# 🔍 Análise Exploratória e Qualidade dos Dados

Fonte: `flight_data_2024_sample.csv` (10.000 registros, 35 colunas)

> Este documento segue a regra do plano: **analisar, entender e documentar
> primeiro — decidir depois.** Nenhuma transformação foi aplicada aos dados
> nesta etapa. As decisões de tratamento serão formalizadas na Etapa 11
> (`docs/silver_rules.md`).

---

## 7.1 — Estrutura Geral

- Linhas: **10.000**
- Colunas: **35**
- Schema e tipos batem com o `data_dictionary.csv` (ver seção 7.4).

---

## 7.4 — Comparação Data Dictionary vs Sample

| Item | Resultado |
|---|---|
| Nº de colunas no dicionário | 35 |
| Nº de colunas no sample | 35 |
| Colunas no dicionário e ausentes no sample | nenhuma |
| Colunas no sample e ausentes no dicionário | nenhuma |
| Ordem das colunas idêntica | ✅ sim |
| Tipos coerentes com o dicionário | ✅ sim (Int64/float64/object do dicionário correspondem a int64/float64/string no sample) |

✅ **Sample e dicionário estão consistentes.** Não há colunas surpresa nem divergência estrutural.

---

## 7.2 — Valores Nulos

| Coluna | Nulos | % |
|---|---:|---:|
| cancellation_code | 9.878 | 98.78% |
| air_time | 164 | 1.64% |
| arr_delay | 164 | 1.64% |
| actual_elapsed_time | 164 | 1.64% |
| taxi_in | 127 | 1.27% |
| wheels_on | 127 | 1.27% |
| arr_time | 127 | 1.27% |
| taxi_out | 120 | 1.20% |
| wheels_off | 120 | 1.20% |
| dep_delay | 116 | 1.16% |
| dep_time | 116 | 1.16% |

Todas as demais colunas: **0% de nulos**.

Os percentuais batem com os valores já registrados no `data_dictionary.md`.

---

## 7.3 — Duplicatas

- Linhas 100% duplicadas: **0**
- Duplicatas usando chave composta (`fl_date + op_unique_carrier + op_carrier_fl_num + origin + dest`): **0**

✅ Não há indício de duplicação no sample.

---

## 7.4b — Valores Únicos (Categóricos)

| Coluna | Valores únicos |
|---|---:|
| op_unique_carrier | 15 |
| origin | 284 |
| dest | 287 |
| origin_state_nm | 52 |
| dest_state_nm | 52 |
| cancellation_code | 3 (A, B, C) + nulo |

`cancelled`: 9.878 não cancelados / 122 cancelados
`diverted`: 9.958 não desviados / 42 desviados

---

## 7.5 — Valores Numéricos

| Coluna | Min | Máx | Média | Mediana |
|---|---:|---:|---:|---:|
| dep_delay | -22.0 | 2011.0 | 13.00 | -2.0 |
| arr_delay | -78.0 | 2014.0 | 7.55 | -6.0 |
| taxi_out | 4.0 | 154.0 | 17.88 | 15.0 |
| air_time | 8.0 | 635.0 | 115.45 | 98.0 |
| distance | 31.0 | 5095.0 | 838.35 | 680.0 |

**Distância:** nenhum valor `<= 0` e nenhum nulo — coluna limpa.

**Atrasos (dep_delay / arr_delay) — valores extremos:**
Existem alguns voos com atraso de partida/chegada acima de 2.000 minutos (~33h). Investigado o maior caso (`arr_delay = 2014`): o valor de `carrier_delay` do mesmo registro é `2011`, ou seja, os componentes de atraso somam de forma coerente com o total — **não é erro de digitação, é um caso real extremo** (atraso operacional grande atribuído à companhia). Não deve ser removido sem critério; entra como candidato a "outlier real" a ser tratado com regra explícita na Silver (ex: flag, não exclusão).

---

## 7.6 — Datas (`fl_date`)

- Datas inválidas: **0**
- Intervalo: `2024-01-01` até `2024-12-31`
- Anos únicos: apenas `2024`

✅ Coluna de data está íntegra e dentro do esperado.

---

## 7.7 — Horários (`crs_dep_time`, `crs_arr_time`)

- Valores fora do range válido (0–2359): **0**
- `crs_dep_time`: min 22, max 2359

✅ Sem inconsistências de horário programado. Vale registrar: o formato é `hhmm` numérico (ex.: 1252 = 12:52), não timestamp — será necessário tratar isso na Silver se quisermos operar como hora real.

