# Pivot — Contexto do Projeto

> Este arquivo existe para que **qualquer IA** (Claude, GPT, Gemini, etc.) consiga entender o projeto do zero, sem precisar ler o histórico de conversas anteriores. Leia este arquivo inteiro antes de propor ou fazer qualquer mudança.

Última revisão deste documento: **2026-07-14**. Este arquivo vive na raiz do repositório `pivot-repo` (`RogerzillaTheArchitect/Pivot` no GitHub) — é a pasta mestre do projeto. Um `git pull` garante que tanto este documento quanto o código estão sempre na versão mais atual; não existe cópia paralela em outro lugar do disco.

---

## 1. O que é o Pivot

Pivot é um SaaS para profissionais que trabalham por projeto/contrato (fotógrafos, videomakers, designers, consultores, advogados, agências, etc.) gerirem: contratos digitais com assinatura online, portal do cliente (sem o cliente precisar criar conta), tarefas/trabalhos, financeiro, lembretes automáticos por email, equipa/colaboradores.

- **Site de produção:** https://pivots.app
- **Slogan:** "Contact, contract, compact."
- **Idiomas:** português (pt), inglês (en), espanhol (es) — sistema de tradução próprio embutido no HTML.
- **Planos:** Free, Plus, Pro, Business, Enterprise (ver seção 6).

---

## 2. Arquitetura — visão geral

Este é um app **de arquivo único**: praticamente toda a aplicação (frontend inteiro — HTML, CSS, JavaScript vanilla, sem framework, sem build step, sem bundler) vive em **`index.html`** (~12 mil linhas). Não existe React/Vue/Svelte nem `package.json`. É só abrir o arquivo num servidor estático que funciona.

```
pivot-repo/                     ← pasta mestre do projeto (repositório git)
├── CONTEXTO_PROJETO.md         ← este arquivo
├── index.html                  ← O app inteiro (frontend). ~12.000 linhas.
├── vercel.json                 ← Config da Vercel (só define o cron job)
├── api/                        ← Funções serverless (Vercel Functions / Node.js)
│   ├── auth/
│   │   ├── resend.js            (reenviar email de confirmação)
│   │   └── signup.js            (criar conta)
│   ├── billing/
│   │   ├── create-checkout-session.js  (inicia checkout Stripe)
│   │   ├── redeem.js                    (resgatar código/cupom)
│   │   └── webhook.js                   (recebe eventos da Stripe)
│   ├── cron/
│   │   └── send-reminders.js    (cron diário 8h — lembretes de prazo)
│   ├── emails/
│   │   └── send-event.js        (dispara emails transacionais via Resend)
│   └── team/
│       ├── invite.js            (convidar membro de equipa)
│       └── lookup-user.js       (buscar utilizador por email)
├── email-templates/             ← Templates HTML de email (portal, ação necessária, convite, etc.)
└── email/                       ← Imagens usadas nos emails (ícones, hero images)
```

### Backend / dados
- **Supabase** (Postgres + Auth) — projeto `erqdsaczclnqbyxjahgs` (`https://erqdsaczclnqbyxjahgs.supabase.co`).
  - Cliente inicializado direto no `index.html` (~linha 2600) com a chave pública (`sb_publishable_...`, segura para expor no frontend).
  - **Padrão de persistência incomum:** a maior parte do estado do app (trabalhos, perfil, favoritos, etc.) **não** usa tabelas relacionais dedicadas — é tudo guardado como JSON num único `kv_store` (chave-valor) escopado por `workspace_id`, através dos helpers `savePersisted(chave, getter)` / `loadPersisted(chave, setter)` no `index.html`.
  - Tabelas Postgres que existem de verdade: `workspaces`, `workspace_members`, `kv_store`, `portal_tokens` (tokens de acesso ao portal do cliente, sem precisar de conta).
  - Não há migrations versionadas no repo — mudanças de schema são aplicadas direto no SQL editor do Supabase quando necessário.
- **Stripe** — cobrança dos planos pagos (Plus/Pro/Business). Price IDs estão hardcoded em `api/billing/create-checkout-session.js`.
- **Resend** — envio de emails transacionais.
- **Vercel** — hosting + funções serverless + cron.

