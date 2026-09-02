# Agenda Fan Carrossel 01 — versão pré-alterações (2026-08-27)

Cópia integral do carrossel 3D da agenda (topo do Dashboard, "Hoje"), guardada
**antes** de qualquer alteração pedida a seguir, para nunca perder o layout
original caso as mudanças não resultem.

Commit em que este backup foi tirado: `f16aaf5` (branch `fix/qa-audit-batch-42271`).

## O que é

O carrossel de dias/eventos que aparece no topo da Dashboard: uma fila de 3
dias navegáveis (`agd-days`) por cima de um carrossel 3D em leque
(`agd-fan`) com os cartões de evento/tarefa do dia, mais uma régua de
horário arrastável (`agd-ruler`) por baixo. É um carrossel genuíno — cartão
central em foco, cartões adjacentes visíveis parcialmente nas laterais com
perspetiva 3D (`perspective`, `translateZ`), arrastável.

Auditado em 2026-08-27 (auditoria visual de design): o "peek card" lateral
foi investigado e confirmado como **efeito propositado** (edge-fade via
gradiente + geometria 3D real), não bug — por isso ficou de fora dessa
ronda de correções. Este backup existe porque agora vai mesmo ser alterado.

## Ficheiros deste backup

| Ficheiro | Conteúdo | Original em |
|---|---|---|
| `agenda-fan.js` | Todo o `js/06-agenda.js` (948 linhas) — dedicado inteiramente a este carrossel | `js/06-agenda.js` |
| `agenda-fan.css` | Todo o `styles/domains/agenda.css` (732 linhas) — idem | `styles/domains/agenda.css` |
| `agenda-fan.html` | Bloco HTML do carrossel (`#agenda-section`) | `index.html`, dentro de `#v-hoje`, antes do card FINANCEIRO |

Os dois ficheiros de origem (`js/06-agenda.js`, `styles/domains/agenda.css`)
são módulos já isolados desde a modularização do projeto — não têm nada
misturado de outras funcionalidades, por isso este backup é a app inteira
tal como estava, não um recorte.

## Como restaurar

### 1. JS — `js/06-agenda.js`
Substituir o ficheiro inteiro pelo conteúdo de `agenda-fan.js`.

### 2. CSS — `styles/domains/agenda.css`
Substituir o ficheiro inteiro pelo conteúdo de `agenda-fan.css`.

### 3. HTML — `index.html`
Localizar o bloco (dentro de `#v-hoje`, logo a seguir a `<div class="screen">`):
```html
<!-- ===== AGENDA FAN ===== -->
<div id="agenda-section" class="agenda-section">
  ...
</div>
```
Substituir pelo conteúdo de `agenda-fan.html`.

## Dependências (ficam fora deste backup, não mexer)

Funções/variáveis partilhadas com o resto da app, referenciadas de dentro
de `agenda-fan.js` mas definidas noutros módulos:
- `AGD_MESES`, `gerarItensRadar()` (lista de itens do dia)
- `openJob()`, `abrirDetalheItemSolto()`, `showToast()`, `openInfo()`, `escapeHtml()`
- `saveLembretesData()`, `saveListasData()`, `saveTarefasData()` (persistência)
- `renderRadarDashboard()` (chamado ao concluir/remover um item do carrossel)
- Tokens de `styles/tokens.css` (`--dur-*`, `--ease-*`) e `styles/domains/dashboard.css`
  (`.tasks-header` etc. — vivem fora do módulo da agenda)

Se `js/06-agenda.js` ou `styles/domains/agenda.css` forem reescritos e algo
correr mal, os ficheiros aqui devolvem exatamente este estado.
