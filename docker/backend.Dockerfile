# ============================================================
# Backend Dockerfile — FastAPI (Flight Intelligence Platform)
# ============================================================

FROM python:3.12-slim

WORKDIR /app

# Instala dependencias primeiro (aproveita cache do Docker entre builds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do codigo
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
