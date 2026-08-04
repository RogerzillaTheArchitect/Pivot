# Pivot — Guia de Contexto para Claude

## Stack
- **Zero build step.** Só `index.html` + `styles/domains/*.css` + `api/*.js` (Vercel serverless).
- **Backend:** Supabase (Auth/Postgres/RLS). Nenhum `package.json` no root.
- **Deploy:** Vercel a partir do GitHub `RogerzillaTheArchitect/Pivot`, domínio `pivots.app`.
- **Libs externas** carregadas via `<script>` injetado sob demanda (padrão: `carregarLeaflet()`). Nunca via npm.

## Regra de branch
```
main  ← produção. Só recebe PRs.
  └── feat/nome   uma funcionalidade
  └── fix/nome    uma correção
  └── refactor/nome  uma refatoração
```
- Branch sempre do `main` mais recente.
- Uma branch = uma responsabilidade. Merge → PR → deletar.
- **Nunca push direto em `main`.**
- `pivots.app` só atualiza quando algo mergeia em `main`.
- Verificação visual é impossível localmente (Supabase Auth obrigatório). Nunca reportar preview local como confirmação.

---

## Mapa de módulos — o que ler para cada tarefa

Regra geral: leia **só** o CSS do domínio + grep pelo `id` ou função listada abaixo.  
`index.html` tem **17 099 linhas** — nunca leia inteiro.

### Design System / Tokens
- `styles/tokens.css` — fonte única de verdade para cores, tipografia, espaçamento
- Escala tipográfica: `--text-2xs` (10px) → `--text-display` (46px), 19 valores
- Dark-surface: seletor combinado no final de `tokens.css` (`.card, .finance-ops-card, .ms-card-sq, .job, .sec, .pp-card, .map-card, .collapse, .plist`)
- `styles/utilities.css` — ~85 classes utilitárias `u-*` (layout, espaçamento, tipografia, ícones)
  - Não duplicar: se algo parece u-*, verificar se já existe antes de criar inline

### Shell / Navegação
- `styles/domains/sidebar.css`, `styles/domains/shell.css`
- HTML: `index.html` linhas **412–473** (sidebar desktop + topbar mobile)
- Mobile nav: linhas **1092–1112**
- Função de navegação: `go(v)` linha **4163**
- Views disponíveis: `['hoje','trabalhos','historico','detalhe','builder','bibliotecas','perfil','relatorios','pesquisa','equipa','contatos','contato-detalhe','importar-arquivo','revisao-importacao']`

### Dashboard (Hoje)
- `styles/domains/dashboard.css`, `styles/domains/dashboard-widgets.css`
- HTML: `index.html` linhas **474–598** (`id="v-hoje"`)
- Anéis financeiros: funções `renderRingsDashboard` (~4415), `pintarFita`, `pintarDespesasGradiente`, `anelArcoPath`
- Radar/Tarefas: `renderTasksList` (~4858), `renderRadarDashboard` (~4947)
- Metas/limites: `abrirDefinirMetaReceita`, `guardarMetaReceita`, `abrirDefinirLimiteGastos` (~4224)

### Trabalhos (Jobs)
- `styles/domains/trabalhos.css`
- HTML: `index.html` linhas **599–671** (`id="v-trabalhos"`, `id="v-historico"`, `id="v-detalhe"`)
- Dados: `loadJobsData()` linha **13414** — carrega todos os jobs do Supabase
- Histórico: `renderHistorico()` linha **13239**
- Sheet de trabalho: `data-panel="trabalho"` linhas **1141–1335**

