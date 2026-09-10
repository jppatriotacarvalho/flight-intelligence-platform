# ✈️ Flight Intelligence Platform

Plataforma completa de inteligência de dados para o setor aéreo — do
processamento de mais de **7 milhões de voos** até um dashboard interativo
e um agente de IA que responde perguntas em linguagem natural.

---

## 📊 Sobre o Projeto

O setor aéreo gera um volume enorme de dados (voos, horários, atrasos,
cancelamentos, companhias, aeroportos, rotas), mas esses dados costumam
existir de forma bruta e fragmentada, dificultando análise e tomada de
decisão.

Este projeto resolve isso construindo um **pipeline de dados de ponta a
ponta**: ingestão de milhões de registros, tratamento e validação de
qualidade, modelagem analítica, disponibilização via API, visualização em
dashboard e um agente de IA para consultas em linguagem natural — tudo
containerizado e pronto para rodar com um único comando.



---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/images/dashboard.png)

### Chat com IA
![Chat IA](docs/images/chat.png)

---

## 🏗️ Arquitetura

```text
   📂 DATASET (7M+ voos, Kaggle/BTS)
        │
        ▼
   📥 INGESTÃO — PySpark (Databricks)
        │
        ▼
   🥉 BRONZE → 🥈 SILVER → 🥇 GOLD  (Delta Lake)
        │
        ▼
   🐬 MySQL (tabelas analíticas)
        │
   ┌────┴────┐
   ▼         ▼
🚀 API    📊 Dashboard (React)
(FastAPI)     │
   │      🤖 Chat IA (Gemini)
   └────┬────┘
        ▼
   💻 Frontend (React + TypeScript)
```

- **Bronze**: dados brutos, sem transformação de negócio
- **Silver**: dados limpos, validados e padronizados (regras documentadas em [`docs/silver_rules.md`](docs/silver_rules.md))
- **Gold**: 5 tabelas analíticas prontas para consumo (`airline_performance`, `airport_performance`, `route_performance`, `delay_causes`, `flight_trends`)

Arquitetura completa e decisões de camada em [`docs/architecture.md`](docs/architecture.md).

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Engenharia de Dados | Python, PySpark, Databricks, Delta Lake |
| Banco de Dados | MySQL |
| Backend | Python, FastAPI, SQLAlchemy |
| Frontend | React, TypeScript, Vite, Recharts |
| Inteligência Artificial | Gemini API (Google) |
| Containerização | Docker, Docker Compose |
| Versionamento | Git, GitHub |



---

## 📁 Estrutura do Projeto

```text
flight-intelligence-platform/
├── backend/          # API FastAPI + agente de IA
├── frontend/         # React + TypeScript (Dashboard, Chat IA)
├── database/         # schema.sql, dump de dados
├── docker/           # Dockerfiles de backend e frontend
├── docs/             # documentação detalhada (ver seção abaixo)
├── notebooks/        # notebooks PySpark (Bronze/Silver/Gold)
└── docker-compose.yml
```

---

## 🚀 Como Executar

### Opção 1 — Docker 

Pré-requisitos: Docker Desktop instalado e aberto.

```bash
# 1. Clone o repositório
git clone https://github.com/jppatriotacarvalho/flight-intelligence-platform.git
cd flight-intelligence-platform

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com sua senha de MySQL e sua chave da Gemini API

# 3. Suba tudo
docker compose up --build
```

- http://localhost:5173




## ✨ Funcionalidades

- **Dashboard interativo** — KPIs (total de voos, taxa de atraso, taxa de
  cancelamento, companhia mais pontual, aeroporto mais atrasado) e gráficos
  (barras, pizza, linha) com fonte/métrica/unidade documentadas em cada um.
- **Páginas de dados** — Companhias, Aeroportos e Rotas (com filtro por
  origem/destino), Atrasos (motivos e evolução mensal).
- **API REST** — endpoints `/dashboard`, `/airlines`, `/airports`,
  `/routes`, `/delays`, `/trends`, documentação automática em `/docs`.
- **Chat com IA** — pergunte em português ("Qual companhia tem a maior
  taxa de atraso?") e receba resposta em linguagem natural, com o SQL
  gerado disponível para consulta.

---

## 🔒 Segurança do Agente de IA

O agente converte perguntas em SQL via Gemini, mas roda sob um pipeline de
segurança rígido:

- Somente `SELECT` — qualquer comando de escrita é bloqueado
- Whitelist de tabelas e colunas (só as 5 tabelas Gold, nunca dados brutos)
- `LIMIT` obrigatório (máx. 100 linhas)
- Perguntas fora do escopo (voos/aeroportos/companhias/rotas/atrasos) são
  recusadas antes mesmo de gerar SQL
- Nenhuma credencial é enviada ao modelo de IA



---

## 🧪 Testes

Pipeline de dados validado (7.079.081 registros, Bronze → Silver → Gold
sem perdas), API testada com casos de erro, agente de IA testado contra
tentativas de burlar a segurança via linguagem natural, e frontend
verificado em telas estreitas. Dois bugs reais foram encontrados e
corrigidos durante os testes.

---

## 📊 Data Source

Este projeto usa o **Flight Delay Dataset — 2024**.

- **Fonte:** Kaggle
- **Fonte original:** BTS TranStats — On-Time Performance Database
- **Licença:** CC0 — Creative Commons Zero
- **Volume:** 7M+ registros, 35 colunas, voos domésticos dos EUA em 2024

---

## 📚 Processo de Documentação

Ao longo do desenvolvimento, cada etapa do projeto foi documentada
internamente: o problema de negócio e o público-alvo, as 35 colunas do
dataset (tipo, nulos, classificação), os achados da análise exploratória
de qualidade, as perguntas de negócio que a plataforma responde, as
regras de limpeza aplicadas na camada Silver, a definição oficial dos
KPIs, a arquitetura de cada camada, o modelo do banco de dados e a
validação da importação, o pipeline de segurança do agente de IA, o
relatório de testes realizados, e as decisões técnicas que desviaram do
plano original (como a troca de PostgreSQL por MySQL, e a escolha de
Python/FastAPI para o backend). Essa documentação guiou o
desenvolvimento passo a passo, mas não está incluída neste repositório.

---

