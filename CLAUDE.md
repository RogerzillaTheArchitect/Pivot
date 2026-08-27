# Pivots — Guia de Contexto para Claude

## Stack
- **Zero build step.** `index.html` (só HTML + estilos) + `js/NN-dominio.js` + `styles/**/*.css` + `api/*.js` (Vercel serverless).
- **Backend:** Supabase (Auth/Postgres/RLS). Nenhum `package.json` no root.
- **Deploy:** Vercel a partir do GitHub `RogerzillaTheArchitect/Pivot`, domínio `pivots.app`.
- **Libs externas** carregadas via `<script>` injetado sob demanda (padrão: `carregarLeaflet()`). Nunca via npm.
- **O nome do produto é `Pivots`, com "s".** Nunca "Pivot" em texto visível (title, manifest, aria-label, i18n, PDF, e-mails). Os identificadores internos (`pivot-logo-*`, `pivotSignIn`, chave `pivot-metas`) mantêm-se em minúsculas — não se renomeiam, e mudar `pivot-metas` apagaria dados do utilizador. O repo GitHub chama-se `Pivot`; esse fica.

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
- `pivots.app` só atualiza quando algo mergeia em `main`. Fazer push da branch não muda nada no ar.
- **Nunca reutilizar nome de branch que já teve PR.**

---

## Arquitetura do JS — um ficheiro por domínio

O `<script>` único de 16 310 linhas foi dividido. **Para um ajuste pontual, abre só o módulo do domínio** — nunca o `index.html` inteiro.

`index.html` tem ~1 800 linhas e contém apenas markup, o `<style>` base e as tags `<script src>`.

| ficheiro | linhas | domínio |
|---|---|---|
| `js/01-auth-supabase.js` | 109 | cliente Supabase, login, `carregarWorkspace` |
| `js/02-portal-cliente.js` | 609 | portal público por token, colaborador externo, timeline |
| `js/03-i18n-strings.js` | 1770 | objeto `STRINGS` (pt/en/es) e helpers de mês |
| `js/04-nav-dashboard.js` | 902 | `t()`, `tp()`, `go()`, metas, cards da dashboard |
| `js/05-tarefas-sessoes.js` | 570 | task stack, pessoas associadas, work sessions |
| `js/06-agenda.js` | 948 | agenda fan carousel (IIFE que exporta `window.agd*`) |
| `js/07-criar-router.js` | 209 | custos, `openJob`, router de painéis de criação |
| `js/08-wizard-trabalho.js` | 1441 | wizard, parcelas, serviços, endereço, painel de biblioteca |
| `js/09-dados-metricas.js` | 1026 | `fmtMoney`, avatares, motor de dados, estatísticas, destaques |
| `js/10-receitas-despesas.js` | 1160 | receitas, despesas, registo manual, `escapeHtml` |
| `js/11-builder-contratos.js` | 1652 | importação de ficheiros, builder, campos dinâmicos |
| `js/12-emails.js` | 796 | link de contrato, sistema visual e templates de e-mail |
| `js/13-colaboracoes.js` | 610 | colaboradores externos, acessos, reenvios |
| `js/14-overlay-i18n.js` | 422 | notificações, overlay manager, `abrirMenuDrawer` |
| `js/15-trabalhos-assinatura.js` | 705 | canvas de assinatura, validação, aplicação ao contrato |
| `js/16-biblioteca.js` | 1065 | biblioteca unificada de modelos |
| `js/17-persistencia-planos.js` | 370 | `StorageAdapter` (`save`/`load`/`remove`), limites por plano |
| `js/18-contatos.js` | 593 | diretório de contatos, `showToast` |
| `js/19-perfil-definicoes.js` | 684 | `openInfo`/`closeInfo`, perfil, plano, calendário, termos |
| `js/20-detalhe-filtros.js` | 566 | detalhe, filtros de trabalhos, pesquisa |
| `js/99-boot.js` | 192 | **todo** o código que executa no load |

### Regras destes módulos
- São **scripts clássicos**, sem `defer`/`async`, sem `import`/`export`. Executam por ordem de documento e partilham o **mesmo escopo global** — exatamente como o script único anterior. Uma função definida no 04 é chamada do 18 sem cerimónia.
- `let`/`const` no topo de um módulo vivem no **escopo léxico global**, não em `window`. Por isso `StorageAdapter` e `LegalLibrary` existem como identificadores mas `window.StorageAdapter` é `undefined` — isto é esperado, não é bug.
- **Nada que execute no load vai para um módulo de domínio.** Tudo isso pertence ao `99-boot.js`, que corre por último para garantir que qualquer função ou constante já está definida quando é chamada. Ao acrescentar um `addEventListener` de arranque ou uma chamada de inicialização, é lá que vai.
- Ao criar um módulo novo, acrescentar a tag `<script src>` no `index.html` **na posição certa da ordem** e antes do `99-boot.js`.
- Validar sempre com `node --check js/<ficheiro>.js` depois de editar.

