# 🩺 Diagnóstico para Silver — Regras de Transformação

Este documento transforma os achados do `data_quality.md` (Etapa 7) em regras
formais de decisão, seguindo o fluxo obrigatório do plano:

```
PROBLEMA → EVIDÊNCIA → DECISÃO → TRANSFORMAÇÃO → VALIDAÇÃO
```

> Nenhuma transformação foi executada ainda. Este documento é o "contrato"
> que será implementado em código na Etapa 12 (`silver.flights_clean`).

---

## Regra 01 — Nulos em `cancellation_code`

- **Problema:** 98.78% de nulos na coluna.
- **Coluna:** `cancellation_code`
- **Evidência:** o nulo ocorre exatamente quando `cancelled = 0` (voo não cancelado). Não é dado faltando, é campo "não aplicável".
- **Decisão:** **Manter nulo.**
- **Justificativa:** substituir por qualquer valor (ex: "N/A") mudaria o tipo de dado sem ganho analítico e poderia confundir com um código de motivo real (A/B/C/D). Nulo já comunica corretamente "não se aplica".
- **Transformação:** nenhuma. Documentar a regra de negócio: `cancellation_code IS NULL ⇔ cancelled = 0`.
- **Validação:** checar que 100% dos nulos em `cancellation_code` correspondem a `cancelled = 0`, e 100% dos `cancelled = 1` têm `cancellation_code` preenchido.

---

## Regra 02 — Nulos operacionais (voo não completou o ciclo normal)

- **Problema:** nulos concentrados em `dep_time`, `dep_delay`, `taxi_out`, `wheels_off`, `wheels_on`, `taxi_in`, `arr_time`, `arr_delay`, `actual_elapsed_time`, `air_time` (1.16%–1.64%).
- **Coluna:** as listadas acima.
- **Evidência:** os nulos aparecem majoritariamente em voos cancelados ou desviados, que não seguem o ciclo completo (partida → chegada) — dados que simplesmente nunca existiram, não foram "perdidos".
- **Decisão:** **Manter nulo.**
- **Justificativa:** imputar (ex: com zero ou média) criaria um valor artificial para algo que não ocorreu, distorcendo qualquer KPI de atraso/duração calculado sobre esses campos.
- **Transformação:** nenhuma remoção ou substituição. Ao calcular KPIs de atraso (Etapa 13), excluir explicitamente nulos do cálculo (não tratar como zero).
- **Validação:** confirmar que a taxa de nulos nessas colunas cai fortemente quando filtrado `cancelled = 0 AND diverted = 0`.

---

## Regra 03 — Atrasos extremos (`dep_delay` / `arr_delay` > 2000 min)

- **Problema:** valores muito altos de atraso (~2000 minutos / ~33h) no topo da distribuição.
- **Coluna:** `dep_delay`, `arr_delay`.
- **Evidência:** no maior caso analisado, `carrier_delay` = 2011 quase idêntico ao `arr_delay` total = 2014 — os componentes de atraso somam de forma coerente, indicando valor real, não erro de digitação.
- **Decisão:** **Manter o registro**, sem remover ou "capar" o valor.
- **Justificativa:** remover outliers reais sem critério de negócio distorceria a análise de casos extremos, que são justamente um dos pontos de interesse do projeto (ex: causas de atrasos severos).
- **Transformação:** adicionar coluna derivada `is_extreme_delay` (boolean, ex: `arr_delay > 180`) para permitir segmentar esses casos em análises futuras, sem excluí-los.
- **Validação:** conferir que a soma das colunas de motivo (`carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay`) é coerente com `arr_delay` nos casos extremos.

---

## Regra 04 — Voo cancelado com `dep_time` preenchido

- **Problema:** 6 registros com `cancelled = 1` mas `dep_time` não nulo (chegaram a sair do portão/decolar antes do cancelamento).
- **Coluna:** `cancelled`, `dep_time`, `arr_time`.
- **Evidência:** todos os 6 casos têm `arr_time` nulo — ou seja, o voo iniciou mas não completou o trajeto.
- **Decisão:** **Manter como está.** Não tratar como inconsistência.
- **Justificativa:** é um cenário operacional real (retorno ao portão, cancelamento em solo após pushback). Forçar `dep_time` para nulo apagaria informação verdadeira.
- **Transformação:** nenhuma.
- **Validação:** ao calcular métricas de cancelamento, considerar `cancelled = 1` como a fonte de verdade — não inferir cancelamento a partir de `arr_time` nulo isoladamente.

---

## Regra 05 — Voo desviado com `arr_time` preenchido

- **Problema:** 5 de 42 registros com `diverted = 1` têm `arr_time` preenchido.
- **Coluna:** `diverted`, `arr_time`, `arr_delay`.
- **Evidência:** 100% dos desviados têm `arr_delay` nulo (mesmo os que têm `arr_time` preenchido) — indica que o voo pousou em local diferente do planejado, então o "atraso" em relação ao destino original não é calculável.
- **Decisão:** **Manter como está.**
- **Justificativa:** `arr_time` preenchido nesses casos provavelmente reflete o horário de pouso no aeroporto alternativo, dado operacionalmente válido, mesmo que `arr_delay` não possa ser calculado.
- **Transformação:** nenhuma. Documentar que `arr_delay` não deve ser usado para voos desviados (sempre nulo por definição).
- **Validação:** confirmar 100% de nulos em `arr_delay` para `diverted = 1` seguem assim após qualquer transformação.

---