---

## 7.8 — Atrasos

- `dep_delay`: 5.784 negativos / 437 zeros / 3.663 positivos
- `arr_delay`: 6.092 negativos / 166 zeros / 3.578 positivos

Confirma o que o plano já alertava: **atraso negativo é válido** e representa voos que decolaram/chegaram adiantados — não deve ser tratado como erro.

**Colunas de motivo de atraso** (`carrier_delay`, `weather_delay`, `nas_delay`, `security_delay`, `late_aircraft_delay`): a maioria dos registros tem valor 0 nessas colunas (mediana 0 em todas), e apenas **2.119 registros** (~21%) têm soma > 0 — ou seja, motivo de atraso só é preenchido quando existe atraso relevante atribuído. Isso é esperado pela definição do BTS (essas colunas só são preenchidas quando `arr_delay >= 15 min`).

---

## 7.10 — Cancelamento e Desvio

**Cancelamento:**
- 122 voos cancelados (1.22% da amostra) — proporção plausível.
- Códigos de cancelamento presentes: A (Companhia), B (Clima), C (NAS). Nenhum D (Segurança) no sample.
- **Achado relevante:** de 122 voos cancelados, **6 têm `dep_time` preenchido** (decolaram/saíram do portão) mas `arr_time` nulo. Isso é um cenário operacional real (ex.: retorno ao portão, cancelamento após saída) e não parece erro — mas é uma regra que precisa ser explicitada na Etapa 11 (Silver): "cancelado" não implica necessariamente todos os campos de horário real nulos.

**Desvio:**
- 42 voos desviados (0.42% da amostra).
- Todos os 42 registros desviados têm `arr_delay` nulo (100%) — coerente, já que um voo desviado não completa o trajeto planejado.
- Desses 42, **37 também têm `arr_time` nulo**, mas **5 têm `arr_time` preenchido** — provavelmente pousaram em outro aeroporto e o sistema registrou algum horário de chegada mesmo assim. Também vira regra a definir na Silver.

---

## 📊 Tabela-Resumo de Problemas Encontrados

| Problema | Coluna(s) | Quantidade | Evidência | Ação |
|---|---|---:|---|---|
| Valores nulos esperados (não aplicável) | cancellation_code | 9.878 (98.78%) | Nulo ocorre exatamente quando `cancelled = 0` | A decidir na Etapa 11 — manter como "não aplicável", não tratar como dado faltando |
| Nulos operacionais (voo não completou o ciclo normal) | dep_time, dep_delay, taxi_out, wheels_off, wheels_on, taxi_in, arr_time, arr_delay, actual_elapsed_time, air_time | 116–164 (1.16%–1.64%) | Concentrados em voos cancelados/desviados | A decidir na Etapa 11 — investigar correlação com `cancelled`/`diverted` antes de tratar |
| Atrasos extremos (>2000 min) | dep_delay, arr_delay | poucos registros (outliers) | Somam de forma coerente com colunas de motivo de atraso | A decidir na Etapa 11 — manter como caso real, não excluir sem critério |
| Cancelado com dep_time preenchido | cancelled + dep_time/arr_time | 6 registros | Voo cancelado após decolagem/saída do portão | A decidir na Etapa 11 — definir regra explícita, não é erro |
| Desviado com arr_time preenchido | diverted + arr_time | 5 registros | Pouso registrado em aeroporto alternativo | A decidir na Etapa 11 — definir regra explícita, não é erro |
| Duplicatas | — | 0 | Nenhuma linha ou chave composta duplicada | Nenhuma ação necessária |
| Datas inválidas | fl_date | 0 | Todas dentro de 2024, sem nulos | Nenhuma ação necessária |
| Horários fora do range | crs_dep_time, crs_arr_time | 0 | Todos entre 0–2359 | Nenhuma ação necessária |
| Distância inválida | distance | 0 | Nenhum valor ≤ 0 ou nulo | Nenhuma ação necessária |
| Rota inválida (origem = destino) | origin, dest | 0 | Nenhum caso encontrado | Nenhuma ação necessária |

---

## 📤 Status

✅ Análise exploratória e de qualidade concluída — Etapa 7.
⏭️ Nenhuma transformação foi aplicada. As decisões de tratamento (o que manter, remover ou substituir) serão formalizadas na **Etapa 11 — Diagnóstico para Silver** (`docs/silver_rules.md`).