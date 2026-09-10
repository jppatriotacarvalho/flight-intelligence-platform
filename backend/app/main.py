from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import airlines, airports, routes, delays, trends, dashboard, chat

app = FastAPI(
    title="Flight Intelligence Platform API",
    description="API para consulta de metricas de voos (companhias, aeroportos, rotas, atrasos, tendencias) e agente de IA.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(airlines.router)
app.include_router(airports.router)
app.include_router(routes.router)
app.include_router(delays.router)
app.include_router(trends.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Flight Intelligence Platform API rodando"}
