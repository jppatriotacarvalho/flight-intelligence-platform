# 📌 Visão Geral e Problema de Negócio

## Qual problema estamos resolvendo?

O setor aéreo gera diariamente um grande volume de dados sobre voos, horários, atrasos, cancelamentos, desvios, companhias aéreas, aeroportos e rotas. Esses dados, no entanto, costumam existir de forma bruta, fragmentada, espalhados em diferentes fontes e sem padronização. Dificultando uma análise ou tomada de decisão com mais qualidade.

O problema central é a ausência de uma plataforma que transforme esse volume de dados brutos em informação confiável, estruturada e acessível: hoje é difícil responder perguntas simples como "qual companhia atrasa mais" ou "qual aeroporto tem maior taxa de cancelamento" sem um processo manual, demorado e sujeito a erro.

Este projeto resolve esse problema construindo um pipeline completo de dados — desde a ingestão de milhões de registros até a disponibilização de métricas confiáveis via API, dashboard e um agente de IA capaz de responder perguntas em linguagem natural.

---

## Quem poderia utilizar a plataforma?

- **Companhias aéreas** — para monitorar sua própria performance operacional e se comparar com o mercado.
- **Aeroportos** — para entender seu desempenho operacional e identificar gargalos.
- **Analistas de dados / BI** — para explorar tendências do setor aéreo sem precisar processar o dataset bruto.
- **Áreas de operações e planejamento** — para embasar decisões sobre rotas, horários e alocação de recursos.
- **Passageiros e público em geral** (uso exploratório) — para entender quais companhias, aeroportos e rotas são historicamente mais pontuais.


---

## Quais decisões podem ser apoiadas?

- Priorização de rotas ou aeroportos que exigem ações para reduzir atrasos.
- Avaliação comparativa de companhias aéreas quanto à pontualidade e confiabilidade.
- Investigação dos principais motivos de atraso, que podem ser o clima, aeronave, segurançae tráfego aéreo, para direcionar investimentos ou mudanças operacionais.
- Escolha de rotas ou companhias por parte de quem está planejando uma viagem, com base em dados históricos de pontualidade.

---

## Quais perguntas os dados podem responder?

- Qual companhia aérea possui o maior atraso médio?
- Qual companhia aérea possui a maior taxa de cancelamento?
- Qual aeroporto apresenta mais atrasos ou cancelamentos?
- Qual rota tem o maior volume de voos ou o maior atraso médio?
- Como os atrasos evoluem ao longo do ano (por mês, por dia da semana)?
- Qual é o principal motivo dos atrasos (clima, companhia, aeronave, segurança, tráfego aéreo)?
- Qual companhia ou aeroporto é historicamente mais pontual?

---
