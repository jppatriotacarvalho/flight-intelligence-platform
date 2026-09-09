# 📖 Data Dictionary — Flight Delay Dataset 2024

Fonte: `flight_data_2024_data_dictionary.csv`

Total de colunas confirmado: **35**

> As descrições abaixo foram escritas com base na nomenclatura oficial do BTS
> (Bureau of Transportation Statistics — On-Time Performance Database), fonte
> original do dataset. Os valores de tipo, % de nulos e exemplo vêm
> diretamente do arquivo de dicionário fornecido.

---

## 📋 Tabela de Documentação

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

## 🗂️ Classificação por Grupo

### 📅 Temporal
- year
- month
- day_of_month
- day_of_week
- fl_date

### ✈️ Voo
- op_carrier_fl_num

### 🏢 Companhia
- op_unique_carrier

### 🛫 Origem
- origin
- origin_city_name
- origin_state_nm

### 🛬 Destino
- dest
- dest_city_name
- dest_state_nm

### ⏰ Horários
- crs_dep_time
- dep_time
- crs_arr_time
- arr_time
- wheels_off
- wheels_on
- taxi_out
- taxi_in

### ⚠️ Atrasos
- dep_delay
- arr_delay
- carrier_delay
- weather_delay
- nas_delay
- security_delay
- late_aircraft_delay

### ❌ Cancelamento
- cancelled
- cancellation_code

### ↪️ Desvio
- diverted

### 📏 Distância e Duração
- crs_elapsed_time
- actual_elapsed_time
- air_time
- distance

---

## 🔎 Categorias de Dados

| Categoria | Colunas |
|---|---|
| Identificador | op_unique_carrier, op_carrier_fl_num, origin, dest |
| Numérica (contínua/discreta) | dep_delay, arr_delay, taxi_out, taxi_in, crs_elapsed_time, actual_elapsed_time, air_time, distance, carrier_delay, weather_delay, nas_delay, security_delay, late_aircraft_delay |
| Categórica | origin_city_name, origin_state_nm, dest_city_name, dest_state_nm, cancellation_code |
| Temporal | year, month, day_of_month, day_of_week, fl_date, crs_dep_time, dep_time, crs_arr_time, arr_time, wheels_off, wheels_on |
| Boolean (0/1) | cancelled, diverted |

---

## 🔍 Observações iniciais (para validar na Etapa 7 com o sample)

- `cancellation_code` tem 98.64% de nulos — coerente, já que só existe valor quando `cancelled = 1`. Precisa ser validado com o sample (regra: nulo aqui não é "dado faltando", é "não se aplica").
- `op_carrier_fl_num` está como `float64` (ex: 4814.0), mas semanticamente é um identificador — não uma medida numérica contínua. Ponto a investigar/ajustar na Silver.
- Horários (`crs_dep_time`, `dep_time`, `crs_arr_time`, `arr_time`, `wheels_off`, `wheels_on`) estão no formato `hhmm` como número (ex: 1252 = 12:52), não como timestamp — vai precisar de tratamento na Silver se quisermos horário de verdade.
- Ainda **não foi feita** a comparação entre este dicionário e o `flight_data_2024_sample.csv` (item 6.4 do plano) — isso será feito assim que o sample for carregado, já na Etapa 7.

---

## 📤 Status

✅ 35 colunas documentadas, classificadas e agrupadas — Etapa 6 concluída.
⏭️ Pendente: comparação com o sample real (Etapa 7).