### Contratos / Builder
- `styles/domains/contratos.css`
- HTML: `index.html** linhas **672–723** (`id="v-builder"`)
- Sheets: `data-panel="contrato"` (1336), `data-panel="contrato-usar"` (1345), `data-panel="modelo-lista"` (1362)
- Renderização: `renderBuilder()` linha **10139**, `renderBuilderCampos()` linha **10615**
- Nova cláusula: `abrirCriarNovaClausula()` linha **10845**

### Biblioteca (Modelos de contrato)
- `styles/domains/biblioteca.css`
- HTML: `index.html` linhas **724–757** (`id="v-bibliotecas"`)
- Render: `renderBiblioteca()` linha **14391**, `renderBibliotecaPanel()` linha **5587**
- Importar arquivo: linhas **758–793** (`id="v-importar-arquivo"`, `id="v-revisao-importacao"`)

### Relatórios
- `styles/domains/relatorios.css`
- HTML: `index.html` linhas **862–1054** (`id="v-relatorios"`)
- Render: `renderRelatorios()` linha **7669**
- Anéis de relatórios: `renderResumoFinanceiroRelatorios()` (~4448), `pintarMetricaOp()` (~4490)

### Perfil / Organização
- `styles/domains/perfil.css`
- HTML: `index.html` linhas **828–861** (`id="v-perfil"`), linhas **1055–1076** (`id="v-equipa"`)
- Equipa: `renderEquipaView()` linha **5806**

### Contatos / Colaborações
- HTML: linhas **794–827** (`id="v-contatos"`, `id="v-contato-detalhe"`, `id="v-colaboracoes"`)
- Render: `renderContatos()` linha **15033**

### Criar (Action Sheet)
- `styles/domains/criar.css`
- HTML: linhas **1113–1520** — todos os `data-panel="*"` sheets de criação
- Sheets: `home`, `trabalho`, `contrato`, `cliente`, `tarefa`, `receita`, `despesa`, `importar`

### Portal do Cliente (público)
- `styles/domains/portal-cliente.css`
- HTML: linhas **1521–1557** (`#landing-page` não — esta é a vista do cliente logado via token)
- Funções públicas: `iniciarPortalPublicoSeAplicavel()` (1840), `renderPortalPublicoPrincipal()` (1927)
- Colaborador externo: `iniciarColabPublicoSeAplicavel()` (1743)

### Landing Page (marketing, unauthenticated)
- `styles/domains/landing.css`
- HTML: linhas **63–184** (antes do `<script>`)
- Slider: `renderSlide()` (251), `rotateCardStack()` (277)
- Assets: `assets/landing-hero-*.png`, `assets/showcase-phone-*.png.jpg`

### Autenticação
- `styles/domains/auth.css`
- Funções: `pivotSignIn()` (1570), `pivotSignInGoogle()` (1578), `pivotSignOut()` (1589)
- Workspace: `carregarWorkspace(session)` (1594) — ponto de entrada após login

### Internacionalização (i18n)
- Strings: objeto `STRINGS` linhas **2343–4090** (pt/en/es para cada chave)
- Funções: `t(key)` (4116), `tp(key)` (4124), `aplicarTraducaoCompleta()` (4131)
- Para adicionar texto: só editar o objeto `STRINGS`, nunca hardcode em HTML

### API / Backend (Vercel serverless)
- `api/auth/` — signup, resend
- `api/billing/` — checkout, webhook Stripe, redeem
- `api/emails/send-event.js` — envio de emails transacionais (usa Resend)
- `api/_lib/emailTemplates.js` — templates de email (V2 atual)
- `api/team/` — convite e lookup de membros
- `api/calendar/feed.js` — feed iCal
- `api/cron/send-reminders.js` — lembretes automáticos

### Responsive / Mobile
- `styles/domains/responsive.css` — breakpoints e ajustes mobile-only

---

## O que NÃO fazer
- Não ler `index.html` inteiro. Use grep + linha específica.
- Não criar ficheiros auxiliares (sem package.json, sem build step, sem bundler).
- Não push direto em `main`.
- Não reportar verificação local como confirmação (app requer Supabase Auth).
- Não copiar dark-surface tokens em ficheiros individuais — estão centralizados em `tokens.css`.
- Não hardcode font-sizes — usar `var(--text-*)`.
- Não hardcode cores inline — usar tokens de `tokens.css`.
- Não usar `style=` inline para padrões que já têm classe `u-*` em `utilities.css`.
- Para ocultar elementos use `class="u-hidden"`. Para mostrar/esconder via JS use `el.classList.toggle('u-hidden')` ou `el.style.display`.
