# Legal Library — dados ativos

Este diretório é o que o app (`index.html` → `LegalLibrary`) busca em runtime via `fetch()`.
Hoje está publicado **vazio** de propósito (fase de fundação — ver PROJECT_STATE.md).

## Como publicar o conteúdo oficial (os 61 contratos)

```
node tools/build-legal-library.js "<caminho-para-'Legal Library'>" --publish
```

Isso recompila a partir dos Markdown oficiais e copia o resultado para cá — nenhum
código do app precisa mudar. Rodar sempre que a Biblioteca Jurídica oficial for
atualizada.

Uma prévia do resultado real já está gerada em `dist/` (staging, não é servida
pelo app) — rode o comando acima sem `--publish` para atualizar só o preview.
