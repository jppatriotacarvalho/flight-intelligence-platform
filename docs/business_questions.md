# ❓ Perguntas de Negócio

Este documento define as perguntas que a plataforma deve conseguir responder.
Elas servem de guia para o desenho das tabelas Gold (Etapa 14), dos KPIs
(Etapa 13) e do dashboard (Etapa 19) — cada tabela e métrica criada deve
existir para responder a pelo menos uma pergunta daqui.

---

## ✈️ Companhias

1. Qual companhia possui o maior atraso médio (partida e chegada)?
2. Qual companhia possui a maior taxa de cancelamento?
3. Qual companhia possui o maior volume de voos?
4. Qual companhia é mais pontual (menor % de voos atrasados)?

---

## 🛫 Aeroportos

5. Qual aeroporto possui o maior atraso médio?
6. Qual aeroporto possui o maior volume de voos (origem e destino)?
7. Qual aeroporto possui a maior taxa de cancelamento?

---

## 🗺️ Rotas

8. Qual rota (origem → destino) possui o maior volume de voos?
9. Qual rota possui o maior atraso médio?
10. Qual rota possui a maior distância percorrida?

---

## 📅 Tempo

11. Qual mês do ano concentra mais atrasos?
12. Qual dia da semana concentra mais atrasos?
13. Como os atrasos evoluíram ao longo de 2024 (tendência mensal/diária)?

---

## ⚠️ Motivos de Atraso

14. Qual é o principal motivo dos atrasos (companhia, clima, NAS, segurança, aeronave anterior)?
15. Quanto o clima (`weather_delay`) impacta no total de minutos de atraso?
16. Quanto atrasos por aeronave anterior (`late_aircraft_delay`) impactam no total?

---

## 📋 Rastreabilidade (pergunta → dado necessário)

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

## ✅ Critério de Validação

Todas as perguntas acima já podem ser respondidas com as colunas confirmadas
no `data_dictionary.md` e validadas no `data_quality.md` — nenhuma depende de
dado que não existe no dataset.

---

## 📤 Status

✅ Perguntas de negócio definidas — Etapa 8 concluída.
⏭️ Servirão de base direta para as Etapas 13 (KPIs) e 14 (tabelas Gold).