# 🏗️ Arquitetura — Flight Intelligence Platform

## 📂 Origem dos Dados

Dataset **Flight Delay Dataset — 2024**, obtido via Kaggle, com origem
original na **BTS TranStats — On-Time Performance Database**. Licença
**CC0 — Creative Commons Zero**. Mais de 7 milhões de registros e 35 colunas
sobre performance de voos domésticos nos EUA em 2024.

Detalhes completos em `docs/business_problem.md` e no `README.md`.

---

## 🔄 Pipeline (Visão Geral)

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
                   MYSQL
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

O pipeline de dados (Bronze → Silver → Gold) roda no **Databricks** com
**PySpark**, gravando tabelas em formato **Delta Lake**. As tabelas Gold são
posteriormente carregadas em um banco **MySQL**, que serve tanto o
**backend/API** quanto o **dashboard**, e o **agente de IA (Gemini)** consulta
o MySQL de forma controlada, apenas leitura, via o backend.

---

## 🥉🥈🥇 Camadas (Arquitetura Medalhão) — Etapa 9

### 🥉 Bronze — `bronze.flights_raw`

**Objetivo:** armazenar os dados o mais próximo possível da origem.

**Pode:**
- Ler o CSV
- Adicionar metadados de rastreabilidade (`ingestion_timestamp`, `source_file`)
- Converter para Delta Lake

**Não pode:**
- Remover duplicatas
- Criar KPIs ou agregações
- Aplicar qualquer regra de negócio

**Status:** ✅ implementada (Etapa 10). 35 colunas originais + 2 colunas de metadados. Contagem validada 1:1 contra o CSV de origem (10.000 → 10.000 no sample).

---

### 🥈 Silver — `silver.flights_clean`

**Objetivo:** gerar dados confiáveis — limpos, padronizados, tipados e validados.

**Transformações aplicadas** (detalhadas em `docs/silver_rules.md`):
- Conversão de tipo (`op_carrier_fl_num` → integer)
- Padronização de texto (trim + maiúsculas em códigos)
- Flag de atraso extremo (`is_extreme_delay`)
- Validações estruturais (data, origem, destino, rota, distância)
- Remoção de duplicatas exatas
- **Nulos legítimos mantidos** (não imputados) — voos cancelados/desviados não têm todos os campos de horário preenchidos por definição, e isso é esperado, não é erro.

**Status:** ✅ implementada (Etapa 12). Validado no sample: 10.000 registros na Bronze → 10.000 na Silver (nenhuma perda, nenhum problema estrutural encontrado).

---

### 🥇 Gold — tabelas analíticas

**Objetivo:** dados analíticos, agregados e prontos para consumo direto por
API, dashboard e agente de IA.

**Regra:** só criar tabela que responda a uma pergunta de negócio real
(`docs/business_questions.md`) e implemente um KPI documentado
(`docs/business_rules.md`) — nunca criar tabela "porque estava no plano".

**Tabelas planejadas** (Etapa 14):

| Tabela | Granularidade | KPIs/Perguntas atendidas |
|---|---|---|
| `gold.airline_performance` | 1 registro = 1 companhia | Taxa de atraso, atraso médio, cancelamento por companhia |
| `gold.airport_performance` | 1 registro = 1 aeroporto | Atraso médio, volume, cancelamento por aeroporto |
| `gold.route_performance` | 1 registro = origem + destino | Volume, atraso médio, distância por rota |
| `gold.delay_causes` | agregado por motivo | Distribuição de motivos de atraso |
| `gold.flight_trends` | 1 registro = mês | Evolução de atrasos ao longo do ano |

**Consumidores:** MySQL → API (backend) → Dashboard e Agente de IA.

---

## 🐬 Banco de Dados

MySQL recebe as tabelas Gold para consumo por aplicações externas ao
Databricks (Etapa 16). Decisão sobre modelo (tabelas analíticas diretas vs.
modelo dimensional) será registrada nesse momento.

---

## 🚀 Backend / API

Camada de API (Etapa 17, tecnologia a definir entre Java/Spring Boot ou
Python/FastAPI) expõe as tabelas Gold via endpoints REST, com filtros por
companhia, aeroporto, rota e período.

---

## 💻 Frontend

Aplicação React + TypeScript (Etapa 18) consome a API para exibir dashboard,
páginas de companhias/aeroportos/rotas/atrasos e o chat com o agente de IA.

---

## 📊 Dashboard

Visualizações (Etapa 19) construídas a partir dos KPIs definidos em
`docs/business_rules.md`: total de voos, taxa de atraso, atraso médio, taxa
de cancelamento, companhia mais pontual, aeroporto mais atrasado, gráficos de
comparação por companhia/aeroporto/rota e evolução temporal.

---

## 🤖 Agente de IA

Agente baseado na Gemini API (Etapas 20 e 21) responde perguntas em
linguagem natural, traduzindo para SQL controlado (somente `SELECT`,
whitelist de tabelas/colunas Gold, `LIMIT` obrigatório, sem acesso a
Bronze/Silver/credenciais). Fluxo completo documentado nas Etapas 20 e 21 do
plano mestre.

---

## 📤 Status

✅ Arquitetura geral e papel das camadas documentados — Etapas 3 e 9 concluídas.
⏭️ Próximo passo: implementação das tabelas Gold (Etapa 14).

---

## 🐳 Containerização (Docker)

Toda a aplicação (exceto o pipeline PySpark, que roda no Databricks) foi
containerizada com Docker e orquestrada via `docker-compose.yml`:

| Serviço | Imagem base | Porta (host) |
|---|---|---|
| `mysql` | `mysql:8.0` | 3307 → 3306 |
| `backend` | `python:3.12-slim` | 8000 → 8000 |
| `frontend` | `node:20-alpine` (build) + `nginx:alpine` (serve) | 5173 → 80 |

O MySQL é inicializado automaticamente a partir de um dump
(`database/flight_intelligence_dump.sql`) na primeira execução, e os dados
persistem em um volume Docker nomeado (`mysql_data`) entre reinicializações.

O frontend usa build em duas etapas (multi-stage): compila com Node, e
serve os arquivos estáticos finais via Nginx — resultando numa imagem final
leve, sem as dependências de desenvolvimento do Node.

**Como subir:** `docker compose up --build` na raiz do projeto, com um
`.env` preenchido (ver `.env.example`). Detalhes completos no `README.md`.

## 📤 Status Final da Arquitetura

✅ Pipeline de dados, banco, backend, frontend, agente de IA e
containerização — todos implementados, testados e documentados.