# 📋 Log de Decisões Técnicas

Este documento registra decisões que alteram o que foi definido originalmente
no plano mestre, com a justificativa de cada mudança (Regra 4 — "Documentar
decisões importantes").

---

## Decisão 01 — Banco de dados: PostgreSQL → MySQL

- **Data:** Etapa 16 (Fase 5 — Banco de Dados)
- **Definição original do plano:** PostgreSQL
- **Nova decisão:** MySQL
- **Motivo:** preferência por usar o MySQL Workbench como ferramenta de
  administração/consulta, já familiar. Tecnicamente, PostgreSQL e MySQL são
  equivalentes para o escopo deste projeto (armazenar as tabelas Gold e
  servir consultas de leitura para API, dashboard e agente de IA) — a
  escolha por PostgreSQL no plano original era estilística (banco mais comum
  em vagas de engenharia de dados), não uma exigência funcional.
- **Impacto:**
  - `README.md` — seção "Banco de Dados" atualizada de PostgreSQL para MySQL.
  - `docs/architecture.md` — seção "Banco de Dados" atualizada.
  - Etapas 16, 20 e 21 do plano (que citam PostgreSQL) devem ser lidas como
    "MySQL" a partir daqui.
  - Ferramenta de administração: MySQL Workbench (equivalente ao pgAdmin do
    Postgres).
- **Sem impacto em:** Bronze, Silver, Gold (Databricks/Delta Lake), Etapas 0-15
  já concluídas. A troca afeta apenas a camada de banco relacional e tudo que
  a consome a partir da Etapa 16.

---

## Decisão 02 — Backend: Python + FastAPI

- **Etapa:** 17 (Fase 6 — Aplicação)
- **Opções do plano:** Java/Spring Boot (Opção A) vs Python/FastAPI (Opção B)
- **Decisão:** Python + FastAPI
- **Motivo:** consistência com o restante do stack de dados do projeto
  (Python/PySpark já usados nas Etapas 10-15), menor curva de setup, e
  FastAPI gera documentação interativa automática (Swagger/OpenAPI), útil
  tanto para desenvolvimento do frontend quanto para portfólio.
- **Impacto:** pasta `backend/` contém uma aplicação FastAPI conectada ao
  MySQL (`flight_intelligence`) via SQLAlchemy.

---

## 📤 Status

✅ Decisões registradas e aplicadas em todo o projeto.
