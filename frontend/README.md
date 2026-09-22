# 💻 Frontend — Flight Intelligence Platform

Aplicação React + TypeScript (Vite) que consome a API FastAPI e entrega o
dashboard, as páginas de dados e o chat com o agente de IA.

## Rodando

```bash
npm install
npm run dev     # http://localhost:5173
```

O endereço da API vem de `VITE_API_URL` (padrão: `http://localhost:8000`).
Para rodar backend e frontend juntos, use `npm run dev` na **raiz** do
repositório.

```bash
npm run build   # build de produção em dist/
npm run lint    # Oxlint
```

## Estrutura

```text
src/
├── components/     # blocos reutilizáveis entre as páginas
│   ├── KpiCard         número grande + rótulo (linha de KPIs do dashboard)
│   ├── SectionHeader   título de seção com subtítulo
│   ├── FilterBar       campo de busca e filtros das páginas de dados
│   ├── DataTable       tabela ordenável (sortValue, defaultSort, rowLimit)
│   ├── BarList         ranking horizontal (reference, emptyMessage, tooltip)
│   ├── TrendLine       série temporal mensal, com pico e vale marcados
│   ├── CauseDonut      distribuição dos motivos de atraso
│   ├── AirlineScatter  atraso × cancelamento, bolha = volume
│   ├── CodeCell        código em destaque + nome abaixo (aeroporto ou companhia)
│   ├── ChartCard       moldura de gráfico com fonte/métrica/unidade
│   ├── PageState       carregamento (esqueletos) e erro, padronizados
│   └── Layout          navegação e casca da aplicação
├── lib/
│   ├── format.ts       números, percentuais, minutos e meses em pt-BR
│   └── chart.ts        paleta, eixos e tooltip dos gráficos
├── pages/
│   ├── Dashboard, Airlines, Airports, RoutesPage, Delays, Chat
│   └── chartData.ts    monta as séries dos gráficos fora do JSX
├── theme.css           tokens de cor, espaçamento e tipografia
└── types.ts            contratos de resposta da API
```

## Convenções

- **Formatação de número mora em `lib/format.ts`**, não na página. Se um
  valor aparece diferente em duas telas, é bug de um lugar só.
- **Toda página usa `PageState`** para carregamento e erro — nada de
  "Carregando..." escrito à mão.
- **Cor de gráfico vem de `lib/chart.ts`**, nunca hexadecimal solto no JSX.
- **Código aparece com o nome abaixo** (`CodeCell`), nunca só o código — vale
  para a sigla do aeroporto (Decisão 03) e para o código da companhia
  (Decisão 04), em `docs/decision_log.md`. Sem nome, mostra só o código: uma
  coluna de travessões não informa nada.
- **Limiar de volume mora em `lib/chart.ts`**, nunca solto no JSX —
  `POOL_AEROPORTOS_MOVIMENTADOS`, `MIN_FLIGHTS_FOR_DELAY_RANKING`,
  `MIN_FLIGHTS_AIRPORT_TABLE`, `MIN_FLIGHTS_ROUTE_TABLE`. Um ranking por taxa
  sem piso coloca um aeroporto de 37 voos no topo (Decisão 05), e o piso
  usado sempre aparece na tela — na legenda do gráfico ou num checkbox.
- **Ordenar é responsabilidade da `DataTable`.** A página entrega **todos** os
  registros filtrados e declara `sortValue` (valor cru) por coluna; a tabela
  ordena e só então corta em `rowLimit`. Cortar antes faria "ordenar por
  cancelamento" reordenar apenas as primeiras linhas.
