# 🐬 Modelo de Banco de Dados — Etapa 16

## Decisão: Tabelas Analíticas Diretas

**Alternativas consideradas:** tabelas analíticas diretas vs. modelo
dimensional (fato + dimensões).

**Decisão:** tabelas analíticas diretas — uma tabela MySQL por tabela Gold,
sem transformar em esquema estrela.

**Justificativa:** o modelo dimensional (`FACT_FLIGHT_PERFORMANCE` +
`DIM_AIRLINE`, `DIM_AIRPORT`, `DIM_DATE`, `DIM_ROUTE`) faz sentido quando os
dados estão em granularidade de linha (1 registro = 1 voo) e precisam ser
cruzados de múltiplas formas ad-hoc. As tabelas Gold deste projeto **já
chegam agregadas e com propósito definido** (Etapa 14) — cada uma responde
diretamente a um grupo de perguntas de negócio. Adicionar um esquema
dimensional por cima adicionaria complexidade sem ganho real de flexibilidade
para este caso de uso (API, dashboard, agente de IA consultando métricas
prontas, não fazendo OLAP livre sobre voo individual).

---

## Estrutura das Tabelas (MySQL)

| Tabela MySQL | Origem (Gold/Databricks) | Chave primária |
|---|---|---|
| `airline_performance` | `gold.airline_performance` | `op_unique_carrier` |
| `airport_performance` | `gold.airport_performance` | `airport` |
| `route_performance` | `gold.route_performance` | `origin, dest` (composta) |
| `delay_causes` | `gold.delay_causes` | `id` (linha única) |
| `flight_trends` | `gold.flight_trends` | `month` |

---

## Validação da Importação (Databricks → MySQL)

| Tabela | Databricks (Gold) | MySQL (importado) | Status |
|---|---:|---:|---|
| airline_performance | 15 | 15 | ✅ |
| airport_performance | 348 | 348 | ✅ |
| route_performance | 6.805 | 6.805 | ✅ |
| delay_causes | 1 | 1 | ✅ |
| flight_trends | 12 | 12 | ✅ |

Todos os registros migrados sem perda. Índices criados conforme item 16.4
(ver `database/schema.sql`).

## 📤 Status Final

✅ Etapa 16 concluída — banco `flight_intelligence` criado no MySQL, com as 5
tabelas populadas e validadas 1:1 contra as tabelas Gold do Databricks.
