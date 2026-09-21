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
│   ├── DataTable       tabela com ordenação e renderização por coluna
│   ├── BarList         ranking horizontal (top N)
│   ├── TrendLine       série temporal mensal
│   ├── CauseDonut      distribuição dos motivos de atraso
│   ├── AirportCell     sigla IATA em destaque + nome do aeroporto abaixo
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
- **Aeroporto aparece com sigla + nome** (`AirportCell`), nunca só a sigla —
  ver Decisão 03 em `docs/decision_log.md`.
