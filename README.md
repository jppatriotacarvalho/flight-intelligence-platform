# ✈️ Flight Intelligence Platform

## 🎯 Objetivo

Criar uma plataforma completa de inteligência de dados para o setor aéreo, capaz de:

- Processar milhões de registros de voos.
- Organizar e garantir a qualidade dos dados.
- Criar métricas e tabelas analíticas.
- Disponibilizar os dados através de uma API.
- Criar dashboards interativos.
- Permitir perguntas em linguagem natural através de um agente de IA.

O projeto demonstra uma jornada completa: engenharia de dados, qualidade de dados, big data, modelagem analítica, banco de dados, backend, API, frontend, dashboard e inteligência artificial.

---

## 🏗️ Arquitetura

> Em desenvolvimento.

```text
                    📂 DATASET
                        │
                        ▼
                   📥 INGESTÃO
                     PySpark
                        │
                        ▼
                 🥉 BRONZE LAYER
                  Dados Brutos
                        │
                        ▼
                 🥈 SILVER LAYER
              Dados Confiáveis
                        │
                        ▼
                  🥇 GOLD LAYER
               Dados Analíticos
                        │
                        ▼
                   POSTGRESQL
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
         BACKEND               DASHBOARD
             │                     │
             └──────────┬──────────┘
                        │
                        ▼
                    FRONTEND
                        │
                        ▼
                   🤖 GEMINI
                  AGENTE DE IA
```

---

## 🛠️ Tecnologias

### Engenharia de Dados
- Python
- PySpark
- Databricks
- Delta Lake

### Banco de Dados
- PostgreSQL
- SQL

### Backend
- *Decisão pendente entre Java/Spring Boot e Python/FastAPI*

### Frontend
- React
- TypeScript

### Dashboard
- Recharts / Chart.js *(a definir)*

### Inteligência Artificial
- Gemini API

### Versionamento
- Git
- GitHub

---

## 📊 Data Source

This project uses the **Flight Delay Dataset — 2024**.

- **Dataset:** Flight Delay Dataset — 2024
- **Source:** Kaggle
- **Original Data Source:** BTS TranStats — On-Time Performance Database
- **License:** CC0 — Creative Commons Zero

The dataset contains over 7 million records and 35 columns related to domestic flight performance in the United States during 2024.

---

## 📌 Status do Projeto

🚧 Em desenvolvimento — seguindo o plano de execução por etapas.