## Regra 06 — Tipo de `op_carrier_fl_num`

- **Problema:** coluna semanticamente um identificador (número do voo), mas veio como `double` (ex: 4814.0).
- **Coluna:** `op_carrier_fl_num`.
- **Evidência:** não existem casas decimais reais nos valores observados no sample.
- **Decisão:** **Converter para inteiro (`integer`).**
- **Justificativa:** identificadores não devem carregar tipo decimal — evita ambiguidade e reduz espaço de armazenamento.
- **Transformação:** `CAST(op_carrier_fl_num AS INT)`.
- **Validação:** conferir que a conversão não gera perda de valor (nenhum decimal diferente de `.0` antes do cast).

---

## Regra 07 — Padronização de texto

- **Problema:** colunas de texto podem conter espaços extras ou inconsistência de caixa (não identificado no sample, mas é boa prática preventiva antes de ir para o dataset completo).
- **Coluna:** `op_unique_carrier`, `origin`, `dest`, `origin_city_name`, `origin_state_nm`, `dest_city_name`, `dest_state_nm`, `cancellation_code`.
- **Evidência:** verificação a ser repetida no dataset completo (Etapa 15); no sample não foram encontrados espaços extras ou inconsistências de caixa.
- **Decisão:** **Aplicar `TRIM()` preventivamente** em todas as colunas de texto; manter `op_unique_carrier`, `origin`, `dest`, `cancellation_code` em maiúsculas (padrão já observado).
- **Justificativa:** operação de baixo custo e sem risco que protege contra inconsistências que podem existir só no dataset completo (7M+ registros).
- **Transformação:** `TRIM(coluna)` para todas as colunas de texto listadas.
- **Validação:** comparar contagem de valores únicos antes/depois do trim (não deve diminuir se não havia problema).

---

## Regra 08 — Horários no formato `hhmm` (inteiro)

- **Problema:** `crs_dep_time`, `dep_time`, `crs_arr_time`, `arr_time`, `wheels_off`, `wheels_on` estão como número no formato `hhmm` (ex: 1252 = 12:52), não como horário de verdade.
- **Coluna:** as listadas acima.
- **Evidência:** todos os valores observados estão dentro do range válido 0–2359.
- **Decisão:** **Manter o formato original na Silver.** Não converter para timestamp nesta etapa.
- **Justificativa:** a conversão para hora/timestamp real só é necessária se algum KPI ou visualização do Gold/Dashboard exigir — fazer isso agora sem uma necessidade concreta seria "limpeza decorativa", proibida pela Regra Geral do plano.
- **Transformação:** nenhuma por enquanto. Se necessário futuramente, será tratado na Gold, específico para a métrica que precisar.
- **Validação:** manter a checagem de range (0–2359) como validação de qualidade contínua.

---

## Regra 09 — Duplicatas

- **Problema:** nenhuma duplicata encontrada no sample (nem linha completa, nem pela chave composta).
- **Coluna:** todas / chave composta `fl_date + op_unique_carrier + op_carrier_fl_num + origin + dest`.
- **Evidência:** `0` duplicatas no sample de 10.000 registros.
- **Decisão:** **Aplicar remoção de duplicatas exatas mesmo assim**, como proteção para o dataset completo (Etapa 15), onde duplicatas podem aparecer em maior volume.
- **Justificativa:** operação segura e reversível — só remove linhas 100% idênticas, não estima nem infere nada.
- **Transformação:** `dropDuplicates()` sobre o DataFrame completo.
- **Validação:** comparar contagem de registros antes/depois; no sample o resultado deve ser idêntico (10.000 → 10.000).

---

## Regra 10 — Validações estruturais obrigatórias

Regras de integridade a aplicar como filtro/validação (não removem dado por
"parecer estranho" — são checagens de consistência básica sugeridas pelo
próprio plano):

| Validação | Regra |
|---|---|
| Data do voo não nula | `fl_date IS NOT NULL` |
| Origem não nula | `origin IS NOT NULL` |
| Destino não nulo | `destination IS NOT NULL` |
| Rota coerente | `origin != dest` |
| Distância válida | `distance > 0` |

**Evidência no sample:** todas as 4 primeiras validações já passam em 100% dos
10.000 registros (0 nulos em `fl_date`/`origin`/`dest`, 0 casos de
`origin = dest`, 0 valores de `distance <= 0`). Serão reaplicadas como
checagem de qualidade contínua no dataset completo.

**Decisão:** registros que violarem essas regras no dataset completo serão
**removidos** da Silver e contabilizados no relatório de validação (não
descartados silenciosamente).

---

## 📋 Resumo das Decisões

| # | Problema | Decisão |
|---|---|---|
| 01 | Nulos em cancellation_code | Manter |
| 02 | Nulos operacionais | Manter |
| 03 | Atrasos extremos | Manter + flag `is_extreme_delay` |
| 04 | Cancelado com dep_time preenchido | Manter |
| 05 | Desviado com arr_time preenchido | Manter |
| 06 | Tipo de op_carrier_fl_num | Converter para integer |
| 07 | Padronização de texto | Trim preventivo |
| 08 | Formato de horário hhmm | Manter |
| 09 | Duplicatas | Remover (proteção) |
| 10 | Validações estruturais | Filtrar/remover se violado |

---

## 📤 Status

✅ Regras de transformação definidas e justificadas — Etapa 11 concluída.
⏭️ Próximo passo: implementar essas regras em código na **Etapa 12 —
Desenvolvimento Silver**, gerando `silver.flights_clean`.