---

## Design System

### Tokens — `styles/tokens.css`
Fonte única para cor, tipografia, espaçamento, movimento e elevação.
- Escala tipográfica: `--text-2xs` (10px) → `--text-display` (46px)
- Escala de espaçamento: `--sp-1`..`--sp-10`
- Raio único do sistema: `--r` (14px). Exceções redondas: `--r-pill` para dots, toggles e o puxador do sheet.

### Movimento — 5 durações, 5 curvas. Não inventar outras.
```
--dur-1 120ms  micro-feedback (hover, active, cor)
--dur-2 180ms  elementos pequenos (chips, ícones)
--dur-3 260ms  padrão (fades, opacidade, cards)
--dur-4 340ms  superfícies a entrar (sheets, drawers)
--dur-5 480ms  percursos longos (ecrã inteiro)

--ease-out     entra e assenta  (padrão)
--ease-in      sai de cena
--ease-inout   move-se entre dois estados
--ease-glide   percurso longo, travagem suave
--ease-spring  pop (check, badge, confirmação)
```
**Nunca escrever duração ou curva literal** numa `transition`/`animation`. As únicas literais legítimas são set pieces acima de 600ms (splash, spinners, deriva do fundo).

### Sobreposições — `styles/overlays.css`
Todo o modal se compõe de **scrim + superfície**, com três arquétipos: `.ov-sheet` (sobe do fundo), `.ov-dialog` (centrado), `.ov-drawer` (lateral). O par histórico `.overlay`/`.sheet` vive aqui.
- Escurecimento: `--scrim` + `--scrim-blur`. Nunca um `rgba` próprio.
- Material: `--sheet-bg` (vidro escuro com brilho no topo), `--sheet-border`, `--sheet-shadow` / `--sheet-shadow-float`, `--sheet-r`.
- Camadas: `--z-scrim` e `--z-sheet`. Nunca um z-index literal.
- Há suporte a `prefers-reduced-motion` — o estado final não muda, só desaparece o percurso.

### Gradientes e reflexos
Elemento colorido nunca leva cor chapada.
- `--grad-brand|late|pend|done|progress|urgent|extras|bib` — todos a **145deg**, para partilharem a mesma fonte de luz.
- `--sheen` (brilho largo), `--gloss` (reflexo curto, botões), `--sheen-soft`, `--sheen-edge` (fio de luz de 1px, usar em `box-shadow`).

### Superfícies de vidro
4 níveis e só 4: `--surface-card`, `--surface-row`, `--surface-header`, `--surface-chrome`, `--surface-panel`. Componente glass-dark novo entra no seletor combinado no fim de `tokens.css`, não redeclara tokens no seu domínio.

### Utilitários — `styles/utilities.css`
~85 classes `u-*`. Verificar se já existe antes de escrever `style=` inline.
Para ocultar: `class="u-hidden"`. Para alternar via JS: `el.classList.toggle('u-hidden')`.

---

## Mapa de CSS por domínio

### Design System / Tokens
- `styles/tokens.css` — fonte única de verdade para cores, tipografia, espaçamento
- Escala tipográfica: `--text-2xs` (10px) → `--text-display` (46px), 19 valores
- Dark-surface: seletor combinado no final de `tokens.css` (`.card, .finance-ops-card, .ms-card-sq, .job, .sec, .pp-card, .map-card, .collapse, .plist`)
- `styles/utilities.css` — ~85 classes utilitárias `u-*` (layout, espaçamento, tipografia, ícones)
  - Não duplicar: se algo parece u-*, verificar se já existe antes de criar inline

### Shell / Navegação
- `styles/domains/sidebar.css`, `styles/domains/shell.css`
- HTML: procurar em `index.html` por (sidebar desktop + topbar mobile)
- Mobile nav:
- Função de navegação: `go(v)`
- Views disponíveis: `['hoje','trabalhos','historico','detalhe','builder','bibliotecas','perfil','relatorios','pesquisa','equipa','contatos','contato-detalhe','importar-arquivo','revisao-importacao']`

### Dashboard (Hoje)
- `styles/domains/dashboard.css`, `styles/domains/dashboard-widgets.css`
- HTML: procurar em `index.html` por (`id="v-hoje"`)
- Anéis financeiros: funções `renderRingsDashboard` (~4415), `pintarFita`, `pintarDespesasGradiente`, `anelArcoPath`
- Radar/Tarefas: `renderTasksList` (~4858), `renderRadarDashboard` (~4947)
- Metas/limites: `abrirDefinirMetaReceita`, `guardarMetaReceita`, `abrirDefinirLimiteGastos` (~4224)

