"""
Gera docs/documentacao_completa.md a partir dos documentos individuais.

Existe porque a documentacao unificada e' o UNICO doc que vai para o GitHub
(ver .gitignore: docs/*.md com excecao para ela). Mantida a mao, ela ficou uma
versao atras do projeto — sem a Regra 11, sem a Decisao 03 e sem o capitulo da
execucao com o dataset completo. Com este script, regenerar e' um comando.

    python scripts/gerar_documentacao.py

NAO edite docs/documentacao_completa.md a mao: edite o documento de origem
e rode o script de novo.
"""
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
SAIDA = DOCS / "documentacao_completa.md"

# (titulo do capitulo, arquivo de origem) — a ordem segue as fases do projeto
CAPITULOS = [
    ("Problema de Negócio",                    "business_problem.md"),
    ("Dicionário de Dados",                    "data_dictionary.md"),
    ("Análise Exploratória e Qualidade",       "data_quality.md"),
    ("Perguntas de Negócio",                   "business_questions.md"),
    ("Regras de Transformação (Silver)",       "silver_rules.md"),
    ("KPIs e Regras de Negócio",               "business_rules.md"),
    ("Execução com o Dataset Completo",        "etapa15_execucao.md"),
    ("Arquitetura Geral",                      "architecture.md"),
    ("Modelo de Banco de Dados",               "database_model.md"),
    ("Agente de IA — Segurança e Resiliência", "ai_agent_security.md"),
    ("Testes Realizados",                      "testing.md"),
    ("Log de Decisões Técnicas",               "decision_log.md"),
]

CABECALHO = """# 📚 Documentação Completa — Flight Intelligence Platform

> Este documento reúne toda a documentação técnica produzida ao longo do
> desenvolvimento do projeto, organizada na ordem das fases do plano de
> execução. Cada seção abaixo corresponde a um documento que guiou uma
> etapa específica do trabalho.
>
> ⚙️ **Arquivo gerado.** Não edite aqui: altere o documento de origem em
> `docs/` e rode `python scripts/gerar_documentacao.py`.
"""


def slug(numero: int, titulo: str) -> str:
    """Ancora no mesmo formato das que ja existiam no arquivo."""
    s = titulo.lower().replace("—", " ").replace("–", " ")
    s = "".join(c for c in s if c.isalnum() or c in " -")
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return f"{numero}-{s}"


def corpo(caminho: Path) -> str:
    """Remove o H1 do documento e rebaixa os demais titulos em um nivel."""
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    saida, dentro_de_bloco, h1_removido = [], False, False

    for linha in linhas:
        if linha.lstrip().startswith("```"):
            dentro_de_bloco = not dentro_de_bloco
            saida.append(linha)
            continue

        if not dentro_de_bloco and linha.startswith("#"):
            if not h1_removido and linha.startswith("# "):
                h1_removido = True
                continue  # o titulo do capitulo substitui o H1 do documento
            linha = "#" + linha

        saida.append(linha)

    return "\n".join(saida).strip()


def main() -> None:
    faltando = [a for _, a in CAPITULOS if not (DOCS / a).exists()]
    if faltando:
        raise SystemExit(f"Documento(s) de origem nao encontrado(s): {faltando}")

    partes = [CABECALHO, "\n---\n", "## 🗂️ Índice\n"]

    for i, (titulo, _) in enumerate(CAPITULOS, start=1):
        partes.append(f"{i}. [{titulo}](#{slug(i, titulo)})")

    partes.append("\n---\n")

    for i, (titulo, arquivo) in enumerate(CAPITULOS, start=1):
        partes.append(f"\n---\n")
        partes.append(f"# {i}. {titulo}\n")
        partes.append(f'<a id="{slug(i, titulo)}"></a>\n')
        partes.append(corpo(DOCS / arquivo))
        partes.append("")

    SAIDA.write_text("\n".join(partes).rstrip() + "\n", encoding="utf-8")

    linhas = SAIDA.read_text(encoding="utf-8").count("\n")
    print(f"{SAIDA.relative_to(RAIZ)} gerado: {len(CAPITULOS)} capitulos, {linhas} linhas")


if __name__ == "__main__":
    main()
