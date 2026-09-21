import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_agent import (
    generate_plan,
    validate_sql,
    run_query,
    format_answer,
    FORA_DE_CONTEXTO_TOKEN,
)

logger = logging.getLogger(__name__)

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
    # Uma unica chamada ao Gemini devolve o SQL e o molde da resposta.
    try:
        sql_gerado, molde_resposta = generate_plan(pergunta)
    except Exception:
        logger.exception("Falha ao gerar o plano para a pergunta: %r", pergunta)
        return ChatResponse(
            question=pergunta,
            sql=None,
            results=None,
            answer="O assistente de IA está temporariamente indisponível, tente novamente em instantes.",
            blocked=True,
        )

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
    except Exception:
        # O erro completo vai para o log; o usuario recebe uma mensagem
        # generica. A mensagem crua do MySQL descreve a estrutura interna
        # do banco e nao deve sair pela API.
        logger.exception("Erro ao executar a consulta: %s", sql_seguro)
        return ChatResponse(
            question=pergunta,
            sql=sql_seguro,
            results=None,
            answer="Nao foi possivel consultar o banco de dados para essa pergunta.",
            blocked=True,
        )

    # Formatacao local: nao gasta cota e nao depende da API estar de pe.
    resposta_natural = format_answer(linhas, molde_resposta)

    return ChatResponse(
        question=pergunta,
        sql=sql_seguro,
        results=linhas,
        answer=resposta_natural,
        blocked=False,
    )
