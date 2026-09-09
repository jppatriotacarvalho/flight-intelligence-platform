# 📐 KPIs e Regras de Negócio

Fonte: `silver.flights_clean`

Cada KPI abaixo existe para responder pelo menos uma pergunta definida em
`docs/business_questions.md`. Nenhuma métrica foi criada sem propósito.

---

## KPI 01 — Total de Voos

- **Descrição:** quantidade total de voos registrados.
- **Fórmula:** `COUNT(*)`
- **Colunas utilizadas:** nenhuma (contagem de linhas).
- **Regra:** conta todos os registros da Silver, incluindo cancelados e desviados (representam voos programados, mesmo que não concluídos).
- **Justificativa:** métrica base de volume, usada como denominador em quase todas as taxas abaixo.

---

## KPI 02 — Taxa de Atraso

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

## KPI 03 — Atraso Médio (Chegada)

- **Descrição:** média de minutos de atraso na chegada.
- **Fórmula:** `AVG(arr_delay)`
- **Colunas utilizadas:** `arr_delay`
- **Regra:** calculado apenas sobre voos com `arr_delay` não nulo. Valores negativos (voo adiantado) entram no cálculo normalmente, pois são dados válidos.
- **Justificativa:** representa o atraso "líquido" médio, incluindo o efeito de voos adiantados — mais realista que olhar só para os atrasados.

---

## KPI 04 — Atraso Médio (Partida)

- **Descrição:** média de minutos de atraso na partida.
- **Fórmula:** `AVG(dep_delay)`
- **Colunas utilizadas:** `dep_delay`
- **Regra:** mesma lógica do KPI 03, aplicada à partida em vez da chegada.
- **Justificativa:** permite distinguir se o atraso se origina na partida ou se acumula/dissipa durante o voo (comparando com o atraso de chegada).

---

## KPI 05 — Taxa de Cancelamento

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

## KPI 06 — Taxa de Desvio

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

## KPI 07 — Companhia Mais Pontual

- **Descrição:** companhia aérea com a menor taxa de atraso (KPI 02 agrupado por companhia).
- **Fórmula:** `MIN(delay_rate)` agrupado por `op_unique_carrier`
- **Colunas utilizadas:** `op_unique_carrier`, `arr_delay`
- **Regra:** mesmo critério de atraso do KPI 02 (`arr_delay > 15`), agregado por companhia.
- **Justificativa:** responde diretamente a pergunta de negócio "qual companhia é mais pontual" (Etapa 8).

---

## KPI 08 — Aeroporto Mais Atrasado

- **Descrição:** aeroporto de origem com o maior atraso médio de partida.
- **Fórmula:** `MAX(AVG(dep_delay))` agrupado por `origin`
- **Colunas utilizadas:** `origin`, `dep_delay`
- **Regra:** considera apenas o papel do aeroporto como origem (partida). Uma versão simétrica pode ser feita para `dest`/`arr_delay` se necessário.
- **Justificativa:** responde à pergunta "qual aeroporto possui maior atraso" (Etapa 8).

---

## KPI 09 — Distribuição de Motivos de Atraso

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

## 📋 Resumo — KPI × Pergunta de Negócio

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

## 📤 Status

✅ KPIs oficialmente definidos, com fórmula, colunas e justificativa — Etapa 13 concluída.
⏭️ Próximo passo: implementar essas métricas nas tabelas analíticas da **Etapa 14 — Desenvolvimento Gold**.