### Trabalhos (Jobs)
- `styles/domains/trabalhos.css`
- HTML: procurar em `index.html` por (`id="v-trabalhos"`, `id="v-historico"`, `id="v-detalhe"`)
- Dados: `loadJobsData()` — carrega todos os jobs do Supabase
- Histórico: `renderHistorico()`
- Sheet de trabalho: `data-panel="trabalho"`

### Contratos / Builder
- `styles/domains/contratos.css`
- HTML: `index.html** (`id="v-builder"`)
- Sheets: `data-panel="contrato"`, `data-panel="contrato-usar"`, `data-panel="modelo-lista"`
- Renderização: `renderBuilder()`, `renderBuilderCampos()`
- Nova cláusula: `abrirCriarNovaClausula()`

### Biblioteca (Modelos de contrato)
- `styles/domains/biblioteca.css`
- HTML: procurar em `index.html` por (`id="v-bibliotecas"`)
- Render: `renderBiblioteca()`, `renderBibliotecaPanel()`
- Importar arquivo: (`id="v-importar-arquivo"`, `id="v-revisao-importacao"`)

### Relatórios
- `styles/domains/relatorios.css`
- HTML: procurar em `index.html` por (`id="v-relatorios"`)
- Render: `renderRelatorios()`
- Anéis de relatórios: `renderResumoFinanceiroRelatorios()` (~4448), `pintarMetricaOp()` (~4490)

### Perfil / Organização
- `styles/domains/perfil.css`
- HTML: procurar em `index.html` por (`id="v-perfil"`), (`id="v-equipa"`)
- Equipa: `renderEquipaView()`

### Contatos / Colaborações
- HTML: procurar em `index.html` por (`id="v-contatos"`, `id="v-contato-detalhe"`, `id="v-colaboracoes"`)
- Render: `renderContatos()`

### Criar (Action Sheet)
- `styles/domains/criar.css`
- HTML: procurar em `index.html` por — todos os `data-panel="*"` sheets de criação
- Sheets: `home`, `trabalho`, `contrato`, `cliente`, `tarefa`, `receita`, `despesa`, `importar`

### Portal do Cliente (público)
- `styles/domains/portal-cliente.css`
- HTML: procurar em `index.html` por (`#landing-page` não — esta é a vista do cliente logado via token)
- Funções públicas: `iniciarPortalPublicoSeAplicavel()`, `renderPortalPublicoPrincipal()`
- Colaborador externo: `iniciarColabPublicoSeAplicavel()`

### Landing Page (marketing, unauthenticated)
- `styles/domains/landing.css`
- HTML: procurar em `index.html` por (antes do `<script>`)
- Slider: `renderSlide()`, `rotateCardStack()`
- Assets: `assets/landing-hero-*.png`, `assets/showcase-phone-*.png.jpg`

### Autenticação
- `styles/domains/auth.css`
- Funções: `pivotSignIn()`, `pivotSignInGoogle()`, `pivotSignOut()`
- Workspace: `carregarWorkspace(session)` — ponto de entrada após login

### Internacionalização (i18n)
- Strings: objeto `STRINGS` (pt/en/es para cada chave)
- Funções: `t(key)`, `tp(key)`, `aplicarTraducaoCompleta()`
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
- Não ler `index.html` inteiro nem um módulo inteiro sem precisar. Abrir só `js/NN-dominio.js` do domínio em causa.
- Não escrever duração nem curva literal em `transition`/`animation` — usar `--dur-*` e `--ease-*`.
- Não escrever z-index nem escurecimento próprios num modal — usar `--z-scrim`/`--z-sheet` e `--scrim`.
- Não pôr código de arranque num módulo de domínio — vai para `js/99-boot.js`.
- Não escrever "Pivot" sem "s" em texto visível.
- Não criar ficheiros auxiliares (sem package.json, sem build step, sem bundler).
- Não push direto em `main`.
- Não reportar verificação local como confirmação (app requer Supabase Auth).
- Não copiar dark-surface tokens em ficheiros individuais — estão centralizados em `tokens.css`.
- Não hardcode font-sizes — usar `var(--text-*)`.
- Não hardcode cores inline — usar tokens de `tokens.css`.
- Não usar `style=` inline para padrões que já têm classe `u-*` em `utilities.css`.
- Para ocultar elementos use `class="u-hidden"`. Para mostrar/esconder via JS use `el.classList.toggle('u-hidden')` ou `el.style.display`.
