# Pivots Insights

App de Business Intelligence separado do Pivot principal — visualização de estatísticas agregadas e anônimas do mercado de prestação de serviços.

## Estado atual (esqueleto navegável)

- Layout completo: sidebar, filter bar (busca/período/região/categoria), tema dark premium (`#0B0B0B`, cards de vidro sutis).
- **Dashboard** e **Mercado**: 100% ligados a dados reais (nenhum dado fictício), via a Edge Function `analytics` do projeto Supabase do Pivot.
- **Contratos**, **Financeiro** (parcial), **Regiões**, **Tendências**, **Rankings**: navegação e layout finais prontos; onde ainda não existe o dado real correspondente no backend do Pivot, mostra o estado "dados insuficientes/estrutura pronta" em vez de inventar números.
- `/login`: layout de entrada provisório, sem autenticação real ainda.

## Backend (já aplicado ao projeto Supabase `erqdsaczclnqbyxjahgs`, o mesmo do Pivot)

- Tabela `analytics_events` já existia e já é alimentada pelo `index.html` do Pivot (evento best-effort, nunca lido de volta pelo próprio app — só tem policy de INSERT).
- Migração `pivots_insights_analytics_aggregates`: materialized views agregadas (`analytics_mv_dashboard`, `analytics_mv_segment`, `analytics_mv_region`, `analytics_mv_trend_daily`), todas com limiar de anonimato (≥3 workspaces distintos por grupo) e sem policy de SELECT para `anon`/`authenticated` — só a service role as lê.
- Edge Function `analytics` (`supabase/functions/analytics` no projeto Supabase): único ponto de leitura, refresca as views a cada 15 min (nunca calcula em tempo real), devolve `{ resource, insufficient, data }`.

### Lacunas de dados conhecidas (não fabricadas de propósito)

- **Profissão**: o Pivot não guarda a profissão do prestador como campo estruturado — só `segment` (categoria do trabalho, ex.: Fotografia, Design, Consultoria). Por isso não existe um filtro/dimensão "Profissão" separado nesta versão; usar `segment` como "Categoria".
- **Geolocalização**: as colunas `city/state/country/lat/lon` existem no evento, mas quase nenhum job real as preenche ainda — por isso o mapa mundial (heatmap com drill-down) não foi implementado; seria puro placeholder sem dado real por trás.
- **Cláusulas usadas / serviço específico dentro da categoria**: não há evento capturando isso hoje.
- Com volume real ainda baixo (poucos workspaces ativos), a maioria dos agregados fica abaixo do limiar de anonimato — por isso muitas telas mostram "dados insuficientes", o que é esperado e vai se resolver sozinho conforme o uso real do Pivot cresce.

## Rodar localmente

```bash
cd pivots-insights
cp .env.example .env.local
npm install
npm run dev
```

## Próximos passos sugeridos

1. Mover para repositório próprio (`pivots-insights`) quando o usuário tiver acesso configurado no GitHub — por ora vive dentro do monorepo do Pivot por restrição de escopo desta sessão.
2. Autenticação real para o subdomínio (`insights.pivots.app` / `admin.pivots.app`).
3. Mapa mundial com drill-down, export (CSV/XLSX/JSON/PDF) e comparação lado a lado — dependem de mais volume de dados reais e/ou novos eventos de captura no Pivot.
