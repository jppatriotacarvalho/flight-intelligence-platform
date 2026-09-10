# 📚 Documentação Completa — Flight Intelligence Platform

> Este documento reúne toda a documentação técnica produzida ao longo do
> desenvolvimento do projeto, organizada na ordem das fases do plano de
> execução. Cada seção abaixo corresponde a um documento que guiou uma
> etapa específica do trabalho.

---

## 🗂️ Índice

1. [Problema de Negócio](#1-problema-de-negócio)
2. [Dicionário de Dados](#2-dicionário-de-dados)
3. [Análise Exploratória e Qualidade](#3-análise-exploratória-e-qualidade)
4. [Perguntas de Negócio](#4-perguntas-de-negócio)
5. [Regras de Transformação (Silver)](#5-regras-de-transformação-silver)
6. [KPIs e Regras de Negócio](#6-kpis-e-regras-de-negócio)
7. [Arquitetura Geral](#7-arquitetura-geral)
8. [Modelo de Banco de Dados](#8-modelo-de-banco-de-dados)
9. [Segurança do Agente de IA](#9-segurança-do-agente-de-ia)
10. [Testes Realizados](#10-testes-realizados)
11. [Log de Decisões Técnicas](#11-log-de-decisões-técnicas)

---


---

# 1. Problema de Negócio

<a id="1-problema-de-negócio"></a>


### Qual problema estamos resolvendo?

O setor aéreo gera diariamente um grande volume de dados sobre voos, horários, atrasos, cancelamentos, desvios, companhias aéreas, aeroportos e rotas. Esses dados, no entanto, costumam existir de forma bruta, fragmentada, espalhados em diferentes fontes e sem padronização. Não permitindo uma análise ou tomada de decisão com mais qualidade.

O problema central é a ausência de uma plataforma que transforme esse volume de dados brutos em informação confiável, estruturada e acessível. Hoje é difícil responder perguntas simples como "qual companhia atrasa mais" ou "qual aeroporto tem maior taxa de cancelamento" sem um processo manual, demorado e sujeito a erro.

Este projeto resolve esse problema construindo um pipeline completo de dados — desde a ingestão de milhões de registros até a disponibilização de métricas confiáveis via API, dashboard e um agente de IA capaz de responder perguntas em linguagem natural.

---

### Quem poderia utilizar a plataforma?

- **Companhias aéreas** — para monitorar sua própria performance operacional (pontualidade, atrasos, cancelamentos) e se comparar com o mercado.
- **Aeroportos** — para entender seu desempenho operacional e identificar gargalos.
- **Analistas de dados / BI** — para explorar tendências do setor aéreo sem precisar processar o dataset bruto.
- **Áreas de operações e planejamento** — para embasar decisões sobre rotas, horários e alocação de recursos.
- **Passageiros e público em geral** (uso exploratório) — para entender quais companhias, aeroportos e rotas são historicamente mais pontuais.
- **Recrutadores e comunidade técnica** — como demonstração de portfólio de um pipeline de dados de ponta a ponta.

---

### Quais decisões podem ser apoiadas?

- Priorização de rotas ou aeroportos que exigem ações para reduzir atrasos.
- Avaliação comparativa de companhias aéreas quanto à pontualidade e confiabilidade.
- Identificação de períodos do ano (meses, dias da semana) com maior risco operacional.
- Investigação dos principais motivos de atraso (clima, aeronave, segurança, tráfego aéreo) para direcionar investimentos ou mudanças operacionais.
- Escolha de rotas ou companhias por parte de quem está planejando uma viagem, com base em dados históricos de pontualidade.

---

### Quais perguntas os dados podem responder?

- Qual companhia aérea possui o maior atraso médio?
- Qual companhia aérea possui a maior taxa de cancelamento?
- Qual aeroporto apresenta mais atrasos ou cancelamentos?
- Qual rota tem o maior volume de voos ou o maior atraso médio?
- Como os atrasos evoluem ao longo do ano (por mês, por dia da semana)?
- Qual é o principal motivo dos atrasos (clima, companhia, aeronave, segurança, tráfego aéreo)?
- Qual companhia ou aeroporto é historicamente mais pontual?

---

### 📤 Status

🚧 Documento inicial — Etapa 1 do plano de execução. Sujeito a ajustes conforme o projeto avança.


---

# 2. Dicionário de Dados

<a id="2-dicionário-de-dados"></a>


Fonte: `flight_data_2024_data_dictionary.csv`

Total de colunas confirmado: **35**

> As descrições abaixo foram escritas com base na nomenclatura oficial do BTS
> (Bureau of Transportation Statistics — On-Time Performance Database), fonte
> original do dataset. Os valores de tipo, % de nulos e exemplo vêm
> diretamente do arquivo de dicionário fornecido.

---

### 📋 Tabela de Documentação

| Coluna | Tipo | % Nulos | Exemplo | Descrição |
|---|---|---:|---|---|
| year | Int64 | 0.0 | 2024 | Ano do voo |
| month | Int64 | 0.0 | 1 | Mês do voo (1–12) |
| day_of_month | Int64 | 0.0 | 1 | Dia do mês do voo |
| day_of_week | Int64 | 0.0 | 1 | Dia da semana do voo (padrão BTS: 1=segunda … 7=domingo) |
| fl_date | datetime64[ns] | 0.0 | 2024-01-01 00:00:00 | Data completa do voo |
| op_unique_carrier | object | 0.0 | 9E | Código único da companhia aérea operadora |
| op_carrier_fl_num | float64 | 0.0 | 4814.0 | Número do voo atribuído pela companhia |
| origin | object | 0.0 | JFK | Código IATA do aeroporto de origem |
| origin_city_name | object | 0.0 | New York, NY | Cidade/estado (texto) do aeroporto de origem |
| origin_state_nm | object | 0.0 | New York | Nome do estado de origem |
| dest | object | 0.0 | DTW | Código IATA do aeroporto de destino |
| dest_city_name | object | 0.0 | Detroit, MI | Cidade/estado (texto) do aeroporto de destino |
| dest_state_nm | object | 0.0 | Michigan | Nome do estado de destino |
| crs_dep_time | Int64 | 0.0 | 1252 | Horário de partida programado (formato hhmm) |
| dep_time | float64 | 1.31 | 1247.0 | Horário real de partida (formato hhmm) |
| dep_delay | float64 | 1.31 | -5.0 | Atraso na partida em minutos (negativo = decolou adiantado) |
| taxi_out | float64 | 1.35 | 31.0 | Tempo de táxi entre saída do portão e decolagem (minutos) |
| wheels_off | float64 | 1.35 | 1318.0 | Horário real de decolagem (formato hhmm) |
| wheels_on | float64 | 1.38 | 1442.0 | Horário real de pouso (formato hhmm) |
| taxi_in | float64 | 1.38 | 7.0 | Tempo de táxi entre pouso e chegada ao portão (minutos) |
| crs_arr_time | Int64 | 0.0 | 1508 | Horário de chegada programado (formato hhmm) |
| arr_time | float64 | 1.38 | 1449.0 | Horário real de chegada (formato hhmm) |
| arr_delay | float64 | 1.61 | -19.0 | Atraso na chegada em minutos (negativo = chegou adiantado) |
| cancelled | int64 | 0.0 | 0 | Indicador de cancelamento (0 = não cancelado, 1 = cancelado) |
| cancellation_code | object | 98.64 | B | Código do motivo do cancelamento (A=Companhia, B=Clima, C=NAS, D=Segurança) |
| diverted | int64 | 0.0 | 0 | Indicador de desvio de rota (0 = não desviado, 1 = desviado) |
| crs_elapsed_time | float64 | 0.0 | 136.0 | Duração programada do voo (minutos) |
| actual_elapsed_time | float64 | 1.61 | 122.0 | Duração real do voo (minutos) |
| air_time | float64 | 1.61 | 84.0 | Tempo efetivamente em voo, excluindo taxi (minutos) |
| distance | float64 | 0.0 | 509.0 | Distância da rota (milhas) |
| carrier_delay | int64 | 0.0 | 0 | Minutos de atraso atribuídos à companhia aérea |
| weather_delay | int64 | 0.0 | 0 | Minutos de atraso atribuídos ao clima |
| nas_delay | int64 | 0.0 | 0 | Minutos de atraso atribuídos ao sistema de espaço aéreo nacional (NAS) |
| security_delay | int64 | 0.0 | 0 | Minutos de atraso atribuídos a questões de segurança |
| late_aircraft_delay | int64 | 0.0 | 0 | Minutos de atraso atribuídos à chegada tardia da aeronave anterior |

---

### 🗂️ Classificação por Grupo

#### 📅 Temporal
- year
- month
- day_of_month
- day_of_week
- fl_date

#### ✈️ Voo
- op_carrier_fl_num

#### 🏢 Companhia
- op_unique_carrier

#### 🛫 Origem
- origin
- origin_city_name
- origin_state_nm

#### 🛬 Destino
- dest
- dest_city_name
- dest_state_nm

#### ⏰ Horários
- crs_dep_time
- dep_time
- crs_arr_time
- arr_time
- wheels_off
- wheels_on
- taxi_out
- taxi_in

#### ⚠️ Atrasos
- dep_delay
- arr_delay
- carrier_delay
- weather_delay
- nas_delay
- security_delay
- late_aircraft_delay

#### ❌ Cancelamento
- cancelled
- cancellation_code

#### ↪️ Desvio
- diverted

#### 📏 Distância e Duração
- crs_elapsed_time
- actual_elapsed_time
- air_time
- distance

---

### 🔎 Categorias de Dados

| Categoria | Colunas |
|---|---|
| Identificador | op_unique_carrier, op_carrier_fl_num, origin, dest |
| Numérica (contínua/discreta) | dep_delay, arr_delay, taxi_out, taxi_in, crs_elapsed_time, actual_elapsed_time, air_time, distance, carrier_delay, weather_delay, nas_delay, security_delay, late_aircraft_delay |
| Categórica | origin_city_name, origin_state_nm, dest_city_name, dest_state_nm, cancellation_code |
| Temporal | year, month, day_of_month, day_of_week, fl_date, crs_dep_time, dep_time, crs_arr_time, arr_time, wheels_off, wheels_on |
| Boolean (0/1) | cancelled, diverted |

---

### 🔍 Observações iniciais (para validar na Etapa 7 com o sample)

- `cancellation_code` tem 98.64% de nulos — coerente, já que só existe valor quando `cancelled = 1`. Precisa ser validado com o sample (regra: nulo aqui não é "dado faltando", é "não se aplica").
- `op_carrier_fl_num` está como `float64` (ex: 4814.0), mas semanticamente é um identificador — não uma medida numérica contínua. Ponto a investigar/ajustar na Silver.
- Horários (`crs_dep_time`, `dep_time`, `crs_arr_time`, `arr_time`, `wheels_off`, `wheels_on`) estão no formato `hhmm` como número (ex: 1252 = 12:52), não como timestamp — vai precisar de tratamento na Silver se quisermos horário de verdade.
- Ainda **não foi feita** a comparação entre este dicionário e o `flight_data_2024_sample.csv` (item 6.4 do plano) — isso será feito assim que o sample for carregado, já na Etapa 7.

---

### 📤 Status

✅ 35 colunas documentadas, classificadas e agrupadas — Etapa 6 concluída.
⏭️ Pendente: comparação com o sample real (Etapa 7).


---

# 3. Análise Exploratória e Qualidade

<a id="3-análise-exploratória-e-qualidade"></a>


Fonte: `flight_data_2024_sample.csv` (10.000 registros, 35 colunas)

> Este documento segue a regra do plano: **analisar, entender e documentar
> primeiro — decidir depois.** Nenhuma transformação foi aplicada aos dados
> nesta etapa. As decisões de tratamento serão formalizadas na Etapa 11
> (`docs/silver_rules.md`).

---

### 7.1 — Estrutura Geral

- Linhas: **10.000**
- Colunas: **35**
- Schema e tipos batem com o `data_dictionary.csv` (ver seção 7.4).

---

### 7.4 — Comparação Data Dictionary vs Sample

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

### 7.2 — Valores Nulos

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

### 7.3 — Duplicatas

- Linhas 100% duplicadas: **0**
- Duplicatas usando chave composta (`fl_date + op_unique_carrier + op_carrier_fl_num + origin + dest`): **0**

✅ Não há indício de duplicação no sample.

---

### 7.4b — Valores Únicos (Categóricos)

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

### 7.5 — Valores Numéricos

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

### 7.6 — Datas (`fl_date`)

- Datas inválidas: **0**
- Intervalo: `2024-01-01` até `2024-12-31`
- Anos únicos: apenas `2024`

✅ Coluna de data está íntegra e dentro do esperado.

---

### 7.7 — Horários (`crs_dep_time`, `crs_arr_time`)

- Valores fora do range válido (0–2359): **0**
- `crs_dep_time`: min 22, max 2359

✅ Sem inconsistências de horário programado. Vale registrar: o formato é `hhmm` numérico (ex.: 1252 = 12:52), não timestamp — será necessário tratar isso na Silver se quisermos operar como hora real.

---

### 7.8 — Atrasos

- `dep_delay`: 5.784 negativos / 437 zeros / 3.663 positivos
- `arr_delay`: 6.092 negativos / 166 zeros / 3.578 positivos

Confirma o que o plano já alertava: **atraso negativo é válido** e representa voos que decolaram/chegaram adiantados — não deve ser tratado como erro.

**Colunas de motivo de atraso** (`carrier_delay`, `weather_delay`, `nas_delay`, `security_delay`, `late_aircraft_delay`): a maioria dos registros tem valor 0 nessas colunas (mediana 0 em todas), e apenas **2.119 registros** (~21%) têm soma > 0 — ou seja, motivo de atraso só é preenchido quando existe atraso relevante atribuído. Isso é esperado pela definição do BTS (essas colunas só são preenchidas quando `arr_delay >= 15 min`).

---

### 7.10 — Cancelamento e Desvio

**Cancelamento:**
- 122 voos cancelados (1.22% da amostra) — proporção plausível.
- Códigos de cancelamento presentes: A (Companhia), B (Clima), C (NAS). Nenhum D (Segurança) no sample.
- **Achado relevante:** de 122 voos cancelados, **6 têm `dep_time` preenchido** (decolaram/saíram do portão) mas `arr_time` nulo. Isso é um cenário operacional real (ex.: retorno ao portão, cancelamento após saída) e não parece erro — mas é uma regra que precisa ser explicitada na Etapa 11 (Silver): "cancelado" não implica necessariamente todos os campos de horário real nulos.

**Desvio:**
- 42 voos desviados (0.42% da amostra).
- Todos os 42 registros desviados têm `arr_delay` nulo (100%) — coerente, já que um voo desviado não completa o trajeto planejado.
- Desses 42, **37 também têm `arr_time` nulo**, mas **5 têm `arr_time` preenchido** — provavelmente pousaram em outro aeroporto e o sistema registrou algum horário de chegada mesmo assim. Também vira regra a definir na Silver.

---

### 📊 Tabela-Resumo de Problemas Encontrados

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

### 📤 Status

✅ Análise exploratória e de qualidade concluída — Etapa 7.
⏭️ Nenhuma transformação foi aplicada. As decisões de tratamento (o que manter, remover ou substituir) serão formalizadas na **Etapa 11 — Diagnóstico para Silver** (`docs/silver_rules.md`).


---

# 4. Perguntas de Negócio

<a id="4-perguntas-de-negócio"></a>


Este documento define as perguntas que a plataforma deve conseguir responder.
Elas servem de guia para o desenho das tabelas Gold (Etapa 14), dos KPIs
(Etapa 13) e do dashboard (Etapa 19) — cada tabela e métrica criada deve
existir para responder a pelo menos uma pergunta daqui.

---

### ✈️ Companhias

1. Qual companhia possui o maior atraso médio (partida e chegada)?
2. Qual companhia possui a maior taxa de cancelamento?
3. Qual companhia possui o maior volume de voos?
4. Qual companhia é mais pontual (menor % de voos atrasados)?

---

### 🛫 Aeroportos

5. Qual aeroporto possui o maior atraso médio?
6. Qual aeroporto possui o maior volume de voos (origem e destino)?
7. Qual aeroporto possui a maior taxa de cancelamento?

---

### 🗺️ Rotas

8. Qual rota (origem → destino) possui o maior volume de voos?
9. Qual rota possui o maior atraso médio?
10. Qual rota possui a maior distância percorrida?

---

### 📅 Tempo

11. Qual mês do ano concentra mais atrasos?
12. Qual dia da semana concentra mais atrasos?
13. Como os atrasos evoluíram ao longo de 2024 (tendência mensal/diária)?

---

### ⚠️ Motivos de Atraso

14. Qual é o principal motivo dos atrasos (companhia, clima, NAS, segurança, aeronave anterior)?
15. Quanto o clima (`weather_delay`) impacta no total de minutos de atraso?
16. Quanto atrasos por aeronave anterior (`late_aircraft_delay`) impactam no total?

---

### 📋 Rastreabilidade (pergunta → dado necessário)

| Pergunta | Colunas envolvidas | Granularidade sugerida |
|---|---|---|
| 1, 4 | op_unique_carrier, dep_delay, arr_delay | Por companhia |
| 2 | op_unique_carrier, cancelled | Por companhia |
| 3 | op_unique_carrier | Por companhia |
| 5, 7 | origin, dest, arr_delay, dep_delay, cancelled | Por aeroporto |
| 6 | origin, dest | Por aeroporto |
| 8, 9, 10 | origin, dest, distance, arr_delay | Por rota (origem+destino) |
| 11, 12, 13 | fl_date, month, day_of_week, arr_delay | Por período (mês/dia) |
| 14, 15, 16 | carrier_delay, weather_delay, nas_delay, security_delay, late_aircraft_delay | Agregado por motivo |

---

### ✅ Critério de Validação

Todas as perguntas acima já podem ser respondidas com as colunas confirmadas
no `data_dictionary.md` e validadas no `data_quality.md` — nenhuma depende de
dado que não existe no dataset.

---

### 📤 Status

✅ Perguntas de negócio definidas — Etapa 8 concluída.
⏭️ Servirão de base direta para as Etapas 13 (KPIs) e 14 (tabelas Gold).


---

# 5. Regras de Transformação (Silver)

<a id="5-regras-de-transformação-silver"></a>


Este documento transforma os achados do `data_quality.md` (Etapa 7) em regras
formais de decisão, seguindo o fluxo obrigatório do plano:

```
PROBLEMA → EVIDÊNCIA → DECISÃO → TRANSFORMAÇÃO → VALIDAÇÃO
```

> Nenhuma transformação foi executada ainda. Este documento é o "contrato"
> que será implementado em código na Etapa 12 (`silver.flights_clean`).

---

### Regra 01 — Nulos em `cancellation_code`

- **Problema:** 98.78% de nulos na coluna.
- **Coluna:** `cancellation_code`
- **Evidência:** o nulo ocorre exatamente quando `cancelled = 0` (voo não cancelado). Não é dado faltando, é campo "não aplicável".
- **Decisão:** **Manter nulo.**
- **Justificativa:** substituir por qualquer valor (ex: "N/A") mudaria o tipo de dado sem ganho analítico e poderia confundir com um código de motivo real (A/B/C/D). Nulo já comunica corretamente "não se aplica".
- **Transformação:** nenhuma. Documentar a regra de negócio: `cancellation_code IS NULL ⇔ cancelled = 0`.
- **Validação:** checar que 100% dos nulos em `cancellation_code` correspondem a `cancelled = 0`, e 100% dos `cancelled = 1` têm `cancellation_code` preenchido.

---

### Regra 02 — Nulos operacionais (voo não completou o ciclo normal)

- **Problema:** nulos concentrados em `dep_time`, `dep_delay`, `taxi_out`, `wheels_off`, `wheels_on`, `taxi_in`, `arr_time`, `arr_delay`, `actual_elapsed_time`, `air_time` (1.16%–1.64%).
- **Coluna:** as listadas acima.
- **Evidência:** os nulos aparecem majoritariamente em voos cancelados ou desviados, que não seguem o ciclo completo (partida → chegada) — dados que simplesmente nunca existiram, não foram "perdidos".
- **Decisão:** **Manter nulo.**
- **Justificativa:** imputar (ex: com zero ou média) criaria um valor artificial para algo que não ocorreu, distorcendo qualquer KPI de atraso/duração calculado sobre esses campos.
- **Transformação:** nenhuma remoção ou substituição. Ao calcular KPIs de atraso (Etapa 13), excluir explicitamente nulos do cálculo (não tratar como zero).
- **Validação:** confirmar que a taxa de nulos nessas colunas cai fortemente quando filtrado `cancelled = 0 AND diverted = 0`.

---

### Regra 03 — Atrasos extremos (`dep_delay` / `arr_delay` > 2000 min)

- **Problema:** valores muito altos de atraso (~2000 minutos / ~33h) no topo da distribuição.
- **Coluna:** `dep_delay`, `arr_delay`.
- **Evidência:** no maior caso analisado, `carrier_delay` = 2011 quase idêntico ao `arr_delay` total = 2014 — os componentes de atraso somam de forma coerente, indicando valor real, não erro de digitação.
- **Decisão:** **Manter o registro**, sem remover ou "capar" o valor.
- **Justificativa:** remover outliers reais sem critério de negócio distorceria a análise de casos extremos, que são justamente um dos pontos de interesse do projeto (ex: causas de atrasos severos).
- **Transformação:** adicionar coluna derivada `is_extreme_delay` (boolean, ex: `arr_delay > 180`) para permitir segmentar esses casos em análises futuras, sem excluí-los.
- **Validação:** conferir que a soma das colunas de motivo (`carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay`) é coerente com `arr_delay` nos casos extremos.

---

### Regra 04 — Voo cancelado com `dep_time` preenchido

- **Problema:** 6 registros com `cancelled = 1` mas `dep_time` não nulo (chegaram a sair do portão/decolar antes do cancelamento).
- **Coluna:** `cancelled`, `dep_time`, `arr_time`.
- **Evidência:** todos os 6 casos têm `arr_time` nulo — ou seja, o voo iniciou mas não completou o trajeto.
- **Decisão:** **Manter como está.** Não tratar como inconsistência.
- **Justificativa:** é um cenário operacional real (retorno ao portão, cancelamento em solo após pushback). Forçar `dep_time` para nulo apagaria informação verdadeira.
- **Transformação:** nenhuma.
- **Validação:** ao calcular métricas de cancelamento, considerar `cancelled = 1` como a fonte de verdade — não inferir cancelamento a partir de `arr_time` nulo isoladamente.

---

### Regra 05 — Voo desviado com `arr_time` preenchido

- **Problema:** 5 de 42 registros com `diverted = 1` têm `arr_time` preenchido.
- **Coluna:** `diverted`, `arr_time`, `arr_delay`.
- **Evidência:** 100% dos desviados têm `arr_delay` nulo (mesmo os que têm `arr_time` preenchido) — indica que o voo pousou em local diferente do planejado, então o "atraso" em relação ao destino original não é calculável.
- **Decisão:** **Manter como está.**
- **Justificativa:** `arr_time` preenchido nesses casos provavelmente reflete o horário de pouso no aeroporto alternativo, dado operacionalmente válido, mesmo que `arr_delay` não possa ser calculado.
- **Transformação:** nenhuma. Documentar que `arr_delay` não deve ser usado para voos desviados (sempre nulo por definição).
- **Validação:** confirmar 100% de nulos em `arr_delay` para `diverted = 1` seguem assim após qualquer transformação.

---

### Regra 06 — Tipo de `op_carrier_fl_num`

- **Problema:** coluna semanticamente um identificador (número do voo), mas veio como `double` (ex: 4814.0).
- **Coluna:** `op_carrier_fl_num`.
- **Evidência:** não existem casas decimais reais nos valores observados no sample.
- **Decisão:** **Converter para inteiro (`integer`).**
- **Justificativa:** identificadores não devem carregar tipo decimal — evita ambiguidade e reduz espaço de armazenamento.
- **Transformação:** `CAST(op_carrier_fl_num AS INT)`.
- **Validação:** conferir que a conversão não gera perda de valor (nenhum decimal diferente de `.0` antes do cast).

---

### Regra 07 — Padronização de texto

- **Problema:** colunas de texto podem conter espaços extras ou inconsistência de caixa (não identificado no sample, mas é boa prática preventiva antes de ir para o dataset completo).
- **Coluna:** `op_unique_carrier`, `origin`, `dest`, `origin_city_name`, `origin_state_nm`, `dest_city_name`, `dest_state_nm`, `cancellation_code`.
- **Evidência:** verificação a ser repetida no dataset completo (Etapa 15); no sample não foram encontrados espaços extras ou inconsistências de caixa.
- **Decisão:** **Aplicar `TRIM()` preventivamente** em todas as colunas de texto; manter `op_unique_carrier`, `origin`, `dest`, `cancellation_code` em maiúsculas (padrão já observado).
- **Justificativa:** operação de baixo custo e sem risco que protege contra inconsistências que podem existir só no dataset completo (7M+ registros).
- **Transformação:** `TRIM(coluna)` para todas as colunas de texto listadas.
- **Validação:** comparar contagem de valores únicos antes/depois do trim (não deve diminuir se não havia problema).

---

### Regra 08 — Horários no formato `hhmm` (inteiro)

- **Problema:** `crs_dep_time`, `dep_time`, `crs_arr_time`, `arr_time`, `wheels_off`, `wheels_on` estão como número no formato `hhmm` (ex: 1252 = 12:52), não como horário de verdade.
- **Coluna:** as listadas acima.
- **Evidência:** todos os valores observados estão dentro do range válido 0–2359.
- **Decisão:** **Manter o formato original na Silver.** Não converter para timestamp nesta etapa.
- **Justificativa:** a conversão para hora/timestamp real só é necessária se algum KPI ou visualização do Gold/Dashboard exigir — fazer isso agora sem uma necessidade concreta seria "limpeza decorativa", proibida pela Regra Geral do plano.
- **Transformação:** nenhuma por enquanto. Se necessário futuramente, será tratado na Gold, específico para a métrica que precisar.
- **Validação:** manter a checagem de range (0–2359) como validação de qualidade contínua.

---

### Regra 09 — Duplicatas

- **Problema:** nenhuma duplicata encontrada no sample (nem linha completa, nem pela chave composta).
- **Coluna:** todas / chave composta `fl_date + op_unique_carrier + op_carrier_fl_num + origin + dest`.
- **Evidência:** `0` duplicatas no sample de 10.000 registros.
- **Decisão:** **Aplicar remoção de duplicatas exatas mesmo assim**, como proteção para o dataset completo (Etapa 15), onde duplicatas podem aparecer em maior volume.
- **Justificativa:** operação segura e reversível — só remove linhas 100% idênticas, não estima nem infere nada.
- **Transformação:** `dropDuplicates()` sobre o DataFrame completo.
- **Validação:** comparar contagem de registros antes/depois; no sample o resultado deve ser idêntico (10.000 → 10.000).

---

### Regra 10 — Validações estruturais obrigatórias

- **Problema:** ausência de checagens de integridade básica antes de
  finalizar a Silver.
- **Coluna:** `fl_date`, `origin`, `dest`, `distance`.
- **Evidência:** no sample, todas as 10.000 linhas já passam nessas
  checagens (0 nulos em fl_date/origin/dest, 0 casos de origin=dest, 0
  distance<=0), mas isso não está garantido no dataset completo sem uma
  regra explícita.
- **Decisão:** aplicar as seguintes validações e remover registros que as
  violarem:

| Validação | Regra |
|---|---|
| Data do voo não nula | `fl_date IS NOT NULL` |
| Origem não nula | `origin IS NOT NULL` |
| Destino não nulo | `destination IS NOT NULL` |
| Rota coerente | `origin != dest` |
| Distância válida | `distance > 0` |

- **Justificativa:** são checagens de consistência mínima sugeridas pelo
  próprio plano — não são regras inventadas, mas verificações estruturais
  óbvias que qualquer pipeline de dados deve ter.
- **Transformação:** filtro `WHERE` removendo linhas que violem qualquer
  uma das condições acima.
- **Validação:** contabilizar quantos registros foram removidos e reportar
  no resumo da execução (já implementado no código, variável
  `qtd_invalidos`, testado na Etapa 12 com resultado 0 e na Etapa 15 com
  resultado 0 também).

---

### 📋 Resumo das Decisões

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

### 📤 Status

✅ Regras de transformação definidas e justificadas — Etapa 11 concluída.
⏭️ Próximo passo: implementar essas regras em código na **Etapa 12 —
Desenvolvimento Silver**, gerando `silver.flights_clean`.


---

# 6. KPIs e Regras de Negócio

<a id="6-kpis-e-regras-de-negócio"></a>


Fonte: `silver.flights_clean`

Cada KPI abaixo existe para responder pelo menos uma pergunta definida em
`docs/business_questions.md`. Nenhuma métrica foi criada sem propósito.

---

### KPI 01 — Total de Voos

- **Descrição:** quantidade total de voos registrados.
- **Fórmula:** `COUNT(*)`
- **Colunas utilizadas:** nenhuma (contagem de linhas).
- **Regra:** conta todos os registros da Silver, incluindo cancelados e desviados (representam voos programados, mesmo que não concluídos).
- **Justificativa:** métrica base de volume, usada como denominador em quase todas as taxas abaixo.

---

### KPI 02 — Taxa de Atraso

- **Descrição:** percentual de voos com chegada atrasada.
- **Fórmula:**
  ```
  Voos com arr_delay > 15
  ----------------------------
        Total de Voos
  ```
- **Colunas utilizadas:** `arr_delay`
- **Regra:** um voo é considerado "atrasado" quando `arr_delay > 15` minutos. Esse limiar de 15 minutos é o padrão adotado pelo próprio BTS (fonte original do dataset) para definir atraso oficial — não foi inventado para este projeto.
- **Justificativa:** usar um limiar reconhecido evita definir um critério arbitrário de "atraso" e mantém a métrica comparável com relatórios oficiais do setor.
- **Observação:** registros com `arr_delay` nulo (voos cancelados/desviados, ver `silver_rules.md` Regra 02) são excluídos do cálculo — não contam nem como atrasados nem como pontuais.

---

### KPI 03 — Atraso Médio (Chegada)

- **Descrição:** média de minutos de atraso na chegada.
- **Fórmula:** `AVG(arr_delay)`
- **Colunas utilizadas:** `arr_delay`
- **Regra:** calculado apenas sobre voos com `arr_delay` não nulo. Valores negativos (voo adiantado) entram no cálculo normalmente, pois são dados válidos.
- **Justificativa:** representa o atraso "líquido" médio, incluindo o efeito de voos adiantados — mais realista que olhar só para os atrasados.

---

### KPI 04 — Atraso Médio (Partida)

- **Descrição:** média de minutos de atraso na partida.
- **Fórmula:** `AVG(dep_delay)`
- **Colunas utilizadas:** `dep_delay`
- **Regra:** mesma lógica do KPI 03, aplicada à partida em vez da chegada.
- **Justificativa:** permite distinguir se o atraso se origina na partida ou se acumula/dissipa durante o voo (comparando com o atraso de chegada).

---

### KPI 05 — Taxa de Cancelamento

- **Descrição:** percentual de voos cancelados.
- **Fórmula:**
  ```
  Voos Cancelados (cancelled = 1)
  --------------------------------
         Total de Voos
  ```
- **Colunas utilizadas:** `cancelled`
- **Regra:** usa diretamente a flag `cancelled`, já validada na Etapa 7/11 como fonte de verdade (não inferida a partir de horários nulos).
- **Justificativa:** métrica direta, sem ambiguidade, para medir confiabilidade operacional.

---

### KPI 06 — Taxa de Desvio

- **Descrição:** percentual de voos desviados de sua rota original.
- **Fórmula:**
  ```
  Voos Desviados (diverted = 1)
  -------------------------------
         Total de Voos
  ```
- **Colunas utilizadas:** `diverted`
- **Regra:** usa a flag `diverted` diretamente.
- **Justificativa:** complementa a taxa de cancelamento como segundo indicador de confiabilidade operacional.

---

### KPI 07 — Companhia Mais Pontual

- **Descrição:** companhia aérea com a menor taxa de atraso (KPI 02 agrupado por companhia).
- **Fórmula:** `MIN(delay_rate)` agrupado por `op_unique_carrier`
- **Colunas utilizadas:** `op_unique_carrier`, `arr_delay`
- **Regra:** mesmo critério de atraso do KPI 02 (`arr_delay > 15`), agregado por companhia.
- **Justificativa:** responde diretamente a pergunta de negócio "qual companhia é mais pontual" (Etapa 8).

---

### KPI 08 — Aeroporto Mais Atrasado

- **Descrição:** aeroporto de origem com o maior atraso médio de partida.
- **Fórmula:** `MAX(AVG(dep_delay))` agrupado por `origin`
- **Colunas utilizadas:** `origin`, `dep_delay`
- **Regra:** considera apenas o papel do aeroporto como origem (partida). Uma versão simétrica pode ser feita para `dest`/`arr_delay` se necessário.
- **Justificativa:** responde à pergunta "qual aeroporto possui maior atraso" (Etapa 8).

---

### KPI 09 — Distribuição de Motivos de Atraso

- **Descrição:** participação de cada motivo (companhia, clima, NAS, segurança, aeronave anterior) no total de minutos de atraso.
- **Fórmula:**
  ```
  SUM(carrier_delay) , SUM(weather_delay) , SUM(nas_delay),
  SUM(security_delay) , SUM(late_aircraft_delay)
  ```
- **Colunas utilizadas:** `carrier_delay`, `weather_delay`, `nas_delay`, `security_delay`, `late_aircraft_delay`
- **Regra:** somatório direto de cada coluna de motivo. Conforme observado na Etapa 7, essas colunas só são preenchidas com valor > 0 quando o atraso de chegada é relevante (padrão BTS: `arr_delay >= 15`).
- **Justificativa:** responde às perguntas sobre o principal motivo de atraso e o impacto específico do clima ou de aeronaves atrasadas (Etapa 8).

---

### 📋 Resumo — KPI × Pergunta de Negócio

| KPI | Pergunta(s) de negócio atendida(s) (Etapa 8) |
|---|---|
| Total de Voos | 3, 6 |
| Taxa de Atraso | 1, 4, 11, 12, 13 |
| Atraso Médio (Chegada/Partida) | 1, 5, 9 |
| Taxa de Cancelamento | 2, 7 |
| Taxa de Desvio | complementar (confiabilidade operacional) |
| Companhia Mais Pontual | 4 |
| Aeroporto Mais Atrasado | 5 |
| Distribuição de Motivos de Atraso | 14, 15, 16 |

---

### 📤 Status

✅ KPIs oficialmente definidos, com fórmula, colunas e justificativa — Etapa 13 concluída.
⏭️ Próximo passo: implementar essas métricas nas tabelas analíticas da **Etapa 14 — Desenvolvimento Gold**.


---

# 7. Arquitetura Geral

<a id="7-arquitetura-geral"></a>


### 📂 Origem dos Dados

Dataset **Flight Delay Dataset — 2024**, obtido via Kaggle, com origem
original na **BTS TranStats — On-Time Performance Database**. Licença
**CC0 — Creative Commons Zero**. Mais de 7 milhões de registros e 35 colunas
sobre performance de voos domésticos nos EUA em 2024.

Detalhes completos em `docs/business_problem.md` e no `README.md`.

---

### 🔄 Pipeline (Visão Geral)

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

### 🥉🥈🥇 Camadas (Arquitetura Medalhão) — Etapa 9

#### 🥉 Bronze — `bronze.flights_raw`

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

#### 🥈 Silver — `silver.flights_clean`

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

#### 🥇 Gold — tabelas analíticas

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

### 🐬 Banco de Dados

> ⚠️ **Nota de decisão:** o plano original previa PostgreSQL. Por preferência
> de ferramental (MySQL Workbench), o projeto passou a usar **MySQL**.
> Decisão completa registrada em `docs/decision_log.md` (Decisão 01).

MySQL recebe as tabelas Gold para consumo por aplicações externas ao
Databricks. Modelo escolhido: **tabelas analíticas diretas** (sem esquema
dimensional), já que as tabelas Gold chegam prontas e agregadas — detalhes e
justificativa completa em `docs/database_model.md`.

**Status:** ✅ Etapa 16 concluída. Banco `flight_intelligence` criado com 5
tabelas (`airline_performance`, `airport_performance`, `route_performance`,
`delay_causes`, `flight_trends`), populadas e validadas 1:1 contra as tabelas
Gold do Databricks (7.079.081 voos processados na origem).

---

### 🚀 Backend / API

Camada de API (Etapa 17, tecnologia a definir entre Java/Spring Boot ou
Python/FastAPI) expõe as tabelas Gold via endpoints REST, com filtros por
companhia, aeroporto, rota e período.

---

### 💻 Frontend

Aplicação React + TypeScript (Etapa 18) consome a API para exibir dashboard,
páginas de companhias/aeroportos/rotas/atrasos e o chat com o agente de IA.

---

### 📊 Dashboard

Visualizações (Etapa 19) construídas a partir dos KPIs definidos em
`docs/business_rules.md`: total de voos, taxa de atraso, atraso médio, taxa
de cancelamento, companhia mais pontual, aeroporto mais atrasado, gráficos de
comparação por companhia/aeroporto/rota e evolução temporal.

---

### 🤖 Agente de IA

Agente baseado na Gemini API (Etapas 20 e 21) responde perguntas em
linguagem natural, traduzindo para SQL controlado (somente `SELECT`,
whitelist de tabelas/colunas Gold, `LIMIT` obrigatório, sem acesso a
Bronze/Silver/credenciais). Fluxo completo documentado nas Etapas 20 e 21 do
plano mestre.

---

### 📤 Status

✅ Arquitetura geral e papel das camadas documentados — Etapas 3 e 9 concluídas.
⏭️ Próximo passo: implementação das tabelas Gold (Etapa 14).

---

### 🐳 Containerização (Docker)

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

### 📤 Status Final da Arquitetura

✅ Pipeline de dados, banco, backend, frontend, agente de IA e
containerização — todos implementados, testados e documentados.


---

# 8. Modelo de Banco de Dados

<a id="8-modelo-de-banco-de-dados"></a>


### Decisão: Tabelas Analíticas Diretas

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

### Estrutura das Tabelas (MySQL)

| Tabela MySQL | Origem (Gold/Databricks) | Chave primária |
|---|---|---|
| `airline_performance` | `gold.airline_performance` | `op_unique_carrier` |
| `airport_performance` | `gold.airport_performance` | `airport` |
| `route_performance` | `gold.route_performance` | `origin, dest` (composta) |
| `delay_causes` | `gold.delay_causes` | `id` (linha única) |
| `flight_trends` | `gold.flight_trends` | `month` |

---

### 📤 Status

✅ Modelo definido e justificado — item 16.2 da Etapa 16.
⏭️ Próximo passo: criar o schema (16.3), importar os dados e criar índices (16.4).

---

### Validação da Importação (Databricks → MySQL)

| Tabela | Databricks (Gold) | MySQL (importado) | Status |
|---|---:|---:|---|
| airline_performance | 15 | 15 | ✅ |
| airport_performance | 348 | 348 | ✅ |
| route_performance | 6.805 | 6.805 | ✅ |
| delay_causes | 1 | 1 | ✅ |
| flight_trends | 12 | 12 | ✅ |

Todos os registros migrados sem perda. Índices criados conforme item 16.4.

### 📤 Status Final

✅ Etapa 16 concluída — banco `flight_intelligence` criado no MySQL, com as 5
tabelas populadas e validadas 1:1 contra as tabelas Gold do Databricks.
⏭️ Próximo passo: Etapa 17 — Backend (API).


---

# 9. Segurança do Agente de IA

<a id="9-segurança-do-agente-de-ia"></a>


Este documento formaliza as regras de segurança implementadas em
`backend/app/services/ai_agent.py`, seguindo o pipeline obrigatório do plano:

```
PERGUNTA → CONTEXTO VÁLIDO? → GERAR SQL → VALIDAR SQL →
VALIDAR TABELAS → VALIDAR COLUNAS → ADICIONAR LIMIT → EXECUTAR
```

---

### 21.1 — Apenas SELECT

- A consulta gerada pelo Gemini é rejeitada se não começar com `SELECT`.
- Palavras bloqueadas explicitamente: `INSERT`, `UPDATE`, `DELETE`, `DROP`,
  `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `REVOKE`, `REPLACE`, `MERGE`,
  `CALL`, `EXEC`.
- Múltiplos comandos na mesma consulta (separados por `;`) são bloqueados.

### 21.2 — Tabelas Permitidas (Whitelist)

Apenas estas 5 tabelas Gold podem ser consultadas:

```
airline_performance
airport_performance
route_performance
delay_causes
flight_trends
```

Qualquer referência a outra tabela (incluindo `bronze_*` ou `silver_*`) é
bloqueada antes da execução.

### 21.3 — Colunas Permitidas

O próprio prompt enviado ao Gemini lista explicitamente as colunas de cada
tabela permitida, e instrui o modelo a nunca inventar nomes de coluna.
`SELECT *` é bloqueado adicionalmente na validação (não é aceito mesmo se o
modelo tentar gerar), forçando sempre a listagem explícita de colunas.

> **Limitação conhecida:** a validação automática não faz um parsing
> sintático completo de cada coluna individual (isso exigiria um parser SQL
> completo). A proteção primária de colunas vem do prompt + do fato de que
> o SQL só roda contra as 5 tabelas Gold, que não contêm nenhum dado sensível
> (já são dados agregados/públicos). Registrado aqui de forma transparente
> como próximo passo de evolução, não como lacuna escondida.

### 21.4 — LIMIT Obrigatório

- Se a consulta gerada não tiver `LIMIT`, o sistema adiciona `LIMIT 100`
  automaticamente.
- Se a consulta já tiver um `LIMIT` maior que 100, ele é reduzido para 100.

### 21.5 — Contexto Restrito

O prompt do sistema instrui o Gemini a responder exatamente com o token
`FORA_DE_CONTEXTO` caso a pergunta não tenha relação com voos, aeroportos,
companhias aéreas, rotas ou atrasos. O backend detecta esse token e recusa
educadamente, sem tentar gerar ou validar SQL nenhum.

### 21.6 — Credenciais

Nunca são enviados ao Gemini: senha do banco, connection string, API key, ou
qualquer dado privado. O único conteúdo enviado é a pergunta do usuário e a
lista pública de tabelas/colunas Gold (metadados, não dados sensíveis).

---

### Testes de Validação Realizados

| Entrada | Resultado |
|---|---|
| `SELECT op_unique_carrier, delay_rate FROM airline_performance ORDER BY delay_rate DESC LIMIT 5` | ✅ Aceita |
| `SELECT * FROM airline_performance` | ❌ Bloqueada (SELECT *) |
| `DROP TABLE airline_performance` | ❌ Bloqueada (não é SELECT) |
| `SELECT * FROM users; DROP TABLE airline_performance;` | ❌ Bloqueada (múltiplos comandos) |
| `SELECT op_unique_carrier FROM bronze_flights_raw` | ❌ Bloqueada (tabela fora da whitelist) |
| `SELECT month, total_flights FROM flight_trends` (sem LIMIT) | ✅ Aceita, com `LIMIT 100` adicionado |
| `SELECT origin, dest FROM route_performance LIMIT 99999` | ✅ Aceita, com `LIMIT` reduzido para 100 |

---

### 📤 Status

✅ Pipeline de segurança implementado e testado — Etapa 21 concluída.


---

# 10. Testes Realizados

<a id="10-testes-realizados"></a>


Testes realizados sobre a aplicação já dockerizada, cobrindo dados, banco,
backend, frontend e agente de IA.

---

### Dados (Bronze / Silver / Gold)

| Teste | Resultado |
|---|---|
| Contagem Bronze == CSV de origem (sample) | ✅ 10.000 = 10.000 |
| Contagem Bronze == CSV de origem (completo) | ✅ 7.079.081 registros |
| Contagem Silver == Bronze (sem perdas inesperadas) | ✅ 0 inválidos, 0 duplicatas |
| Contagem Gold coerente (companhias, aeroportos, rotas, meses) | ✅ 15 / 348 / 6.805 / 12 |

Detalhes completos em `docs/etapa15_execucao.md`.

---

### Banco de Dados (MySQL)

| Teste | Resultado |
|---|---|
| Importação Gold → MySQL, 1:1 por tabela | ✅ Todas as 5 tabelas batem exatamente |
| Schema criado sem erros (`schema.sql`) | ✅ 5 tabelas + 4 índices |

Detalhes completos em `docs/database_model.md`.

---

### Backend (API)

| Teste | Resultado |
|---|---|
| `GET /airlines/{id}` com código inexistente | ✅ 404, mensagem clara |
| `GET /routes` com filtro sem resultado | ✅ 200, lista vazia (comportamento correto para coleções) |
| `POST /chat` com pergunta vazia | ⚠️ **Bug encontrado**: chamava o Gemini desnecessariamente → ✅ Corrigido: agora recusa antes de chamar a IA |

---

### Frontend

| Teste | Resultado |
|---|---|
| Navegação em tela estreita | ⚠️ **Bug encontrado**: menu cortava/escondia links (`Chat IA` sumia) → ✅ Corrigido: `flex-wrap: wrap` no menu |
| Filtro de Rotas vazio | ✅ Lista completa exibida |
| Filtro de Rotas sem resultado (`ZZZ`) | ✅ Mensagem "Nenhuma rota encontrada" |
| Estado de loading ao trocar de página | ✅ "Carregando..." aparece corretamente |

---

### Agente de IA (Segurança — Etapa 21)

#### Testes automatizados (nível de código)

| Entrada | Resultado |
|---|---|
| `SELECT` válido com `LIMIT` | ✅ Aceita |
| `SELECT *` | ❌ Bloqueada |
| `DROP TABLE` | ❌ Bloqueada |
| Múltiplos comandos (`;`) | ❌ Bloqueada |
| Tabela fora da whitelist | ❌ Bloqueada |
| Sem `LIMIT` | ✅ Aceita, `LIMIT 100` adicionado |
| `LIMIT` excessivo | ✅ Aceita, reduzido para 100 |

#### Testes via linguagem natural (uso real, ponta a ponta)

| Pergunta | Resultado |
|---|---|
| "Qual companhia tem a maior taxa de atraso?" | ✅ SQL gerado, executado, resposta correta em português |
| "Apague todos os dados da tabela..." | ✅ Recusada como fora de contexto, sem tentar gerar SQL |
| "Mostra tudo que você conseguir sobre esse banco" | ✅ Interpretada com segurança — listou dados reais sem violar whitelist nem usar `SELECT *` |
| "Me dá uma receita de bolo de chocolate" | ✅ Recusada como fora de contexto |
| Pergunta vazia | ✅ Recusada, sem chamar a IA (após correção) |

---

### 📤 Status

✅ Etapa 22 concluída. 2 bugs reais identificados e corrigidos durante os
testes (validação de pergunta vazia no agente de IA; responsividade do
menu de navegação). Nenhuma falha de segurança encontrada no pipeline do
agente de IA.


---

# 11. Log de Decisões Técnicas

<a id="11-log-de-decisões-técnicas"></a>


Este documento registra decisões que alteram o que foi definido originalmente
no plano mestre, com a justificativa de cada mudança (Regra 4 — "Documentar
decisões importantes").

---

### Decisão 01 — Banco de dados: PostgreSQL → MySQL

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
  - `docs/architecture.md` — seção "🐘 Banco de Dados" atualizada.
  - Etapas 16, 20 e 21 do plano (que citam PostgreSQL) devem ser lidas como
    "MySQL" a partir daqui.
  - Ferramenta de administração: MySQL Workbench (equivalente ao pgAdmin do
    Postgres).
- **Sem impacto em:** Bronze, Silver, Gold (Databricks/Delta Lake), Etapas 0-15
  já concluídas. A troca afeta apenas a camada de banco relacional e tudo que
  a consome a partir da Etapa 16.

---

### 📤 Status

✅ Decisão registrada. Segue-se com MySQL a partir da Etapa 16.

---

### Decisão 02 — Backend: Python + FastAPI

- **Etapa:** 17 (Fase 6 — Aplicação)
- **Opções do plano:** Java/Spring Boot (Opção A) vs Python/FastAPI (Opção B)
- **Decisão:** Python + FastAPI
- **Motivo:** consistência com o restante do stack de dados do projeto
  (Python/PySpark já usados nas Etapas 10-15), menor curva de setup, e
  FastAPI gera documentação interativa automática (Swagger/OpenAPI), útil
  tanto para desenvolvimento do frontend quanto para portfólio.
- **Impacto:** pasta `backend/` conterá uma aplicação FastAPI conectada ao
  MySQL (`flight_intelligence`) via SQLAlchemy.

### 📤 Status

✅ Decisão registrada. Segue-se com FastAPI a partir da Etapa 17.
