import { useEffect, useRef, useState } from "react";
import { askQuestion } from "../services/api";
import type { ChatResponse } from "../types";
import { formatCell, tableFromSql } from "../lib/format";
import "./Chat.css";

/** Quantas linhas do resultado aparecem na previa dentro da bolha. */
const PREVIEW_ROWS = 3;

const SUGGESTIONS = [
  "Qual aeroporto tem mais voos?",
  "Qual a taxa de atraso da Delta?",
  "Qual mês teve mais atrasos?",
  "Quais as 5 rotas com maior atraso?",
];

interface PreviewRow {
  key: string;
  value: string;
  /** Largura da mini barra, proporcional ao maior valor da previa. */
  width: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  sql?: string | null;
  blocked?: boolean;
  preview?: PreviewRow[];
  meta?: string;
}

/**
 * Monta a previa visual do resultado: usa a primeira coluna textual como
 * rotulo e a primeira coluna numerica como valor, com a barra proporcional
 * ao maior valor exibido. Quando o formato nao encaixa, devolve undefined e
 * a bolha mostra so' o texto da resposta.
 */
function buildPreview(results: Record<string, unknown>[] | null): PreviewRow[] | undefined {
  if (!results || results.length === 0) return undefined;

  const columns = Object.keys(results[0]);
  if (columns.length === 0) return undefined;

  const keyColumn =
    columns.find((column) => typeof results[0][column] === "string") ?? columns[0];
  const valueColumn = columns.find(
    (column) => column !== keyColumn && typeof results[0][column] === "number",
  );
  if (!valueColumn) return undefined;

  const linhas = results.slice(0, PREVIEW_ROWS);
  const maior = Math.max(
    ...linhas.map((row) => Math.abs(Number(row[valueColumn]) || 0)),
    0,
  );

  return linhas.map((row) => {
    const valor = Number(row[valueColumn]) || 0;
    return {
      key: String(row[keyColumn] ?? "—"),
      value: formatCell(valueColumn, row[valueColumn]),
      width: maior > 0 ? `${((Math.abs(valor) / maior) * 100).toFixed(0)}%` : "0%",
    };
  });
}

/** Pergunta ao agente medindo quanto a ida e volta levou, para a linha de meta. */
async function askTimed(question: string): Promise<{ response: ChatResponse; elapsedMs: number }> {
  const inicio = performance.now();
  const response = await askQuestion(question);
  return { response, elapsedMs: performance.now() - inicio };
}

function buildMeta(response: ChatResponse, elapsedMs: number): string | undefined {
  if (!response.results) return undefined;
  const tabela = tableFromSql(response.sql);
  const linhas = `${response.results.length} ${response.results.length === 1 ? "linha" : "linhas"}`;
  // O modelo vem da resposta, nao de uma constante: a cadeia de fallback pode
  // ter respondido com outro modelo que nao o preferencial.
  return [tabela, linhas, `${Math.round(elapsedMs)} ms`, response.model]
    .filter(Boolean)
    .join(" · ");
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Pergunte algo sobre voos, companhias, aeroportos, rotas ou atrasos.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Mantem a conversa rolada para a mensagem mais recente.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [messages, loading]);

  async function handleSend(question?: string) {
    const pergunta = (question ?? draft).trim();
    if (!pergunta || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: pergunta }]);
    setDraft("");
    setLoading(true);

    try {
      const { response, elapsedMs } = await askTimed(pergunta);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
          sql: response.sql,
          blocked: response.blocked,
          preview: buildPreview(response.results),
          meta: buildMeta(response, elapsedMs),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Erro ao consultar o agente: ${(err as Error).message}`,
          blocked: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat__header">
        <span className="chat__status-dot" />
        <span className="chat__agent">Agente de dados · Gemini</span>
        <span className="chat__spacer" />
        <span className="chat__guards">somente SELECT · LIMIT 100</span>
      </div>

      <div className="chat__body" ref={bodyRef}>
        {messages.map((message, index) => (
          <div key={index} className={`chat__row chat__row--${message.role}`}>
            <div className={`chat__bubble chat__bubble--${message.role}`}>
              <span className="chat__text">{message.text}</span>

              {message.sql && (
                <div className="chat__sql">
                  <div className="chat__sql-bar">
                    <span className="chat__sql-label">SQL gerado</span>
                    <span
                      className={`chat__sql-badge${
                        message.blocked ? " chat__sql-badge--blocked" : ""
                      }`}
                    >
                      {message.blocked ? "bloqueado" : "validado"}
                    </span>
                  </div>
                  <pre className="chat__sql-code">{message.sql}</pre>
                </div>
              )}

              {message.preview && (
                <div className="chat__preview">
                  {message.preview.map((row) => (
                    <div key={row.key} className="chat__preview-row">
                      <span className="chat__preview-key">{row.key}</span>
                      <span className="chat__preview-track">
                        <span className="chat__preview-fill" style={{ width: row.width }} />
                      </span>
                      <span className="chat__preview-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {message.meta && <span className="chat__meta">{message.meta}</span>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat__thinking">
            <span className="spinner" aria-hidden="true" />
            {/* Um texto so', e honesto: o frontend nao tem como saber em que
                passo o backend esta', e o "passo 2 de 3" era fixo. */}
            <span className="chat__thinking-title">
              Gerando SQL, validando e consultando o banco…
            </span>
          </div>
        )}
      </div>

      <div className="chat__footer">
        <div className="chat__chips">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chat__chip"
              onClick={() => handleSend(suggestion)}
              disabled={loading}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="chat__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >
          <input
            className="chat__input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Pergunte sobre companhias, aeroportos, rotas, atrasos…"
            disabled={loading}
          />
          <button type="submit" className="chat__send" disabled={loading || !draft.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
