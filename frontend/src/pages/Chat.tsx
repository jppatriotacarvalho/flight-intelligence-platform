import { useState } from "react";
import { askQuestion } from "../services/api";
import type { ChatResponse } from "../types";
import "./Chat.css";

interface Message {
  role: "user" | "assistant";
  text: string;
  blocked?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "Qual companhia tem a maior taxa de atraso?",
  "Qual aeroporto tem mais voos?",
  "Qual mês teve mais atrasos?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Pergunte algo sobre voos, companhias, aeroportos, rotas ou atrasos.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(question?: string) {
    const pergunta = (question ?? input).trim();
    if (!pergunta || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: pergunta }]);
    setInput("");
    setLoading(true);

    try {
      const response: ChatResponse = await askQuestion(pergunta);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
          blocked: response.blocked,
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  return (
    <div className="chat">
      <h2>Chat com a IA</h2>
      <p className="chat__hint">
        O agente responde apenas sobre voos, aeroportos, companhias aéreas,
        rotas e atrasos. Outras perguntas são recusadas automaticamente.
      </p>

      <div className="chat__examples">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button key={q} onClick={() => handleSend(q)} disabled={loading}>
            {q}
          </button>
        ))}
      </div>

      <div className="chat__messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat__message chat__message--${m.role}`}>
            <div className="chat__bubble">
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat__message chat__message--assistant">
            <div className="chat__bubble chat__bubble--loading">
              <span className="spinner" aria-hidden="true" />
              <span>Pensando...</span>
            </div>
          </div>
        )}
      </div>

      <form className="chat__input-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta sobre voos..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
