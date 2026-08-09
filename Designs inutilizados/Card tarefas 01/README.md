# Card Tarefas 01 — Carrossel Horizontal

Design anterior dos cards de Tarefas no Dashboard. Substituído pelo sistema de stack vertical em agosto de 2026.

## O que estava implementado

Carrossel horizontal com loop infinito. O card ativo ficava centralizado e os cards adjacentes apareciam à esquerda e à direita com ~50% de largura visível. Arrastar para esquerda/direita navegava entre os cards. Toque simples revelava ações (Editar/Arquivar/Concluir) deslizando o layer superior para cima.

## Arquivos deste backup

| Arquivo | Conteúdo |
|---|---|
| `carousel.css` | Estilos do carrossel (classes `tc-*`) — substituir a seção TASK STACK em `styles/domains/dashboard.css` |
| `carousel.js` | Funções JS do carrossel — substituir a seção TASK STACK em `index.html` |

## Como restaurar

### 1. CSS — `styles/domains/dashboard.css`

Localizar o bloco:
```
/* ===== TASK STACK ===== */
...
/* ===== FIM TASK STACK ===== */
```
Substituir pelo conteúdo de `carousel.css`.

### 2. JS — `index.html`

Localizar o bloco:
```
/* ===== TASK STACK ===== */
...
/* ===== FIM TASK STACK ===== */
```
Substituir pelo conteúdo de `carousel.js`.

### 3. Dentro de `renderTasksList()` em `index.html`

Localizar:
```js
wrap.innerHTML='<div class="tsk-stack" id="tsk-stack">'+itens.map(construirStackCard).join('')+'</div>';
ativarStackTarefas();
```
Substituir por:
```js
const svgPrev='<svg viewBox="0 0 8 14" width="8" height="14" fill="none"><path d="M6.5 1L1 7l5.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgNext='<svg viewBox="0 0 8 14" width="8" height="14" fill="none"><path d="M1.5 1L7 7l-5.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
wrap.innerHTML='<div class="tc-viewport" id="tc-viewport"><div class="tc-track" id="tc-track">'+itens.map(construirCarouselCard).join('')+'</div></div>'+
  '<div class="tc-nav-prev" id="tc-nav-prev">'+svgPrev+'</div>'+
  '<div class="tc-nav-next" id="tc-nav-next">'+svgNext+'</div>';
ativarCarrosselTarefas();
```

## Dependências

Estas funções são compartilhadas e NÃO estão neste backup (permanecem em `index.html`):
- `gerarItensRadar()` — gera a lista de itens do radar
- `_tcArquivados` — Set de itens arquivados da sessão
- `clienteFotoPorNome()`, `avatarHtml()`, `escapeHtml()`, `RTK_ICONS`
- `abrirDetalheItemSolto()`, `openJob()`, `showToast()`, `t()`
- `lembretesData`, `listasData`, `tarefasData`, `jobsData` e funções de save
- `marcarPagoDynamic()`, `renderMonthTicker()`
