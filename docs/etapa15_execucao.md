# 🚀 Execução com Dataset Completo — Etapa 15

## Ambiente

- **Plataforma:** Databricks Free Edition
- **Compute:** Serverless (sem cluster configurado manualmente)
- **Arquivo de origem:** `flight_data_2024.csv` (~1,28 GB descompactado)
- **Local de upload:** `/Volumes/workspace/default/dado_bruto_de_voos/flight_data_2024.csv`

---

## Resultados por Camada

| Camada | Entrada | Saída | Registros removidos | Tempo de execução |
|---|---:|---:|---:|---:|
| 🥉 Bronze | CSV completo | 7.079.081 | — (ingestão bruta) | 15.9s |
| 🥈 Silver | 7.079.081 | 7.079.081 | 0 inválidos / 0 duplicatas | 21.5s |
| 🥇 Gold | 7.079.081 | 5 tabelas analíticas | — (agregação) | 20.7s |

**Tempo total do pipeline: ~58.1s**

---

## Tabelas Gold Criadas

| Tabela | Registros | Granularidade |
|---|---:|---|
| `gold.airline_performance` | 15 | 1 por companhia |
| `gold.airport_performance` | 348 | 1 por aeroporto (origem) |
| `gold.route_performance` | 6.805 | 1 por rota (origem+destino) |
| `gold.delay_causes` | 1 | agregado único |
| `gold.flight_trends` | 12 | 1 por mês |

---

## Validação — Comparação Sample vs Dataset Completo

| Métrica | Sample (10k) | Completo (7.079.081) | Observação |
|---|---:|---:|---|
| Companhias únicas | 15 | 15 | Igual — número fixo de grandes companhias no mercado americano |
| Aeroportos únicos | 284 | 348 | Cresceu — aeroportos menores só aparecem com mais volume |
| Rotas únicas | 3.591 | 6.805 | Quase dobrou — mais combinações origem/destino aparecem |
| Registros inválidos (Regra 10) | 0 | 0 | Consistente |
| Duplicatas (Regra 09) | 0 | 0 | Consistente |

✅ O comportamento do dataset completo é coerente com o que foi validado no
sample — nenhuma regra da Silver precisou de ajuste ao escalar de 10 mil para
7 milhões de registros.

---

## 📤 Status

✅ Etapa 15 concluída. Pipeline Bronze → Silver → Gold executado com sucesso
sobre o dataset completo, sem perdas inesperadas e com tempo de execução
adequado ao Free Edition.
⏭️ Próximo passo: Etapa 16 — Banco de Dados (exportar as tabelas Gold para
consumo externo ao Databricks).
