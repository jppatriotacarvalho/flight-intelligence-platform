from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_agent import (
    generate_sql,
    validate_sql,
    run_query,
    generate_natural_language_answer,
    FORA_DE_CONTEXTO_TOKEN,
)

router = APIRouter(prefix="/chat", tags=["AI Agent"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    question: str
    sql: str | None = None
    results: list[dict] | None = None
    answer: str
    blocked: bool = False


@router.post("", response_model=ChatResponse)
def ask(request: ChatRequest) -> ChatResponse:
    pergunta = request.question.strip()

    if not pergunta:
        return ChatResponse(
            question=pergunta,
            sql=None,
            results=None,
            answer="Por favor, digite uma pergunta sobre voos, aeroportos, companhias aereas, rotas ou atrasos.",
            blocked=True,
        )

    # ETAPA 21.5 — Responder somente sobre o contexto permitido
    sql_gerado = generate_sql(pergunta)

    if sql_gerado.strip().upper() == FORA_DE_CONTEXTO_TOKEN:
        return ChatResponse(
            question=pergunta,
            sql=None,
            results=None,
            answer=(
                "Só posso responder perguntas sobre voos, aeroportos, "
                "companhias aéreas, rotas e atrasos, com base nos dados "
                "desta plataforma."
            ),
            blocked=True,
        )

    # Pipeline de segurança (Etapa 21)
    try:
        sql_seguro = validate_sql(sql_gerado)
    except ValueError as erro:
        return ChatResponse(
            question=pergunta,
            sql=sql_gerado,
            results=None,
            answer=f"Não foi possível executar essa consulta com segurança: {erro}",
            blocked=True,
        )

    # Execução (somente leitura)
    try:
        linhas = run_query(sql_seguro)
    except Exception as erro:
        return ChatResponse(
            question=pergunta,
            sql=sql_seguro,
            results=None,
            answer=f"Erro ao consultar o banco de dados: {erro}",
            blocked=True,
        )

    resposta_natural = generate_natural_language_answer(pergunta, sql_seguro, linhas)

    return ChatResponse(
        question=pergunta,
        sql=sql_seguro,
        results=linhas,
        answer=resposta_natural,
        blocked=False,
    )