### Variáveis de ambiente (configuradas na Vercel, não estão no repo)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY   (secreta — só usada nas funções server-side em api/)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
APP_URL                     (default: https://pivots.app)
CRON_SECRET                 (protege o endpoint do cron)
```

---

## 3. Deploy e fluxo de Git — **leia isto antes de tocar em qualquer branch**

- **Repositório GitHub:** `RogerzillaTheArchitect/Pivot` (público).
- **Projeto Vercel:** `prj_fvVH3rzGigcl39yQRBIQ2urLA8Ip`, team `team_emMLWiUTfoEhKObJQj2PC7je`.
- **`main`** = produção real. Só o que está em `main` aparece em `pivots.app`. A Vercel faz deploy automático a cada push/merge em `main`.
- **`contratos-recorrentes`** = branch de integração/staging onde o trabalho de features recentes converge antes de ir pra `main`. Cada branch de feature nova nasce a partir dela.
- **Toda branch nova de feature** nasce de `contratos-recorrentes` atualizada, nunca de `main` diretamente e nunca commitando direto nela.
- **Não existe `gh` CLI instalado** — PRs são feitos via link de comparação do GitHub, que o usuário clica e aprova manualmente:
  `https://github.com/RogerzillaTheArchitect/Pivot/compare/<base>...<branch>?expand=1`
- Fluxo padrão de qualquer mudança:
  1. `git fetch origin`
  2. `git checkout contratos-recorrentes && git pull origin contratos-recorrentes`
  3. `git checkout -b <nome-descritivo-da-branch>`
  4. Editar, testar localmente (ver seção 8), commitar.
  5. `git push -u origin <branch>`
  6. Dar ao usuário o link de compare `contratos-recorrentes...<branch>` **e também** o link de compare `main...contratos-recorrentes` (mostrando o que está pendente pra produção) — o usuário já confirmou preferência por sempre receber os dois links juntos, sem precisar pedir separadamente.
- **Nunca fazer `git push` direto em `main`** nem em `contratos-recorrentes` sem autorização explícita e nomeada pelo usuário. O classificador de segurança do ambiente bloqueia push direto em branch default de qualquer forma.
- **⚠️ Pasta compartilhada / múltiplas sessões simultâneas:** historicamente, o diretório de trabalho do repo (`C:\Users\brene\Downloads\pivot-repo`) foi usado por várias sessões de IA ao mesmo tempo. **Sempre** rodar `git status` e `git branch --show-current` antes de qualquer `checkout`/`pull`/`reset`. Se houver mudanças não commitadas de outra sessão, **nunca descartar** — usar `git stash push -m "descrição"` e devolver depois pra branch certa.

---

## 4. Como rodar/testar localmente

Não há dev server com hot-reload nem build. É um HTML estático:

```bash
# a partir da pasta que CONTÉM pivot-repo
python -m http.server 5173
# abrir http://localhost:5173/pivot-repo/index.html
```

Como não há backend local, funcionalidades que dependem de rede (login, Supabase, Stripe, envio de email) não funcionam offline — mas toda a **UI, navegação, e lógica client-side pura** (ex.: a Biblioteca de contratos, o builder de contrato, cálculos, filtros) funciona perfeitamente sem backend, porque os dados de demonstração/catálogo estão embutidos no próprio `index.html`.

Para testar mudanças de JS/UI sem precisar clicar manualmente: abrir o app no browser e chamar as funções diretamente no console (ex.: `renderBiblioteca()`, `abrirBuilder(null)`, `catalogoBiblioteca()`) — é o método usado nas últimas sessões pra validar mudanças rápido.

Sempre validar sintaxe do JS antes de considerar uma mudança pronta:
```js
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const big = scripts.sort((a,b)=>b.length-a.length)[0];
try { new Function(big); console.log('SYNTAX OK'); } catch(e) { console.log('SYNTAX ERROR:', e.message); }
"
```

---

## 5. Convenções de código (importante seguir para consistência)

- **Nomes de função/variável em português** na maior parte da lógica de domínio (`abrirBuilder`, `renderBiblioteca`, `salvarNovoBlocoManual`), mas nomes de infraestrutura/genéricos em inglês (`getBuilderJob`, `escapeHtml`, `showToast`). Siga o padrão já presente na região do código que for editar.
- **Sem framework:** manipulação de DOM é toda via `innerHTML` com template strings JS concatenadas (`'<div>...'+var+'...</div>'`). Sempre usar `escapeHtml()` em qualquer valor de usuário/dado dinâmico inserido em HTML, para evitar XSS.
- **i18n:** função `t(chave)` lê de um objeto gigante de traduções (`pt`/`en`/`es`) definido perto da metade do arquivo. Toda string nova visível ao usuário deve virar uma chave de tradução nos 3 idiomas, seguindo o padrão `"secao.nome": { pt:"...", en:"...", es:"..." }`. Elementos HTML estáticos usam `data-t="chave"` (texto) ou `data-t-placeholder="chave"` (placeholder de input) — um scanner global aplica a tradução ao trocar de idioma. `LANG` é a variável global do idioma atual (default `'en'` quando não autenticado).
- **Navegação:** `go(view)` alterna qual `<section class="view" id="v-NOME">` fica visível (classe `.active`). Lista de views válidas está no array `views`. Painéis/modais menores usam `openInfo(titulo, html)` / `closeInfo()` (modal genérico) ou `pushPanel(nome)` / `openSheet()` / `closeSheet()` (bottom sheets empilháveis).
- **Toast de feedback:** `showToast(texto)` para confirmações rápidas.
- **Tema claro/escuro:** variáveis CSS custom properties (`--ink`, `--paper`, `--line`, `--neutral`, etc.) trocam de valor conforme o tema. Há também um background animado em WebGL/Three.js ("vidro canelado") que muda de paleta com o tema.
- **Cards com efeito de vidro (glassmorphism):** receita padrão já estabelecida na classe `.card` (dashboard) e replicada em `.bib-card` (Biblioteca) — sempre reaproveitar essa receita em vez de inventar uma nova, para manter consistência visual:
  ```css
  background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,0) 45%),rgba(122,124,116,.15);
  border:1.5px solid rgba(255,255,255,.20);
  box-shadow:0 12px 28px -10px rgba(15,20,15,.22),inset 0 1px 0 rgba(255,255,255,.12);
  backdrop-filter:blur(11px) saturate(160%); -webkit-backdrop-filter:blur(11px) saturate(160%);
  /* + overrides locais de --ink/--paper/--line pra manter texto legível sobre o vidro */
  ```
- **Ícones:** SVG inline no estilo Lucide (`viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"`), nunca emoji nos elementos de UI "premium" (Biblioteca, selos). Emoji só é aceitável em contextos bem casuais, e mesmo assim tem sido removido em favor de ícones reais nas últimas iterações.
- **Não fabricar dados:** quando um recurso pedido precisar de um dado que não existe de verdade no modelo atual (ex.: histórico de crescimento de uso, avaliação real de advogado), **não inventar heurística falsa** — sinalizar isso ao usuário e perguntar como ele quer definir a métrica real, em vez de simular.

---

## 6. Modelo de dados principal (globals do `index.html`)

| Variável/Função | O que é |
|---|---|
| `jobsData` (objeto, chave = id) | Todos os "trabalhos" (jobs) do workspace atual — cliente, contrato, tarefas, financeiro, histórico. |
| `perfilData` | Dados do utilizador/empresa logada: nome, plano (`plano: 'Free'\|'Plus'\|'Pro'\|'Business'\|'Enterprise'`), branding, idioma, etc. |
| `PLANOS` | Metadados de cada plano (nome/descrição traduzidos). Preços/checkout reais estão em `api/billing/create-checkout-session.js` (`PRICE_IDS`). |
| `currentWorkspaceId` | Workspace ativo (multi-tenant via Supabase). |
| `currentJobId` | Job atualmente aberto na tela de detalhe. |
| `BIBLIOTECA_OFICIAL` | Array de ~39 modelos de contrato prontos (fotografia, vídeo, casamentos, corporativo, etc.) — dados estáticos embutidos, cada um com `id, titulo, tipo, categoria, autor, avaliacao, usos, desc, tags`. Só os de `tipo==='Contrato'` aparecem na Biblioteca principal (ver seção 7). |
| `BIBLIOTECA_BLOCOS` | Mapa `{ idDoModelo: [{key, params}, ...] }` — a composição real de blocos de cada contrato da `BIBLIOTECA_OFICIAL` (ex.: pagamento, entrega, cancelamento, direitos, forçaMaior, confidencialidade, garantias). |
| `blocoTextos` | Templates de texto real (pt/en/es) por `key` de bloco — é daqui que vem o conteúdo jurídico de cada bloco quando renderizado num contrato. |
| `LEGAL_BLOCKS` | Base de ~15 cláusulas jurídicas "avulsas" com metadata rica (`preco_tier`, `industry_tags`, `jurisdiction_notes`, textos completos pt/en/es) — inclui proteção de dados/LGPD, propriedade intelectual, etc. Hoje só acessível de dentro da **Biblioteca de Blocos** (contextual, dentro do editor de contrato), nunca na navegação principal. |
| `CATALOGO_EXPLORAR` | Checklists/cronogramas/briefings prontos — também só acessíveis via Biblioteca de Blocos. |
| `modelosContratoData` | Modelos de contrato que o **próprio utilizador** criou/guardou (distinto da biblioteca oficial). |

---

## 7. A Biblioteca (feature mais retrabalhada recentemente — histórico de decisões)

Esta seção documenta o estado atual e o *porquê* de várias decisões, pra evitar que uma IA nova reverta acidentalmente algo que já foi corrigido de propósito.

### Estrutura atual
- **Biblioteca Principal** (`v-bibliotecas`, função `renderBiblioteca()`) mostra **apenas contratos completos**: `catalogoBiblioteca()` filtra `BIBLIOTECA_OFICIAL` por `tipo==='Contrato'`. Checklists, cronogramas, coleções, "Informações do Cliente" e cláusulas jurídicas soltas **foram removidos de propósito** desta tela — não são "esquecimento", foi pedido explícito do usuário pra Biblioteca não parecer misturada.
- **Busca:** campo livre, cruza título/descrição/tags/categoria/autor.
- **Chips rápidos** (`#bib-origem-row`, uma única linha, inclui o botão "Filtrar" no final da mesma linha): Todos / Oficial Pivot / Comunidade / Jurídicos (= `item.verificado`, nota alta) / Populares (`usos>=150`) / Recomendados (`avaliacao>=4.7`).
- **Filtros avançados** (sheet aberta por `abrirFiltrosBiblioteca()`): Segmento (`profissao`), Contexto (`contexto` — situação de uso: Prestação de Serviços, Corporativo, Eventos, etc. — **não** é sobre fotografia/casamento especificamente, foi generalizado de propósito pra não parecer nicho), Categoria (`categoriaAmigavel` — agrupamento amplo: Audiovisual, Jurídico, Projetos, etc.), Coberturas (`coberturas`, array — o que o contrato cobre: Pagamento, Cancelamento, Confidencialidade, etc., derivado da composição real em `BIBLIOTECA_BLOCOS`).
- **Selos** (badges): sistema de 3 níveis de cor, ícone SVG real (não emoji, não "◇" genérico), clicáveis (abrem pop-up explicativo via `abrirExplicacaoSelo(tipoKey)`):
  - 🥇 **Dourado** = Oficial Pivot (`item.origem==='oficial'`)
  - 🥈 **Prata** = Validação Jurídica (`item.verificado`, i.e. `avaliacao>=4.7`)
  - 🥉 **Bronze** = Comunidade / Popular (`usos>=150`) / Recomendado (`avaliacao>=4.7`) — cada um com ícone próprio mas mesma cor bronze.
  - **"Em Alta"** (tendência de crescimento) foi pedido mas **não foi implementado** — não existe dado real de crescimento ao longo do tempo no modelo atual (só uma contagem estática de `usos`). Não inventar essa métrica; perguntar ao usuário que sinal real ele quer usar antes de implementar.
- **Card:** glassmorphism translúcido (receita da seção 5), altura idêntica entre todos os cards (descrição truncada em 2 linhas via `line-clamp`, rodapé fixado embaixo), sem tag "Contrato" redundante, sem tags visíveis no card (tags só aparecem na página de detalhe). Hierarquia: Título+Descrição → (lateral direita) coração de favorito + coluna de selos-ícone → rodapé "Por Autor • N utilizações • N blocos".
- **Favoritos:** coração nunca é dourado (dourado é exclusivo do selo Oficial Pivot) — usa tom neutro "gelo": `opacity:.5` quando não favoritado, sólido quando favoritado.
- **Página de detalhe** (`abrirDetalheBibliotecaPrincipal`): descrição, autor, selos (com texto completo, não só ícone), métricas, **estrutura protegida** (barras que mostram o tamanho/complexidade de cada bloco sem revelar o texto), **amostra de bloco com blur** (preview borrado + "conteúdo protegido"), tags, botão Importar.

### Biblioteca de Blocos (contextual, dentro do editor)
Não fica na navegação principal — só é alcançável de dentro do editor de contrato (`v-builder`), pelo botão "Adicionar Bloco" (`abrirBibliotecaBlocos()`). Abre um mini-modal com duas opções:
- **Explorar Biblioteca** (`abrirExplorarBibliotecaBlocos()` → `bibBlocosCatalogo()`): lista de busca unificada que mistura (a) contratos completos com composição conhecida (clicar abre um checklist de checkboxes dos blocos desse contrato — `abrirBlocosDoContrato()`/`buildBibBlocosChecklistHtml()` — e "Importar N Blocos" mescla os blocos escolhidos no contrato **atualmente aberto no editor**, sem criar nem substituir nada), e (b) itens avulsos importáveis com um clique só (`importarBlocoAvulso()`): checklists, cronogramas, questionários, coleções, e as cláusulas jurídicas do `LEGAL_BLOCKS` (incluindo LGPD/proteção de dados).
- **Criar Novo Bloco** (`abrirCriarNovoBloco()`): formulário livre (nome + texto) pra adicionar uma cláusula personalizada.

### Bug histórico já corrigido (não reintroduzir)
`getBuilderJob()` — quando o editor está aberto **sem** nenhum trabalho vinculado (`builderContext` nulo, ex.: criar um contrato do zero a partir da Biblioteca) — antes retornava um array novo de blocos a cada chamada, então nenhuma edição sobrevivia. Corrigido guardando o array numa variável de módulo (`builderBlankBlocks`) reutilizada entre chamadas, resetada só quando `abrirBuilder()` é chamado de novo.

Também: `voltarDoBuilder()` — quando `builderContext` é nulo, agora volta pra view de onde o usuário realmente entrou (`builderVoltarView`, capturada em `abrirBuilder()`), não mais para uma tela de detalhe de trabalho fixa e vazia (isso causava uma tela em branco só com o botão "Portal do Cliente" visível).

---

## 8. Como validar uma mudança antes de dizer que está pronta

1. Checar sintaxe JS (comando na seção 4).
2. Subir um servidor estático local e abrir `index.html` no browser.
3. Testar a função/fluxo diretamente no console do browser (chamar a função, inspecionar o resultado, checar `console` por erros).
4. Conferir que não sobrou referência a função/variável removida (`grep` pelo nome antigo).
5. Só then commitar, dar push pra uma branch nova, e entregar os dois links de PR (feature→contratos-recorrentes, contratos-recorrentes→main) ao usuário — nunca mergear sozinho.

---

## 9. O que evitar

- Não fabricar dados/métricas que não existem no modelo real (ver seção 7, "Em Alta").
- Não commitar/push direto em `main` ou `contratos-recorrentes`.
- Não usar emoji em elementos de UI "premium" (Biblioteca, selos) — usar ícone SVG real.
- Não misturar Contratos completos com Checklists/Cronogramas/Coleções/Blocos soltos na Biblioteca Principal — esses ficam exclusivamente na Biblioteca de Blocos contextual.
- Não presumir que o repositório está isolado — pode haver outra sessão de IA trabalhando na mesma pasta ao mesmo tempo. Sempre checar `git status` antes de qualquer operação destrutiva.

---

## 10. Se você (IA) está lendo isto para começar uma tarefa nova

1. Rode `git fetch origin && git status` nesta pasta (`pivot-repo`) antes de assumir que o código local está atualizado — o histórico de commits e o `main` remoto são sempre a fonte de verdade, não a memória desta conversa.
2. Leia este arquivo inteiro antes de tocar no código.
3. Para mudanças na Biblioteca especificamente, leia a seção 7 com atenção — há várias decisões de design já tomadas e revertidas/refinadas em iterações anteriores.
4. Siga o fluxo de branch+PR da seção 3. Nunca faça deploy direto.
