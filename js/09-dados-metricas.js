/* Pivots — dados metricas
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== MOTOR DE DADOS REAL — trabalhos criados, contratos, assinatura ===== */
  let jobsData={};
  let currentJobId=null;
  let clientContext=null;

  function fmtMoney(v){ return Math.round(v||0).toLocaleString(jsLocale())+'€'; }
  /* fundo neutro (grafite/preto fosco) pra todo avatar sem foto — sem cor
     aleatória por nome; só as iniciais identificam a pessoa. */
  function avatarColor(name){
    return '#26272A';
  }
  function avatarInitials(name){
    const parts=(name||'?').trim().split(/\s+/).filter(Boolean);
    if(parts.length>=2) return (parts[0][0]+parts[1][0]).toUpperCase();
    return (name||'?').slice(0,2).toUpperCase();
  }
  function avatarHtml(name,size,foto){
    size=size||30;
    if(foto) return '<div class="client-avatar" style="width:'+size+'px;height:'+size+'px;background-image:url('+foto+');background-size:cover;background-position:center"></div>';
    return '<div class="client-avatar" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*0.4)+'px;background:'+avatarColor(name||'?')+'">'+avatarInitials(name)+'</div>';
  }


  /* Navegação de mês em Relatórios — infinita nos dois sentidos, cruza anos
     automaticamente. As datas já estavam guardadas em cada job/pagamento/despesa;
     calcularEstatisticasMes()/custosDoMes()/etc. agora aceitam (ano,mes) para
     filtrar por qualquer mês real, então não há "dados inventados" — meses
     futuros só mostram zeros honestos porque ainda não existe nada com essa data. */
  let relAno = new Date().getFullYear();
  let relMes = new Date().getMonth()+1; // 1-12 — âncora usada pelos gráficos mensais (linha, histórico de 12 meses)
  /* relPeriodo controla o âmbito agregado dos blocos de números (Card 1/2) e da
     lista do Card 4 — mês/trimestre/ano/intervalo. Composição por cima das
     funções existentes (calcularEstatisticasMes etc.), sem alterar a lógica
     interna delas: cada tipo apenas soma o resultado de vários meses. */
  let relPeriodo = { tipo:'mes' };
  function relRangeMeses(){
    if(relPeriodo.tipo==='trimestre'){
      const fim=relPeriodo.mesFim, out=[];
      for(let m=fim-2;m<=fim;m++) out.push({ano:relPeriodo.ano, mes:m});
      return out;
    }
    if(relPeriodo.tipo==='ano'){
      const out=[]; for(let m=1;m<=12;m++) out.push({ano:relPeriodo.ano, mes:m});
      return out;
    }
    if(relPeriodo.tipo==='intervalo'){
      const out=[], seen=new Set();
      let d=new Date(relPeriodo.ini+'T00:00:00');
      const fim=new Date(relPeriodo.fim+'T00:00:00');
      while(d<=fim){
        const k=d.getFullYear()+'-'+(d.getMonth()+1);
        if(!seen.has(k)){ seen.add(k); out.push({ano:d.getFullYear(), mes:d.getMonth()+1}); }
        d=new Date(d.getFullYear(), d.getMonth()+1, 1);
      }
      return out;
    }
    return [{ano:relAno, mes:relMes}];
  }
  function relStatsAgregadas(){
    return relStatsParaRange(relRangeMeses());
  }
  function relLabelPeriodo(){
    const fmtD=d=>d.split('-').reverse().join('/');
    if(relPeriodo.tipo==='trimestre') return {big:'T'+Math.ceil(relPeriodo.mesFim/3), small:String(relPeriodo.ano), compact:false};
    if(relPeriodo.tipo==='ano') return {big:String(relPeriodo.ano), small:'', compact:false};
    if(relPeriodo.tipo==='intervalo') return {big:fmtD(relPeriodo.ini)+' – '+fmtD(relPeriodo.fim), small:'', compact:true};
    return {big:mesCompleto(relMes-1), small:String(relAno), compact:false};
  }

  /* ===== seletor avançado de período — modal aberto ao tocar no mês/ano ===== */
  let relPeriodoTabTemp='mes', relPeriodoAnoTemp=new Date().getFullYear();
  function abrirSeletorPeriodo(){
    relPeriodoTabTemp = relPeriodo.tipo;
    relPeriodoAnoTemp = relPeriodo.tipo==='mes' ? relAno : (relPeriodo.ano || relAno);
    const tabs=[['mes','reports.period.month'],['trimestre','reports.period.quarter'],['ano','reports.period.year'],['intervalo','reports.period.custom']];
    const html = '<div class="segmented" id="periodo-tabs">' +
      tabs.map(([tipo,key])=>'<button class="'+(relPeriodoTabTemp===tipo?'on':'')+'" onclick="relTrocarTabPeriodo(\''+tipo+'\')">'+t(key)+'</button>').join('') +
      '</div><div id="periodo-body"></div>';
    openInfo(t('reports.period.title'), html);
    renderPeriodoBody();
  }
  function relTrocarTabPeriodo(tipo){
    relPeriodoTabTemp=tipo;
    document.querySelectorAll('#periodo-tabs button').forEach(b=>b.classList.toggle('on', b.getAttribute('onclick').indexOf("'"+tipo+"'")!==-1));
    renderPeriodoBody();
  }
  function renderPeriodoBody(){
    const body=document.getElementById('periodo-body'); if(!body) return;
    const tipo=relPeriodoTabTemp;
    if(tipo==='mes'){
      const cels=[...Array(12).keys()].map(m=>{
        const on = relPeriodo.tipo==='mes' && relPeriodoAnoTemp===relAno && (m+1)===relMes;
        return '<div class="rel-month-cell'+(on?' on':'')+'" onclick="relEscolherMes('+relPeriodoAnoTemp+','+(m+1)+')">'+mesCompleto(m).slice(0,3)+'</div>';
      }).join('');
      body.innerHTML = '<div class="rel-year-nav"><span onclick="relPeriodoAnoTemp--;renderPeriodoBody()">‹</span><b>'+relPeriodoAnoTemp+'</b><span onclick="relPeriodoAnoTemp++;renderPeriodoBody()">›</span></div><div class="rel-month-grid">'+cels+'</div>';
    } else if(tipo==='trimestre'){
      const cels=[1,2,3,4].map(q=>{
        const on = relPeriodo.tipo==='trimestre' && relPeriodo.ano===relPeriodoAnoTemp && Math.ceil((relPeriodo.mesFim||0)/3)===q;
        return '<div class="rel-month-cell'+(on?' on':'')+'" onclick="relEscolherTrimestre('+relPeriodoAnoTemp+','+q+')">T'+q+'</div>';
      }).join('');
      body.innerHTML = '<div class="rel-year-nav"><span onclick="relPeriodoAnoTemp--;renderPeriodoBody()">‹</span><b>'+relPeriodoAnoTemp+'</b><span onclick="relPeriodoAnoTemp++;renderPeriodoBody()">›</span></div><div class="rel-month-grid">'+cels+'</div>';
    } else if(tipo==='ano'){
      const base=relPeriodoAnoTemp;
      const anos=[base-2,base-1,base,base+1,base+2];
      const cels=anos.map(a=>{
        const on = relPeriodo.tipo==='ano' && relPeriodo.ano===a;
        return '<div class="rel-month-cell'+(on?' on':'')+'" onclick="relEscolherAno('+a+')">'+a+'</div>';
      }).join('');
      body.innerHTML = '<div class="rel-month-grid rel-year-grid">'+cels+'</div>';
    } else {
      const hoje=new Date().toISOString().slice(0,10);
      const ini = relPeriodo.tipo==='intervalo' ? relPeriodo.ini : hoje;
      const fim = relPeriodo.tipo==='intervalo' ? relPeriodo.fim : hoje;
      body.innerHTML = '<div class="field"><label>'+t('reports.period.from')+'</label><input type="date" id="periodo-ini" value="'+ini+'"></div>'+
        '<div class="field"><label>'+t('reports.period.to')+'</label><input type="date" id="periodo-fim" value="'+fim+'"></div>'+
        '<button class="btn primary u-w-full" onclick="relAplicarIntervalo()">'+t('collab.apply')+'</button>';
    }
  }
  function _relRefreshDash(){ if(typeof renderMonthTicker==='function') renderMonthTicker(); if(typeof clonarCardParaDashboard==='function') clonarCardParaDashboard('rel-anchor-destaques','dash-card-destaques'); }
  function relEscolherMes(ano,mes){ relPeriodo={tipo:'mes'}; relAno=ano; relMes=mes; closeInfo(); renderRelatorios(); _relRefreshDash(); }
  function relEscolherTrimestre(ano,q){ relPeriodo={tipo:'trimestre',ano,mesFim:q*3}; relAno=ano; relMes=q*3; closeInfo(); renderRelatorios(); _relRefreshDash(); }
  function relEscolherAno(ano){ relPeriodo={tipo:'ano',ano}; relAno=ano; relMes=12; closeInfo(); renderRelatorios(); _relRefreshDash(); }
  function relAplicarIntervalo(){
    const ini=document.getElementById('periodo-ini').value, fim=document.getElementById('periodo-fim').value;
    if(!ini || !fim || ini>fim) return;
    relPeriodo={tipo:'intervalo', ini, fim};
    const fimD=new Date(fim+'T00:00:00');
    relAno=fimD.getFullYear(); relMes=fimD.getMonth()+1;
    closeInfo(); renderRelatorios(); _relRefreshDash();
  }

  /* ── Dashboard card full-view expansion ── */
  var _dashCardAberto=null;
  var _DASH_TITULOS={financeiro:'Financeiro',operacional:'Operacional',destaques:'Destaques'};
  function abrirDashCard(e,tipo){
    var el=e.target, wrpId='dash-card-'+tipo;
    while(el && el.id!==wrpId){
      if(el.hasAttribute('onclick')||el.tagName==='BUTTON'||el.tagName==='A') return;
      el=el.parentElement;
    }
    _dashCardAberto=tipo;
    var card=document.getElementById(wrpId);
    if(!card) return;
    card.classList.add('dash-card-expanded');
    var hdr=document.getElementById('dash-fullview-hdr');
    if(hdr){ hdr.classList.remove('u-hidden'); var tit=document.getElementById('dash-fvh-titulo'); if(tit) tit.textContent=_DASH_TITULOS[tipo]||tipo; }
    document.body.style.overflow='hidden';
  }
  function fecharDashCard(){
    if(_dashCardAberto){ var card=document.getElementById('dash-card-'+_dashCardAberto); if(card) card.classList.remove('dash-card-expanded'); _dashCardAberto=null; }
    var hdr=document.getElementById('dash-fullview-hdr'); if(hdr) hdr.classList.add('u-hidden');
    document.body.style.overflow='';
  }
  /* leva para a secção correspondente da vista Estatísticas — antes ia
     para 'hoje' porque Financeiro/Operacional/Destaques viviam lá; agora
     vivem em Estatísticas (ver reorganização da Dashboard de Tarefas). */
  function abrirRelatorios(tab){
    go('estatisticas');
    /* a view tem uma animação de entrada de 0.45s (fade + translateY) — rolar
       antes disso terminar faz o scrollIntoView mirar um alvo que ainda está
       a mover-se e falha silenciosamente (o ecrã fica preso no topo). Espera
       a animação acabar antes de rolar. */
    setTimeout(()=>{
      const mapa={ faturamento:'rel-anchor-financeiro', operacional:'rel-anchor-operacional', tarefas:'rel-anchor-operacional' };
      const el=document.getElementById(mapa[tab]||'rel-anchor-financeiro');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 480);
  }
  /* pequenos anéis reutilizáveis — cada "tile" é {id, label, num, den, pct, trend} */


  /* ===== estatísticas operacionais — listas por trás de cada métrica ===== */
  function opPendenciasCliente(){
    const hoje=new Date().toISOString().slice(0,10);
    const out=[];
    jobsVisiveis().filter(j=>!j.arquivado).forEach(j=>{
      const c=classificarTrabalho(j);
      const pagFuturo=(j.payments||[]).some(p=>p.status!=='pago' && (!p.dueDate || p.dueDate>=hoje));
      if(!c.fechado || pagFuturo) out.push({job:j, label:(!c.fechado?t('jobs.filter.awaiting'):t('home.pendingPayments'))+' — '+j.client});
    });
    return out;
  }
  function opPendenciasMinhas(){
    const hoje=new Date().toISOString().slice(0,10);
    const out=[];
    jobsVisiveis().filter(j=>!j.arquivado && (!j.dateRaw || j.dateRaw>=hoje)).forEach(j=>{
      const c=classificarTrabalho(j);
      if(c.aRealizar) out.push({job:j, label:t('home.executed')+' — '+(j.typeLabel||j.nome||'')});
      else if(c.aEntregar) out.push({job:j, label:t('home.delivered')+' — '+(j.typeLabel||j.nome||'')});
    });
    return out;
  }
  /* ícones semânticos monocromáticos (mesmo estilo/peso/cor) — substituem os
     pontos coloridos em Estatísticas Operacionais e Fluxo de Tarefas, que
     criavam ruído sem transmitir mais informação do que o próprio rótulo */
  /* ícones do card Estatísticas Operacionais — spec exata (lineares, sem
     moldura/preenchimento, stroke 2px, rounded caps) */
  /* Card 3 (Fluxo de Tarefas) — os mesmos 4 indicadores agregados de sempre,
     agora sob o anchor rel-anchor-tarefas. Os 3 mini-anéis que existiam aqui
     (Fechados/Executados/Concluídos) saíram — esses 3 já aparecem, com mais
     contexto (barra + histórico de 12 meses), no Card 2 Estatísticas
     Operacionais logo acima. */

  /* ===== Segmentação Financeira (Relatórios) =====
     Classifica cada projeto por nicho de mercado usando só um dicionário
     interno de palavras-chave — sem IA, sem API externa, tudo local e
     instantâneo. Compara o texto (título do projeto + nome do contrato
     usado) contra os segmentos NESTA ORDEM; o primeiro que bater vence.
     A ordem importa: segmentos de nicho/indústria do cliente vêm antes dos
     genéricos de tipo de serviço (Fotografia/Videografia/Design/Tecnologia),
     senão um "Vídeo Institucional Empresa XPTO" seria lido como Videografia
     em vez de Corporativo (que é o nicho real do cliente).
     Os segmentos e palavras-chave vieram de uma análise da biblioteca
     oficial de contratos do Pivots (legal-library/index.json, 69 modelos,
     10 mercados) — cada segmento aqui corresponde a um ou mais desses
     modelos/subcategorias reais, não a uma lista inventada. Estrutura
     modular: para adicionar um segmento novo (ex. quando a biblioteca
     ganhar modelos de um mercado ainda não coberto) basta acrescentar um
     objeto {id, label, keywords} — nada mais na função muda. */
  const SEGMENTOS_FINANCEIROS = [
    { id:'casamentos', label:'Casamentos', keywords:['casamento','casamentos','noivo','noiva','noivos','wedding','cerimônia','cerimonia','núpcias','nupcias','matrimônio','matrimonio','elopement'] },
    { id:'corporativo', label:'Corporativo', keywords:['corporativo','corporate','empresa','empresarial','institucional','conferência','conferencia','congresso','executivo','companhia'] },
    { id:'eventos', label:'Eventos', keywords:['evento','eventos','festa','aniversário','aniversario','festival','seminário','seminario','celebração','celebracao','formatura'] },
    { id:'imobiliario', label:'Imobiliário', keywords:['imóvel','imovel','imobiliário','imobiliario','propriedade','apartamento','condomínio','condominio','aluguel','residência','residencia','hotel','pousada','resort','hospedagem'] },
    { id:'construcao', label:'Construção Civil', keywords:['construção','construcao','obra','reforma','edificação','edificacao','canteiro','inspeção predial','inspecao predial'] },
    { id:'servicos_domesticos', label:'Serviços Domésticos', keywords:['pintura','pintor','pintores','faxina','limpeza','faz-tudo','faz tudo','handyman','jardinagem','paisagismo','jardineiro','mudança','mudanca','mudanças','mudancas'] },
    { id:'arquitetura', label:'Arquitetura', keywords:['arquitetura','arquitetônico','arquitetonico','arquiteto','interiores','decoração','decoracao'] },
    { id:'engenharia', label:'Engenharia', keywords:['engenharia','engenheiro','estrutural','elétrica','eletrica','mecânica','mecanica','hidráulica','hidraulica'] },
    { id:'moda', label:'Moda', keywords:['moda','fashion','editorial','lookbook','desfile','coleção','colecao'] },
    { id:'produto_ecommerce', label:'Produto & E-commerce', keywords:['produto','ecommerce','e-commerce','catálogo','catalogo','loja virtual','revenda'] },
    { id:'marketing', label:'Marketing', keywords:['marketing','redes sociais','anúncios','anuncios','tráfego pago','trafego pago','seo','campanha publicitária','campanha publicitaria'] },
    { id:'consultoria', label:'Consultoria', keywords:['consultoria','coaching','mentoria','contabilidade','auditoria','recursos humanos','rh'] },
    { id:'educacao', label:'Educação & Conteúdo', keywords:['educação','educacao','curso','workshop','tradução','traducao','podcast','redação','redacao','ensino','aula'] },
    { id:'tecnologia', label:'Tecnologia', keywords:['site','website','aplicativo','app','software','sistema','saas','api','tecnologia','desenvolvimento','plataforma'] },
    { id:'design', label:'Design', keywords:['design','identidade visual','logo','logotipo','branding','gráfico','grafico','ui','ux'] },
    { id:'fotografia', label:'Fotografia', keywords:['fotografia','foto','fotógrafo','fotografo','fotógrafa','fotografa','retrato','ensaio fotográfico','ensaio fotografico','book fotográfico','book fotografico'] },
    { id:'videografia', label:'Videografia', keywords:['vídeo','video','filmagem','videografia','videomaker','drone','documentário','documentario','videoclipe'] },
  ];
  /* substring simples (indexOf/includes) daria falso positivo — ex. "gráfico"
     (Design) bateria dentro de "fotográfico" (Fotografia), ou "api" (Tecnologia)
     dentro de "capital" (Consultoria). Confere que os caracteres antes/depois
     da ocorrência não são letras, pra só contar quando a palavra aparece
     inteira, não como pedaço de outra. */
  function ehLetra(ch){ return /[a-zà-öø-ÿ]/i.test(ch); }
  function contemPalavra(alvo, chave){
    let idx=alvo.indexOf(chave);
    while(idx!==-1){
      const antes = idx>0 ? alvo[idx-1] : ' ';
      const depois = (idx+chave.length<alvo.length) ? alvo[idx+chave.length] : ' ';
      if(!ehLetra(antes) && !ehLetra(depois)) return true;
      idx=alvo.indexOf(chave, idx+1);
    }
    return false;
  }
  function classificarSegmentoTexto(texto){
    const alvo=' '+(texto||'').toLowerCase()+' ';
    for(const seg of SEGMENTOS_FINANCEIROS){
      if(seg.keywords.some(k=>contemPalavra(alvo,k))) return seg.id;
    }
    return 'outros';
  }
  function classificarSegmentoJob(job){
    /* categoria escolhida manualmente na criação do trabalho é o sinal mais
       confiável — se bate direto com uma categoria conhecida, usa sem
       precisar varrer palavra por palavra. Senão (categoria personalizada,
       ou nenhuma escolhida), cai pro dicionário de palavras-chave, agora
       considerando também categoria+segmento no texto analisado — mais
       contexto, classificação mais precisa. */
    if(job.categoria){
      const direta=SEGMENTOS_FINANCEIROS.find(s=>s.label.toLowerCase()===String(job.categoria).toLowerCase());
      if(direta) return direta.id;
    }
    const texto=[job.categoria, job.segmento, job.nome, job.contract&&job.contract.templateName].filter(Boolean).join(' ');
    return classificarSegmentoTexto(texto);
  }
  /* ===== Analytics interno (backend) =====
     Escreve eventos estruturados na tabela analytics_events do Supabase —
     workspace_id, tipo, data, valor, segmento, geografia — pra permitir
     análise cruzada entre workspaces fora do produto (SQL/BI direto no
     Supabase, via service_role). A tabela só tem policy de INSERT pro
     client (nenhuma de SELECT): o próprio app NUNCA lê isto de volta, e um
     usuário não consegue ver dado de outro. Best-effort só — nunca deve
     bloquear nem falhar visivelmente pro usuário. */
  async function registrarAnalyticsEvento(tipo, dados){
    if(!currentWorkspaceId) return;
    try{
      await sb.from('analytics_events').insert({
        workspace_id: currentWorkspaceId,
        job_id: dados.job_id||null,
        event_type: tipo,
        event_date: dados.event_date||null,
        value: dados.value!=null ? dados.value : null,
        hours: dados.hours!=null ? dados.hours : null,
        segment: dados.segment||null,
        city: dados.city||null,
        state: dados.state||null,
        country: dados.country||null,
        lat: (dados.lat!=null && !isNaN(dados.lat)) ? dados.lat : null,
        lon: (dados.lon!=null && !isNaN(dados.lon)) ? dados.lon : null
      });
    }catch(e){ /* silencioso de propósito */ }
  }
  function registrarAnalyticsJobCriado(job){
    registrarAnalyticsEvento('job_created', {
      job_id: job.id, event_date: job.dateRaw, value: job.value, hours: job.duracaoHoras,
      segment: classificarSegmentoJob(job),
      city: job.cidadeGeo||null, state: job.estadoGeo||null, country: job.paisGeo||null,
      lat: job.geo&&job.geo.lat, lon: job.geo&&job.geo.lon
    });
  }
  function registrarAnalyticsPagamento(job, pagamento){
    registrarAnalyticsEvento('payment_received', {
      job_id: job.id, event_date: pagamento.pagoEm||pagamento.dueDate, value: pagamento.amount,
      segment: classificarSegmentoJob(job),
      city: job.cidadeGeo||null, state: job.estadoGeo||null, country: job.paisGeo||null,
      lat: job.geo&&job.geo.lat, lon: job.geo&&job.geo.lon
    });
  }
  function registrarAnalyticsDespesa(despesa){
    registrarAnalyticsEvento('expense_added', { event_date: despesa.data, value: despesa.valor, segment: despesa.categoria||null });
  }
  /* ===== Categoria / Segmento (etapa de criação do trabalho) =====
     Categoria reaproveita os mesmos 17 ids/labels de SEGMENTOS_FINANCEIROS —
     uma única fonte da verdade entre o que a pessoa escolhe ao criar o
     trabalho e o que a Segmentação Financeira usa pra classificar. Segmento
     é uma escolha mais granular dentro da categoria, também baseada nas
     subcategorias reais da biblioteca oficial de contratos. "+ Personalizado"
     grava o valor digitado na lista pessoal da conta (catalogoPersonalizado),
     que passa a aparecer nas próximas criações — sem exigir nenhuma
     configuração prévia, só cresce com o uso. */
  const SEGMENTOS_POR_CATEGORIA = {
    casamentos: ['Casamento Civil','Casamento Religioso','Cerimônia Íntima / Elopement','Noivado'],
    corporativo: ['Institucional','Evento Corporativo','Treinamento','Retrato Corporativo','Apresentação Executiva'],
    eventos: ['Aniversário','Formatura','Festival','Conferência','Confraternização','Evento Social'],
    imobiliario: ['Residencial','Comercial','Hotelaria','Lançamento Imobiliário'],
    construcao: ['Residencial','Comercial','Industrial','Reforma','Inspeção Predial'],
    servicos_domesticos: ['Pintura','Limpeza Residencial','Limpeza Comercial','Jardinagem','Mudança','Reparos (Faz-Tudo)'],
    arquitetura: ['Projeto Residencial','Projeto Comercial','Design de Interiores'],
    engenharia: ['Civil','Elétrica','Mecânica','Hidráulica'],
    moda: ['Editorial','Campanha Publicitária','Lookbook','Desfile'],
    produto_ecommerce: ['Catálogo','Lançamento de Produto','Publicidade'],
    marketing: ['Redes Sociais','Tráfego Pago','SEO','Marketing de Conteúdo'],
    consultoria: ['Empresarial','Financeira / Contábil','Recursos Humanos','Coaching / Mentoria','Auditoria'],
    educacao: ['Curso Online','Workshop','Podcast','Tradução','Redação'],
    tecnologia: ['Website','Aplicativo Mobile','Software Sob Medida','SaaS','API / Integração','Manutenção'],
    design: ['Identidade Visual','UI/UX','Design Gráfico','Web Design'],
    fotografia: ['Retrato','Ensaio','Book Fotográfico','Fotografia de Produto'],
    videografia: ['Institucional','Documentário','Videoclipe','Drone','Vídeo para Redes Sociais'],
  };
  let catalogoPersonalizado={ categorias:[], segmentosPorCategoria:{} };
  function saveCatalogoPersonalizado(){ savePersisted('pivot-catalogoPersonalizado', ()=>catalogoPersonalizado); }
  async function loadCatalogoPersonalizado(){
    await loadPersisted('pivot-catalogoPersonalizado', d=>{ catalogoPersonalizado = d || { categorias:[], segmentosPorCategoria:{} }; });
  }
  function listaCategorias(){
    const base=SEGMENTOS_FINANCEIROS.map(s=>({id:s.id, label:s.label}));
    const custom=(catalogoPersonalizado.categorias||[]).map(nome=>({id:'custom:'+nome, label:nome}));
    return base.concat(custom);
  }
  function listaSegmentos(categoriaId){
    if(!categoriaId) return [];
    const base=SEGMENTOS_POR_CATEGORIA[categoriaId]||[];
    const custom=(catalogoPersonalizado.segmentosPorCategoria&&catalogoPersonalizado.segmentosPorCategoria[categoriaId])||[];
    return base.concat(custom);
  }
  function registrarCategoriaPersonalizada(nome){
    nome=(nome||'').trim(); if(!nome) return;
    if(!catalogoPersonalizado.categorias) catalogoPersonalizado.categorias=[];
    const jaExiste=listaCategorias().some(c=>c.label.toLowerCase()===nome.toLowerCase());
    if(!jaExiste){ catalogoPersonalizado.categorias.push(nome); saveCatalogoPersonalizado(); }
  }
  function registrarSegmentoPersonalizado(categoriaId, nome){
    nome=(nome||'').trim(); if(!nome || !categoriaId) return;
    if(!catalogoPersonalizado.segmentosPorCategoria) catalogoPersonalizado.segmentosPorCategoria={};
    if(!catalogoPersonalizado.segmentosPorCategoria[categoriaId]) catalogoPersonalizado.segmentosPorCategoria[categoriaId]=[];
    const jaExiste=listaSegmentos(categoriaId).some(s=>s.toLowerCase()===nome.toLowerCase());
    if(!jaExiste){ catalogoPersonalizado.segmentosPorCategoria[categoriaId].push(nome); saveCatalogoPersonalizado(); }
  }
  /* opções do <select> Categoria — sempre com "+ Personalizado" no fim */
  function categoriaOptionsHtml(selecionado){
    return listaCategorias().map(c=>'<option value="'+c.id+'"'+(c.id===selecionado?' selected':'')+'>'+escapeHtml(c.label)+'</option>').join('')+
      '<option value="__custom__">'+t('wizard.customOption')+'</option>';
  }
  function populateCategoriaWizardSelect(){
    const sel=document.getElementById('tw-categoria'); if(!sel) return;
    sel.innerHTML='<option value="" data-t="wizard.categoryPlaceholder">'+t('wizard.categoryPlaceholder')+'</option>'+categoriaOptionsHtml(null);
  }
  function segmentoOptionsHtml(categoriaId, selecionado){
    const opts=listaSegmentos(categoriaId);
    return '<option value="">'+t('wizard.segmentPlaceholder')+'</option>'+
      opts.map(s=>'<option value="'+escapeHtml(s)+'"'+(s===selecionado?' selected':'')+'>'+escapeHtml(s)+'</option>').join('')+
      '<option value="__custom__">'+t('wizard.customOption')+'</option>';
  }
  function onCategoriaWizardChange(){
    const sel=document.getElementById('tw-categoria');
    const customField=document.getElementById('tw-categoria-custom-field');
    const isCustom=sel.value==='__custom__';
    customField.style.display=isCustom?'':'none';
    const segSel=document.getElementById('tw-segmento');
    segSel.innerHTML=segmentoOptionsHtml(isCustom?null:sel.value, null);
    segSel.disabled=isCustom;
    document.getElementById('tw-segmento-custom-field').style.display='none';
  }
  function onSegmentoWizardChange(){
    const sel=document.getElementById('tw-segmento');
    document.getElementById('tw-segmento-custom-field').style.display=(sel.value==='__custom__')?'':'none';
  }
  /* resolve o valor final de categoria/segmento no submit do wizard — se for
     "+ Personalizado", lê o texto digitado e já regista na lista da conta. */
  function lerCategoriaWizard(){
    const sel=document.getElementById('tw-categoria');
    if(!sel || !sel.value) return {id:null, label:null};
    if(sel.value==='__custom__'){
      const nome=(document.getElementById('tw-categoria-custom').value||'').trim();
      if(!nome) return {id:null, label:null};
      registrarCategoriaPersonalizada(nome);
      return {id:'custom:'+nome, label:nome};
    }
    const info=listaCategorias().find(c=>c.id===sel.value);
    return info ? {id:info.id, label:info.label} : {id:null, label:null};
  }
  function lerSegmentoWizard(categoriaId){
    const sel=document.getElementById('tw-segmento');
    if(!sel || !sel.value || sel.disabled) return null;
    if(sel.value==='__custom__'){
      const nome=(document.getElementById('tw-segmento-custom').value||'').trim();
      if(!nome) return null;
      if(categoriaId) registrarSegmentoPersonalizado(categoriaId, nome);
      return nome;
    }
    return sel.value;
  }
  /* soma receita (job.value) e contagem de projetos por segmento, dentro do
     mesmo período selecionado no topo de Relatórios (mês/trimestre/ano/
     intervalo — relRangeMeses()); trabalhos deletados nunca entram, os
     demais (mesmo arquivados/concluídos) contam, igual ao resto da página. */
  /* Agrupa as despesas do período selecionado pela categoria real digitada
     na criação (ver DESPESA_CATEGORIAS_SUGERIDAS) — nunca inventa uma
     categoria por palavra-chave; despesas sem categoria (inclusive as
     criadas antes desse campo existir) caem em "Sem categoria". */
  function calcularGastosPorCategoria(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    Object.values(custosData).forEach(c=>{
      const mm=(c.data||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      const valor=Number(c.valor)||0;
      if(!valor) return;
      const nome=(c.categoria||'').trim() || t('reports.distFin.uncategorized');
      if(!acc[nome]) acc[nome]=0;
      acc[nome]+=valor;
    });
    const linhas=Object.entries(acc).map(([label,valor])=>({label, valor}));
    linhas.sort((a,b)=>b.valor-a.valor);
    return linhas;
  }

  /* ===== .rel-split — grid dividido OBRIGATÓRIO de qualquer card comparativo
     de 2 colunas em Relatórios (Fluxo, Evolução Mensal, Rentabilidade):
     divisória vertical exata no centro (border-right nas células da
     esquerda), linhas horizontais atravessando a largura toda do card
     (border-bottom em ambas as células da mesma linha, coladas sem gap —
     visualmente uma linha só), sempre N linhas fixas (preenchidas com "Sem
     dados" quando falta item real, pra altura do card nunca variar). ===== */
  function relSplitCellVazia(lado){
    return '<div class="rel-split-cell '+lado+' empty"><div class="rel-mrow-name">'+t('reports.noData')+'</div></div>';
  }
  /* N pares (esquerda,direita) intercalados na ordem que o grid de 2
     colunas espera (l1,r1,l2,r2,...) — cellFn(item,indice) devolve o HTML
     da célula preenchida; null/undefined no array vira célula "Sem dados". */
  function relSplitBuild(n, itensEsq, itensDir, cellFnEsq, cellFnDir){
    let html='';
    for(let i=0;i<n;i++){
      const e=itensEsq[i], d=itensDir[i];
      html += e!=null ? cellFnEsq(e,i) : relSplitCellVazia('l');
      html += d!=null ? cellFnDir(d,i) : relSplitCellVazia('r');
    }
    return html;
  }
  const REL_SPLIT_N=5;
  /* barra do card Fluxo — mesmos blocos retangulares/altura/espaçamento/
     cantos do card Operacional (.segment: 22px de altura, 2px de gap,
     border-radius 0), só que SEM segmentos vazios: a barra é composta só
     pelos blocos preenchidos, cujo número varia com o valor (proporcional
     ao maior item do próprio lado). Encostada no eixo central — zero gap
     entre o último/primeiro segmento e a linha (justify-content:flex-end
     no lado esquerdo, flex-start no direito) — e cresce pra fora, nunca em
     direção ao centro. */
  /* mesmo componente de barra do card Operacional (.track/.segment,
     dashboard.css): 20 blocos fixos, moldura vazia nos não preenchidos,
     preenchimento progressivo da esquerda pra direita — padrão idêntico
     pros dois lados (Recebidos/Despesas), só recolorido (.green pro
     Recebidos, laranja nativo pro Despesas). */
  /* mesma paleta de 5 cores já usada no card Financeiro do Dashboard (.mr-meta-c
     etc) — reaproveitada aqui, não uma cor nova, só a mesma legenda aplicada
     também às barras de Faturamento */
  /* Card 1 — Faturamento: linhas soltas sobre o fundo, sem caixa — a barra é o
     próprio elemento. Valor acima à direita, barra grossa de cantos quadrados
     (não pílula), rótulo por baixo. */
  /* escala em raiz quadrada, não linear — a Meta costuma ser bem maior que os
     outros valores (Esperado/Recebido/Despesas/Teto); numa escala linear isso
     reduz os outros a quadradinhos quase invisíveis. Raiz comprime a diferença
     mantendo a ordem relativa, sem inventar dados. */

  /* ===== Card "Estatísticas" (Relatórios) — reaproveita EXATAMENTE o mesmo
     componente ops-card/pintarMetricaOp da Dashboard (mesmos ícones, mesma
     barra de 20 blocos, mesma tipografia), só com o prefixo de id "ropm-" e
     os números recalculados pro período selecionado em Relatórios em vez
     do mês corrente fixo. Todas as 6 linhas usam Atual/Total da MESMA
     coorte (trabalhos com dateRaw no período), igual ao painel antigo:
       horas       → horasExecutadasEsteMes / horasEsteMes
       pendências  → pendClienteEsteMes / totalJobsEsteMes
       demandas    → pendMeuEsteMes / totalJobsEsteMes
       fechados    → fechadosPorDataEsteMes (contagem bruta, sem %)
       executados  → eventosExecutadosEsteMes / eventosPrevistosEsteMes
       concluídos  → entreguesPorDataEsteMes / totalJobsEsteMes ===== */
  function relPctVariacao(atual, anterior){
    if(!anterior) return atual>0 ? 100 : 0;
    return Math.round(((atual-anterior)/anterior)*100);
  }
  function renderRelOpBars(s){
    if(!document.getElementById('ropm-horas')) return;
    const totalJobs=s.totalJobsEsteMes||0;
    const eventosTot=s.eventosPrevistosEsteMes||0;
    var _wsHrsEsteR=(typeof wsTotalSecMesAtual==='function'?wsTotalSecMesAtual():0)/3600;
    var _horasExecR=s.horasExecutadasEsteMes+_wsHrsEsteR;
    pintarMetricaOp('horas', _horasExecR, s.horasEsteMes, horasOpNum(_horasExecR), horasOpNum(s.horasEsteMes), null, 'ropm-');
    pintarMetricaOp('pendencias', s.pendClienteEsteMes||0, totalJobs, String(s.pendClienteEsteMes||0), String(totalJobs), null, 'ropm-');
    pintarMetricaOp('demandas', s.pendMeuEsteMes||0, totalJobs, String(s.pendMeuEsteMes||0), String(totalJobs), null, 'ropm-');
    pintarMetricaOp('fechados', s.fechadosPorDataEsteMes||0, 0, '', String(s.fechadosPorDataEsteMes||0), 'contagem', 'ropm-');
    pintarMetricaOp('executados', s.eventosExecutadosEsteMes||0, eventosTot, String(s.eventosExecutadosEsteMes||0), String(eventosTot), null, 'ropm-');
    pintarMetricaOp('concluidos', s.entreguesPorDataEsteMes||0, totalJobs, String(s.entreguesPorDataEsteMes||0), String(totalJobs), null, 'ropm-');
  }

  function calcularReceitaPorSubcategoria(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    jobsVisiveis().filter(j=>!j.arquivado || j.arquivado.motivo!=='deletado' || jobTemPagamentoRecebido(j)).forEach(j=>{
      const mm=(j.dateRaw||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      if(!j.value) return;
      const nome=(j.segmento||'').trim() || t('reports.distFin.uncategorized');
      if(!acc[nome]) acc[nome]=0;
      acc[nome]+=j.value;
    });
    const linhas=Object.entries(acc).map(([label,valor])=>({label, valor}));
    linhas.sort((a,b)=>b.valor-a.valor);
    return linhas;
  }
  /* Card Fluxo — duas colunas independentes: ranking de categorias de
     Receitas (esquerda, calcularReceitaPorSubcategoria — agrupa pelo
     segmento/categoria do projeto) e ranking de categorias de Despesas
     (direita, calcularGastosPorCategoria — agrupa por custosData.categoria),
     cada uma ordenada da maior pra menor. Nunca misturadas — colunas
     totalmente separadas. SEMPRE exatamente 5 linhas (nunca menos, nunca
     "sem dados") — linhas sem categoria correspondente ficam em branco,
     mas ocupam o espaço, pra o card nunca mudar de tamanho. Só listas,
     sem barra/indicador gráfico nenhum. */
  function relFluxoDoMes(ano, mes){
    const rec=listaRecebidosDoMes(ano,mes).map(it=>Object.assign({}, it, {tipo:'recebido'}));
    const desp=listaDespesasDoMes(ano,mes).map(it=>Object.assign({}, it, {tipo:'despesa'}));
    return rec.concat(desp).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  }
  /* soma relFluxoDoMes ao longo de todo o período selecionado (mês único, ou vários
     meses no caso de trimestre/ano/intervalo — mesma função por mês, sem alterar) */
  const ICON_LAPIS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_LIXO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  /* ===== gráfico de linha: recebido e gasto acumulados no mês, com meta e teto ===== */
  function serieAcumuladaMes(ano, mes, dias){
    const recebido=new Array(dias+1).fill(0), gasto=new Array(dias+1).fill(0);
    const mesISO=ano+'-'+String(mes).padStart(2,'0');
    jobsVisiveis().forEach(j=>{
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        const d=p.pagoEm||p.dueDate; if(!d || d.slice(0,7)!==mesISO) return;
        const dia=parseInt(d.slice(8,10),10); if(dia>=1&&dia<=dias) recebido[dia]+=Number(p.amount)||0;
      });
    });
    Object.values(custosData).forEach(c=>{
      if(!c.data || c.data.slice(0,7)!==mesISO) return;
      const dia=parseInt(c.data.slice(8,10),10); if(dia>=1&&dia<=dias) gasto[dia]+=Number(c.valor)||0;
    });
    for(let i=1;i<=dias;i++){ recebido[i]+=recebido[i-1]; gasto[i]+=gasto[i-1]; }
    return {recebido, gasto};
  }
  /* série do gráfico, adaptada ao tipo de período selecionado — mês (dia a dia,
     serieAcumuladaMes inalterada), trimestre/ano (mês a mês, soma dos meses do
     range) ou intervalo personalizado (dia a dia dentro do intervalo exato,
     lendo os mesmos dados-fonte de sempre: pagamentos e custosData). */
  /* onda preenchida (não linhas/legenda/pontilhado) — recebidos como massa
     principal, despesas como camada secundária por baixo, meta/teto como linhas
     discretas sólidas. Eixo com poucos números (fórmula de passo por dias) e
     marcações discretas entre eles, sem grelha atravessando o gráfico. */
  /* despesas: âmbar (baixo) → laranja (médio) → vermelho queimado (alto), a
     linha evolui com o próprio valor em vez de ficar vermelha o tempo todo */

  function renderRelatorios(){
    const s=relStatsAgregadas();
    const lbl=relLabelPeriodo();
    const lblMesNovo=document.getElementById('rel-mes-label'), lblAnoNovo=document.getElementById('rel-ano-label');
    if(lblMesNovo){ lblMesNovo.textContent=lbl.big; lblMesNovo.classList.toggle('compact', !!lbl.compact); }
    if(lblAnoNovo) lblAnoNovo.textContent=lbl.small;

    renderResumoFinanceiroRelatorios();
    renderRelOpBars(s);
    renderDestaques();
    sincronizarTogglesDashboard();
  }
  function sincronizarTogglesDashboard(){
    const cfg=perfilData.dashboardCards||{};
    document.querySelectorAll('.dash-card-toggle[data-dash-key]').forEach(el=>{
      el.classList.toggle('on', !!cfg[el.dataset.dashKey]);
    });
  }
  /* Financeiro/Operacional/Destaques mudaram-se para a vista Estatísticas
     (deixaram de ser "cards opcionais da Dashboard de Tarefas"), por isso
     esta função ficou só com o que ainda é real: mostrar/esconder o card
     Financeiro (o único com config própria que ainda existe no DOM) e
     recalcular os Destaques. `clonarCardParaDashboard()` e os containers-
     espelho de Operacional/Destaques (`#dash-card-operacional`/
     `#dash-card-destaques`) eram código morto — nunca chegavam a ficar
     visíveis — e saíram junto com o HTML deles. */
  function renderDashCustomCards(){
    sincronizarTogglesDashboard();
    const cfg=perfilData.dashboardCards||{};
    const finEl=document.getElementById('dash-card-financeiro'); if(finEl) finEl.style.display=cfg.financeiro!==false?'block':'none';
    renderDestaques();
  }

  /* ===== DESTAQUES — dados enriquecidos por categoria ===== */
  function calcularCategoriasDetalhe(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    jobsVisiveis().filter(j=>!j.arquivado||j.arquivado.motivo!=='deletado'||jobTemPagamentoRecebido(j)).forEach(j=>{
      const mm=(j.dateRaw||'').slice(0,7);
      if(!mesesSet.has(mm)||!j.value) return;
      const nome=(j.segmento||'').trim()||t('reports.distFin.uncategorized');
      if(!acc[nome]) acc[nome]={receita:0,horas:0,projetos:0};
      acc[nome].receita+=j.value;
      acc[nome].horas+=Number(j.duracaoHoras)||0;
      acc[nome].projetos+=1;
    });
    const total=Object.values(acc).reduce((s,x)=>s+x.receita,0);
    return Object.keys(acc).map(label=>{
      const d=acc[label];
      return {label, receita:d.receita, horas:d.horas, projetos:d.projetos,
        porHora:d.horas>0?d.receita/d.horas:0,
        ticket:d.projetos>0?d.receita/d.projetos:0,
        pct:total>0?Math.round(d.receita/total*100):0};
    });
  }
  function calcularDespesasDetalhe(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    Object.values(custosData).forEach(c=>{
      const mm=(c.data||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      const v=Number(c.valor)||0; if(!v) return;
      const nome=(c.categoria||'').trim()||t('reports.distFin.uncategorized');
      if(!acc[nome]) acc[nome]={valor:0,count:0};
      acc[nome].valor+=v; acc[nome].count+=1;
    });
    const total=Object.values(acc).reduce((s,x)=>s+x.valor,0);
    return Object.keys(acc).map(label=>({
      label, valor:acc[label].valor, count:acc[label].count,
      pct:total>0?Math.round(acc[label].valor/total*100):0
    })).sort((a,b)=>b.valor-a.valor);
  }
  function renderDestaques(){
    /* Estado vazio ("ainda sem dados") passa a ler-se claramente como
       ausência — itálico, texto normal em vez de maiúsculas — em vez de
       parecer mais um valor real em caps-lock, ver auditoria de design,
       causa sistémica nº5. */
    const txt=(id,v,vazio)=>{ const el=document.getElementById(id); if(el){ el.textContent=v; el.classList.toggle('is-empty', !!vazio); } };
    const cats=calcularCategoriasDetalhe();
    const desp=calcularDespesasDetalhe();
    const regioes=calcularMercadoRegional();
    const semDados='Ainda sem dados';
    /* MAIOR RECEITA */
    const porReceita=[...cats].sort((a,b)=>b.receita-a.receita);
    txt('dest-maior-receita-nome', porReceita[0]?porReceita[0].label:semDados, !porReceita[0]);
    txt('dest-maior-receita-val',  porReceita[0]?fmtMoney(porReceita[0].receita):'');
    /* MELHOR POR HORA */
    const comHoras=cats.filter(c=>c.horas>0).sort((a,b)=>b.porHora-a.porHora);
    txt('dest-melhor-hora-nome', comHoras[0]?comHoras[0].label:semDados, !comHoras[0]);
    txt('dest-melhor-hora-val',  comHoras[0]?fmtMoney(comHoras[0].porHora)+'/h':'');
    /* MAIS TRABALHOS */
    const porProjetos=[...cats].sort((a,b)=>b.projetos-a.projetos);
    txt('dest-mais-trabalhos-nome', porProjetos[0]?porProjetos[0].label:semDados, !porProjetos[0]);
    txt('dest-mais-trabalhos-val',  porProjetos[0]?porProjetos[0].projetos+' trabalhos':'');
    /* MAIOR TICKET */
    const porTicket=cats.filter(c=>c.projetos>0).sort((a,b)=>b.ticket-a.ticket);
    txt('dest-maior-ticket-nome', porTicket[0]?porTicket[0].label:semDados, !porTicket[0]);
    txt('dest-maior-ticket-val',  porTicket[0]?fmtMoney(porTicket[0].ticket):'');
    /* MAIOR DESPESA */
    txt('dest-maior-despesa-nome', desp[0]?desp[0].label:semDados, !desp[0]);
    txt('dest-maior-despesa-val',  desp[0]?fmtMoney(desp[0].valor):'');
    /* PIOR POR HORA */
    const piorHora=comHoras.length>0?comHoras[comHoras.length-1]:null;
    txt('dest-pior-hora-nome', piorHora?piorHora.label:semDados, !piorHora);
    txt('dest-pior-hora-val',  piorHora?fmtMoney(piorHora.porHora)+'/h':'');
    /* MAIOR RECEITA POR REGIÃO */
    const porReceitaReg=[...regioes].sort((a,b)=>b.receita-a.receita);
    txt('dest-receita-regiao-nome', porReceitaReg[0]?porReceitaReg[0].cidade:semDados, !porReceitaReg[0]);
    txt('dest-receita-regiao-val',  porReceitaReg[0]?fmtMoney(porReceitaReg[0].receita):'');
    /* MAIS TRABALHOS POR REGIÃO */
    const porEventosReg=[...regioes].sort((a,b)=>b.eventos-a.eventos);
    txt('dest-trabalhos-regiao-nome', porEventosReg[0]?porEventosReg[0].cidade:semDados, !porEventosReg[0]);
    txt('dest-trabalhos-regiao-val',  porEventosReg[0]?porEventosReg[0].eventos+' trabalhos':'');
  }
  /* ===== DESTAQUE análises específicas ===== */
  function fecharDestaqueOverlay(){
    const el=document.getElementById('destaque-overlay');
    if(el) el.classList.add('u-hidden');
  }
  function abrirDestaqueDetalhe(tipo){
    const overlay=document.getElementById('destaque-overlay');
    const titulo=document.getElementById('da-title');
    const body=document.getElementById('da-body');
    if(!overlay||!titulo||!body) return;
    const cats=calcularCategoriasDetalhe();
    const desp=calcularDespesasDetalhe();
    const regioes=calcularMercadoRegional();
    const row=(nome,val,sub)=>'<div class="da-row"><div class="da-row-left"><div class="da-row-name">'+escapeHtml(nome)+'</div>'+(sub?'<div class="da-row-sub">'+sub+'</div>':'')+'</div><div class="da-row-val">'+escapeHtml(val)+'</div></div>';
    const vazio='<div class="da-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/></svg>Sem dados neste período</div>';
    let html='', label='';
    if(tipo==='maior-receita'){
      label='RECEITA POR CATEGORIA';
      const list=[...cats].sort((a,b)=>b.receita-a.receita).slice(0,10);
      html=list.length?list.map(c=>row(c.label, fmtMoney(c.receita),
        c.projetos+' trabalhos · ticket '+fmtMoney(c.ticket)+(c.horas>0?' · '+fmtMoney(c.porHora)+'/h':'')+(c.pct?' · '+c.pct+'%':'')
      )).join(''):vazio;
    } else if(tipo==='melhor-hora'){
      label='RECEITA POR HORA';
      const list=cats.filter(c=>c.horas>0).sort((a,b)=>b.porHora-a.porHora).slice(0,10);
      html=list.length?list.map(c=>row(c.label, fmtMoney(c.porHora)+'/h',
        Math.round(c.horas)+'h · '+fmtMoney(c.receita)+' · '+c.projetos+' trabalhos'
      )).join(''):vazio;
    } else if(tipo==='mais-trabalhos'){
      label='TRABALHOS POR CATEGORIA';
      const list=[...cats].sort((a,b)=>b.projetos-a.projetos).slice(0,10);
      html=list.length?list.map(c=>row(c.label, c.projetos+' trabalhos',
        fmtMoney(c.receita)+' · ticket '+fmtMoney(c.ticket)+(c.horas>0?' · '+fmtMoney(c.porHora)+'/h':'')
      )).join(''):vazio;
    } else if(tipo==='maior-ticket'){
      label='TICKET MÉDIO POR CATEGORIA';
      const list=cats.filter(c=>c.projetos>0).sort((a,b)=>b.ticket-a.ticket).slice(0,10);
      html=list.length?list.map(c=>row(c.label, fmtMoney(c.ticket),
        fmtMoney(c.receita)+' · '+c.projetos+' trabalhos'+(c.horas>0?' · '+fmtMoney(c.porHora)+'/h':'')
      )).join(''):vazio;
    } else if(tipo==='maior-despesa'){
      label='DESPESAS POR CATEGORIA';
      html=desp.length?desp.slice(0,10).map(d=>row(d.label, fmtMoney(d.valor),
        d.count+' lançamentos · '+d.pct+'% das despesas'
      )).join(''):vazio;
    } else if(tipo==='pior-hora'){
      label='MENOR RECEITA POR HORA';
      const list=cats.filter(c=>c.horas>0).sort((a,b)=>a.porHora-b.porHora).slice(0,10);
      html=list.length?list.map(c=>row(c.label, fmtMoney(c.porHora)+'/h',
        Math.round(c.horas)+'h · '+fmtMoney(c.receita)+' · '+c.projetos+' trabalhos · ticket '+fmtMoney(c.ticket)
      )).join(''):vazio;
    } else if(tipo==='receita-regiao'){
      label='RECEITA POR REGIÃO';
      const list=[...regioes].sort((a,b)=>b.receita-a.receita).slice(0,10);
      html=list.length?list.map(r=>row(r.cidade, fmtMoney(r.receita),
        r.eventos+' trabalhos · ticket '+fmtMoney(r.ticketMedio)+(r.pctReceita?' · '+r.pctReceita+'%':'')
      )).join(''):vazio;
    } else if(tipo==='trabalhos-regiao'){
      label='TRABALHOS POR REGIÃO';
      const list=[...regioes].sort((a,b)=>b.eventos-a.eventos).slice(0,10);
      html=list.length?list.map(r=>row(r.cidade, r.eventos+' trabalhos',
        fmtMoney(r.receita)+' · ticket '+fmtMoney(r.ticketMedio)
      )).join(''):vazio;
    }
    titulo.textContent=label;
    body.innerHTML=html;
    overlay.classList.remove('u-hidden');
  }

  /* ===== Evolução Mensal — período atual vs período anterior equivalente
     (mesmo nº de meses, imediatamente anterior). Rankeia por % de variação:
     top 5 que mais subiram (melhorias) e top 5 que mais caíram (quedas). ===== */
  function relRangeAnterior(meses){
    const n=meses.length;
    const primeiro=meses[0];
    const out=[];
    for(let i=n;i>=1;i--){
      let m=primeiro.mes-i, a=primeiro.ano;
      while(m<1){ m+=12; a--; }
      out.push({ano:a, mes:m});
    }
    return out;
  }
  function relStatsParaRange(meses){
    if(meses.length===1) return calcularEstatisticasMes(meses[0].ano, meses[0].mes);
    const campos=['recebido','porReceber','custos','fechadosEsteMes','realizadosEsteMes','entreguesEsteMes',
      'horasEsteMes','horasMesAnterior','horasExecutadasEsteMes','horasExecutadasMesAnterior',
      'pendClienteEsteMes','pendClienteMesAnterior','pendMeuEsteMes','pendMeuMesAnterior',
      'totalJobsEsteMes','totalJobsMesAnterior',
      'eventosPrevistosEsteMes','eventosPrevistosMesAnterior','eventosExecutadosEsteMes','eventosExecutadosMesAnterior',
      'entreguesPorDataEsteMes','entreguesPorDataMesAnterior','fechadosPorDataEsteMes','fechadosPorDataMesAnterior'];
    const acc={}; campos.forEach(c=>acc[c]=0);
    meses.forEach(({ano,mes})=>{
      const s=calcularEstatisticasMes(ano,mes);
      campos.forEach(c=>acc[c]+=s[c]||0);
    });
    const somaMetasRange=meses.reduce((s,{ano,mes})=>{ const mm=metasDoMes(ano,mes); s.receita+=mm.receita||0; s.gastos+=mm.gastos||0; return s; }, {receita:0,gastos:0});
    acc.meta=somaMetasRange.receita; acc.limiteGastos=somaMetasRange.gastos;
    return acc;
  }
  /* cada métrica carrega um "dir" (1 = subir é bom, -1 = subir é ruim) —
     é isso que classifica melhoria vs queda, não o sinal bruto do %.
     Ex.: Despesas subir é queda mesmo com pct positivo; Horas por evento
     cair é melhoria mesmo com pct negativo. */
  function relMetricasEvolucao(){
    const rangeAtual=relRangeMeses();
    const rangeAnterior=relRangeAnterior(rangeAtual);
    const atual=relStatsParaRange(rangeAtual);
    const anterior=relStatsParaRange(rangeAnterior);
    const ticketA = atual.totalJobsEsteMes ? atual.recebido/atual.totalJobsEsteMes : 0;
    const ticketP = anterior.totalJobsEsteMes ? anterior.recebido/anterior.totalJobsEsteMes : 0;
    const horasEventoA = atual.totalJobsEsteMes ? atual.horasEsteMes/atual.totalJobsEsteMes : 0;
    const horasEventoP = anterior.totalJobsEsteMes ? anterior.horasEsteMes/anterior.totalJobsEsteMes : 0;
    const receitaHoraA = atual.horasEsteMes ? atual.recebido/atual.horasEsteMes : 0;
    const receitaHoraP = anterior.horasEsteMes ? anterior.recebido/anterior.horasEsteMes : 0;
    const lucroA=atual.recebido-atual.custos, lucroP=anterior.recebido-anterior.custos;
    const margemA = atual.recebido>0 ? (atual.recebido-atual.custos)/atual.recebido*100 : 0;
    const margemP = anterior.recebido>0 ? (anterior.recebido-anterior.custos)/anterior.recebido*100 : 0;
    const metrics=[
      {label:t('reports.evolution.metric.revenue'), a:atual.recebido, p:anterior.recebido, fmt:fmtMoney, dir:1},
      {label:t('reports.evolution.metric.profit'), a:lucroA, p:lucroP, fmt:fmtMoney, dir:1},
      {label:t('reports.evolution.metric.margin'), a:margemA, p:margemP, fmt:v=>Math.round(v)+'%', dir:1},
      {label:t('reports.evolution.metric.expenses'), a:atual.custos, p:anterior.custos, fmt:fmtMoney, dir:-1},
      {label:t('reports.evolution.metric.ticket'), a:ticketA, p:ticketP, fmt:fmtMoney, dir:1},
      {label:t('reports.evolution.metric.revenuePerHour'), a:receitaHoraA, p:receitaHoraP, fmt:v=>fmtMoney(v)+'/h', dir:1},
      {label:t('reports.evolution.metric.hoursPerEvent'), a:horasEventoA, p:horasEventoP, fmt:v=>v.toFixed(1)+'h', dir:-1},
      {label:t('reports.evolution.metric.projects'), a:atual.totalJobsEsteMes, p:anterior.totalJobsEsteMes, fmt:v=>String(Math.round(v)), dir:1},
      {label:t('reports.evolution.metric.closed'), a:atual.fechadosPorDataEsteMes, p:anterior.fechadosPorDataEsteMes, fmt:v=>String(Math.round(v)), dir:1},
      {label:t('reports.evolution.metric.completed'), a:atual.entreguesPorDataEsteMes, p:anterior.entreguesPorDataEsteMes, fmt:v=>String(Math.round(v)), dir:1},
      {label:t('reports.evolution.metric.pending'), a:atual.pendClienteEsteMes, p:anterior.pendClienteEsteMes, fmt:v=>String(Math.round(v)), dir:-1},
      {label:t('reports.evolution.metric.hours'), a:atual.horasEsteMes, p:anterior.horasEsteMes, fmt:v=>Math.round(v)+'h', dir:1},
    ];
    return metrics.filter(m=>!(!m.a && !m.p)).map(m=>{
      const pct=relPctVariacao(m.a, m.p||0);
      return Object.assign({}, m, {pct, score:pct*m.dir});
    });
  }
  /* duas colunas espelhadas, sempre 5 indicadores cada (o pool de
     relMetricasEvolucao tem 12 métricas) — melhorias são as 5 com maior
     "score" (% já ajustado pelo significado da métrica), quedas as 5 com
     menor score. A seta/percentual exibidos continuam sendo o valor bruto
     (ex.: Horas por evento pode aparecer com ↓ mesmo estando na coluna de
     melhorias — caiu de fato, e cair é bom nessa métrica); a cor (verde/
     vermelho) segue a coluna, não o sinal bruto. Se houver menos de 12
     métricas com dado real no período, as colunas mostram o que existe
     (sem inventar linha vazia). */
  /* mesmo grid dividido .rel-split das outras (divisória central, linhas de
     borda a borda), 5+5 fixo — se sobrarem menos de 5 métricas reais de
     cada lado, completa com "Sem dados". */

  /* ===== Rentabilidade — receita/hora por categoria de serviço no período,
     ordenação invertível (mais/menos rentáveis primeiro). ===== */
  /* por SUBCATEGORIA (job.segmento — Casamento Religioso, Ensaio Feminino
     etc.), não por categoria de mercado (Fotografia, Videografia) — o
     nível granular é o que ajuda de fato na tomada de decisão. */
  function calcularRentabilidade(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    jobsVisiveis().filter(j=>!j.arquivado || j.arquivado.motivo!=='deletado' || jobTemPagamentoRecebido(j)).forEach(j=>{
      const mm=(j.dateRaw||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      if(!j.value || !j.duracaoHoras) return;
      const nome=(j.segmento||'').trim() || t('reports.distFin.uncategorized');
      if(!acc[nome]) acc[nome]={receita:0, horas:0};
      acc[nome].receita+=j.value;
      acc[nome].horas+=j.duracaoHoras;
    });
    return Object.keys(acc).map(label=>({ label, porHora: acc[label].horas>0 ? acc[label].receita/acc[label].horas : 0 }));
  }
  /* duas colunas: mais rentáveis (esquerda, sempre nessa ordem, sem botão
     pra inverter) vs menos rentáveis (direita, pior primeiro) — até 5 cada,
     sem barra, só nome + €/h (mesmo espírito compacto do card Indicadores). */
  /* mesmo grid dividido .rel-split das outras, 5+5 fixo — sem a zona de
     percentual, só nome em cima, €/h embaixo, mesma altura/grade. */
  /* Card unificado Rentabilidade + Eficiência: esquerda = ranking de
     rentabilidade por hora (maior → menor, até 5 subcategorias), direita =
     5 médias gerais do período (ticket médio, receita/h, receita/projeto,
     lucro médio/projeto, margem média) — mesmo grid .rel-split das demais. */
  function renderRelRentabilidade(){
    const wrap=document.getElementById('rel-rentabilidade-grid');
    if(!wrap) return;
    const ranking=calcularRentabilidade().sort((a,b)=>b.porHora-a.porHora).slice(0,REL_SPLIT_N);
    const d=calcularIndicadores();
    const indicadores=[
      {label:t('reports.indicators.ticket'), val:fmtMoney(d.ticketMedio)},
      {label:t('reports.indicators.revenuePerHour'), val:fmtMoney(d.receitaPorHora)+'/h'},
      {label:t('reports.indicators.revenuePerProject'), val:fmtMoney(d.receitaPorProjeto)},
      {label:t('reports.indicators.avgProfitPerProject'), val:fmtMoney(d.lucroMedioProjeto)},
      {label:t('reports.indicators.avgMargin'), val:Math.round(d.margemMedia)+'%'},
    ];
    const celEsq=l=>'<div class="rel-split-cell l"><div class="rel-mrow-name">'+escapeHtml(l.label)+'</div><div class="rel-mrow-value">'+fmtMoney(l.porHora)+'/h</div></div>';
    const celDir=ind=>'<div class="rel-split-cell r"><div class="rel-mrow-name">'+escapeHtml(ind.label)+'</div><div class="rel-mrow-value">'+ind.val+'</div></div>';
    wrap.innerHTML=relSplitBuild(REL_SPLIT_N, ranking, indicadores, celEsq, celDir);
  }

  /* ===== Indicadores — 5 médias do período selecionado (usado dentro do
     card unificado Rentabilidade, ver renderRelRentabilidade). ===== */
  function calcularIndicadores(){
    const meses=relRangeMeses();
    const mesesSet=new Set(meses.map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    let receitaTotal=0, projetos=0, horas=0, despesasTotal=0, pagamentosSum=0, pagamentosCount=0;
    jobsVisiveis().filter(j=>!j.arquivado || j.arquivado.motivo!=='deletado').forEach(j=>{
      const mm=(j.dateRaw||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      if(j.value){ receitaTotal+=j.value; projetos+=1; }
      horas+=Number(j.duracaoHoras)||0;
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        const d=p.pagoEm||p.dueDate;
        if(d && mesesSet.has(d.slice(0,7))){ pagamentosSum+=Number(p.amount)||0; pagamentosCount+=1; }
      });
    });
    /* trabalhos apagados ficam fora do loop acima (não entram em receitaTotal/
       projetos/horas), mas um pagamento já marcado Pago neles é receita real —
       soma só ao ticket médio, sem alterar os outros indicadores (mesmo
       critério de calcularEstatisticasMes/jobTemPagamentoRecebido). */
    jobsVisiveis().filter(j=>j.arquivado && j.arquivado.motivo==='deletado').forEach(j=>{
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        const d=p.pagoEm||p.dueDate;
        if(d && mesesSet.has(d.slice(0,7))){ pagamentosSum+=Number(p.amount)||0; pagamentosCount+=1; }
      });
    });
    meses.forEach(m=>{ despesasTotal+=custosDoMes(m.ano,m.mes); });
    return {
      ticketMedio: pagamentosCount ? pagamentosSum/pagamentosCount : 0,
      receitaPorHora: horas>0 ? receitaTotal/horas : 0,
      receitaPorProjeto: projetos>0 ? receitaTotal/projetos : 0,
      lucroMedioProjeto: projetos>0 ? (receitaTotal-despesasTotal)/projetos : 0,
      margemMedia: receitaTotal>0 ? ((receitaTotal-despesasTotal)/receitaTotal)*100 : 0,
    };
  }

  /* ===== Mercado Regional — substitui o antigo Heatmap Geográfico: tabela
     real por cidade (ordenada por receita) + insights automáticos, tudo
     escopado ao período selecionado (o heatmap antigo não era). ===== */
  function calcularMercadoRegional(){
    const mesesSet=new Set(relRangeMeses().map(m=>m.ano+'-'+String(m.mes).padStart(2,'0')));
    const acc={};
    jobsVisiveis().filter(j=>!j.arquivado || j.arquivado.motivo!=='deletado' || jobTemPagamentoRecebido(j)).forEach(j=>{
      const mm=(j.dateRaw||'').slice(0,7);
      if(!mesesSet.has(mm)) return;
      const cidade=heatCidadeDoJob(j) || t('reports.heatmap.geoNoLocation');
      if(!acc[cidade]) acc[cidade]={eventos:0, receita:0, horas:0};
      acc[cidade].eventos+=1;
      if(j.value) acc[cidade].receita+=j.value;
      acc[cidade].horas+=Number(j.duracaoHoras)||0;
    });
    const totalReceita=Object.values(acc).reduce((s,c)=>s+c.receita,0);
    const linhas=Object.entries(acc).map(([cidade,c])=>({
      cidade, eventos:c.eventos, receita:c.receita,
      ticketMedio: c.eventos>0 ? c.receita/c.eventos : 0,
      porHora: c.horas>0 ? c.receita/c.horas : 0,
      pctReceita: totalReceita>0 ? Math.round(c.receita/totalReceita*100) : 0,
    }));
    linhas.sort((a,b)=>b.receita-a.receita);
    return linhas;
  }

  /* ===== HEATMAPS =====
     Temporal: agrupa receita/lucro/projetos/horas/ticket médio/clientes
     conquistados/gastos por dia, semana, mês ou ano, e pinta cada "bucket"
     com uma cor cuja intensidade reflete o valor relativo ao máximo do
     período visível — responde "quando trabalho/ganho mais".
     Geográfico: mesma ideia, mas agrupado por cidade (única granularidade de
     localização que a app guarda de forma confiável hoje — não há campos
     separados de país/estado, só o texto livre do endereço + lat/lon
     opcionais), com filtro por segmento — responde "onde tenho mais
     clientes/faturamento/ticket". */
  /* Um único passe por todos os trabalhos/receitas/despesas, indexado por dia
     ISO (YYYY-MM-DD) — depois é só somar os dias de cada "bucket" (semana,
     mês, ano ou cidade), sem repetir a varredura dos dados por granularidade. */
  /* Cor de "menos" (quase transparente) a "mais" (laranja sólido) — mesmo
     laranja já usado nas tags de campo dinâmico e na estrutura da Biblioteca,
     pra manter uma única cor de "destaque/intensidade" em todo o app. */
  /* Extrai um nome de cidade do texto livre do endereço — última parte depois
     da vírgula, sem o código postal na frente (ex.: "Rua X, 1200 Lisboa" →
     "Lisboa"). É a única granularidade de localização confiável hoje. */
  function heatCidadeDoJob(job){
    /* Prioriza o campo estruturado (job.cidadeGeo, vindo do Nominatim na
       criação do trabalho) — só cai pra extrair da string livre em
       trabalhos criados antes dessa captura existir. */
    if(job.cidadeGeo) return job.cidadeGeo;
    const texto=job.localCompleto||job.local||'';
    if(!texto.trim()) return null;
    const partes=texto.split(',');
    let ultima=(partes[partes.length-1]||'').trim();
    ultima=ultima.replace(/^\d[\d\- ]*/,'').trim();
    return ultima || null;
  }
