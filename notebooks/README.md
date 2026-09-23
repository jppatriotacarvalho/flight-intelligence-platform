# 📓 Notebooks — Pipeline PySpark

Pipeline de dados da Flight Intelligence Platform, em arquitetura medalhão
(Bronze → Silver → Gold). Roda no **Databricks**, gravando tabelas em
**Delta Lake**.

Esta é a única parte do projeto que **não** sobe via Docker: o
`docker compose up` levanta MySQL, backend e frontend a partir das tabelas Gold
já exportadas (`database/flight_intelligence_dump.sql`). Rodar estes notebooks
só é necessário para reproduzir o pipeline a partir do CSV bruto.

---

## Ordem de execução

| # | Notebook | Lê | Grava |
|---|---|---|---|
| 1 | `02_bronze/bronze.ipynb` | CSV bruto | `bronze.flights_raw` |
| 2 | `03_silver/silver.ipynb` | `bronze.flights_raw` | `silver.flights_clean`, `silver.dim_airports` |
| 3 | `04_gold/gold.ipynb` | `silver.flights_clean`, `silver.dim_airports` | as 5 tabelas `gold.*` |

Cada notebook é independente: lê a tabela gravada pelo anterior e não
compartilha variáveis com ele. Precisam rodar **nesta ordem**, mas não precisam
rodar na mesma sessão.

> **Não existe notebook de ingestão.** Ler o CSV e gravar a Bronze são o mesmo
> passo, feito na primeira célula de código do notebook Bronze.

---

## Dataset

|  |  |
|---|---|
| **Nome** | Flight Delay Dataset — 2024 |
| **Fonte** | Kaggle |
| **Fonte original** | BTS TranStats — On-Time Performance Database |
| **Licença** | CC0 — Creative Commons Zero |
| **Volume** | 7.079.081 registros · 35 colunas · voos domésticos dos EUA em 2024 |
| **Tamanho** | ~1,28 GB descompactado |

O CSV **não está no repositório** — o `.gitignore` exclui `data/*.csv`.

---

## Como rodar

1. Baixe o dataset no Kaggle e descompacte o `flight_data_2024.csv`.

2. No Databricks, faça upload do CSV para um Volume.

3. Ajuste a variável `caminho_csv_completo`, na primeira célula de código do
   notebook Bronze, para o caminho do **seu** Volume. O valor versionado aponta
   para o workspace original e não vai existir na sua conta:

   ```python
   caminho_csv_completo = "/Volumes/workspace/default/dado_bruto_de_voos/flight_data_2024.csv"
   ```

4. Crie os schemas, se ainda não existirem:

   ```sql
   CREATE SCHEMA IF NOT EXISTS bronze;
   CREATE SCHEMA IF NOT EXISTS silver;
   CREATE SCHEMA IF NOT EXISTS gold;
   ```

5. Rode os três notebooks na ordem da tabela acima.

---

## Ambiente de referência

Executado no **Databricks Free Edition**, Compute **Serverless**.

| Camada | Entrada | Saída | Removidos | Tempo |
|---|---:|---:|---:|---:|
| 🥉 Bronze | CSV completo | 7.079.081 | — (ingestão bruta) | 15,9s |
| 🥈 Silver | 7.079.081 | 7.079.081 | 0 inválidos / 0 duplicatas | 21,5s |
| 🥇 Gold | 7.079.081 | 5 tabelas | — (agregação) | 20,7s |

**Pipeline completo: ~58s.**

---

## Documentação

A documentação técnica completa do projeto está em
[`docs/documentacao_completa.md`](../docs/documentacao_completa.md), e o
relatório desta execução em
[Execução com o Dataset Completo](../docs/documentacao_completa.md#7-execução-com-o-dataset-completo).

As seções que governam diretamente estes notebooks:

| Seção | Cobre |
|---|---|
| Arquitetura Geral | papel de cada camada — o que pode e o que não pode em cada uma |
| Dicionário de Dados | as 35 colunas do dataset (origem do schema explícito da Bronze) |
| Análise Exploratória e Qualidade | os achados que originaram as regras da Silver |
| Regras de Transformação (Silver) | as 11 regras, com problema, evidência, decisão e validação |
| KPIs e Regras de Negócio | os 9 KPIs implementados nas tabelas Gold |
| Perguntas de Negócio | as 16 perguntas que a camada Gold precisa responder |
