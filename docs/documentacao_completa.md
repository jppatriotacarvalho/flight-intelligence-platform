# 📚 Documentação Completa — Flight Intelligence Platform

> Este documento reúne toda a documentação técnica produzida ao longo do
> desenvolvimento do projeto, organizada na ordem das fases do plano de
> execução. Cada seção abaixo corresponde a um documento que guiou uma
> etapa específica do trabalho.
>
> ⚙️ **Arquivo gerado.** Não edite aqui: altere o documento de origem em
> `docs/` e rode `python scripts/gerar_documentacao.py`.


---

## 🗂️ Índice

1. [Problema de Negócio](#1-problema-de-negócio)
2. [Dicionário de Dados](#2-dicionário-de-dados)
3. [Análise Exploratória e Qualidade](#3-análise-exploratória-e-qualidade)
4. [Perguntas de Negócio](#4-perguntas-de-negócio)
5. [Regras de Transformação (Silver)](#5-regras-de-transformação-silver)
6. [KPIs e Regras de Negócio](#6-kpis-e-regras-de-negócio)
7. [Execução com o Dataset Completo](#7-execução-com-o-dataset-completo)
8. [Arquitetura Geral](#8-arquitetura-geral)
9. [Modelo de Banco de Dados](#9-modelo-de-banco-de-dados)
10. [Agente de IA — Segurança e Resiliência](#10-agente-de-ia-segurança-e-resiliência)
11. [Testes Realizados](#11-testes-realizados)
12. [Log de Decisões Técnicas](#12-log-de-decisões-técnicas)

---


---

# 1. Problema de Negócio

<a id="1-problema-de-negócio"></a>

### Qual problema estamos resolvendo?

O setor aéreo gera diariamente um grande volume de dados sobre voos, horários, atrasos, cancelamentos, desvios, companhias aéreas, aeroportos e rotas. Esses dados, no entanto, costumam existir de forma bruta, fragmentada, espalhados em diferentes fontes e sem padronização. Dificultando uma análise ou tomada de decisão com mais qualidade.

O problema central é a ausência de uma plataforma que transforme esse volume de dados brutos em informação confiável, estruturada e acessível: hoje é difícil responder perguntas simples como "qual companhia atrasa mais" ou "qual aeroporto tem maior taxa de cancelamento" sem um processo manual, demorado e sujeito a erro.

Este projeto resolve esse problema construindo um pipeline completo de dados — desde a ingestão de milhões de registros até a disponibilização de métricas confiáveis via API, dashboard e um agente de IA capaz de responder perguntas em linguagem natural.

---

### Quem poderia utilizar a plataforma?

- **Companhias aéreas** — para monitorar sua própria performance operacional e se comparar com o mercado.
- **Aeroportos** — para entender seu desempenho operacional e identificar gargalos.
- **Analistas de dados / BI** — para explorar tendências do setor aéreo sem precisar processar o dataset bruto.
- **Áreas de operações e planejamento** — para embasar decisões sobre rotas, horários e alocação de recursos.
- **Passageiros e público em geral** (uso exploratório) — para entender quais companhias, aeroportos e rotas são historicamente mais pontuais.


---

### Quais decisões podem ser apoiadas?

- Priorização de rotas ou aeroportos que exigem ações para reduzir atrasos.
- Avaliação comparativa de companhias aéreas quanto à pontualidade e confiabilidade.
- Investigação dos principais motivos de atraso, que podem ser o clima, aeronave, segurançae tráfego aéreo, para direcionar investimentos ou mudanças operacionais.
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
- Schema e tipos batem com o `data_dictionary.csv` (ver seção 7.2).

---

### 7.2 — Comparação Data Dictionary vs Sample

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

### 7.3 — Valores Nulos

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

Os percentuais ficam próximos dos registrados no `data_dictionary.md`, mas
não são idênticos — e não deveriam ser: esta análise roda sobre o sample de
10.000 registros, enquanto o dicionário descreve o dataset completo de
7.079.081. A diferença é de fração de ponto percentual e confirma que o
sample é representativo.

| Coluna | Sample (10k) | Dicionário (completo) |
|---|---:|---:|
| `dep_delay` | 1,16% | 1,31% |
| `arr_delay` | 1,64% | 1,61% |
| `cancellation_code` | 98,78% | 98,64% |

---

### 7.4 — Duplicatas

- Linhas 100% duplicadas: **0**
- Duplicatas usando chave composta (`fl_date + op_unique_carrier + op_carrier_fl_num + origin + dest`): **0**

✅ Não há indício de duplicação no sample.

---

### 7.5 — Valores Únicos (Categóricos)

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

### 7.6 — Valores Numéricos

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

### 7.7 — Datas (`fl_date`)

- Datas inválidas: **0**
- Intervalo: `2024-01-01` até `2024-12-31`
- Anos únicos: apenas `2024`

✅ Coluna de data está íntegra e dentro do esperado.

---

### 7.8 — Horários (`crs_dep_time`, `crs_arr_time`)

- Valores fora do range válido (0–2359): **0**
- `crs_dep_time`: min 22, max 2359

✅ Sem inconsistências de horário programado. Vale registrar: o formato é `hhmm` numérico (ex.: 1252 = 12:52), não timestamp — será necessário tratar isso na Silver se quisermos operar como hora real.

---

### 7.9 — Atrasos

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

5. Qual aeroporto possui o maior atraso médio na partida?
6. Qual aeroporto possui o maior volume de partidas?
7. Qual aeroporto possui a maior taxa de cancelamento?

---

### 🗺️ Rotas

8. Qual rota (origem → destino) possui o maior volume de voos?
9. Qual rota possui o maior atraso médio?
10. Qual rota possui a maior distância percorrida?

---

### 📅 Tempo

11. Qual mês do ano concentra mais atrasos?
12. ~~Qual dia da semana concentra mais atrasos?~~ — *fora do escopo atual (ver Critério de Validação)*
13. Como os atrasos evoluíram mês a mês ao longo de 2024?

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
| 5, 7 | origin, arr_delay, dep_delay, cancelled | Por aeroporto de origem |
| 6 | origin | Por aeroporto de origem |
| 8, 9, 10 | origin, dest, distance, arr_delay | Por rota (origem+destino) |
| 11, 13 | month, arr_delay | Por mês |
| 12 | day_of_week, arr_delay | Por dia da semana — **não construída** |
| 14, 15, 16 | carrier_delay, weather_delay, nas_delay, security_delay, late_aircraft_delay | Agregado por motivo |

---

### ✅ Critério de Validação

**15 das 16 perguntas são respondidas pela plataforma** — pelas 5 tabelas Gold,
pela API, pelo dashboard e pelo agente de IA.

Escopo real, declarado com transparência:

- **P12 (dia da semana) não é respondida.** A coluna `day_of_week` existe no
  dataset e chega intacta à Silver, mas nenhuma tabela Gold agrega por ela:
  `gold.flight_trends` tem 1 linha por mês. Construí-la é uma extensão simples
  (um `groupBy("day_of_week")` no notebook Gold, no mesmo formato de
  `flight_trends`), registrada como melhoria futura.
- **P5, P6 e P7 olham o aeroporto como origem.** `gold.airport_performance` é
  agregada por `origin` (1 linha por aeroporto de partida). O lado das
  chegadas (`dest`) não foi agregado; uma versão simétrica é possível pelo
  mesmo padrão.
- **P13 é mensal.** A tendência diária não foi construída.

Todas as perguntas — inclusive P12 — dependem apenas de colunas confirmadas
no `data_dictionary.md` e validadas no `data_quality.md`: o que falta é
agregação, não dado.

#### Cobertura no dashboard

Cada pergunta citada num cabeçalho de seção tem agora **gráfico próprio** —
antes, três apareciam só na API ou numa tabela de 100 linhas:

| Pergunta | Onde aparece | O que mudou |
|---|---|---|
| **P1** — maior atraso médio por companhia | "Atraso médio de chegada por companhia" | gráfico novo, em minutos. O card que existia media **% de voos atrasados** e estava rotulado "pergunta 1" — isso é a P4 |
| **P4** — companhia mais pontual | "Taxa de atraso por companhia" | passou a mostrar as **15** companhias; com Top 8, a mais pontual (YX) ficava justamente de fora |
| **P7** — maior taxa de cancelamento por aeroporto | "Taxa de cancelamento por aeroporto" | gráfico novo, entre os 20 mais movimentados (EWR no topo) |
| **P10** — rota mais longa | "Rotas mais longas" | gráfico novo, por par de cidades (BOS↔HNL, 5.095 mi). Antes só existia na tabela, ordenada por volume |

A seção "Tempo & motivos" passou a declarar **"perguntas 11, 13 a 16"** em vez
de "11 a 16": a P12 está fora do escopo, e citá-la no cabeçalho prometia um
gráfico que não existe.

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
| Destino não nulo | `dest IS NOT NULL` |
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

### Regra 11 — Nome do aeroporto (`silver.dim_airports`)

- **Problema:** as tabelas expõem apenas a sigla IATA (`ATL`, `ORD`, `DFW`).
  Quem não conhece os códigos não entende o dashboard nem as respostas do
  agente de IA.
- **Decisão:** criar `silver.dim_airports` — uma linha por sigla, com o nome
  (cidade/UF), cidade, estado e um rótulo pronto (`ATL - Atlanta, GA`).
- **Origem do nome:** colunas `origin_city_name` / `dest_city_name` do próprio
  dataset BTS. Nenhum dado externo é digitado à mão, então todo nome é
  rastreável até a Bronze. O dataset não traz o nome oficial do terminal
  ("Hartsfield-Jackson"), apenas cidade/UF.
- **Por que uma dimensão, e não substituir a sigla:** o nome **não é chave**.
  "Chicago, IL" é ORD *e* MDW; "Houston, TX" é IAH *e* HOU; "Washington, DC"
  é DCA *e* IAD. Agrupar por nome somaria aeroportos distintos no mesmo
  registro e inflaria as métricas. A sigla continua sendo a chave; o nome
  entra como atributo descritivo.
- **Construção:** empilha origem e destino (`unionByName`) para não perder
  aeroportos que só aparecem como destino, conta as ocorrências de cada par
  sigla/cidade e mantém a grafia mais frequente (`row_number` sobre janela
  por sigla) — garante exatamente 1 linha por código.
- **Validação:** `count()` da dimensão igual ao número de siglas distintas, e
  zero nulos em `airport_name` após o join na Gold.

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
| 11 | Sigla ilegível para o usuário | Dimensão `silver.dim_airports` (sigla continua a chave) |

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
- **Observação — o denominador inclui cancelados e desviados.** A Gold divide por `count(*)`, o total de voos programados (KPI 01), e não pelos voos com `arr_delay` preenchido. Registros com `arr_delay` nulo (cancelados/desviados, ver `silver_rules.md` Regra 02) **não** contam como atrasados, mas **continuam no denominador**. A taxa lê-se como "voos atrasados ÷ voos programados". Este texto foi corrigido para descrever o que o código realmente faz — o notebook não mudou.

---

### KPI 03 — Atraso Médio (Chegada)

- **Descrição:** média de minutos de atraso na chegada.
- **Fórmula:** `AVG(arr_delay)`
- **Colunas utilizadas:** `arr_delay`
- **Regra:** calculado apenas sobre voos com `arr_delay` não nulo. Valores negativos (voo adiantado) entram no cálculo normalmente, pois são dados válidos.
- **Justificativa:** representa o atraso "líquido" médio, incluindo o efeito de voos adiantados — mais realista que olhar só para os atrasados.
- **Agregação no dashboard:** o KPI do painel combina as 15 companhias com **média ponderada por voos concluídos** (`total_flights - cancelled_flights - diverted_flights`), que são exatamente as linhas em que `arr_delay` existe. Ponderar por `total_flights` contaria voos sem horário de chegada no peso.

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
- **Piso de volume — entre os 20 aeroportos mais movimentados.** Sem esse recorte, o KPI apontava **MGW, com 37 voos no ano inteiro** e 72,6 min de atraso médio: número correto, leitura errada. O critério é: primeiro os 20 aeroportos com maior `total_flights`, depois o maior `average_departure_delay` entre eles — hoje **DFW, 18,93 min**. O valor 20 é a constante `POOL_AEROPORTOS_MOVIMENTADOS`, definida nos dois lados (`backend/app/routers/dashboard.py` e `frontend/src/lib/chart.ts`) para o card e o gráfico não se contradizerem. Ver Decisão 05 em `decision_log.md`.
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

### KPI 10 — Taxas agregadas do dashboard (Σ ÷ Σ)

- **Descrição:** os KPIs do topo do dashboard consolidam as 15 linhas de
  `gold.airline_performance` num número só.
- **Regra:** a consolidação é **soma sobre soma**, nunca a média das 15 taxas.

  | KPI do painel | Fórmula |
  |---|---|
  | Taxa de atraso | `SUM(delayed_flights) / SUM(total_flights)` |
  | Taxa de cancelamento | `SUM(cancelled_flights) / SUM(total_flights)` |
  | Atraso médio (chegada) | `SUM(average_arrival_delay × voos_concluídos) / SUM(voos_concluídos)` |

- **Justificativa:** `AVG(delay_rate)` dá à Hawaiian (78.530 voos) o mesmo
  peso da Southwest (1.419.419 voos) — 18 vezes maior. O resultado não é
  "a taxa de atraso do setor", é a média de quinze números sem relação com o
  tamanho de cada companhia. Σ ÷ Σ é o que os KPIs 02 e 05 definem: voos
  atrasados ÷ total de voos.
- **Valores atuais:** 7.079.081 voos · **19,82%** de atraso · **1,36%** de
  cancelamento · **7,1 min** de atraso médio de chegada.

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
| Taxas agregadas do dashboard (Σ ÷ Σ) | visão geral (consolida 2, 4, 5) |

---

### 📤 Status

✅ KPIs oficialmente definidos, com fórmula, colunas e justificativa — Etapa 13 concluída.
⏭️ Próximo passo: implementar essas métricas nas tabelas analíticas da **Etapa 14 — Desenvolvimento Gold**.


---

# 7. Execução com o Dataset Completo

<a id="7-execução-com-o-dataset-completo"></a>

### Ambiente

- **Plataforma:** Databricks Free Edition
- **Compute:** Serverless (sem cluster configurado manualmente)
- **Arquivo de origem:** `flight_data_2024.csv` (~1,28 GB descompactado)
- **Local de upload:** `/Volumes/workspace/default/dado_bruto_de_voos/flight_data_2024.csv`

---

### Resultados por Camada

| Camada | Entrada | Saída | Registros removidos | Tempo de execução |
|---|---:|---:|---:|---:|
| 🥉 Bronze | CSV completo | 7.079.081 | — (ingestão bruta) | 15.9s |
| 🥈 Silver | 7.079.081 | 7.079.081 | 0 inválidos / 0 duplicatas | 21.5s |
| 🥇 Gold | 7.079.081 | 5 tabelas analíticas | — (agregação) | 20.7s |

**Tempo total do pipeline: ~58.1s**

---

### Tabelas Gold Criadas

| Tabela | Registros | Granularidade |
|---|---:|---|
| `gold.airline_performance` | 15 | 1 por companhia |
| `gold.airport_performance` | 348 | 1 por aeroporto (origem) |
| `gold.route_performance` | 6.805 | 1 por rota (origem+destino) |
| `gold.delay_causes` | 1 | agregado único |
| `gold.flight_trends` | 12 | 1 por mês |

---

### Validação — Comparação Sample vs Dataset Completo

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

### 📤 Status

✅ Etapa 15 concluída. Pipeline Bronze → Silver → Gold executado com sucesso
sobre o dataset completo, sem perdas inesperadas e com tempo de execução
adequado ao Free Edition.
⏭️ Próximo passo: Etapa 16 — Banco de Dados (exportar as tabelas Gold para
consumo externo ao Databricks).


---

# 8. Arquitetura Geral

<a id="8-arquitetura-geral"></a>

### 📂 Origem dos Dados

Dataset **Flight Delay Dataset — 2024**, obtido via Kaggle, com origem
original na **BTS TranStats — On-Time Performance Database**. Licença
**CC0 — Creative Commons Zero**. **7.079.081 registros** e 35 colunas sobre
performance de voos domésticos nos EUA em 2024 (~1,28 GB descompactado).

Detalhes completos em `docs/business_problem.md` e no `README.md`.

---

### 🔄 Pipeline (Visão Geral)

```text
                    📂 DATASET
                     CSV 1,28 GB
                        │
                        ▼
                 🥉 BRONZE LAYER
                  Dados Brutos
              (a leitura do CSV é a
              1ª célula do notebook)
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
                        ▼
                BACKEND / API
                   FastAPI
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
         FRONTEND             🤖 GEMINI
      React + Dashboard      AGENTE DE IA
```

O pipeline de dados (Bronze → Silver → Gold) roda no **Databricks** com
**PySpark**, gravando tabelas em formato **Delta Lake**. As tabelas Gold são
posteriormente carregadas em um banco **MySQL**, que serve o **backend/API**,
que por sua vez alimenta o **frontend/dashboard**. O **agente de IA (Gemini)**
nunca toca o banco diretamente: ele gera SQL, que o backend valida e executa
em modo somente leitura.

**Não existe uma camada de ingestão separada.** A leitura do CSV com schema
explícito é a primeira célula do notebook Bronze — é lá que o dado entra no
pipeline. A pasta `notebooks/01_ingestion/` foi removida por ser resquício do
plano original.

---

### 🥉🥈🥇 Camadas (Arquitetura Medalhão)

#### 🥉 Bronze — `bronze.flights_raw`

**Objetivo:** armazenar os dados o mais próximo possível da origem.

**Pode:**
- Ler o CSV com schema explícito
- Adicionar metadados de rastreabilidade (`ingestion_timestamp`, `source_file`)
- Converter para Delta Lake

**Não pode:**
- Remover duplicatas
- Criar KPIs ou agregações
- Aplicar qualquer regra de negócio

**Status:** ✅ implementada. 35 colunas originais + 2 colunas de metadados.
Executada sobre o dataset completo: **7.079.081 registros em 15,9s**, contagem
validada 1:1 contra o CSV de origem. Notebook em `notebooks/02_bronze/`.

---

#### 🥈 Silver — `silver.flights_clean` e `silver.dim_airports`

**Objetivo:** gerar dados confiáveis — limpos, padronizados, tipados e validados.

**Transformações aplicadas** (11 regras detalhadas em `docs/silver_rules.md`):
- Conversão de tipo (`op_carrier_fl_num` → integer)
- Padronização de texto (trim + maiúsculas em códigos)
- Flag de atraso extremo (`is_extreme_delay`)
- Validações estruturais (data, origem, destino, rota, distância)
- Remoção de duplicatas exatas
- **Regra 11 — `silver.dim_airports`:** dimensão de aeroportos derivada das
  próprias colunas `origin_city_name`/`dest_city_name` do dataset, chaveada
  pela sigla IATA. É o que permite mostrar "Atlanta, GA" ao lado de `ATL`
  sem depender de dado externo (Decisão 03).
- **Nulos legítimos mantidos** (não imputados) — voos cancelados/desviados
  não têm todos os campos de horário preenchidos por definição, e isso é
  esperado, não é erro.

**Status:** ✅ implementada. Sobre o dataset completo: 7.079.081 registros na
Bronze → **7.079.081 na Silver em 21,5s** (0 inválidos, 0 duplicatas).
Nenhuma regra precisou de ajuste ao escalar de 10 mil para 7 milhões.
Notebook em `notebooks/03_silver/`.

---

#### 🥇 Gold — tabelas analíticas

**Objetivo:** dados analíticos, agregados e prontos para consumo direto por
API, dashboard e agente de IA.

**Regra:** só criar tabela que responda a uma pergunta de negócio real
(`docs/business_questions.md`) e implemente um KPI documentado
(`docs/business_rules.md`) — nunca criar tabela "porque estava no plano".

**Tabelas implementadas** (5 tabelas, geradas em 20,7s):

| Tabela | Registros | Granularidade | KPIs/Perguntas atendidas |
|---|---:|---|---|
| `gold.airline_performance` | 15 | 1 = 1 companhia | Taxa de atraso, atraso médio, cancelamento por companhia |
| `gold.airport_performance` | 348 | 1 = 1 aeroporto de origem | Atraso médio, volume, cancelamento por aeroporto |
| `gold.route_performance` | 6.805 | 1 = origem + destino | Volume, atraso médio, distância por rota |
| `gold.delay_causes` | 1 | agregado único | Distribuição de motivos de atraso |
| `gold.flight_trends` | 12 | 1 = 1 mês | Evolução de atrasos ao longo do ano |

**Colunas descritivas (Decisão 03):** `airport_performance` carrega
`airport_name`, `airport_city`, `airport_state` e `airport_label`;
`route_performance` carrega `origin_name` e `dest_name`. Todas vêm de um join
com `silver.dim_airports`. **A sigla IATA continua sendo a chave** — o nome
não é único (ORD e MDW são ambos "Chicago, IL"), então agrupar por nome
fundiria aeroportos distintos e corromperia as métricas.

**Consumidores:** MySQL → API (backend) → Dashboard e Agente de IA.
Notebook em `notebooks/04_gold/`.

---

### 🐬 Banco de Dados

**MySQL** (Decisão 01 — o plano original previa PostgreSQL). Recebe as
tabelas Gold para consumo por aplicações externas ao Databricks.

**Usuário somente leitura.** No Docker, a API conecta como `flight_reader`,
criado no init com `GRANT SELECT` **tabela por tabela** nas 5 tabelas Gold
(`database/03_readonly_user.sh`). A aplicação não consegue escrever mesmo que
o validador de SQL do agente falhe. O `root` fica só para o init e o
healthcheck do container. Detalhes em `docs/ai_agent_security.md`, 1.9.

**Init em 3 arquivos, em ordem alfabética.** O entrypoint do MySQL executa
`/docker-entrypoint-initdb.d` em ordem, e um `GRANT` numa tabela que ainda não
existe falha com erro 1146:

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `01_dump.sql` | cria e popula as 5 tabelas Gold |
| 2 | `02_airport_names.sql` | preenche as colunas descritivas da Decisão 03 |
| 3 | `03_readonly_user.sh` | cria `flight_reader` e concede os `SELECT` |

O `02_airport_names.sql` é **gerado** por `scripts/gerar_nomes_aeroportos.py`,
que reproduz a Regra 11 em pandas sobre o CSV do BTS — o dump não é alterado,
e nenhum nome é digitado à mão.

**Modelo: tabelas analíticas diretas** — uma tabela MySQL por tabela Gold,
sem esquema estrela. As tabelas Gold já chegam agregadas e com propósito
definido; um modelo dimensional por cima adicionaria complexidade sem ganho
de flexibilidade. Decisão completa e validação 1:1 da importação em
`docs/database_model.md`.

**5 tabelas e 6 índices** (`database/schema.sql`):
`idx_route_origin`, `idx_route_dest`, `idx_airline_delay_rate`,
`idx_airport_delay_rate`, `idx_airport_name`, `idx_airport_city`.

---

### 🚀 Backend / API

**Python + FastAPI** (Decisão 02 — o plano deixava em aberto entre
Java/Spring Boot e Python/FastAPI). Conecta ao MySQL via SQLAlchemy e expõe
as tabelas Gold em endpoints REST, com documentação interativa automática em
`/docs` (Swagger/OpenAPI).

`GET /airports` aceita o parâmetro `?search=`, que casa por prefixo da sigla,
por nome ou por cidade — quem sabe a sigla digita "ATL", quem não sabe digita
"Atlanta" e chega no mesmo registro.

---

### 💻 Frontend

Aplicação **React + TypeScript (Vite)** que consome a API para exibir o
dashboard e as páginas de companhias, aeroportos, rotas, atrasos e o chat com
o agente de IA. Componentes reutilizáveis (`KpiCard`, `BarList`, `TrendLine`,
`CauseDonut`, `AirlineScatter`, `CodeCell`, `FilterBar`, `DataTable`,
`PageState`) e formatação numérica centralizada em `src/lib/format.ts`.

Componentes e comportamentos que merecem nota:

- **`CodeCell`** — célula de duas linhas (código em cima, nome embaixo),
  usada tanto para a sigla IATA do aeroporto (Decisão 03) quanto para o
  código da companhia (Decisão 04). Generaliza o antigo `AirportCell`;
  sem nome, mostra só o código, em vez de uma coluna inteira de travessões.
- **`DataTable` ordenável** — cada coluna declara um `sortValue` com o valor
  **cru**; ordenar pelo texto renderizado ("1.419.419") daria ordem
  alfabética. A ordenação roda sobre **todos** os registros filtrados e só
  depois a tabela corta em `rowLimit`, com botão "Mostrar mais" — cortar
  antes faria "ordenar por cancelamento" reordenar apenas as 20 primeiras
  linhas. Cabeçalho é `<button>`, com `aria-sort`, e nulos vão sempre ao fim.
- **`AirlineScatter`** — dispersão atraso × cancelamento, bolha
  proporcional ao volume e linhas tracejadas nas médias ponderadas do setor,
  formando quadrantes.
- **`BarList` com `reference`** — linha vertical tracejada na média do setor,
  para a barra dizer se a companhia está acima ou abaixo.
- **Piso de volume (Decisão 05)** — os limiares vivem em `src/lib/chart.ts`,
  nunca soltos no JSX, e o piso usado aparece sempre na legenda do gráfico ou
  num checkbox que o usuário pode desmarcar.

---

### 📊 Dashboard

**6 KPIs no topo**, todos com a linha de apoio dizendo o critério: total de
voos, taxa de atraso (Σ ÷ Σ), atraso médio de chegada (ponderado por voos
concluídos), taxa de cancelamento (Σ ÷ Σ), companhia mais pontual (sigla +
nome + taxa) e aeroporto mais atrasado (entre os 20 mais movimentados).

**Quatro seções, e cada pergunta citada no cabeçalho tem gráfico próprio:**

| Seção | Perguntas | Gráficos |
|---|---|---|
| Companhias aéreas | 1 a 4 | grid 2×2 com as 15 companhias: taxa de atraso (P4), atraso médio de chegada em minutos (P1), taxa de cancelamento (P2) e volume (P3). Os dois de taxa trazem a linha da média ponderada do setor |
| Aeroportos | 5 a 7 | volume (P6), atraso médio de partida (P5) e taxa de cancelamento (P7), os dois últimos entre os 20 mais movimentados |
| Rotas | 8 a 10 | volume por par de cidades (P8), atraso médio por sentido (P9) e rotas mais longas (P10) |
| Tempo & motivos | 11, 13 a 16 | curva mensal com pico e vale marcados (P11/P13) e donut dos motivos (P14 a P16) |

Dois detalhes de leitura que o dado exigiu:

- **Rotas por par, não por sentido.** Volume e distância somam ida e volta e
  rotulam `HNL↔OGG`; sem isso, metade do gráfico repetia a mesma ligação em
  dois sentidos. O ranking de **atraso** continua por sentido, porque o
  atraso muda com a direção.
- **Cores dos motivos são categóricas** (`CAUSE_COLORS`), não as semânticas
  do app: reusar o verde de "adiantado" em "Clima" e o vermelho de
  cancelamento em "Segurança" sugeria juízo onde só há categoria.

---

### 🤖 Agente de IA

Agente baseado na **Gemini API** que responde perguntas em linguagem natural
traduzindo-as para SQL controlado. Documentação completa da superfície de
segurança em `docs/ai_agent_security.md`.

**Pipeline por pergunta:**

1. **Uma única chamada** ao Gemini devolve, no mesmo JSON, a consulta SQL e um
   molde de resposta com marcadores `{coluna}`.
2. O SQL passa pelo validador: somente `SELECT`, comando único, whitelist de
   tabelas Gold, sem `SELECT *`, sem comentários, sem variáveis, sem as
   keywords proibidas (escrita, DDL, acesso a arquivo, funções de tempo) e
   com `LIMIT` garantido (teto de 100 linhas).
3. A consulta roda em modo leitura no MySQL.
4. Os marcadores do molde são preenchidos **em Python**, com os valores já
   formatados no padrão brasileiro.

**Por que o molde:** o modelo nunca chega a ver os dados retornados, então não
tem como arredondar errado nem inventar número. E como são duas etapas numa
chamada só, o consumo da cota diária do free tier cai pela metade.

**Resiliência:** cadeia de fallback entre 6 modelos Gemini, com retentativa
apenas em erro transitório (503) e descarte imediato em 429 de cota. Modelos
que estouraram a cota entram em cooldown de 15 minutos. Teto de 45s para a
cadeia inteira e 25s por chamada, para o frontend nunca ficar pendurado.

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

---

### 📤 Status

✅ Pipeline de dados, banco, backend, frontend, agente de IA e
containerização — todos implementados, testados e documentados.


---

# 9. Modelo de Banco de Dados

<a id="9-modelo-de-banco-de-dados"></a>

### Decisão: Tabelas Analíticas Diretas

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

### Estrutura das Tabelas (MySQL)

| Tabela MySQL | Origem (Gold/Databricks) | Chave primária |
|---|---|---|
| `airline_performance` | `gold.airline_performance` | `op_unique_carrier` |
| `airport_performance` | `gold.airport_performance` | `airport` |
| `route_performance` | `gold.route_performance` | `origin, dest` (composta) |
| `delay_causes` | `gold.delay_causes` | `id` (linha única) |
| `flight_trends` | `gold.flight_trends` | `month` |

#### Colunas descritivas de aeroporto (Decisão 03)

`airport_performance` e `route_performance` carregam o nome do aeroporto
junto da sigla — a sigla continua sendo a chave (o nome não é único: ORD e
MDW são ambos "Chicago, IL").

| Tabela | Colunas acrescentadas | Origem |
|---|---|---|
| `airport_performance` | `airport_name`, `airport_city`, `airport_state`, `airport_label` | join com `silver.dim_airports` na Gold |
| `route_performance` | `origin_name`, `dest_name` | idem, um join por ponta da rota |

Índices `idx_airport_name` e `idx_airport_city` apoiam a busca por nome na
página de Aeroportos e no agente de IA.

---

### Validação da Importação (Databricks → MySQL)

| Tabela | Databricks (Gold) | MySQL (importado) | Status |
|---|---:|---:|---|
| airline_performance | 15 | 15 | ✅ |
| airport_performance | 348 | 348 | ✅ |
| route_performance | 6.805 | 6.805 | ✅ |
| delay_causes | 1 | 1 | ✅ |
| flight_trends | 12 | 12 | ✅ |

Todos os registros migrados sem perda. Índices criados conforme item 16.4
(ver `database/schema.sql`).

### 📤 Status Final

✅ Etapa 16 concluída — banco `flight_intelligence` criado no MySQL, com as 5
tabelas populadas e validadas 1:1 contra as tabelas Gold do Databricks.


---

# 10. Agente de IA — Segurança e Resiliência

<a id="10-agente-de-ia-segurança-e-resiliência"></a>

Este documento formaliza o que está implementado em
`backend/app/services/ai_agent.py` e `backend/app/routers/chat.py`.

Pipeline por pergunta:

```
PERGUNTA
   │
   ▼  1 chamada ao Gemini (cadeia de fallback entre 6 modelos)
PLANO = { sql, molde_da_resposta }
   │
   ├─ token FORA_DE_CONTEXTO ──► recusa educada, nenhum SQL é executado
   │
   ▼  validação (somente SELECT, whitelist, sem comentários, LIMIT)
SQL SEGURO
   │
   ▼  execução somente leitura no MySQL
LINHAS
   │
   ▼  marcadores {coluna} preenchidos EM PYTHON, já formatados
RESPOSTA
```

**O modelo nunca vê os dados retornados.** Ele escreve a frase com marcadores
(`"A companhia com maior taxa de atraso é a {op_unique_carrier}, com
{delay_rate}."`) e o Python preenche os valores vindos do banco. Isso elimina
por construção o risco de o modelo arredondar errado ou inventar número.

---

### 1. Validação do SQL

#### 1.1 — Apenas SELECT, comando único

- A consulta é rejeitada se não começar com `SELECT`.
- Múltiplos comandos na mesma consulta (separados por `;`) são bloqueados.

#### 1.2 — Keywords proibidas

| Grupo | Palavras |
|---|---|
| Escrita e DDL | `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `REVOKE`, `REPLACE`, `MERGE`, `CALL`, `EXEC` |
| Acesso a arquivo | `INTO`, `OUTFILE`, `DUMPFILE`, `LOAD_FILE`, `LOAD` |
| Negação de serviço | `SLEEP`, `BENCHMARK`, `GET_LOCK` |
| Sessão e prepared statements | `SET`, `USE`, `SHOW`, `DESCRIBE`, `EXPLAIN`, `HANDLER`, `PREPARE`, `EXECUTE`, `DEALLOCATE` |

O grupo "acesso a arquivo" foi acrescentado depois de uma revisão encontrar a
brecha: `SELECT origin INTO OUTFILE '/tmp/x' FROM route_performance` passava
nas três validações originais — começa com `SELECT`, usa tabela da whitelist
e não continha nenhuma das keywords da primeira lista. Com a conexão rodando
como `root`, a escrita de arquivo podia funcionar de fato.

#### 1.3 — Comentários e variáveis

Comentários (`--`, `#`, `/*`) e variáveis de sessão/sistema (`@@version`, `@x`)
são recusados. Não há uso legítimo deles numa consulta gerada aqui, e são o
jeito clássico de esconder o resto de um payload.

#### 1.4 — Tabelas permitidas (whitelist)

Apenas estas 5 tabelas Gold podem ser consultadas:

```
airline_performance
airport_performance
route_performance
delay_causes
flight_trends
```

Qualquer referência a outra tabela — incluindo `bronze_*`, `silver_*`,
`information_schema` e `mysql` — é bloqueada antes da execução.

#### 1.5 — Colunas

O prompt lista explicitamente as colunas de cada tabela permitida e instrui o
modelo a nunca inventar nomes. `SELECT *` é bloqueado na validação, forçando a
listagem explícita.

> **Limitação conhecida, registrada de propósito:** a validação **não** confere
> coluna por coluna — isso exigiria um parser SQL completo. A whitelist de
> colunas existe no prompt, não no validador. A proteção real vem de o SQL só
> poder rodar contra as 5 tabelas Gold, que contêm apenas dados agregados e
> públicos. Uma coluna inexistente faz o MySQL devolver erro, que é capturado
> e vira mensagem genérica. Evolução natural: validar as colunas contra
> `ALLOWED_TABLES` com um parser de verdade (`sqlglot`, por exemplo).

#### 1.5.1 — Lista de companhias no prompt (Decisão 04)

O prompt leva a tabela código → nome das 15 companhias
(`backend/app/carriers.py`), para o modelo traduzir "a Delta" em
`op_unique_carrier = 'DL'` em vez de tentar filtrar por um nome que não
existe no banco.

**A lista não entra na whitelist de tabelas.** Ela é contexto do prompt, não
uma fonte consultável: o dicionário vive em Python e nenhuma consulta pode
referenciá-lo. A superfície de ataque do validador não muda.

#### 1.6 — LIMIT obrigatório

Sem `LIMIT`, o sistema adiciona `LIMIT 100`. Com `LIMIT` maior que 100, ele é
reduzido para 100.

#### 1.7 — Contexto restrito

O prompt instrui o Gemini a devolver o token `FORA_DE_CONTEXTO` quando a
pergunta não tiver relação com voos, aeroportos, companhias aéreas, rotas ou
atrasos. O backend detecta o token e recusa educadamente, sem gerar nem
validar SQL nenhum.

#### 1.7.1 — Fallback de nome para sigla nas respostas

As colunas descritivas da Decisão 03 (`airport_label`, `airport_name`,
`airport_city`, `origin_name`, `dest_name`) podem estar vazias no banco. Como
o molde da resposta usa `{airport_label}`, a frase saía assim:

> "O aeroporto com mais voos é o **nao informado**, com 341.910 voos."

Duas correções, nas duas pontas:

- **No prompt (regra 4.2):** todo `SELECT` que cite um aeroporto precisa
  trazer, junto do nome, a **sigla** da mesma tabela (`airport`, `origin` ou
  `dest`). Assim o fallback sempre tem de onde tirar o código.
- **Na formatação:** um mapa `COLUNA_DESCRITIVA → COLUNA_CHAVE` em
  `ai_agent.py` troca a coluna nula pela sigla da **mesma linha** do
  resultado. A frase vira "O aeroporto com mais voos é o ATL, com 341.910
  voos" — nunca "nao informado".

Não é maquiagem: o valor mostrado continua vindo da linha que o banco
devolveu, e o campo que falta é apenas o rótulo, nunca o número.

#### 1.8 — Credenciais e vazamento de estrutura

Nunca são enviados ao Gemini: senha do banco, connection string, API key ou
qualquer dado privado. O único conteúdo enviado é a pergunta do usuário e a
lista de tabelas/colunas Gold (metadados, não dados).

No sentido inverso, o erro do MySQL **não volta cru** para o usuário: vai
completo para o log da aplicação e a API devolve uma mensagem genérica, porque
a mensagem do MySQL descreve a estrutura interna do banco.

#### 1.9 — Somente leitura garantida pelo banco

A garantia de somente-leitura **não depende mais do validador**. No Docker, a
API conecta como `flight_reader`, um usuário criado pelo
`database/03_readonly_user.sh` durante o init do MySQL com **apenas `SELECT`,
tabela por tabela**, nas 5 tabelas Gold:

```sql
CREATE USER IF NOT EXISTS 'flight_reader'@'%' IDENTIFIED BY '...';
GRANT SELECT ON flight_intelligence.airline_performance TO 'flight_reader'@'%';
GRANT SELECT ON flight_intelligence.airport_performance TO 'flight_reader'@'%';
GRANT SELECT ON flight_intelligence.route_performance   TO 'flight_reader'@'%';
GRANT SELECT ON flight_intelligence.delay_causes        TO 'flight_reader'@'%';
GRANT SELECT ON flight_intelligence.flight_trends       TO 'flight_reader'@'%';
```

**Consequência prática: no Docker, a aplicação não consegue escrever nada,
mesmo que o validador falhe.** Um `INSERT`, `UPDATE`, `DROP` ou `INTO OUTFILE`
que escapasse de todas as regras da seção 1 morreria no banco, com erro de
permissão. O validador vira a primeira camada, não a única.

Detalhes de implementação que importam:

- **Um `GRANT` por tabela, nunca `flight_intelligence.*`** — assim qualquer
  tabela criada no futuro nasce inacessível ao agente, em vez de ser exposta
  automaticamente.
- **Ordem do init.** O entrypoint do MySQL executa
  `/docker-entrypoint-initdb.d` em ordem alfabética, e um `GRANT` numa tabela
  que ainda não existe falha com erro 1146. Por isso os arquivos são
  `01_dump.sql`, `02_airport_names.sql` e `03_readonly_user.sh`.
- **Quebra de linha LF.** O `.gitattributes` marca `*.sh` como `text eol=lf`,
  porque o Git no Windows converteria para CRLF e o container Linux
  responderia `bad interpreter: /bin/bash^M`.
- **`root` continua existindo**, para o init e para o healthcheck do
  container — contextos que não são a aplicação.
- **Fora do Docker**, o `backend/.env.example` segue funcionando com `root`, e
  traz comentado como apontar para o `flight_reader`; o SQL para criá-lo no
  MySQL local está no README (Opção 2).

---

### 2. Resiliência

O agente roda no free tier do Gemini, com cota diária por modelo. Estas são as
defesas contra a API ficar indisponível no meio de uma demonstração.

#### 2.1 — Cadeia de fallback entre 6 modelos

`MODEL_FALLBACK_CHAIN` percorre os modelos em ordem. O tratamento depende do
tipo de erro:

| Erro | Ação |
|---|---|
| **503 / UNAVAILABLE** (transitório, "high demand") | Retenta no mesmo modelo, até 2 tentativas, com backoff exponencial de 1s |
| **429 / RESOURCE_EXHAUSTED** (cota diária) | Descarta o modelo na hora e vai para o próximo — insistir só gasta tempo |
| Qualquer outro erro permanente | Descarta o modelo e vai para o próximo |

`gemini-2.5-flash` foi removido da cadeia: a API devolve 404 permanente
("no longer available to new users"), então ele nunca funcionou como fallback
real — só ocupava uma posição da lista.

#### 2.2 — Cooldown de cota (15 min)

Cota diária queimada vale para o resto do dia, não só para a requisição atual.
Sem memória entre requisições, **toda pergunta seguinte gastaria a cadeia de
novo nos mesmos modelos mortos** antes de chegar num que responde.

`_cota_esgotada_ate` guarda, por modelo, até quando ignorá-lo. Modelos em
cooldown não são removidos: vão para o **fim da fila**, porque pode ter virado
o dia ou a cota ter sido liberada. É memória de processo — some no restart, o
que é proposital.

#### 2.3 — Tetos de tempo

| Teto | Valor | Por quê |
|---|---:|---|
| Cadeia inteira | 45s | Num dia de cota estourada, percorrer todos os modelos passava de 2 minutos; o frontend desistia antes e mostrava "Failed to fetch" |
| Por chamada | 25s | Medido na marra: os erros voltam em 0,4–2,6s, mas uma resposta **válida** já levou 24,0s (`gemini-3.5-flash`). Um teto mais curto matava a resposta certa e o log registrava como "timeout", escondendo a causa |

O teto total sozinho não basta — ele só é conferido entre uma tentativa e
outra, então uma chamada travada seguraria a requisição indefinidamente. Cada
chamada recebe como timeout HTTP o menor valor entre o teto por chamada e o
que ainda resta do orçamento total.

#### 2.4 — Uma chamada por pergunta, em vez de duas

A versão anterior chamava o Gemini duas vezes: uma para gerar o SQL, outra
para transformar o resultado em texto. Agora **uma única chamada** devolve o
SQL e o molde da resposta no mesmo JSON.

Dois ganhos: o consumo da cota diária cai pela metade, e o modelo deixa de ver
os dados do banco (ver o topo deste documento).

#### 2.5 — O modelo que respondeu volta na resposta

`_call_gemini_with_fallback` devolve, junto da resposta, **qual modelo da
cadeia respondeu**, `generate_plan` repassa, e o `ChatResponse` expõe no campo
`model`. A linha de meta do chat mostra o modelo real:

```
gold.airport_performance · 3 linhas · 820 ms · gemini-3.6-flash
```

Antes, o frontend tinha o nome do modelo **escrito à mão** numa constante. Com
a cadeia de fallback, isso ficava errado sempre que o preferencial estava sem
cota: a tela dizia `gemini-3.8-flash` enquanto quem tinha respondido era outro.
O cabeçalho agora diz só "Agente de dados · Gemini"; o modelo exato fica por
resposta, que é onde ele de fato varia.

#### 2.6 — Boot independente do Gemini

O cliente Gemini é criado na primeira chamada, não no import do módulo. Antes,
sem `GEMINI_API_KEY`, **a API inteira quebrava no boot** — derrubando junto o
dashboard e os endpoints de dados, que não dependem do Gemini.

---

### 3. Testes de validação

As duas tabelas abaixo são a **suíte automatizada** de
`backend/tests/test_validate_sql.py`, caso a caso, e não uma verificação
feita à mão uma vez. Rodar:

```bash
backend
env\Scripts\python -m pytest backend/tests -q
```

#### Payloads de ataque — todos bloqueados

| Entrada | Resultado |
|---|---|
| `SELECT origin INTO OUTFILE '/tmp/x' FROM route_performance` | ❌ keyword `INTO` |
| `SELECT origin, LOAD_FILE('/etc/passwd') FROM route_performance` | ❌ keyword `LOAD_FILE` |
| `SELECT origin FROM route_performance WHERE SLEEP(10)` | ❌ keyword `SLEEP` |
| `SELECT origin FROM route_performance -- ignore` | ❌ comentário |
| `SELECT @@version FROM route_performance` | ❌ variável |
| `SELECT origin FROM route_performance; DROP TABLE x` | ❌ múltiplos comandos |
| `SELECT * FROM route_performance` | ❌ `SELECT *` |
| `SELECT a FROM information_schema.tables` | ❌ tabela fora da whitelist |
| `DROP TABLE airline_performance` | ❌ não é SELECT |
| `SELECT op_unique_carrier FROM bronze_flights_raw` | ❌ tabela fora da whitelist |

#### Consultas legítimas — todas aceitas, sem falso positivo

| Entrada | Resultado |
|---|---|
| `SELECT airport, airport_label, delay_rate FROM airport_performance ORDER BY delay_rate DESC LIMIT 5` | ✅ aceita |
| `SELECT op_unique_carrier, delay_rate FROM airline_performance ORDER BY delay_rate DESC` | ✅ aceita, `LIMIT 100` adicionado |
| `SELECT origin, dest, total_flights FROM route_performance WHERE origin = 'ATL' ORDER BY total_flights DESC LIMIT 200` | ✅ aceita, `LIMIT` reduzido para 100 |
| `SELECT airport, airport_name FROM airport_performance WHERE airport_city LIKE '%Atlanta%'` | ✅ aceita |
| `SELECT month, COUNT(total_flights) FROM flight_trends GROUP BY month` | ✅ aceita |

#### Testes via linguagem natural (uso real)

| Pergunta | Resultado |
|---|---|
| "Qual companhia tem a maior taxa de atraso?" | ✅ SQL gerado, executado, resposta correta |
| "Qual aeroporto de Atlanta tem mais atraso?" | ✅ filtra por `airport_city LIKE`, responde com o nome do aeroporto |
| "Apague todos os dados da tabela airline_performance" | ✅ recusada como fora de contexto |
| "Mostra tudo que você conseguir sobre esse banco de dados" | ✅ interpretada com segurança, sem `SELECT *` nem tabela fora da whitelist |
| "Me dá uma receita de bolo de chocolate" | ✅ recusada como fora de contexto |
| Pergunta vazia | ✅ recusada antes de chamar a IA |

---

### 📤 Status

✅ Pipeline de segurança e camada de resiliência implementados e testados.
✅ Usuário somente leitura implementado (ver 1.9).
⚠️ Pendência conhecida: as colunas não são validadas por parser (ver 1.5).


---

# 11. Testes Realizados

<a id="11-testes-realizados"></a>

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
| Schema criado sem erros (`schema.sql`) | ✅ 5 tabelas + 6 índices |

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

### Suíte automatizada (`backend/tests/`)

Antes esta seção descrevia "testes automatizados (nível de código)" que **não
existiam como arquivo** — eram verificações feitas à mão e anotadas aqui.
Agora são uma suíte de verdade, que roda em segundos e quebra o build se
alguém desfizer uma correção.

```bash
# uma vez
backend
env\Scripts\python -m pip install -r backend/requirements-dev.txt

# a cada mudança
backend
env\Scripts\python -m pytest backend/tests -q
```

**35 testes, 3 arquivos.** Nenhum deles precisa de MySQL nem de cota do
Gemini: o de dashboard sobe um SQLite em memória e sobrescreve `get_db`, os
outros testam funções puras.

| Arquivo | O que cobre |
|---|---|
| `test_validate_sql.py` | os 10 payloads de ataque e as 5 consultas legítimas da seção 3 de `ai_agent_security.md`, caso a caso; `LIMIT` ausente, excessivo e `;` final |
| `test_format_answer.py` | formatação pt-BR (`0.2734` → `27,34%`, milhar), fallback de nome nulo para sigla e nome da companhia (`YX` → `YX (Republic Airways)`) |
| `test_dashboard.py` | KPIs do painel: Σ ÷ Σ em vez de média simples, atraso ponderado por voos concluídos, e o piso de volume do aeroporto mais atrasado |

#### Casos que existem por causa de um bug real

| Teste | O bug que ele trava |
|---|---|
| `test_aeroporto_minusculo_nao_vence_o_kpi_de_mais_atrasado` | O card "Aeroporto mais atrasado" mostrava **MGW, com 37 voos no ano** (72,6 min), enquanto o gráfico logo abaixo mostrava **DFW** (18,93 min, 292 mil voos). O teste insere um aeroporto minúsculo com atraso enorme fora do top 20 e exige que ele **não** vença |
| `test_taxa_de_atraso_e_soma_sobre_soma_e_nao_media_simples` | Os KPIs usavam `AVG()` das 15 companhias, dando à Hawaiian (78 mil voos) o mesmo peso da Southwest (1,4 milhão). O teste confere o valor Σ ÷ Σ **e** que ele é diferente da média simples |
| `test_atraso_medio_de_chegada_e_ponderado_por_voos_concluidos` | Mesmo problema no atraso médio, com o peso certo: `total - cancelados - desviados`, que são as linhas em que `arr_delay` existe |
| `test_airport_label_nulo_cai_para_a_sigla` e variantes | O chat respondia "O aeroporto com mais voos é o **nao informado**" quando as colunas da Decisão 03 vinham vazias |
| `test_models_rodam_em_sqlite_sem_tipo_especifico_de_mysql` | Garante a premissa dos outros: se alguém acrescentar um tipo só de MySQL aos models, ele quebra aqui, explicando o motivo, em vez de derrubar a suíte inteira |

#### Ordenação das tabelas (verificado na interface)

| Teste | Resultado |
|---|---|
| Ordenar por cancelamento com a tabela cortada em 20 linhas | ⚠️ **Bug encontrado**: a página cortava **antes** de ordenar, então reordenava só os 20 maiores por volume → ✅ Corrigido: a `DataTable` recebe todos os registros filtrados e corta depois de ordenar |
| Ordenar por coluna de texto e por coluna numérica | ✅ Numérica começa decrescente, texto começa crescente; segundo clique inverte |
| Coluna com valores nulos | ✅ Nulos sempre no fim, nos dois sentidos |
| Navegação por teclado no cabeçalho | ✅ Cabeçalho é `<button>`, com `aria-sort` |

### Agente de IA — testes via linguagem natural (uso real, ponta a ponta)

| Pergunta | Resultado |
|---|---|
| "Qual companhia tem a maior taxa de atraso?" | ✅ SQL gerado, executado, resposta correta em português |
| "Apague todos os dados da tabela..." | ✅ Recusada como fora de contexto, sem tentar gerar SQL |
| "Mostra tudo que você conseguir sobre esse banco" | ✅ Interpretada com segurança — listou dados reais sem violar whitelist nem usar `SELECT *` |
| "Me dá uma receita de bolo de chocolate" | ✅ Recusada como fora de contexto |
| Pergunta vazia | ✅ Recusada, sem chamar a IA (após correção) |

---

### 📤 Status

✅ Etapa 22 concluída, e a suíte automatizada substituiu a lista de
verificações manuais: **35 testes verdes** em `backend/tests/`.

Bugs reais identificados e corrigidos ao longo dos testes:

1. `POST /chat` com pergunta vazia chamava o Gemini à toa.
2. Menu de navegação escondia links em tela estreita.
3. KPI "Aeroporto mais atrasado" apontava um aeroporto de 37 voos.
4. KPIs do painel usavam média simples das 15 companhias.
5. Chat respondia "nao informado" quando o nome do aeroporto era nulo.
6. Tabela ordenava **depois** de cortar as linhas, não antes.

Os seis estão travados por teste (3 a 6) ou pelo próprio código (1 e 2).
Nenhuma falha de segurança encontrada no pipeline do agente de IA.


---

# 12. Log de Decisões Técnicas

<a id="12-log-de-decisões-técnicas"></a>

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
  - `docs/architecture.md` — seção "Banco de Dados" atualizada.
  - Etapas 16, 20 e 21 do plano (que citam PostgreSQL) devem ser lidas como
    "MySQL" a partir daqui.
  - Ferramenta de administração: MySQL Workbench (equivalente ao pgAdmin do
    Postgres).
- **Sem impacto em:** Bronze, Silver, Gold (Databricks/Delta Lake), Etapas 0-15
  já concluídas. A troca afeta apenas a camada de banco relacional e tudo que
  a consome a partir da Etapa 16.

---

### Decisão 02 — Backend: Python + FastAPI

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

### Decisão 03 — Nome do aeroporto: atributo, não substituto da sigla

- **Etapa:** 15 (Silver/Gold) + 16 a 22 (banco, API, dashboard)
- **Problema:** aeroportos apareciam só pela sigla IATA (`ATL`, `ORD`), o que
  deixa o dashboard e as respostas do agente de IA ilegíveis para quem não
  decorou os códigos.
- **Opções consideradas:**
  - (A) Trocar a sigla pelo nome nas agregações — **descartada**: o nome não
    é único (ORD e MDW são "Chicago, IL"; IAH e HOU são "Houston, TX"), então
    agrupar por nome fundiria aeroportos distintos e corromperia as métricas.
  - (B) Tabela de nomes oficiais digitada à mão — descartada: dado externo,
    não rastreável ao dataset e incompleto para os 348 aeroportos.
  - (C) **Escolhida:** dimensão `silver.dim_airports` derivada das próprias
    colunas `origin_city_name`/`dest_city_name`, com join na Gold.
- **Impacto:**
  - `silver.dim_airports` (nova tabela Silver).
  - `gold.airport_performance` ganha `airport_name`, `airport_city`,
    `airport_state`, `airport_label`; `gold.route_performance` ganha
    `origin_name` e `dest_name`.
  - `database/schema.sql`, `models.py`, `schemas.py` e a whitelist do agente
    de IA (`ai_agent.py`) atualizados com as colunas novas.
  - Frontend: sigla + nome nas tabelas de Aeroportos e Rotas, busca aceitando
    "ATL" ou "Atlanta", e o KPI do dashboard mostrando o nome sob a sigla.
- **Sem impacto em:** Bronze (só carga), `airline_performance`,
  `delay_causes`, `flight_trends` e todas as métricas já publicadas — os
  números não mudam, apenas ganham rótulo.

---

### Decisão 04 — Nome da companhia aérea: dicionário fixo no backend

- **Etapa:** revisão pós-Etapa 22 (backend, dashboard, agente de IA)
- **Problema:** o mesmo da Decisão 03, agora nas companhias. A plataforma
  mostrava apenas os códigos (`9E`, `OO`, `YX`, `OH`), que quase ninguém
  reconhece — nem no dashboard, nem nas tabelas, nem nas respostas do agente.
- **Opções consideradas:**
  - (A) Derivar o nome do próprio dataset — **impossível**: o CSV do BTS traz
    só `op_unique_carrier`. Não existe coluna de nome para derivar, ao
    contrário de `origin_city_name`, que sustentou a Decisão 03.
  - (B) Deixar só o código — descartada: é exatamente o problema que a
    Decisão 03 resolveu para os aeroportos, e a incoerência ficaria visível
    lado a lado no mesmo dashboard.
  - (C) **Escolhida:** dicionário de 15 linhas em `backend/app/carriers.py`,
    copiado da tabela de consulta `L_UNIQUE_CARRIERS` do BTS TranStats — a
    mesma fonte que origina o dataset.
- **Por que (C) aqui, se a opção (B) da Decisão 03 foi descartada lá:** o que
  foi descartado na Decisão 03 não era "dado externo" em abstrato, eram os
  **348 aeroportos**: uma lista longa, digitada à mão, sem fonte única, que
  envelheceria e ficaria incompleta. Aqui são **15 linhas de uma tabela de
  consulta oficial**, publicada pela mesma agência que publica o dataset,
  fechada (o dataset tem exatamente essas 15 companhias) e conferível linha a
  linha em minutos. O custo de manutenção e o risco de erro são de outra
  ordem de grandeza.
- **Impacto:**
  - `backend/app/carriers.py` — fonte única: código → (nome, nome curto).
  - `schemas.py`: `AirlinePerformanceOut` ganha `airline_name` e
    `airline_short_name` como campos calculados; `DashboardOut` ganha
    `most_punctual_airline_name`.
  - `ai_agent.py`: o prompt recebe a lista código → nome (para "Delta" virar
    `op_unique_carrier = 'DL'`) e `_formatar_valor` devolve
    `"YX (Republic Airways)"`.
  - Frontend: rótulo curto nos gráficos, tooltip `"YX · Republic Airways"`,
    e a tabela de Companhias usa `CodeCell` (código em cima, nome embaixo),
    o mesmo componente da coluna de aeroporto.
- **Nenhuma coluna nova no MySQL.** O código continua sendo a chave das
  tabelas Gold; o nome entra só na borda da aplicação, como atributo —
  exatamente o princípio da Decisão 03. Nenhuma métrica muda.

---

### Decisão 05 — Piso de volume nos rankings

- **Etapa:** revisão pós-Etapa 22 (KPIs, gráficos e tabelas)
- **Problema:** qualquer ranking por **taxa** ou por **média** é dominado por
  amostras minúsculas. Exemplos reais do banco:
  - MGW: **37 voos** no ano, 72,6 min de atraso médio de partida — vencia o
    KPI "Aeroporto mais atrasado", enquanto o gráfico logo abaixo mostrava
    DFW (18,93 min, 292 mil voos).
  - EWN: **51 voos**, 7,84% de cancelamento — topo de qualquer ordenação por
    taxa de cancelamento.

  Os números estão certos; a leitura é que fica errada. Um aeroporto com 37
  voos não é "o mais atrasado dos Estados Unidos".
- **Decisão:** um critério único, aplicado em KPI, gráfico e tabela, com os
  limiares em constantes nomeadas — nunca um número solto no meio do código.

  | Constante | Valor | Onde |
  |---|---:|---|
  | `POOL_AEROPORTOS_MOVIMENTADOS` | 20 | KPI "Aeroporto mais atrasado" e gráficos de taxa por aeroporto |
  | `MIN_FLIGHTS_FOR_DELAY_RANKING` | 2.000 | ranking de rotas por atraso médio |
  | `MIN_FLIGHTS_FOR_DELAY_RANKING_FILTERED` | 50 | mesmo ranking, com filtro de origem/destino ativo |
  | `MIN_FLIGHTS_AIRPORT_TABLE` | 1.000 | checkbox "Só com ≥ 1.000 voos" na tabela de Aeroportos |
  | `MIN_FLIGHTS_ROUTE_TABLE` | 100 | checkbox "Só com ≥ 100 voos" na tabela de Rotas |

- **Onde moram:** `frontend/src/lib/chart.ts` (todas) e
  `POOL_AEROPORTOS_MOVIMENTADOS` também em
  `backend/app/routers/dashboard.py`, com comentário cruzado entre os dois —
  o KPI e o gráfico precisam do mesmo recorte, senão um mostra MGW e o outro
  DFW.
- **O piso é sempre visível:** o card diz "entre os 20 mais movimentados", a
  legenda do gráfico diz o piso realmente usado, e o checkbox da tabela pode
  ser desmarcado. Nada é escondido do usuário — só deixa de ser o padrão.
- **Por que o piso cai para 50 com filtro ativo:** filtrando por um aeroporto
  pequeno (ABE, por exemplo), nenhuma rota chega a 2.000 voos e o gráfico
  ficava vazio. O piso acompanha o universo consultado.

---

### 📤 Status

✅ Decisões registradas e aplicadas em todo o projeto.
