/* Pivots — wizard trabalho
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ✨ Trabalho — 3 momentos */
  /* ============================================================
     LEGAL LIBRARY ENGINE — fundação
     Fonte de verdade: Markdown oficial em "Legal Library" (compilado por
     tools/build-legal-library.js). Este objeto é a ÚNICA porta de entrada
     que o resto do app usa para ler o catálogo — nenhum outro código lê
     legal-library/*.json diretamente. Isso é o que permite trocar a
     origem dos dados no futuro (ex.: um endpoint de API) sem tocar em
     nenhum dos pontos do app que consultam a biblioteca.
     Hoje o catálogo publicado (legal-library/index.json) está vazio de
     propósito — ver legal-library/README.md para publicar o conteúdo
     real dos 69 contratos.
     Cada entrada do catálogo tem o formato:
       { id, titulo, categoria, mercado, subcategoria, desc, tags, origem,
         verificado, requiredBlockCount, optionalBlockCount, clauseCount }
     origem é sempre oficial (bibAutorLinha já sabe mostrar Pivots Oficial
     nesse caso). verificado reflete o status real do contrato no
     Markdown, true só quando status é FINAL APPROVED — não é fabricado,
     é o mesmo campo que os arquivos oficiais já declaram.
     Não existem (e não são fabricados) autor/avaliação/usos de
     comunidade — esses conceitos não têm equivalente na Biblioteca
     Jurídica oficial, que é uma fonte única e curada, não um
     marketplace. */
  const LegalLibrary = {
    _catalog: [], _byId: new Map(), _detailCache: new Map(), _manifest: null, _basePath: 'legal-library/',
    _i18nAvailable: {pt:new Set(), es:new Set()}, _i18nMeta: {},
    async init(){
      try{
        const [manifest, idx, i18nManifest, i18nMeta] = await Promise.all([
          fetch(this._basePath+'manifest.json').then(r=>r.json()),
          fetch(this._basePath+'index.json').then(r=>r.json()),
          fetch(this._basePath+'i18n/manifest.json').then(r=>r.ok?r.json():{available:{}}).catch(()=>({available:{}})),
          fetch(this._basePath+'i18n/meta.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
        ]);
        this._manifest = manifest;
        this._i18nMeta = i18nMeta || {};
        this._i18nAvailable = {
          pt: new Set((i18nManifest.available&&i18nManifest.available.pt)||[]),
          es: new Set((i18nManifest.available&&i18nManifest.available.es)||[])
        };
        this._catalog = (idx.contractTypes||[]).map(c=>{
          const idiomas=['en'];
          if(this._i18nAvailable.pt.has(c.slug)) idiomas.push('pt');
          if(this._i18nAvailable.es.has(c.slug)) idiomas.push('es');
          return {
            id: c.id, titulo: c.title, tituloEN: c.title, descEN: c.desc||null,
            categoria: c.market, subcategoria: c.subcategory,
            mercado: c.market, desc: c.desc||null, tags: c.tags||[], origem: 'oficial',
            verificado: c.status === 'FINAL APPROVED', idioma: idiomas,
            texto: c.previewText||null, blocks: c.blocks||[],
            requiredBlockCount: c.requiredBlockCount, optionalBlockCount: c.optionalBlockCount, clauseCount: c.clauseCount,
            numBlocos: (c.requiredBlockCount||0)+(c.optionalBlockCount||0) || null
          };
        });
      }catch(e){
        console.warn('LegalLibrary: catálogo indisponível, seguindo com biblioteca vazia.', e);
        this._manifest = {published:false};
        this._catalog = [];
      }
      this._byId.clear();
      this._catalog.forEach(c=>this._byId.set(c.id, c));
      return this._catalog;
    },
    list({categoria, query}={}){
      let out = this._catalog;
      if(categoria) out = out.filter(c=>c.categoria===categoria);
      if(query){
        const q=query.toLowerCase();
        out = out.filter(c=>((c.titulo||'')+' '+(c.desc||'')+' '+(c.tags||[]).join(' ')).toLowerCase().includes(q));
      }
      return out;
    },
    get(id){ return this._byId.get(id) || null; },
    /* lang: 'en' (padrão) devolve o Master English tal como compilado. 'pt'/'es'
       tentam mesclar a tradução de legal-library/i18n/<lang>/<slug>.json por cima
       do detalhe em inglês, casando cláusula por id — qualquer cláusula sem
       tradução (arquivo ausente, id não encontrado) cai de volta pro inglês em
       vez de mostrar vazio, e o inglês nunca é modificado no cache. */
    async getDetail(id, lang='en'){
      const cacheKey=id+'::'+lang;
      if(this._detailCache.has(cacheKey)) return this._detailCache.get(cacheKey);
      const c=this.get(id); if(!c) return null;
      let detail;
      try{
        detail = await fetch(this._basePath+'contracts/'+c.id+'.json').then(r=>r.json());
      }catch(e){ console.warn('LegalLibrary: detalhe indisponível para', id, e); return null; }
      if(lang!=='en' && this._i18nAvailable[lang] && this._i18nAvailable[lang].has(c.id)){
        try{
          const trans = await fetch(this._basePath+'i18n/'+lang+'/'+c.id+'.json').then(r=>r.json());
          const clauseById=new Map();
          (trans.blocks||[]).forEach(b=>(b.clauses||[]).forEach(cl=>clauseById.set(cl.id, cl.text)));
          detail = {
            ...detail,
            meta: {...detail.meta, language: lang, status: trans.status||detail.meta.status},
            blocks: detail.blocks.map(b=>({
              ...b,
              clauses: b.clauses.map(cl=>({...cl, text: clauseById.has(cl.id) ? clauseById.get(cl.id) : cl.text}))
            }))
          };
        }catch(e){ console.warn('LegalLibrary: tradução indisponível para', id, lang, e); }
      }
      this._detailCache.set(cacheKey, detail);
      return detail;
    },
    resolveClauseText(text, fieldValues={}){
      return text.replace(/\[([A-Z0-9_]+)\]/g, (m,name)=> (fieldValues[name]!=null ? fieldValues[name] : m));
    },
    /* Título/descrição traduzidos por idioma (legal-library/i18n/meta.json).
       'en' usa o Master; pt/es caem de volta pro Master se faltar tradução. */
    tituloEm(item, lang){
      if(lang==='en') return item.tituloEN||item.titulo;
      const m=this._i18nMeta[item.id]; const tr=m&&m[lang];
      return (tr&&tr.title) || item.tituloEN || item.titulo;
    },
    descEm(item, lang){
      if(lang==='en') return item.descEN!=null?item.descEN:item.desc;
      const m=this._i18nMeta[item.id]; const tr=m&&m[lang];
      return (tr&&tr.desc) || (item.descEN!=null?item.descEN:item.desc);
    },
    /* Tags traduzidas por idioma, mesma fonte (i18n/meta.json) e mesma regra
       de fallback de tituloEm/descEm — nunca traduz palavra a palavra (isso
       é o que misturava inglês com português dentro da MESMA tag, ex.:
       "Interior Pintura"). Ou a lista inteira já vem pronta no idioma pedido,
       ou cai inteira para o Master English — nunca uma mistura das duas. Um
       contrato novo sem tradução de tags ainda aparece 100% em inglês (não
       "quebrado"), até alguém preencher pt/es.tags em i18n/meta.json. */
    tagsEm(item, lang){
      const raw=item.tags||[];
      if(lang==='en') return raw;
      const m=this._i18nMeta[item.id]; const tr=m&&m[lang];
      return (tr&&tr.tags&&tr.tags.length===raw.length) ? tr.tags : raw;
    }
  };
  /* Preenche os [DYNAMIC_FIELD] de uma cláusula oficial com o que já se
     sabe do trabalho/perfil no momento da importação — como um bloco
     avulso (customText), isso é congelado no import, não recalculado a
     cada render; o que não dá pra preencher fica com o placeholder
     [ENTRE_COLCHETES] visível, para o usuário completar manualmente em
     vez de inventarmos um valor. */
  function valoresDynamicFieldsDoJob(job){
    const v={};
    if(job.client) v.CLIENT_NAME=job.client;
    if(job.typeLabel) v.PROJECT_NAME=job.typeLabel;
    if(job.value) v.TOTAL_VALUE=fmtMoney(job.value);
    if(job.date) v.DELIVERY_DATE=v.START_DATE=job.date;
    if(job.local) v.LOCATION=job.local;
    const empresa=perfilData && perfilData.empresa;
    if(empresa) v.PROVIDER_NAME=empresa;
    return v;
  }
  /* Gera os blocos reais de um contrato da Biblioteca Jurídica oficial a
     partir do detalhe compilado (LegalLibrary.getDetail) — um bloco por
     Block do Blueprint (Identification, Payment, ...), com o texto de
     todas as suas cláusulas Master English concatenado. Blocos CONDITIONAL
     dependem de um gatilho que não avaliamos automaticamente, então ficam
     de fora por enquanto. REQUIRED entra ligado, OPTIONAL entra desligado
     (o usuário ativa o que quiser) — mesma convenção do esqueleto genérico. */
  async function blocosParaModeloBiblioteca(m, lang, valores){
    const rawId = m && m.id ? String(m.id).replace(/^of:/,'').replace(/@.*$/,'') : null;
    const detail = rawId ? await LegalLibrary.getDetail(rawId, lang||LANG) : null;
    if(!detail || !detail.blocks || !detail.blocks.length) return blocosModeloPadrao();
    valores = valores || valoresDynamicFieldsDoJob(getBuilderJob());
    const blocosComTexto = detail.blocks.filter(b=>b.status!=='CONDITIONAL' && b.clauses && b.clauses.length);
    if(!blocosComTexto.length) return blocosModeloPadrao();
    /* Guarda tpl (texto-modelo com os [PLACEHOLDERS] originais) além do
       customText já resolvido — o painel de campos dinâmicos re-resolve o tpl
       a cada substituição em massa, sem perder os placeholders. */
    return blocosComTexto.map((b,i)=>{
      const tpl = b.clauses.map(c=>c.text).join('\n\n');
      return { id:'lb'+i, key:null, name:b.name, on: b.status==='REQUIRED',
        tpl, customText: LegalLibrary.resolveClauseText(tpl, valores) };
    });
  }
  function sugerirModelos(nomeTrabalho){
    const q=(nomeTrabalho||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    const palavras=q.split(/\s+/).filter(w=>w.length>2);
    if(!palavras.length) return [];
    const pontuados=LegalLibrary.list().map(m=>{
      const alvo=(m.titulo+' '+(m.tags||[]).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
      let pontos=0;
      palavras.forEach(p=>{ if(alvo.includes(p)) pontos++; });
      return {modelo:m, pontos};
    }).filter(p=>p.pontos>0);
    pontuados.sort((a,b)=>b.pontos-a.pontos);
    return pontuados.slice(0,5).map(p=>p.modelo);
  }
  function modelCardHtml(m, selected){
    return '<div class="model-card'+(selected?' selected':'')+'" data-modelo-id="'+m.id+'" onclick="selecionarModeloContrato(\''+m.id+'\')">'+
      '<div class="model-card-head">'+
        '<div class="model-card-name">'+escapeHtml(LegalLibrary.tituloEm(m, LANG))+'</div>'+
        '<svg class="model-card-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>'+
      '</div>'+
      '<div class="model-card-desc">'+escapeHtml(LegalLibrary.descEm(m, LANG)||'')+'</div>'+
    '</div>';
  }
  /* Biblioteca Pivots — navegação real por categoria e detalhe dinâmico.
     A categoria de cada item é o Market da Biblioteca Jurídica oficial
     (Photography, Videography, Design, ...) — os ícones abaixo cobrem os
     10 mercados do Blueprint; qualquer nome fora dessa lista cai no ícone
     genérico ("Outros"). */
  const BIB_CATEGORIA_ICONS={
    'Photography':'<path d="M4 8h2.5l1.3-2h8.4l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.4"/>',
    'Videography':'<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10 6-3.2v10.4l-6-3.2"/>',
    'Design':'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
    'Software Development':'<path d="m8 9-5 3 5 3M16 9l5 3-5 3M13 5l-2 14"/>',
    'Marketing':'<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    'Consulting':'<rect x="2.5" y="7.5" width="19" height="12" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M2.5 13h19"/>',
    'Architecture & Engineering':'<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
    'Education & Content':'<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>',
    'Universal Contracts':'<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
    'Home & Trade Services':'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
    'Outros':'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  let bibFiltroAtual={contratos:'populares', modelos:'populares'};
  /* Origem: comunidade (biblioteca pública) / favoritos (compartilha o mesmo
     Set bibFavoritos da página Bibliotecas do menu — sem sistema paralelo) /
     meus (modelosContratoData — modelos que o próprio utilizador criou,
     importou ou editou). Junto com a barra de pesquisa, substitui a versão
     anterior que só tinha populares/avaliados/categoria, sem forma de achar
     favoritos ou modelos próprios dentro desta biblioteca. */
  let bibOrigemAtual={contratos:'comunidade', modelos:'comunidade'};
  function selecionarOrigemBiblioteca(escopo, origem){
    bibOrigemAtual[escopo]=origem;
    renderBibliotecaPanel(escopo);
  }
  function renderBibliotecaPanel(escopo){
    const origem=bibOrigemAtual[escopo];
    const origens=[
      {key:'comunidade', labelKey:'library.origin.community'},
      {key:'favoritos', labelKey:'library.origin.saved'},
      {key:'meus', labelKey:'library.origin.mine'}
    ];
    document.getElementById('bib-'+escopo+'-origem').innerHTML=origens.map(o=>
      '<div class="chip'+(o.key===origem?' on':'')+'" onclick="selecionarOrigemBiblioteca(\''+escopo+'\',\''+o.key+'\')">'+t(o.labelKey)+'</div>'
    ).join('');
    const q=(document.getElementById('bib-'+escopo+'-busca').value||'').trim().toLowerCase();
    const wrap=document.getElementById('bib-'+escopo+'-lista');

    if(origem==='meus'){
      document.getElementById('bib-'+escopo+'-tabs').innerHTML='';
      const meus=Object.values(modelosContratoData).filter(m=>!q || m.nome.toLowerCase().includes(q));
      wrap.innerHTML = meus.length ? meus.map(meuModeloCardHtml).join('') : '<p class="u-label-nd u-p-8-2">'+t('library.empty')+'</p>';
      return;
    }

    let base = LegalLibrary.list();
    if(origem==='favoritos') base = base.filter(m=>bibFavoritos.has('of:'+m.id));
    if(q) base = base.filter(m=>((m.titulo||'')+' '+(m.desc||'')+' '+(m.tags||[]).join(' ')+' '+(m.categoria||'')).toLowerCase().includes(q));
    const categorias=[...new Set(base.map(m=>m.categoria))];
    let filtro=bibFiltroAtual[escopo];
    if(!categorias.includes(filtro)) filtro=categorias[0]||null;
    const tabs=categorias.map(c=>({key:c, label:c, icon:BIB_CATEGORIA_ICONS[c]||BIB_CATEGORIA_ICONS['Outros']}));
    document.getElementById('bib-'+escopo+'-tabs').innerHTML=tabs.map(tb=>
      '<div class="chip chip-ic'+(tb.key===filtro?' on':'')+'" onclick="selecionarFiltroBiblioteca(\''+escopo+'\',\''+tb.key+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'+tb.icon+'</svg> '+escapeHtml(tb.label)+'</div>'
    ).join('');
    const itens = filtro ? base.filter(m=>m.categoria===filtro) : base;
    wrap.innerHTML = itens.length ? itens.map(m=>bibCardHtml(m,escopo)).join('') : '<p class="u-label-nd u-p-8-2">'+t('library.empty')+'</p>';
  }
  function selecionarFiltroBiblioteca(escopo,key){
    bibFiltroAtual[escopo]=key;
    renderBibliotecaPanel(escopo);
  }
  function bibCardHtml(m, escopo){
    const fav=bibFavoritos.has('of:'+m.id);
    return '<div class="model-card">'+
      '<div class="model-card-head u-cur-pointer" onclick="abrirDetalheBiblioteca(\''+m.id+'\')"><div class="model-card-name">'+escapeHtml(LegalLibrary.tituloEm(m, LANG))+'</div></div>'+
      '<div class="model-card-desc u-cur-pointer" onclick="abrirDetalheBiblioteca(\''+m.id+'\')">'+escapeHtml(LegalLibrary.descEm(m, LANG)||'')+'</div>'+
      '<div class="model-card-foot">'+
        '<span class="bib-fav'+(fav?' on':'')+'" style="margin-left:auto;cursor:pointer" onclick="event.stopPropagation();toggleFavBibliotecaWizard(\''+m.id+'\',\''+escopo+'\')"><svg class="u-ico-md" viewBox="0 0 24 24" fill="'+(fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.7"><path d="M12 17.3 6.2 21l1.6-6.6L2.5 9.8l6.7-.6L12 3l2.8 6.2 6.7.6-5.3 4.6L17.8 21z"/></svg></span>'+
      '</div>'+
    '</div>';
  }
  function toggleFavBibliotecaWizard(id, escopo){
    const key='of:'+id;
    if(bibFavoritos.has(key)){ bibFavoritos.delete(key); showToast(t('library.unfavorited')); }
    else { bibFavoritos.add(key); showToast(t('library.favorited')); if(navigator.vibrate)navigator.vibrate(6); }
    saveBibFavoritos();
    renderBibliotecaPanel(escopo);
  }
  function meuModeloCardHtml(m){
    return '<div class="pick-row" onclick="usarModeloContrato(\''+m.id+'\')">'+
      '<div><div class="nm">'+escapeHtml(m.nome)+'</div><div class="sub">'+m.blocks.length+' '+t('builder.blocksCount')+(m.usos?(' · '+t('builder.usedPrefix')+' '+m.usos+'x'):'')+'</div></div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>';
  }
  function abrirDetalheBiblioteca(id){
    const m=LegalLibrary.get(id);
    if(!m) return;
    const titulo=LegalLibrary.tituloEm(m, LANG);
    let html='<div class="model-detail-head">';
    html+='<div class="model-detail-name">'+escapeHtml(titulo)+'</div>';
    html+='<div class="model-detail-meta">'+bibAutorLinha(m)+'</div>';
    html+='</div>';
    html+='<p class="model-detail-desc">'+escapeHtml(LegalLibrary.descEm(m, LANG)||'')+'</p>';
    const tagsTraduzidas=LegalLibrary.tagsEm(m, LANG);
    if(tagsTraduzidas.length){
      html+='<div class="plabel">'+t('library.tags')+'</div>';
      html+='<div class="detail-structure">'+tagsTraduzidas.map(tg=>'<span class="struct-pill">'+escapeHtml(tg)+'</span>').join('')+'</div>';
    }
    html+='<div class="warn-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.86 1.8 18a1 1 0 0 0 .87 1.5h18.66a1 1 0 0 0 .87-1.5L13.7 3.86a1 1 0 0 0-1.74 0Z"/></svg><div>'+t('library.legalWarning')+'</div></div>';
    const favAtivo=bibFavoritos.has('of:'+id);
    html+='<div class="detail-actions"><button class="btn soft" onclick="duplicarModeloBiblioteca(\''+id+'\')">'+t('action.duplicate')+'</button><button class="btn soft'+(favAtivo?' on':'')+'" id="bib-detalhe-guardar-btn" onclick="guardarModeloBiblioteca(\''+id+'\')">'+(favAtivo?t('library.saved'):t('action.save'))+'</button><button class="btn primary" onclick="importarModeloBiblioteca(\''+id+'\',\''+LANG+'\')">'+t('sheet.import')+'</button></div>';
    html+='<div class="plabel u-mt-18">'+t('library.rating')+'</div>';
    html+='<div id="avaliacao-stars-'+id+'"></div>';
    document.getElementById('bib-detalhe-conteudo').innerHTML=html;
    pushPanel('comunidade-contrato-detalhe');
    document.getElementById('sheetTitle').textContent=titulo;
    renderEstrelasAvaliacao(id);
  }
  async function selecionarModeloBibliotecaNoWizard(id){
    const m=LegalLibrary.get(id);
    if(!m) return;
    marcarModeloComoUsado(id);
    twModeloEscolhido={ nome:LegalLibrary.tituloEm(m, LANG), blocks: await blocosParaModeloBiblioteca(m, LANG) };
    twEmWizard=false;
    while(panelStack.length>1 && panelStack[panelStack.length-1]!=='trabalho'){ panelStack.pop(); }
    showPanel('trabalho');
    renderModeloEscolhidoWizard();
  }
  function abrirBuilderParaSelecao(modeloOrigem){
    if(contratoParaColaboradorJobId){
      const jobId=contratoParaColaboradorJobId;
      contratoParaColaboradorJobId=null;
      // Se estivermos a meio do wizard de criação (__wizard__), a folha
      // (sheet) tem de continuar aberta — fechar aqui devolvia o utilizador
      // ao dashboard e "encerrava" a criação do trabalho. Fora do wizard
      // (Portal Operacional), a folha só serviu para mostrar a biblioteca.
      if(jobId!=='__wizard__') closeSheet();
      aplicarContratoEscolhidoAoColaborador(jobId, modeloOrigem||{blocks:[]});
      return;
    }
    closeSheet();
    abrirBuilder(null, modeloOrigem);
  }
  /* Contrato de Colaborador vai direto à Biblioteca — sem passar pela tela
     antiga "Novo Contrato" (Novo / Duplicar existente / Usar modelo
     guardado), que não faz sentido neste fluxo.
     BUG real corrigido aqui: este fluxo é sempre chamado a partir de um
     openInfo() já aberto (lista de colaboradores / configurar colaborador),
     que usa o #infoSheet (z-index 85) — mais alto que o #sheet da
     Biblioteca (z-index 80). Sem fechar o #infoSheet antes, as duas folhas
     ficavam abertas ao mesmo tempo, a de baixo (Biblioteca) parcialmente
     tapada pela de cima, dando a impressão de interface quebrada/sem
     botões. */
  function abrirPainelBibliotecaContratoDireto(){
    if(document.getElementById('infoSheet').classList.contains('show')) closeInfo();
    if(!document.getElementById('sheet').classList.contains('show')) openSheet();
    pushPanel('comunidade-contratos');
  }
  async function duplicarModeloBiblioteca(id){
    if(twEmWizard){ selecionarModeloBibliotecaNoWizard(id); return; }
    const m=LegalLibrary.get(id);
    if(!m) return;
    marcarModeloComoUsado(id);
    abrirBuilderParaSelecao({ client:'', nome:LegalLibrary.tituloEm(m, LANG), blocks: await blocosParaModeloBiblioteca(m, LANG) });
    showToast(t('toast.duplicatedForEdit'));
  }
  /* Botão "Guardar" do detalhe (painel Explorar Modelos, dentro do wizard) —
     antes só mostrava um toast de sucesso sem persistir nada (o contrato
     "desaparecia": não ficava em Favoritos nem em nenhuma outra língua da
     mesma ficha). Agora usa o mesmo Set bibFavoritos (chave 'of:'+id, igual
     ao baseId da Biblioteca principal) que todo o resto do app já usa —
     favoritar aqui ou lá é a mesma marca, válida pra todas as variações de
     idioma daquele contrato, não uma cópia presa a uma língua só. */
  function guardarModeloBiblioteca(id){
    const key='of:'+id;
    if(bibFavoritos.has(key)){ bibFavoritos.delete(key); showToast(t('library.unfavorited')); }
    else { bibFavoritos.add(key); showToast(t('library.favorited')); if(navigator.vibrate)navigator.vibrate(6); }
    saveBibFavoritos();
    marcarModeloComoUsado(id);
    renderEstrelasAvaliacao(id);
    const btn=document.getElementById('bib-detalhe-guardar-btn');
    if(btn){ const on=bibFavoritos.has(key); btn.classList.toggle('on', on); btn.textContent = on ? t('library.saved') : t('action.save'); }
  }
  async function importarModeloBiblioteca(id, lang){
    if(twEmWizard){ selecionarModeloBibliotecaNoWizard(id); return; }
    const m=LegalLibrary.get(id);
    if(!m) return;
    marcarModeloComoUsado(id);
    const nome = lang ? LegalLibrary.tituloEm(m, lang) : m.titulo;
    const valores = valoresDynamicFieldsDoJob(getBuilderJob());
    const blocks = await blocosParaModeloBiblioteca(m, lang, valores);
    abrirBuilderParaSelecao({ client:'', nome, blocks, fieldValues: valores });
    showToast(t('toast.templateImported'));
  }
  /* Equipa — dados reais (workspace_members), convite via /api/team/invite.
     Fonte única de verdade: a tabela em si, nunca um blob local. */
  const PAPEIS_EQUIPA_KEYS={
    Admin:{nameKey:'role.admin.name', descKey:'team.adminDesc'},
    Editor:{nameKey:'role.editor.name', descKey:'team.editorDesc'},
    Viewer:{nameKey:'role.viewer.name', descKey:'team.viewerDesc'}
  };
  const LIMITE_UTILIZADORES_PLANO={Free:1, Plus:1, Pro:3, Business:10, Enterprise:Infinity};
  function papelNome(p){ return t(PAPEIS_EQUIPA_KEYS[p].nameKey); }
  function papelDesc(p){ return t(PAPEIS_EQUIPA_KEYS[p].descKey); }
  let membrosEquipa=[];
  let meuPapel='Admin';
  function souAdmin(){ return meuPapel==='Admin'; }
  async function loadEquipaData(){
    if(!currentWorkspaceId || !currentUser) return;
    const { data, error } = await sb.from('workspace_members').select('user_id,email,papel').eq('workspace_id', currentWorkspaceId);
    if(error){ console.error('Erro a carregar equipa:', error); return; }
    membrosEquipa = data||[];
    const eu = membrosEquipa.find(m=>m.user_id===currentUser.id);
    meuPapel = eu ? eu.papel : 'Admin';
    atualizarContagemEquipaNav();
    aplicarPermissoesUI();
  }
  function atualizarContagemEquipaNav(){
    const n=membrosEquipa.length;
    const navEl=document.getElementById('equipa-nav-v'); if(navEl) navEl.textContent=n===1?t('team.1person'):(n+' '+t('team.nPersons').replace('{n}','').trim());
  }
  /* Esconde ações que exigem Admin (equipa, dados da empresa) de quem não é Admin. */
  function aplicarPermissoesUI(){
    document.querySelectorAll('[data-requer-admin]').forEach(el=>{
      el.style.display = souAdmin() ? '' : 'none';
    });
  }
  /* Cabeçalho da Organização: avatar grande da logo + nome/categoria numa
     olhada + grid com os campos preenchidos (endereço, categoria, email,
     telefone, website, número fiscal) — só os que existem, sem linha vazia.
     Edição fica atrás do botão Editar (infoEmpresa()), a página em si é
     sempre só leitura. */
  function renderOrgHead(){
    const avatarEl=document.getElementById('org-avatar-preview');
    if(avatarEl){
      if(perfilData.empresaFotoUrl){ avatarEl.style.backgroundImage='url('+perfilData.empresaFotoUrl+')'; avatarEl.style.backgroundSize='cover'; avatarEl.style.backgroundPosition='center'; avatarEl.textContent=''; }
      else { avatarEl.style.backgroundImage='none'; avatarEl.textContent=(perfilData.empresa||'?').charAt(0).toUpperCase(); }
    }
    const nomeEl=document.getElementById('org-nome-display'); if(nomeEl) nomeEl.textContent=perfilData.empresa||t('profile.company');
    const catEl=document.getElementById('org-categoria-display'); if(catEl) catEl.textContent=perfilData.categoria||'';
    const grid=document.getElementById('org-info-grid');
    if(grid){
      const itens=[
        [t('profile.company.address'), perfilData.endereco],
        [t('profile.company.category'), perfilData.categoria],
        ['Email', perfilData.empresaEmail],
        [t('profile.company.phone'), perfilData.telefone],
        [t('profile.company.website'), perfilData.website],
        [t('profile.company.taxId'), perfilData.taxId]
      ].filter(([,v])=>v);
      grid.innerHTML = itens.length ? itens.map(([lbl,val])=>'<div class="card-info-item"><span class="lbl">'+escapeHtml(lbl)+'</span><span class="val">'+escapeHtml(val)+'</span></div>').join('')
        : '<p style="font-size:13px;color:var(--ink-soft);grid-column:1/-1">'+t('profile.company.empty')+'</p>';
    }
  }
  function renderEquipaView(){
    renderOrgHead();
    const limite=LIMITE_UTILIZADORES_PLANO[perfilData.plano||'Free'];
    const limiteTexto = limite===Infinity ? '∞' : limite;
    document.getElementById('equipa-seats-label').textContent=membrosEquipa.length+' '+t('team.seats').replace('{n}',limiteTexto);
    const wrap=document.getElementById('equipa-lista');
    wrap.innerHTML=membrosEquipa.map(m=>{
      const souEu = m.user_id===currentUser.id;
      const nomeExibido= souEu ? (perfilData.nome||m.email||t('team.noEmail')) : (m.email||t('team.noEmail'));
      const corAv=avatarColor(nomeExibido);
      const fotoUrl= souEu ? perfilData.fotoUrl : null;
      const podeGerir = souAdmin() && !souEu;
      const avatarHtml= fotoUrl
        ? '<div style="width:36px;height:36px;border-radius:var(--r);flex:none;overflow:hidden"><img src="'+fotoUrl+'" style="width:100%;height:100%;object-fit:cover;filter:grayscale(1) brightness(0.78)" onerror="this.parentElement.innerHTML=\'<div style=\\\'width:36px;height:36px;border-radius:var(--r);background:'+corAv+';color:#fff;display:grid;place-items:center;font-family:Plus Jakarta Sans,sans-serif;font-weight:700;font-size:13px\\\'>'+avatarInitials(nomeExibido)+'</div>\'"></div>'
        : '<div style="width:36px;height:36px;border-radius:var(--r);background:'+corAv+';color:#fff;display:grid;place-items:center;font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:13px;flex:none">'+avatarInitials(nomeExibido)+'</div>';
      return '<div class="struct-row" style="align-items:center">'+
        '<div class="u-row-full">'+
          avatarHtml+
          '<div class="u-min-0"><div class="nm">'+escapeHtml(nomeExibido)+(souEu?' <span style="font-size:10.5px;color:var(--brand);font-weight:700">'+t('team.youTag')+'</span>':'')+'</div>'+(souEu&&currentUser.email?'<div style="font-size:11.5px;color:var(--ink-soft);margin-top:1px">'+escapeHtml(currentUser.email)+'</div>':'')+'</div>'+
        '</div>'+
        (podeGerir
          ? '<div class="u-row"><span class="sig-tag yellow u-cur-pointer" onclick="abrirAlterarPapel(\''+m.user_id+'\')">'+papelNome(m.papel).toUpperCase()+'</span><svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerMembroEquipa(\''+m.user_id+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
          : '<span class="sig-tag '+(m.papel==='Admin'?'green':'yellow')+'">'+papelNome(m.papel).toUpperCase()+'</span>'
        )+
      '</div>';
    }).join('');
  }
  function abrirAdicionarMembro(){
    if(!souAdmin()){ showToast(t('team.onlyAdminInvites')); return; }
    const limite=LIMITE_UTILIZADORES_PLANO[perfilData.plano||'Free'];
    if(membrosEquipa.length>=limite){
      openInfo(t('modal.seatsFull'), `
        <p class="u-hint">${t('team.seatsFullPrefix')}${limite}${t('team.seatsFullSuffix')}</p>
        <button class="btn primary u-w-full" onclick="closeInfo();infoPlano()">${t('profile.account.plan')}</button>`);
      return;
    }
    openInfo(t('team.addPerson'), `
      <div class="field"><label>${t('login.email')}</label><input id="eq-email" placeholder="example@email.com" data-t-placeholder="field.emailPlaceholder" type="email" autocomplete="off" name="eq-email-convite"></div>
      <div class="field"><label>${t('field.role')}</label><select id="eq-papel"><option value="Editor">${papelNome('Editor')}</option><option value="Viewer">${papelNome('Viewer')}</option></select></div>
      <p class="u-xs-nd u-m-n6-2-14" id="eq-papel-desc">${papelDesc('Editor')}</p>
      <button class="btn primary u-w-full" onclick="guardarNovoMembro()">${t('action.add')}</button>`);
    document.getElementById('eq-papel').addEventListener('change', e=>{
      document.getElementById('eq-papel-desc').textContent=papelDesc(e.target.value);
    });
  }
  async function guardarNovoMembro(){
    const emailEl=document.getElementById('eq-email');
    const email=emailEl.value.trim();
    if(!email || !email.includes('@')){ emailEl.focus(); showToast(t('toast.writeEmail')); return; }
    const papel=document.getElementById('eq-papel').value;
    const { data:sessionData } = await sb.auth.getSession();
    const access_token = sessionData && sessionData.session && sessionData.session.access_token;
    try{
      const res=await fetch('/api/team/invite', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({access_token, workspace_id:currentWorkspaceId, email, papel})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok || !body.ok){ showToast(body.error || t('toast.inviteError')); return; }
      await loadEquipaData();
      closeInfo();
      renderEquipaView();
      /* o membro fica associado mesmo que o email não saia; avisamos se falhou
         para o admin poder partilhar o convite por outro meio */
      showToast(body.emailEnviado===false ? t('toast.memberAddedNoEmail') : (email+t('team.memberAdded')));
    }catch(e){ showToast(t('toast.inviteError')); }
  }
  function abrirAlterarPapel(userId){
    const m=membrosEquipa.find(x=>x.user_id===userId);
    if(!m) return;
    openInfo(t('modal.changeRolePrefix')+(m.email||''), Object.keys(PAPEIS_EQUIPA_KEYS).filter(p=>p!=='Admin').map(p=>
      '<div class="pick-row'+(m.papel===p?' selected':'')+'" onclick="definirPapelMembro(\''+userId+'\',\''+p+'\')"><div><div class="nm">'+papelNome(p)+'</div><div class="sub">'+papelDesc(p)+'</div></div></div>'
    ).join(''));
  }
  async function definirPapelMembro(userId,papel){
    const { error } = await sb.from('workspace_members').update({papel}).eq('workspace_id',currentWorkspaceId).eq('user_id',userId);
    if(error){ showToast(t('toast.inviteError')); return; }
    await loadEquipaData();
    closeInfo();
    renderEquipaView();
    showToast(t('toast.roleUpdated'));
  }
  async function removerMembroEquipa(userId){
    const { error } = await sb.from('workspace_members').delete().eq('workspace_id',currentWorkspaceId).eq('user_id',userId);
    if(error){ showToast(t('toast.inviteError')); return; }
    await loadEquipaData();
    renderEquipaView();
    atualizarContagemEquipaNav();
    showToast(t('toast.personRemoved'));
  }
  /* Uso e avaliação — só pode avaliar depois de usar ou importar um modelo */
  let modelosUsadosIds=new Set();
  let avaliacoesUtilizador={};
  function saveModelosUsoData(){ savePersisted('pivot-modelosUso', ()=>({usados:[...modelosUsadosIds], avaliacoes:avaliacoesUtilizador})); }
  async function loadModelosUsoData(){
    await loadPersisted('pivot-modelosUso', d=>{
      if(d){ modelosUsadosIds=new Set(d.usados||[]); avaliacoesUtilizador=d.avaliacoes||{}; }
    });
  }
  function marcarModeloComoUsado(id){
    if(!modelosUsadosIds.has(id)) modelosUsadosIds.add(id);
    else { modelosUsadosIds.delete(id); modelosUsadosIds.add(id); } // move para o fim (mais recente)
    saveModelosUsoData();
  }
  function avaliarModelo(id, estrelas){
    if(!modelosUsadosIds.has(id)){ showToast(t('toast.useOrImportFirst')); return; }
    avaliacoesUtilizador[id]=estrelas;
    saveModelosUsoData();
    renderEstrelasAvaliacao(id);
    showToast(t('toast.ratingSaved'));
  }
  function renderEstrelasAvaliacao(id){
    const wrap=document.getElementById('avaliacao-stars-'+id);
    if(!wrap) return;
    const usado=modelosUsadosIds.has(id);
    const dada=avaliacoesUtilizador[id]||0;
    if(!usado){
      wrap.innerHTML='<p class="rating-hint">Usa ou importa este modelo para poderes avaliar.</p>';
      return;
    }
    let stars='';
    for(let i=1;i<=5;i++){
      stars+='<svg viewBox="0 0 24 24" fill="'+(i<=dada?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.6" onclick="avaliarModelo(\''+id+'\','+i+')"><path d="M12 2.5l2.7 5.8 6.3.6-4.8 4.3 1.4 6.2L12 16.2 6.4 19.4l1.4-6.2-4.8-4.3 6.3-.6Z"/></svg>';
    }
    wrap.innerHTML='<p class="rating-hint">Sua avaliação</p><div class="rating-stars">'+stars+'</div>';
  }
  function trabalhoGoto(n){
    trabalhoMoment=n;
    document.querySelectorAll('.panel[data-panel="trabalho"] .moment').forEach(m=>{
      m.style.display = (+m.dataset.moment===n)?'block':'none';
    });
    if(n===2) renderColaboradoresPendentesWizard();
    if(n===4) renderServicosIncluidosWizard();
    if(n===5) prepararEtapaEntrega();
    if(n===6){ sincronizarValorComServicosSelecionados(); prepararEtapaPagamentos(); }
    if(n===7) renderModelosSugeridos();
    if(n===8) renderReview();
    document.getElementById('sheetBody').scrollTop=0;
    syncChrome();
  }
  /* Etapa 4 (Pagamentos): recorrência é definida na Etapa 1 — aqui, se estiver
     ligada, escondemos as parcelas manuais e mostramos a nota de cobrança
     automática; caso contrário, semeamos as parcelas por omissão. */
  function prepararEtapaPagamentos(){
    const recorrente=document.getElementById('envio-recorrencia').classList.contains('on');
    document.getElementById('tw-pag-recorrente-nota').style.display = recorrente?'flex':'none';
    document.getElementById('tw-parcelas-wrap').style.display = recorrente?'none':'block';
    if(!recorrente) seedParcelasWizardSeVazio();
  }
  /* editar o valor à mão só precisa re-sincronizar as parcelas — o valor
     deixou de estar amarrado a um único serviço (ver Etapa 4, Serviços). */
  function onValorWizardManual(){
    sincronizarParcelaAutoComValor();
  }
  /* Ao entrar na Etapa de Pagamento, pré-preenche o Valor com o total dos
     serviços escolhidos na Etapa de Serviços — só se o campo ainda estiver
     vazio, pra nunca sobrescrever um valor que a pessoa já editou à mão. */
  function sincronizarValorComServicosSelecionados(){
    const el=document.getElementById('tw-valor');
    if(!el || el.value.trim()) return;
    const total=totalServicosSelecionadosWizard();
    if(total>0) el.value=total;
  }
  /* ===== Parcelas de pagamento — configuração manual no wizard =====
     Antes disto, o valor era sempre dividido automaticamente 50/50 (sinal +
     pagamento final) sem qualquer forma de mudar datas, valores ou número de
     parcelas na criação do trabalho. Agora o wizard mostra as parcelas como
     linhas editáveis, pré-preenchidas com o 50/50 de sempre (para não mudar o
     comportamento por omissão), mas totalmente ajustáveis antes de criar. */
  /* Recorrência (Etapa 1): só mostra/esconde a configuração de frequência e
     renovação. Valor por ciclo = campo Valor; primeira cobrança = data de
     início — lidos no momento de criar o trabalho. */
  function toggleRecorrenciaWizard(el){
    el.classList.toggle('on');
    document.getElementById('tw-recorrencia-config').style.display = el.classList.contains('on') ? 'block':'none';
  }
  /* Renovação automática ligada = recorrência indefinida (sem data de fim).
     Desligada = exige uma data de fim, que aparece por baixo. */
  function toggleRenovacaoAutoWizard(el){
    el.classList.toggle('on');
    document.getElementById('tw-recur-fim-wrap').style.display = el.classList.contains('on') ? 'none':'block';
  }
  function parcelaWizardRowHtml(i, p){
    return '<div class="field-row" data-parc-row="'+i+'" style="display:grid;grid-template-columns:1fr 1fr auto;align-items:flex-end;gap:10px;margin-bottom:8px">'+
      '<div class="field u-mb-0"><label class="u-xs-label" data-t="wizard.fee">Valor</label><input class="tw-parc-valor" type="number" min="0" step="0.01" placeholder="0" value="'+(p.amount||0)+'"></div>'+
      '<input type="hidden" class="tw-parc-label" value="'+escapeHtml(p.label||'')+'">'+
      '<div class="field u-mb-0"><label class="u-xs-label" data-t="wizard.date">Data</label><input class="tw-parc-data" type="date" value="'+(p.dueDate||'')+'"></div>'+
      '<div style="padding-bottom:12px;cursor:pointer;color:var(--neutral)" onclick="removerParcelaWizard(this)"><svg class="u-ico-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'+
    '</div>';
  }
  function valorWizardNumerico(){
    const valorTxt=(document.getElementById('tw-valor').value||'').trim();
    return parseFloat((valorTxt.match(/[\d.,]+/)||['0'])[0].replace(/\./g,'').replace(',','.'))||0;
  }
  function seedParcelasWizardSeVazio(){
    const lista=document.getElementById('tw-parcelas-lista');
    if(!lista || lista.children.length) return;
    const dataEvento=document.getElementById('tw-data').value||null;
    /* a parcela semeada fica marcada como "espelho do valor" (data-parc-auto):
       enquanto o utilizador não lhe mexer, ela acompanha o campo Valor — o
       valor agora é escrito nesta mesma etapa, depois desta linha existir. */
    lista.innerHTML=parcelaWizardRowHtml(0, {label:t('payment.installmentDefault'), amount:valorWizardNumerico(), dueDate:dataEvento});
    const row=lista.querySelector('[data-parc-row]');
    if(row){
      row.dataset.parcAuto='1';
      row.querySelector('.tw-parc-valor').addEventListener('input', ()=>{ delete row.dataset.parcAuto; });
    }
  }
  /* mantém a única parcela automática em sincronia com o campo Valor. Só age
     enquanto existir exatamente uma parcela e ela ainda não tiver sido
     editada à mão — a partir daí o utilizador manda. */
  function sincronizarParcelaAutoComValor(){
    const lista=document.getElementById('tw-parcelas-lista');
    if(!lista || lista.children.length!==1) return;
    const row=lista.querySelector('[data-parc-row]');
    if(!row || row.dataset.parcAuto!=='1') return;
    row.querySelector('.tw-parc-valor').value=valorWizardNumerico();
  }
  function addParcelaWizard(){
    const lista=document.getElementById('tw-parcelas-lista');
    const i=lista.children.length;
    lista.insertAdjacentHTML('beforeend', parcelaWizardRowHtml(i, {label:t('payment.installmentDefault'), amount:0, dueDate:null}));
  }
  function removerParcelaWizard(btn){
    btn.closest('[data-parc-row]').remove();
  }
  function lerParcelasWizard(){
    return [...document.querySelectorAll('#tw-parcelas-lista [data-parc-row]')].map(row=>({
      label: row.querySelector('.tw-parc-label').value.trim() || 'Parcela',
      amount: parseFloat(row.querySelector('.tw-parc-valor').value)||0,
      status:'pendente',
      dueDate: row.querySelector('.tw-parc-data').value || null,
      comprovativo:null
    }));
  }
  /* ===== Etapa 5 — Entrega e Aprovação =====
     Cada funcionalidade (Triagem, Seleção, Revisões) tem o seu próprio
     toggle, porque nem todo trabalho usa todas as fases. Os dados ficam
     disponíveis depois em job.entrega para preencher automaticamente os
     contratos (ver blocoTextos.entrega). Revisões não calcula prazos —
     cada profissional tem o seu próprio fluxo de trabalho; o sistema só
     pede quantas rodadas de revisão o trabalho terá. */
  let entregaRevisoesQtd=1;
  function prepararEtapaEntrega(){
    atualizarDisplayRevisoes();
  }
  function toggleEntregaAjustes(el){
    el.classList.toggle('on');
    document.getElementById('entrega-ajustes-wrap').style.display = el.classList.contains('on') ? 'block':'none';
  }
  function alterarQuantidadeRevisoes(delta){
    entregaRevisoesQtd=Math.max(1, Math.min(20, entregaRevisoesQtd+delta));
    atualizarDisplayRevisoes();
  }
  function atualizarDisplayRevisoes(){
    const el=document.getElementById('entrega-revisoes-qtd');
    if(el) el.textContent=entregaRevisoesQtd;
  }
  /* Gera "Revisão 1".."Revisão N" a partir da quantidade escolhida — o link
     de cada uma só é pedido depois, quando a timeline chegar "Aguardando
     envio para Revisão N" (ver abrirAnexarLinkAjuste). */
  function lerAjustesWizard(){
    return Array.from({length:entregaRevisoesQtd}, (_,i)=>({
      nome: t('entrega.adjustmentDefault')+' '+(i+1),
      link: null, status:'pendente', observacoes:null
    }));
  }
  function lerEntregaWizard(){
    const ajustesOn=document.getElementById('entrega-ajustes-toggle').classList.contains('on');
    const ajustes = ajustesOn ? lerAjustesWizard() : [];
    return {
      triagem: false,
      triagemLink: null,
      triagemConcluida:false,
      selecao: false,
      selecaoLink: null,
      selecaoConcluida:false,
      permiteAjustes: ajustesOn,
      ajustes,
      formatoEntrega: document.getElementById('entrega-formato').value,
      dataEntrega: document.getElementById('entrega-data').value || null,
      linkDownload: null,
      entregaFinalConcluida:false
    };
  }
  /* Impede avançar sem os dados mínimos pra o resto do app não quebrar depois
     (sem cliente/data o trabalho não aparece direito em nenhuma lista/anel
     de prazo, e os lembretes automáticos/emails da Etapa 8 disparam pra
     ninguém ou com "undefined" no texto). Só bloqueia o essencial — recursos,
     equipa, portal do cliente, entrega e modelo de contrato continuam
     opcionais, com valores por omissão sãos. */
  function trabalhoValidarEtapa(n){
    if(n===1){
      if(!document.getElementById('tw-nome').value.trim()) return t('wizard.errRequireTitle');
      if(!document.getElementById('tw-cliente').value.trim()) return t('wizard.errRequireClient');
      if(!document.getElementById('tw-data').value) return t('wizard.errRequireDate');
      if(!document.getElementById('tw-hora').value) return t('wizard.errRequireTime');
      return null;
    }
    if(n===6){
      const recorrente=document.getElementById('envio-recorrencia').classList.contains('on');
      if(recorrente) return null;
      const valorTxt=(document.getElementById('tw-valor').value||'').trim();
      const valorNum=parseFloat((valorTxt.match(/[\d.,]+/)||['0'])[0].replace(/\./g,'').replace(',','.'))||0;
      if(valorNum<=0) return t('wizard.errRequireValue');
      return null;
    }
    return null;
  }
  function trabalhoNext(){
    const erro=trabalhoValidarEtapa(trabalhoMoment);
    if(erro){ showToast(erro); return; }
    trabalhoGoto(Math.min(8, trabalhoMoment+1));
  }
  /* ===== Etapa 4 — Serviços =====
     Seleção (não obrigatória) de múltiplos modelos de serviço salvos em
     Perfil > Serviços — cada um pode ter o valor editado manualmente aqui
     (sem afetar o modelo salvo), o total soma automaticamente e alimenta o
     valor da Etapa de Pagamento. A escolha também vira um bloco "Serviços
     incluídos" no contrato, com snapshot de nome/categoria/descrição/valor
     no momento da criação (não uma referência viva ao modelo). */
  let twServicosSelecionados=new Set();
  let twServicosValores={};
  function valorServicoWizard(s){ return twServicosValores[s.id]!=null ? twServicosValores[s.id] : (s.valor||0); }
  function totalServicosSelecionadosWizard(){
    return servicosData.filter(s=>twServicosSelecionados.has(s.id)).reduce((acc,s)=>acc+valorServicoWizard(s),0);
  }
  function renderServicosIncluidosWizard(){
    const wrap=document.getElementById('tw-servicos-incluidos-lista');
    const empty=document.getElementById('tw-servicos-incluidos-empty');
    if(!wrap) return;
    if(!servicosData.length){ wrap.innerHTML=''; if(empty) empty.style.display='block'; }
    else{
      if(empty) empty.style.display='none';
      wrap.innerHTML=servicosData.map(s=>{
        const on=twServicosSelecionados.has(s.id);
        return '<div class="pick-row'+(on?' selected':'')+'">'+
          '<div onclick="toggleServicoIncluidoWizard(\''+s.id+'\')" style="flex:1;min-width:0;cursor:pointer;display:flex;align-items:center;gap:10px">'+
            (on?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;color:var(--brand);flex:none"><path d="M20 6 9 17l-5-5"/></svg>'
               :'<span style="width:18px;height:18px;flex:none"></span>')+
            '<div><div class="nm">'+escapeHtml(s.nome)+'</div>'+(s.categoria?'<div class="sub">'+escapeHtml(s.categoria)+'</div>':'')+'</div>'+
          '</div>'+
          (on?'<input class="tw-servico-valor" value="'+valorServicoWizard(s)+'" oninput="onServicoValorWizardChange(\''+s.id+'\',this.value)" onclick="event.stopPropagation()" style="width:88px;text-align:right;flex:none">':'')+
        '</div>';
      }).join('');
    }
    const totalEl=document.getElementById('tw-servicos-total');
    if(totalEl) totalEl.textContent=fmtMoney(totalServicosSelecionadosWizard());
  }
  function toggleServicoIncluidoWizard(id){
    if(twServicosSelecionados.has(id)) twServicosSelecionados.delete(id);
    else twServicosSelecionados.add(id);
    renderServicosIncluidosWizard();
  }
  function onServicoValorWizardChange(id, val){
    twServicosValores[id]=parseFloat((val||'').match(/[\d.,]+/) ? (val.match(/[\d.,]+/)[0].replace(/\./g,'').replace(',','.')) : '0')||0;
    const totalEl=document.getElementById('tw-servicos-total');
    if(totalEl) totalEl.textContent=fmtMoney(totalServicosSelecionadosWizard());
  }
  let modeloContratoSelecionado=null;
  function renderModelosSugeridos(){
    const nome=document.getElementById('tw-nome').value.trim();
    const sugestoes=sugerirModelos(nome);
    const wrap=document.getElementById('modelos-sugeridos-lista');
    if(!sugestoes.length){
      wrap.innerHTML='<p style="font-size:13px;color:var(--neutral);padding:4px 2px 10px">'+(nome? t('wizard.noMatchesFor')+escapeHtml(nome)+'".' : t('wizard.noSuggestionsYet'))+'</p>';
      return;
    }
    wrap.innerHTML=sugestoes.map(m=>modelCardHtml(m, m.id===modeloContratoSelecionado)).join('');
  }
  function selecionarModeloContrato(id){
    modeloContratoSelecionado = (modeloContratoSelecionado===id) ? null : id;
    document.querySelectorAll('.model-card').forEach(card=>{
      card.classList.toggle('selected', card.dataset.modeloId===modeloContratoSelecionado);
    });
    if(modeloContratoSelecionado) marcarModeloComoUsado(modeloContratoSelecionado);
  }
  function calcularDuracaoHoras(horaIni, horaFim){
    if(!horaIni || !horaFim) return null;
    const [h1,m1]=horaIni.split(':').map(Number);
    const [h2,m2]=horaFim.split(':').map(Number);
    let minutos=(h2*60+m2)-(h1*60+m1);
    if(minutos<=0) minutos+=24*60;
    return Math.round((minutos/60)*10)/10;
  }
  function formatarDuracao(horas){
    if(horas==null) return '';
    if(horas===Math.floor(horas)) return horas+' hora'+(horas===1?'':'s');
    const h=Math.floor(horas), m=Math.round((horas-h)*60);
    return h+'h'+String(m).padStart(2,'0');
  }
  const DUR_UNITS={
    pt:{day:'dia',days:'dias',hour:'hora',hours:'horas',min:'min',and:'e'},
    en:{day:'day',days:'days',hour:'hour',hours:'hours',min:'min',and:'and'},
    es:{day:'día',days:'días',hour:'hora',hours:'horas',min:'min',and:'y'}
  };
  /* Duração total do trabalho: considera data de início, data de fim, hora de
     início e hora de fim — não só as horas. Ex.: 01/07 14:00 → 25/07 15:00
     dá "24 dias e 1 hora". Sem data de fim, cai para o cálculo de horas do dia
     (que já lida com virar a meia-noite). */
  function formatarDuracaoTrabalho(dIni,dFim,hIni,hFim){
    if(!dIni) return formatarDuracao(calcularDuracaoHoras(hIni,hFim));
    const toMs=(d,h)=>{ const [Y,M,D]=d.split('-').map(Number); const [hh,mm]=(h||'00:00').split(':').map(Number); return Date.UTC(Y,M-1,D,hh,mm); };
    const startMs=toMs(dIni, hIni);
    let endMs=toMs(dFim||dIni, hFim||hIni||'00:00');
    if(endMs<=startMs){
      if(!dFim && hIni && hFim) return formatarDuracao(calcularDuracaoHoras(hIni,hFim));
      return '';
    }
    let mins=Math.round((endMs-startMs)/60000);
    const dias=Math.floor(mins/1440); mins-=dias*1440;
    const horas=Math.floor(mins/60); mins-=horas*60;
    const u=DUR_UNITS[LANG]||DUR_UNITS.pt;
    const parts=[];
    if(dias>0) parts.push(dias+' '+(dias===1?u.day:u.days));
    if(horas>0) parts.push(horas+' '+(horas===1?u.hour:u.hours));
    if(dias===0 && horas===0 && mins>0) parts.push(mins+' '+u.min);
    if(!parts.length) return '';
    return parts.length>1 ? parts.slice(0,-1).join(', ')+' '+u.and+' '+parts[parts.length-1] : parts[0];
  }
  function atualizarDuracaoCalculada(){
    const el=document.getElementById('tw-duracao-calc');
    if(!el) return;
    const txt=formatarDuracaoTrabalho(
      document.getElementById('tw-data').value,
      document.getElementById('tw-data-fim').value,
      document.getElementById('tw-hora').value,
      document.getElementById('tw-hora-fim').value
    );
    if(txt){ el.textContent=t('job.duration.prefix')+txt; el.style.display='block'; }
    else { el.style.display='none'; }
  }
  function formatDataHora(){
    const d=document.getElementById('tw-data').value;
    const h=document.getElementById('tw-hora').value;
    if(!d) return '';
    const [ano,mes,dia]=d.split('-').map(Number);
    const dt=new Date(ano, mes-1, dia);
    const dataFmt=dt.toLocaleDateString(jsLocale(),{day:'2-digit',month:'short'});
    return h? (dataFmt+', '+h) : dataFmt;
  }
  function lerEndereco(){
    return document.getElementById('tw-local').value.trim();
  }
  function lerEnderecoCompleto(){
    return lerEndereco();
  }
  function montarEnderecoCompleto(a, fallbackNome){
    let ruaNum=(a.road||a.pedestrian||a.suburb||fallbackNome||'').trim();
    if(a.house_number) ruaNum+=' '+a.house_number;
    const cepCidade=[a.postcode, (a.city||a.town||a.village||a.municipality)].filter(Boolean).join(' ');
    return [ruaNum, cepCidade].filter(Boolean).join(', ');
  }

  /* ===== Endereço — um único campo, geocodificação real (OpenStreetMap/Nominatim, sem chave) com fallback local ===== */
  let twGeoTimer=null;
  let twSelectedGeo=null;
  let twSelectedGeoAddr=null; // {city,state,country} — vem do address estruturado do Nominatim
  let twColaboradoresExternosPendentes=[];
  let twEmWizard=false;
  let twModeloEscolhido=null;
  function abrirColaboradorExternoNoWizard(){ abrirAdicionarColaboradorExterno('__wizard__'); }
  function renderModeloEscolhidoWizard(){
    const wrap=document.getElementById('tw-modelo-escolhido-status');
    if(!wrap) return;
    wrap.innerHTML = twModeloEscolhido ? ('<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(twModeloEscolhido.nome||'')+'</div></div>'+
      '<svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="twModeloEscolhido=null;renderModeloEscolhidoWizard()"><path d="M18 6 6 18M6 6l12 12"/></svg></div>') : '';
  }
  /* Substitui a antiga lista de toda a organização com toggles: agora cada
     colaborador é adicionado explicitamente via busca (abrirColaboradorExternoNoWizard)
     e aparece aqui como uma linha removível. Ninguém é pré-selecionado. */
  function renderColaboradoresPendentesWizard(){ renderColaboradorExternoPendenteWizard(); }
  function renderColaboradorExternoPendenteWizard(){
    const wrap=document.getElementById('tw-colab-externo-status');
    if(!wrap) return;
    wrap.innerHTML = twColaboradoresExternosPendentes.map((p,i)=>
      '<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(p.nome||p.email)+'</div><span class="sub">'+papelNomeColaborador(p.nivel_acesso)+'</span></div>'+
      '<svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="twColaboradoresExternosPendentes.splice('+i+',1);renderColaboradorExternoPendenteWizard()"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
    ).join('');
  }
  let _twAddrResults=null;
  let _twAddrLocal=null;
  /* Endereço já selecionado (com coordenadas) que o utilizador está a
     complementar — número, bloco, apartamento, sala, lote. Só invalidamos a
     geolocalização quando o texto deixa de começar por essa base, ou seja,
     quando é mesmo uma edição substancial e não apenas um complemento. */
  let twSelectedAddrBase=null;
  function onEnderecoInput(){
    const q=document.getElementById('tw-local').value.trim();
    const complementando = twSelectedAddrBase && q.startsWith(twSelectedAddrBase);
    if(!complementando){ twSelectedGeo=null; twSelectedGeoAddr=null; twSelectedAddrBase=null; }
    clearTimeout(twGeoTimer);
    const dd=document.getElementById('tw-addr-dropdown');
    if(q.length<2){ dd.style.display='none'; return; }
    if(complementando){ dd.style.display='none'; return; }
    dd.style.display='block';
    mostrarSugestoesLocais(q);
    twGeoTimer=setTimeout(()=>buscarEnderecosReais(q), 400);
  }
  async function buscarEnderecosReais(q){
    try{
      const controller=new AbortController();
      const timeoutId=setTimeout(()=>controller.abort(), 2000);
      const url='https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q='+encodeURIComponent(q);
      const res=await fetch(url, {signal:controller.signal});
      clearTimeout(timeoutId);
      if(res.ok){
        const data=await res.json();
        if(data && data.length){
          _twAddrResults=data;
          const dd=document.getElementById('tw-addr-dropdown');
          const aindaRelevante = dd && dd.style.display!=='none' && document.getElementById('tw-local').value.trim()===q;
          if(aindaRelevante){
            dd.innerHTML=data.map((r,i)=>{
              const completo=montarEnderecoCompleto(r.address||{}, (r.display_name||'').split(',')[0]);
              return '<div class="addr-row" onclick="selecionarEnderecoReal('+i+')"><div class="main">'+escapeHtml(completo||r.display_name)+'</div></div>';
            }).join('');
          }
        }
      }
    }catch(err){ /* mantém as sugestões locais já visíveis — nunca fica em branco */ }
  }
  const ENDERECOS_BASE=[
    '123 Main Street, Springfield','45 Market Square, Riverside','200 Elm Avenue, Fairview',
    '18 King Street, Newtown','77 Baker Street, London','12 Rue de la Paix, Paris',
    '9 Friedrichstraße, Berlin','30 Via Roma, Milan','58 Calle Mayor, Madrid',
    '410 Broadway, New York','1200 Sunset Boulevard, Los Angeles','88 Queen Street, Toronto',
    '15 George Street, Sydney','300 Orchard Road, Singapore','22 Marine Drive, Mumbai',
    '5 Nathan Road, Hong Kong','40 Ginza Avenue, Tokyo','101 Harbour Street, Auckland',
    '67 Long Street, Cape Town','19 Ipanema Avenue, Rio de Janeiro','250 Reforma Avenue, Mexico City',
    '8 Rose Garden Lane, Portland','36 Church Road, Dublin','14 Vasagatan, Stockholm',
    '5 Damrak, Amsterdam','21 Bahnhofstrasse, Zurich','44 Nevsky Prospect, Saint Petersburg',
    '3 Grand Canal Walk, Venice','29 Sukhumvit Road, Bangkok','12 Al Wasl Road, Dubai'
  ];
  function mostrarSugestoesLocais(q){
    const dd=document.getElementById('tw-addr-dropdown');
    const usados=jobsVisiveis().map(j=>j.local).filter(Boolean);
    const all=[...new Set([...usados, ...ENDERECOS_BASE])].filter(a=>a.toLowerCase().includes(q.toLowerCase())).slice(0,8);
    if(!all.length){
      dd.innerHTML='<div class="addr-loading u-c-neutral">'+t('wizard.noAddressMatches')+'</div>';
      return;
    }
    _twAddrLocal=all;
    dd.innerHTML=all.map((a,i)=>'<div class="addr-row" onclick="selecionarEnderecoLocal('+i+')"><div class="main">'+escapeHtml(a)+'</div></div>').join('');
  }
  function selecionarEnderecoReal(i){
    const r=_twAddrResults[i];
    const a=r.address||{};
    const completo=montarEnderecoCompleto(a, (r.display_name||'').split(',')[0]);
    const valor=completo||r.display_name;
    document.getElementById('tw-local').value=valor;
    twSelectedGeo={lat:parseFloat(r.lat), lon:parseFloat(r.lon)};
    /* Cidade/estado/país estruturados — o Nominatim já devolve isto, mas até
       aqui só a string livre (montarEnderecoCompleto) era guardada; isso
       fica no job (ver trabalhoCreate) pra alimentar o Heatmap Geográfico e
       o analytics interno com dado real, não texto adivinhado depois. */
    twSelectedGeoAddr={ city:a.city||a.town||a.village||a.municipality||null, state:a.state||null, country:a.country||null };
    twSelectedAddrBase=valor;
    document.getElementById('tw-addr-dropdown').style.display='none';
  }
  function selecionarEnderecoLocal(i){
    const valor=_twAddrLocal[i];
    document.getElementById('tw-local').value=valor;
    document.getElementById('tw-addr-dropdown').style.display='none';
    twSelectedGeo=null;
    twSelectedGeoAddr=null;
    twSelectedAddrBase=valor;
  }
  function populateEnderecoSuggestions(){ /* sugestões agora carregam ao digitar — ver onEnderecoInput() */ }
  /* Resumo final em cartões — junta e apresenta tudo o que foi definido no
     wizard antes da criação. Escreve em frases limpas, sem listas coridas com
     travessões. */
  function renderReview(){
    const cliente=document.getElementById('tw-cliente').value.trim();
    const nomeTrabalho=document.getElementById('tw-nome').value.trim();
    const valorTxt=document.getElementById('tw-valor').value.trim();
    const valorNum=parseFloat((valorTxt.match(/[\d.,]+/)||['0'])[0].replace(/\./g,'').replace(',','.'))||0;
    const inicioIso=document.getElementById('tw-data').value||null;
    const fimIso=document.getElementById('tw-data-fim').value||null;
    const hora=document.getElementById('tw-hora').value||null;
    const horaFim=document.getElementById('tw-hora-fim').value||null;
    const local=lerEndereco();
    const recorrente=document.getElementById('envio-recorrencia').classList.contains('on');

    const fmtIso=iso=> iso ? iso.split('-').reverse().join('/') : null;
    let datasTxt='';
    if(inicioIso && fimIso && inicioIso!==fimIso) datasTxt=fmtIso(inicioIso)+' a '+fmtIso(fimIso);
    else if(inicioIso) datasTxt=fmtIso(inicioIso);
    if(hora){ datasTxt+=(datasTxt?', ':'')+hora+(horaFim?(' às '+horaFim):''); }

    // responsáveis
    const nomesResp=twColaboradoresExternosPendentes.map(p=>p.nome||p.email);

    // conteúdo enviado ao cliente
    const conteudo=[];
    if(document.getElementById('envio-contrato').classList.contains('on')) conteudo.push(t('job.contract'));
    if(document.getElementById('envio-cronograma').classList.contains('on')) conteudo.push(t('wizard.schedule'));
    if(document.getElementById('envio-pessoas').classList.contains('on')) conteudo.push(t('wizard.keyPeople'));
    if(document.getElementById('envio-observacoes').classList.contains('on')) conteudo.push(t('wizard.importantNotes'));
    if(document.getElementById('envio-pagamentos').classList.contains('on')) conteudo.push(t('job.payments'));

    // pagamentos
    let pagTxt;
    if(recorrente){
      const freqLabel=t((RECORRENCIA_FREQ[document.getElementById('tw-recur-freq').value]||{}).labelKey||'recur.freq.monthly');
      pagTxt=t('recur.badge')+' · '+freqLabel+(valorNum?(' · '+fmtMoney(valorNum)+t((RECORRENCIA_FREQ[document.getElementById('tw-recur-freq').value]||{}).sufixoKey||'recur.per.month')):'');
    } else {
      const linhas=[...document.querySelectorAll('#tw-parcelas-lista [data-parc-row]')];
      if(linhas.length){
        const soma=linhas.reduce((s,r)=>s+(parseFloat(r.querySelector('.tw-parc-valor').value)||0),0);
        pagTxt=linhas.length+' '+(linhas.length===1?t('wizard.installmentOne'):t('wizard.installmentMany'))+' · '+fmtMoney(soma);
      } else {
        pagTxt=valorNum?fmtMoney(valorNum):t('resumo.none');
      }
    }

    const modelo = twModeloEscolhido ? twModeloEscolhido.nome : t('resumo.noTemplate');

    const card=(label,valor)=> valor ? '<div class="resumo-card"><div class="resumo-label">'+escapeHtml(label)+'</div><div class="resumo-value">'+escapeHtml(valor)+'</div></div>' : '';
    let html='<div class="resumo-grid">';
    html+=card(t('resumo.client'), cliente||t('resumo.toDefine'));
    html+=card(t('resumo.title'), nomeTrabalho||t('resumo.toDefine'));
    if(datasTxt) html+=card(t('resumo.dates'), datasTxt);
    if(local) html+=card(t('resumo.location'), local);
    if(nomesResp.length) html+=card(t('resumo.responsibles'), nomesResp.join(', '));
    html+=card(t('job.payments'), pagTxt);
    if(conteudo.length) html+=card(t('resumo.clientReceives'), conteudo.join(', '));
    const entregaFases=[];
    if(document.getElementById('entrega-ajustes-toggle').classList.contains('on')) entregaFases.push(t('entrega.allowAdjustments')+' ('+entregaRevisoesQtd+')');
    if(entregaFases.length) html+=card(t('wizard.step5'), entregaFases.join(', '));
    const entregaFormatoVal=document.getElementById('entrega-formato');
    if(entregaFormatoVal) html+=card(t('entrega.deliveryFormat'), t('entrega.format.'+entregaFormatoVal.value));
    html+=card(t('resumo.contractTemplate'), modelo);
    html+='</div>';
    document.getElementById('trabalho-review-summary').innerHTML=html;
  }
  function checkNovoCliente(){
    const v=document.getElementById('tw-cliente').value.trim();
    const link=document.getElementById('tw-criar-cliente');
    const dd=document.getElementById('tw-cliente-dropdown');
    const todosConhecidos = Object.values(clientesData).map(c=>c.nome);
    if(v.length<1){ link.style.display='none'; if(dd) dd.style.display='none'; return; }
    const matches = todosConhecidos.filter(n=>n.toLowerCase().includes(v.toLowerCase()));
    if(dd){
      if(matches.length && document.activeElement===document.getElementById('tw-cliente')){
        dd.innerHTML=matches.slice(0,5).map(n=>'<div class="addr-row" onclick="selecionarClienteConhecido(this)" data-nome="'+escapeHtml(n)+'"><div class="main">'+escapeHtml(n)+'</div></div>').join('');
        dd.style.display='block';
      } else { dd.style.display='none'; }
    }
    const existe = todosConhecidos.some(n=>n.toLowerCase()===v.toLowerCase());
    if(v.length>1 && !existe){
      document.getElementById('tw-novo-nome').textContent=v;
      link.style.display='inline-flex';
    } else { link.style.display='none'; }
  }
  function selecionarClienteConhecido(el){
    document.getElementById('tw-cliente').value=el.dataset.nome;
    document.getElementById('tw-cliente-dropdown').style.display='none';
    document.getElementById('tw-criar-cliente').style.display='none';
  }
  function revelarNovoCliente(){ document.getElementById('tw-novo-cliente-fields').style.display='block'; }
  /* Cria ou atualiza um cliente pelo nome, guardando email/telefone. Fonte única
     usada tanto pelo botão "Guardar cliente" do wizard como pela criação do
     trabalho — para que o email nunca se perca. Devolve o registo do cliente. */
  function upsertClientePorNome(nome, extra){
    extra=extra||{};
    if(!nome) return null;
    let cli=Object.values(clientesData).find(c=>c.nome===nome);
    if(cli){
      if(extra.email) cli.email=extra.email;
      if(extra.telefone) cli.telefone=extra.telefone;
    } else {
      /* mesmo limite de LIMITE_CLIENTES_PLANO aplicado nas telas de criação
         explícita (criarCliente/guardarNovoClienteInline) — aqui, dentro da
         criação de um trabalho, um limite atingido nunca deve interromper o
         fluxo com um modal inesperado: o trabalho continua a ser criado
         normalmente com o nome do cliente digitado, só não sobra um novo
         registo em clientesData além do limite do plano. */
      const limite=LIMITE_CLIENTES_PLANO[perfilData.plano||'Free'];
      if(Object.keys(clientesData).length>=limite){
        return { id:null, nome, tipo:'Cliente', email:extra.email||'', telefone:extra.telefone||'', empresa:'', instagram:'', notas:'' };
      }
      const id='cli'+Date.now();
      cli={ id, nome, tipo:'Cliente', email:extra.email||'', telefone:extra.telefone||'', empresa:'', instagram:'', notas:'', criadoEm:new Date().toISOString() };
      clientesData[id]=cli;
    }
    saveClientesData();
    return cli;
  }
  function guardarNovoClienteInline(){
    const nome=document.getElementById('tw-cliente').value.trim();
    if(!nome){ showToast(t('toast.writeClientName')); return; }
    const jaExiste=Object.values(clientesData).some(c=>c.nome===nome);
    if(!jaExiste){
      const limite=LIMITE_CLIENTES_PLANO[perfilData.plano||'Free'];
      if(Object.keys(clientesData).length>=limite){ abrirLimitePlanoModal('plan.limit.clientsTitle','plan.limit.clientsBody',limite); return; }
    }
    const email=(document.getElementById('tw-novo-email').value||'').trim();
    const telefone=(document.getElementById('tw-novo-tel').value||'').trim();
    upsertClientePorNome(nome, {email, telefone});
    document.getElementById('tw-novo-cliente-fields').style.display='none';
    document.getElementById('tw-criar-cliente').style.display='none';
    showToast(t('toast.clientAddedPrefix')+nome+t('toast.clientAddedSuffix'));
  }
  let criandoTrabalho=false;
  async function trabalhoCreate(){
    /* guarda contra duplo-toque/duplo-clique — sem isto, um toque duplo no botão
       "Criar trabalho" (comum em ecrãs touch, sobretudo com alguma lentidão de rede)
       criava dois registos quase idênticos, cada um com o seu próprio card e as
       suas próprias notificações de pagamento/entrega. Reforçado com o próprio
       botão desativado visualmente (não só uma flag em JS) — se o browser alguma
       vez disparar o evento de clique duas vezes por outra via (ex.: um segundo
       ponteiro/toque simultâneo), o atributo disabled já impede o segundo clique
       de sequer chegar ao handler. */
    if(criandoTrabalho) return;
    { const limite=LIMITE_TRABALHOS_PLANO[perfilData.plano||'Free'];
      if(Object.keys(jobsData).length>=limite){ abrirLimitePlanoModal('plan.limit.jobsTitle','plan.limit.jobsBody',limite); return; } }
    /* Título, Data e Hora são obrigatórios — sem isto o sistema deixava criar
       trabalhos "fantasma" (título a cair para o nome do cliente, data/hora a
       ficar null), difíceis de encontrar depois e sem entrar corretamente no
       calendário. Valida antes de sequer travar o botão, e volta ao passo 1
       do assistente (onde estes 3 campos vivem) se faltar algo. */
    const tituloVal=(document.getElementById('tw-nome').value||'').trim();
    const dataVal=document.getElementById('tw-data').value;
    const horaVal=document.getElementById('tw-hora').value;
    if(!tituloVal || !dataVal || !horaVal){
      document.querySelectorAll('.panel[data-panel="trabalho"] .moment').forEach(m=>{
        m.style.display = m.dataset.moment==='1' ? 'block':'none';
      });
      trabalhoMoment=1;
      showToast(t('toast.requiredJobFields'));
      return;
    }
    /* Se a etapa de pagamentos estiver com parcelas próprias, cada uma precisa
       de uma data de vencimento — o valor já nunca fica nulo (default 0 em
       lerParcelasWizard), mas a data podia ficar vazia e nenhuma cobrança/
       lembrete conseguia disparar. */
    const envioPagamentosEl=document.getElementById('envio-pagamentos');
    if(envioPagamentosEl && envioPagamentosEl.classList.contains('on')){
      const parcelasSemData=[...document.querySelectorAll('#tw-parcelas-lista [data-parc-row]')]
        .some(row=>!row.querySelector('.tw-parc-data').value);
      if(parcelasSemData){
        showToast(t('toast.requiredPaymentDate'));
        return;
      }
    }
    criandoTrabalho=true;
    const btnCriar=document.querySelector('.panel[data-panel="trabalho"] button[onclick="trabalhoCreate()"]');
    if(btnCriar) btnCriar.disabled=true;
    setTimeout(()=>{ criandoTrabalho=false; if(btnCriar) btnCriar.disabled=false; }, 1500);
    const cliente=document.getElementById('tw-cliente').value.trim()||'Novo cliente';
    const nomeTrabalho=tituloVal;
    const dateRaw=dataVal||null;
    const dateFimRaw=document.getElementById('tw-data-fim').value||null;
    const horaIni=document.getElementById('tw-hora').value||null;
    const horaFim=document.getElementById('tw-hora-fim').value||null;
    const duracaoHoras=calcularDuracaoHoras(horaIni, horaFim);
    const data=formatDataHora();
    const local=lerEndereco();
    const localCompleto=lerEnderecoCompleto();
    const geo=twSelectedGeo;
    const cidadeGeo=(twSelectedGeoAddr&&twSelectedGeoAddr.city)||null;
    const estadoGeo=(twSelectedGeoAddr&&twSelectedGeoAddr.state)||null;
    const paisGeo=(twSelectedGeoAddr&&twSelectedGeoAddr.country)||null;
    const valorTxt=document.getElementById('tw-valor').value.trim();
    const valorNum=parseFloat((valorTxt.match(/[\d.,]+/)||['0'])[0].replace(/\./g,'').replace(',','.'))||0;
    const typeLabel=nomeTrabalho||t('job.typeDefault');

    // Portal do Cliente é agora sempre parte da estrutura (deixou de ser um
    // toggle manual). "cronograma:true" mantém-se porque o cronograma faz parte
    // do trabalho independentemente do que o cliente recebe.
    const ligado=id2=>{ const el=document.getElementById(id2); return !!(el && el.classList.contains('on')); };
    const envioPessoas=ligado('envio-pessoas'), envioObservacoes=ligado('envio-observacoes');
    const structure={
      contrato: ligado('envio-contrato'),
      briefing: ligado('envio-cronograma') || envioPessoas || envioObservacoes,
      cronograma: true,
      pagamentos: ligado('envio-pagamentos'),
      checklist: false,
      lembretes: ligado('tw-lembretes-toggle'),
      portal: true
    };

    /* captura o email/telefone digitados no wizard mesmo que o utilizador não
       tenha clicado em "Guardar cliente" — e persiste o cliente para reutilização.
       Sem isto, o email era descartado e o trabalho ficava sem destinatário,
       fazendo com que nenhum email automático ao cliente chegasse a ser enviado. */
    const emailInlineEl=document.getElementById('tw-novo-email');
    const telInlineEl=document.getElementById('tw-novo-tel');
    const emailInline=(emailInlineEl&&emailInlineEl.value||'').trim();
    const telInline=(telInlineEl&&telInlineEl.value||'').trim();
    const clienteExistente=upsertClientePorNome(cliente, {email:emailInline, telefone:telInline});
    /* categoria/segmento — mesclados ao título na classificação da
       Segmentação Financeira (Relatórios). "+ Personalizado" já grava o
       valor na lista pessoal da conta dentro de lerCategoriaWizard/
       lerSegmentoWizard, antes de devolver o valor final. */
    const categoriaInfo=lerCategoriaWizard();
    const segmentoVal=lerSegmentoWizard(categoriaInfo.id);
    const id='job'+Date.now()+Math.random().toString(36).slice(2,7);
    const job={ id, typeLabel, nome:nomeTrabalho, client:cliente, modo:trabalhoModo,
      categoria:categoriaInfo.label, segmento:segmentoVal,
      email:emailInline||(clienteExistente&&clienteExistente.email)||'',
      date:data, dateRaw, dateFimRaw, horaIni, horaFim, duracaoHoras, local, localCompleto, geo, cidadeGeo, estadoGeo, paisGeo, value:valorNum, structure,
      contract:{status:'vazio', blocks:[], templateName:null, link:null, signerName:null, signedAt:null},
      briefing:null, checklist:null, recursos:[...recursosAdicionaisAtuais], calendarioSync:null,
      recorrencia:null,
      payments:[], milestones:[], reminders:[], history:[], assignedTo:[],
      teamPermissions: {}, entrega: lerEntregaWizard(), criadoEm:new Date().toISOString() };
    // Recorrência (definida na Etapa 1): valor por ciclo = campo Valor;
    // primeira cobrança = data de início; renovação automática ligada => sem
    // data de fim (renova indefinidamente); desligada => usa a data de fim.
    const recorrLigada = document.getElementById('envio-recorrencia').classList.contains('on');
    if(recorrLigada){
      const freq=document.getElementById('tw-recur-freq').value;
      const valorCiclo=valorNum||0;
      const inicio=dateRaw || new Date().toISOString().slice(0,10);
      const renovaAuto=document.getElementById('tw-recur-renova').classList.contains('on');
      const fim=renovaAuto ? null : (document.getElementById('tw-recur-fim').value || null);
      iniciarRecorrencia(job, freq, valorCiclo, inicio, fim);
    } else {
      const parcelasListaEl=document.getElementById('tw-parcelas-lista');
      job.payments = job.structure.pagamentos
        ? ((parcelasListaEl && parcelasListaEl.children.length) ? lerParcelasWizard() : gerarPagamentos(job))
        /* mesmo sem pagamentos ativados, o valor da parcela nunca fica nulo — fica
           um registo de €0 com a data do próprio trabalho como vencimento, em vez
           de um array vazio sem nenhuma referência de valor/data. */
        : [{label:t('field.payment'), amount:0, status:'pendente', dueDate:dateRaw, comprovativo:null}];
    }
    // milestones depois da recorrência: um contrato recorrente não tem
    // "sinal + pagamento final", tem ciclos — as etapas de meia-parcela são
    // suprimidas em gerarMilestones quando job.recorrencia existe.
    job.milestones = gerarMilestones(job);
    job.reminders = job.structure.lembretes ? gerarLembretes(job) : [];
    job.briefing = job.structure.briefing ? gerarBriefing(job) : null;
    job.checklist = job.structure.checklist ? gerarChecklist(job) : null;
    if(twModeloEscolhido){
      job.contract.blocks = twModeloEscolhido.blocks.map(b=>Object.assign({}, b));
      job.contract.templateName = twModeloEscolhido.nome;
      job.contract.status = 'rascunho';
    }
    /* Serviços (Etapa 4): snapshot dos modelos escolhidos — com o valor
       eventualmente editado ali — vira um bloco extra no contrato, além dos
       blocos do modelo/template. */
    if(twServicosSelecionados.size){
      const servicosSnapshot=servicosData.filter(s=>twServicosSelecionados.has(s.id))
        .map(s=>({nome:s.nome, categoria:s.categoria||'', descricao:s.descricao||'', valor:valorServicoWizard(s)}));
      job.contract.blocks.push({id:genId(), key:'servicosIncluidos', on:true, params:{servicos:servicosSnapshot}});
    }
    // Exigir documento de identificação (Etapa 7 — Contrato): o portal do
    // cliente passa a pedir tipo+número do documento antes de assinar, e o
    // valor entra no hash e na folha de prova (ver assinarContratoCliente).
    job.contract.exigirDocumento = ligado('tw-exigir-doc');
    pushHistory(job,t('toast.jobCreated')+(trabalhoModo==='rapido'?t('toast.quickMode'):''));
    jobsData[id]=job;
    renderJobCard(job);
    saveJobsData();
    registrarAnalyticsJobCriado(job);
    /* Espera as inserções de colaboradores terminarem ANTES de abrir o
       Portal Operacional — sem isto, o card de Colaboradores fazia a sua
       leitura antes das linhas existirem no Supabase (condição de corrida)
       e mostrava "sem colaboradores" mesmo tendo sido adicionados na
       criação do trabalho. */
    await Promise.all(twColaboradoresExternosPendentes.map(p=>finalizarColaboradorExternoPendente(job, p)));
    // Portal do Cliente + código de acesso + email são automáticos assim que
    // o trabalho é criado — o utilizador não precisa de gerar o link à mão
    // depois. "Reenviar Email" no Portal Operacional continua disponível
    // para reenviar o mesmo acesso caso o cliente não tenha recebido.
    await gerarPortalClienteAutomatico(job);
    closeSheet();
    showToast(t('toast.jobCreated')+' '+nomeTrabalho+'.');
    openJob(id);
    resetTrabalho();
  }
  async function gerarPortalClienteAutomatico(job){
    try{
      const token=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36)).replace(/-/g,'').slice(0,20);
      const { error } = await sb.from('portal_tokens').insert({ token, workspace_id: currentWorkspaceId, job_id: job.id });
      if(error){ console.error('Erro ao gerar portal automático:', error); return; }
      job.contract.link = window.location.origin + '/?portal=' + token;
      job.contract.codigoAcesso = gerarCodigoAcessoPortal();
      saveJobsData();
      if(job.email){
        dispararEmailConta('portalCriado', job.email, { nome: job.client, projeto: job.nome||job.typeLabel||'', ctaUrl: job.contract.link, codigo: job.contract.codigoAcesso }, true);
      }
    }catch(e){ console.error('Erro ao gerar portal automático:', e); }
  }
  async function finalizarColaboradorExternoPendente(job, p){
    const briefing = p.permissoes.briefing && job.briefing ? {perguntas:job.briefing.perguntas||[], observacoes:''} : null;
    const datas = p.permissoes.datas ? {date:job.date, local:job.local} : null;
    const contrato = p.permissoes.contrato ? {status:job.contract.status} : null;
    const financeiro = p.permissoes.financeiro ? {value:job.value, payments:[]} : null;
    const semConta = !p.userId;
    const token = semConta ? gerarTokenColaborador() : null;
    const codigo = semConta ? gerarCodigoAcessoPortal() : null;
    const row={
      workspace_id: currentWorkspaceId, job_id: job.id, user_id: p.userId, email: p.email, token,
      nivel_acesso: p.nivel_acesso, permissoes: p.permissoes, funcao: p.funcao||null, recebe_contrato: !!(p.acordo && p.acordo.texto),
      escopo: { briefing, datas, contrato, financeiro, horasPrevistas: job.duracaoHoras||null,
        checklist: job.checklist?job.checklist.itens.map(c=>({t:c.t,feito:false})):[], tarefas:[], documentos:[],
        jobNome: job.nome||job.typeLabel, jobCliente: job.client, codigoAcesso: codigo },
      acordo: p.acordo, entregas: [], status:'convidado'
    };
    const { error } = await sb.from('external_collaborators').insert(row);
    if(error){ console.error('Erro ao convidar colaborador externo:', error); return; }
    const jobNome = job.nome||job.typeLabel;
    const remetente = perfilData.nome||t('defaults.userName');
    const remetenteAvatarCor=avatarColor(remetente), remetenteIniciais=avatarInitials(remetente);
    const remetenteFoto = (perfilData.fotoUrl && !/^data:/i.test(perfilData.fotoUrl)) ? perfilData.fotoUrl : null;
    await enviarEmailConviteColaborador({semConta, email:p.email, jobNome, remetente, remetenteAvatarCor, remetenteIniciais, remetenteFoto, token, codigo});
  }
  function gerarDatasEventoICS(job){
    if(!job.dateRaw) return null;
    const ini=job.horaIni||'10:00';
    const [ah,am]=ini.split(':').map(Number);
    const inicio=new Date(job.dateRaw+'T'+ini+':00');
    let fim;
    if(job.horaFim){ fim=new Date(job.dateRaw+'T'+job.horaFim+':00'); if(fim<=inicio) fim=new Date(inicio.getTime()+2*3600000); }
    else fim=new Date(inicio.getTime()+2*3600000);
    return {inicio, fim};
  }
  function sincronizarComGoogleCalendar(id){
    const job=jobsData[id];
    const datas=gerarDatasEventoICS(job);
    const fmt=d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    let url='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(job.nome||job.client);
    if(datas) url+='&dates='+fmt(datas.inicio)+'/'+fmt(datas.fim);
    if(job.local) url+='&location='+encodeURIComponent(job.local);
    url+='&details='+encodeURIComponent('Trabalho · '+job.client);
    window.open(url, '_blank');
    job.calendarioSync='google';
    saveJobsData();
    closeInfo();
    if(document.getElementById('v-detalhe').classList.contains('active')) renderJobDetailDynamic(id);
    showToast(t('toast.googleSynced'));
  }
  function sincronizarComAppleCalendar(id){
    const job=jobsData[id];
    const datas=gerarDatasEventoICS(job);
    const fmt=d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const agora=fmt(new Date());
    let ics='BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pivots//PT\nBEGIN:VEVENT\nUID:'+id+'@pivot\nDTSTAMP:'+agora+'\n';
    if(datas) ics+='DTSTART:'+fmt(datas.inicio)+'\nDTEND:'+fmt(datas.fim)+'\n';
    ics+='SUMMARY:'+(job.nome||job.client)+'\n';
    if(job.local) ics+='LOCATION:'+job.local+'\n';
    ics+='DESCRIPTION:Trabalho · '+job.client+'\nEND:VEVENT\nEND:VCALENDAR';
    const blob=new Blob([ics], {type:'text/calendar'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(job.nome||job.client).toLowerCase().replace(/\s+/g,'-')+'.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    job.calendarioSync='apple';
    saveJobsData();
    closeInfo();
    if(document.getElementById('v-detalhe').classList.contains('active')) renderJobDetailDynamic(id);
    showToast(t('toast.appleSynced'));
  }
  function resetTrabalho(){
    trabalhoMoment=1; trabalhoModo='completo'; twSelectedGeo=null; twSelectedGeoAddr=null; twSelectedAddrBase=null; twColaboradoresExternosPendentes=[]; twModeloEscolhido=null; twEmWizard=false; twServicosSelecionados=new Set(); twServicosValores={};
    const exigirDocEl=document.getElementById('tw-exigir-doc'); if(exigirDocEl) exigirDocEl.classList.toggle('on', !!perfilData.exigirDocumentoAssinaturaPadrao);
    document.querySelectorAll('.panel[data-panel="trabalho"] .moment').forEach(m=>{
      m.style.display = m.dataset.moment==='1'?'block':'none';
    });
    ['tw-cliente','tw-nome','tw-data','tw-data-fim','tw-hora','tw-hora-fim','tw-local','tw-valor','tw-novo-email','tw-novo-tel','tw-categoria-custom','tw-segmento-custom'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    const catSel=document.getElementById('tw-categoria'); if(catSel) catSel.value='';
    const segSel=document.getElementById('tw-segmento');
    if(segSel){ segSel.innerHTML='<option value="">'+t('wizard.segmentPlaceholder')+'</option>'; segSel.disabled=true; }
    const catCustomField=document.getElementById('tw-categoria-custom-field'); if(catCustomField) catCustomField.style.display='none';
    const segCustomField=document.getElementById('tw-segmento-custom-field'); if(segCustomField) segCustomField.style.display='none';
    const durCalc=document.getElementById('tw-duracao-calc'); if(durCalc) durCalc.textContent='';
    recursosAdicionaisAtuais=[]; renderRecursosLista();
    const dd=document.getElementById('tw-addr-dropdown'); if(dd) dd.style.display='none';
    const link=document.getElementById('tw-criar-cliente'); if(link) link.style.display='none';
    const nf=document.getElementById('tw-novo-cliente-fields'); if(nf) nf.style.display='none';
    const parcLista=document.getElementById('tw-parcelas-lista'); if(parcLista) parcLista.innerHTML='';
    const parcWrap=document.getElementById('tw-parcelas-wrap'); if(parcWrap) parcWrap.style.display='block';
    // Portal do Cliente deixou de ser toggle; as opções "o que o cliente recebe"
    // começam todas ligadas.
    ['envio-contrato','envio-cronograma','envio-pessoas','envio-observacoes','envio-pagamentos'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.add('on'); });
    const envioRec=document.getElementById('envio-recorrencia'); if(envioRec) envioRec.classList.remove('on');
    const recCfg=document.getElementById('tw-recorrencia-config'); if(recCfg) recCfg.style.display='none';
    const recRenova=document.getElementById('tw-recur-renova'); if(recRenova) recRenova.classList.add('on');
    const recFimWrap=document.getElementById('tw-recur-fim-wrap'); if(recFimWrap) recFimWrap.style.display='none';
    const recFimEl=document.getElementById('tw-recur-fim'); if(recFimEl) recFimEl.value='';
    const recFreq=document.getElementById('tw-recur-freq'); if(recFreq) recFreq.value='mensal';
    // Etapa 5 — Entrega e Aprovação: toggles desligados por padrão, campos limpos.
    ['entrega-ajustes-toggle'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('on'); });
    ['entrega-ajustes-wrap'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
    ['entrega-data'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    entregaRevisoesQtd=1; atualizarDisplayRevisoes();
    const entregaFormato=document.getElementById('entrega-formato'); if(entregaFormato) entregaFormato.value='digital';
    const lembretesToggle=document.getElementById('tw-lembretes-toggle'); if(lembretesToggle) lembretesToggle.classList.add('on');
  }
