# 📊 Modelo de Banco de Dados — Etapa 16

## Decisão: Tabelas Analíticas Diretas

**Alternativas consideradas:** tabelas analíticas diretas vs. modelo dimensional (fato + dimensões).

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

## 📤 Status

✅ Modelo definido e justificado — item 16.2 da Etapa 16.
⏭️ Próximo passo: criar o schema (16.3), importar os dados e criar índices (16.4).
