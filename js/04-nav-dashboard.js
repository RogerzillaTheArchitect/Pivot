/* Pivots — nav dashboard
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  function t(key){
    const entry=STRINGS[key];
    if(!entry){ console.error('[i18n] chave inexistente: '+key); return key; }
    const val=entry[LANG];
    if(val===undefined || val===''){ console.error('[i18n] falta '+LANG+' para: '+key); return entry.pt||key; }
    return val;
  }
  /* tp() — tradução do portal do cliente (usa idiomaPortal, não idiomaUI) */
  function tp(key){
    const portalLangMap={'Português':'pt','English':'en','Español':'es'};
    const lang=(typeof perfilData!=='undefined'&&perfilData)?portalLangMap[perfilData.idiomaPortal]||'pt':'pt';
    const entry=STRINGS[key];
    if(!entry){ console.error('[i18n] chave inexistente: '+key); return key; }
    return entry[lang]!==undefined?entry[lang]:(entry.pt!==undefined?entry.pt:key);
  }
  function aplicarTraducaoCompleta(){
    document.title=t('app.subtitle');
    document.querySelectorAll('[data-t]').forEach(el=>{
      const val=t(el.dataset.t);
      if(val&&val!==el.dataset.t)el.textContent=val;
    });
    document.querySelectorAll('[data-t-placeholder]').forEach(el=>{
      const val=t(el.dataset.tPlaceholder);
      if(val)el.placeholder=val;
    });
    const pv=document.getElementById('pf-idioma-v');
    if(pv&&typeof perfilData!=='undefined'&&perfilData)pv.textContent=perfilData.idiomaUI||'Português';
    const active=document.querySelector('.view.active');
    if(active){
      const vid=active.id.replace('v-','');
      if(vid==='hoje'&&typeof renderMonthTicker==='function')renderMonthTicker();
      if(vid==='hoje'&&typeof renderTasksList==='function')renderTasksList();
      if(vid==='detalhe'&&typeof currentJobId!=='undefined'&&currentJobId&&typeof jobsData!=='undefined'&&jobsData[currentJobId]&&typeof renderJobDetailDynamic==='function')renderJobDetailDynamic(currentJobId);
      if(vid==='builder'&&typeof renderBuilder==='function')renderBuilder();
      if(vid==='equipa'&&typeof renderEquipaView==='function')renderEquipaView();
      if(vid==='bibliotecas'&&typeof renderBiblioteca==='function')renderBiblioteca();
      if(vid==='estatisticas'&&typeof renderRelatorios==='function')renderRelatorios();
    }
    if(document.getElementById('v-trabalhos').classList.contains('active')){
      document.querySelectorAll('.job[data-job-id]').forEach(div=>{
        const job=typeof jobsData!=='undefined'?jobsData[div.dataset.jobId]:null;
        if(job&&typeof updateJobCardInner==='function')updateJobCardInner(div,job);
      });
      if(typeof renderCalendar==='function')renderCalendar();
    }
  }

  const views = ['hoje','trabalhos','historico','detalhe','builder','bibliotecas','perfil','estatisticas','pesquisa','equipa','contatos','contato-detalhe','importar-arquivo','revisao-importacao'];
  function go(v){
    /* "relatorios" era o nome antigo — o conteúdo (Financeiro/Operacional/
       Destaques) já não vive em "hoje" (Dashboard de Tarefas), vive na
       vista Estatísticas. Mantém chamadas antigas a funcionar. */
    if(v==='relatorios') v='estatisticas';
    const navMap={hoje:'hoje',trabalhos:'trabalhos',historico:'trabalhos',detalhe:'trabalhos',builder:'trabalhos',
      bibliotecas:'bibliotecas',perfil:'perfil',pesquisa:'trabalhos',equipa:'perfil',
      contatos:'perfil','contato-detalhe':'perfil'};
    /* sair da área de Trabalhos (menu/página diferente) limpa a seleção de dia
       do calendário — ao voltar, mostra de novo os registos do dia atual em
       vez de continuar filtrado por um dia que a pessoa já esqueceu. */
    if(navMap[v]!=='trabalhos' && typeof calDiaAtivo!=='undefined' && calDiaAtivo!=null) calDiaAtivo=null;
    views.forEach(x=>{
      const el=document.getElementById('v-'+x); if(el) el.classList.toggle('active', x===v);
    });
    const active=navMap[v]||v;
    document.querySelectorAll('.sb-item').forEach(el=>el.classList.toggle('on', el.dataset.nav===active));
    document.querySelectorAll('.nav button[id^="n-"]').forEach(el=>el.classList.toggle('on', el.id==='n-'+active));
    document.querySelector('.screen').scrollTop=0;
    if(v==='trabalhos'){ staggerCards('#v-trabalhos .job'); renderCalendar(); }
    if(v==='hoje'){ staggerCards('#v-hoje .card, #v-hoje .collapse'); renderMonthTicker(); renderTasksList(); }
    if(v==='estatisticas'){ staggerCards('#v-estatisticas .card'); renderRelatorios(); renderDashCustomCards(); }
    if(v==='equipa') renderEquipaView();
    if(v==='bibliotecas') renderBiblioteca();
    if(v==='historico') renderHistorico();
    if(v==='colaboracoes') renderColaboracoesView();
    if(v==='contatos') abrirContatos();
    if(v==='pesquisa'){ const si=document.getElementById('searchin'); if(si) si.value=''; fakeSearch(); }
  }
  /* Meta de faturamento e limite de gastos passam a ter histórico por mês
     (chave 'AAAA-MM'), não mais um único valor global — cada mês guarda o
     valor que esteve em vigor nele. O mês corrente é sempre o único
     editável: as duas telas de definição (abrirDefinirMetaReceita/
     abrirDefinirLimiteGastos) só leem/gravam a chave do mês atual, nunca
     uma chave passada — isso já é suficiente pra "travar" meses anteriores,
     sem precisar de nenhum mecanismo extra de bloqueio: uma vez que o mês
     vira, a chave antiga simplesmente não é mais tocada por nada. Um mês
     sem valor definido (ex.: início de um mês novo, ainda sem edição)
     herda o último valor definido até ali, em vez de cair pra 0. */
  let METAS_HIST={};
  function chaveMes(ano,mes){ return ano+'-'+String(mes).padStart(2,'0'); }
  function chaveMesAtual(){ const h=new Date(); return chaveMes(h.getFullYear(), h.getMonth()+1); }
  function metasDoMes(ano,mes){
    const chave=chaveMes(ano,mes);
    if(METAS_HIST[chave]) return METAS_HIST[chave];
    const anteriores=Object.keys(METAS_HIST).filter(k=>k<=chave).sort();
    if(anteriores.length) return METAS_HIST[anteriores[anteriores.length-1]];
    return {receita:0, gastos:0};
  }
  function metasMesAtual(){
    const chave=chaveMesAtual();
    if(!METAS_HIST[chave]) METAS_HIST[chave]=Object.assign({}, metasDoMes(new Date().getFullYear(), new Date().getMonth()+1));
    return METAS_HIST[chave];
  }
  function saveMetas(){ savePersisted('pivot-metas-historico', ()=>METAS_HIST); }
  async function loadMetas(){
    await loadPersisted('pivot-metas-historico', d=>{ METAS_HIST=d||{}; });
    /* migração do formato antigo (pivot-metas: um objeto único {receita,gastos},
       sem histórico) — se ainda não existir nenhum histórico, o valor antigo
       vira o valor do mês corrente, pra não perder o que já estava configurado. */
    if(!Object.keys(METAS_HIST).length){
      await loadPersisted('pivot-metas', d=>{ if(d && (d.receita||d.gastos)) METAS_HIST[chaveMesAtual()]={receita:d.receita||0, gastos:d.gastos||0}; });
    }
    renderMonthTicker();
  }
  function abrirDefinirMetaReceita(){
    const m=metasMesAtual();
    openInfo(t('settings.projectedLabel'), `
      <div class="field"><label>${t('settings.projectedLabel')}</label><input type="number" min="0" id="meta-receita-input" value="${m.receita}" placeholder="4300"></div>
      <p class="u-xs-nd u-m-n6-2-14">${t('settings.ringHint')}</p>
      <button class="btn sec u-w-full" onclick="guardarMetaReceita()">${t('action.saveGoals')}</button>`);
  }
  function guardarMetaReceita(){
    const r=parseFloat(document.getElementById('meta-receita-input').value)||0;
    metasMesAtual().receita=r;
    saveMetas();
    renderMonthTicker();
    if(document.getElementById('v-estatisticas').classList.contains('active')) renderRelatorios();
    closeInfo();
    showToast(t('toast.goalsUpdated'));
  }
  function abrirDefinirLimiteGastos(){
    const m=metasMesAtual();
    openInfo(t('settings.limitLabel'), `
      <div class="field"><label>${t('settings.limitLabel')}</label><input type="number" min="0" id="meta-gastos-input" value="${m.gastos}" placeholder="500"></div>
      <p class="u-xs-nd u-m-n6-2-14">${t('settings.ringHint')}</p>
      <button class="btn primary u-w-full" onclick="guardarLimiteGastos()">${t('action.saveGoals')}</button>`);
  }
  function guardarLimiteGastos(){
    const g=parseFloat(document.getElementById('meta-gastos-input').value)||0;
    metasMesAtual().gastos=g;
    saveMetas();
    renderMonthTicker();
    if(document.getElementById('v-estatisticas').classList.contains('active')) renderRelatorios();
    closeInfo();
    showToast(t('toast.goalsUpdated'));
  }
  /* Donut Financeiro — dois anéis concêntricos sólidos (sem gradiente/ramp
     de cor, sem glow). Externo (receitas): Esperado/Recebido/Extras. Interno
     (despesas): Teto de gastos como anel-base fixo (sempre 100%, cobre a
     pista) com Despesas por cima crescendo sobre ele — ao ultrapassar o
     teto, Despesas cobre o Teto por completo, comunicando o estouro sem
     precisar de rampa de cor. Cada indicador nasce às 12h (o <svg> já roda
     -90deg via CSS) e, ao passar de 360°, não reinicia: continua desenhando
     sobre o mesmo percurso (base = volta(s) fechada(s) em círculo cheio,
     tip = arco parcial da volta atual). As pontas ganham micro-gap na
     extremidade (separação sutil de leitura) e cantos levemente chanfrados
     (nem pill, nem corte duro). Ver anelArcoPath/anelCheioPath. */
  const MR_CHAMFER=2.2; // svg units — chanfro mínimo nas pontas do arco
  // gradiente de despesas: 6 bandas de 60° cada (0°→100% do limite = amarelo→vermelho escuro)
  function anelPonto(cx,cy,r,a){ return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
  /* arco parcial em forma de "fatia de anel" (path preenchido, não stroke),
     com os 4 cantos levemente chanfrados por MR_CHAMFER — evita tanto a
     ponta em pílula (round) quanto o corte cru (butt) das libs padrão. */
  function anelArcoPath(cx,cy,rOut,rIn,a0,a1,chamfer){
    const span=a1-a0;
    if(span<=0.001) return '';
    let dOut=chamfer/rOut, dIn=chamfer/rIn;
    if(span < (dOut+dIn)*1.4){ dOut=0; dIn=0; }
    const large=(span-dOut-dIn) > Math.PI ? 1 : 0;
    const [ox0,oy0]=anelPonto(cx,cy,rOut,a0+dOut);
    const [ox1,oy1]=anelPonto(cx,cy,rOut,a1-dOut);
    const [ix1,iy1]=anelPonto(cx,cy,rIn,a1-dIn);
    const [ix0,iy0]=anelPonto(cx,cy,rIn,a0+dIn);
    return 'M'+ox0+' '+oy0+' A'+rOut+' '+rOut+' 0 '+large+' 1 '+ox1+' '+oy1+
      ' L'+ix1+' '+iy1+' A'+rIn+' '+rIn+' 0 '+large+' 0 '+ix0+' '+iy0+' Z';
  }
  /* anel cheio (360°) — usado pela base de voltas já fechadas e pelo
     indicador fixo do Teto de gastos (sempre "100%"). */
  function anelCheioPath(cx,cy,rOut,rIn){
    return 'M'+(cx+rOut)+' '+cy+' A'+rOut+' '+rOut+' 0 1 1 '+(cx-rOut)+' '+cy+
      ' A'+rOut+' '+rOut+' 0 1 1 '+(cx+rOut)+' '+cy+
      ' M'+(cx+rIn)+' '+cy+' A'+rIn+' '+rIn+' 0 1 0 '+(cx-rIn)+' '+cy+
      ' A'+rIn+' '+rIn+' 0 1 0 '+(cx+rIn)+' '+cy+' Z';
  }
  /* anima o crescimento da ponta (ease-out) recalculando o path a cada
     frame — substitui a antiga transição CSS de stroke-dashoffset, que não
     se aplica mais porque o anel agora é desenhado como path preenchido. */
  /* gradiente contínuo das despesas: 6 bandas fixas de 60° cada, ancoradas
     na posição angular (0°=início/amarelo → 360°=100% do limite/vermelho escuro).
     Além do limite → segunda volta em vermelho progressivamente mais escuro. */
  /* Teto (limite): agora representado apenas pelo trilho-circle — path vazio */
  /* reordena as camadas do anel externo: toda fita com ao menos uma volta
     fechada (base cheia) desce para o fundo; as pontas (arco parcial da
     volta atual) competem só entre si — a de menor fração fica por cima,
     para que a ponta de quem está começando a volta nunca fique encoberta
     pela fita mais "cheia" na volta atual. O anel interno tem ordem fixa
     (Teto sempre abaixo, Despesas sempre acima). */
  /* pinta arco circular de 240° (stroke-dasharray) — p∈[0,1], r=raio do círculo */
  function setFinArc(id, p, r){
    const el=document.getElementById(id);
    if(!el) return;
    if(el.dataset.ringFull){
      /* full-circle ring (fin2 card) */
      const C=2*Math.PI*r;
      const ratio=Math.max(0,p);
      const laps=Math.floor(ratio), frac=ratio-laps;
      const pct=Math.min(1,(laps>0&&frac<0.001)?1:frac);
      el.style.strokeDasharray=pct>0.005?(pct*C).toFixed(1)+' '+((1-pct)*C).toFixed(1):'0 '+C.toFixed(1);
      return;
    }
    const cx=170, cy=218, halfC=Math.PI*r, C=2*halfC;
    const ratio=Math.max(0,p);
    const laps=Math.floor(ratio), frac=ratio-laps;
    const pct=(laps>0 && frac<0.001) ? 1 : frac;
    const arcLen=pct*halfC;
    el.style.strokeDasharray=arcLen>0.5 ? arcLen.toFixed(1)+' '+(C-arcLen).toFixed(1) : '0 '+C.toFixed(1);
    /* ghost: arco completo a meia opacidade quando há pelo menos 1 volta completa */
    const ghostEl=document.getElementById(id.replace('-arc-','-ghost-'));
    if(ghostEl) ghostEl.style.strokeDasharray=laps>=1 ? halfC.toFixed(1)+' '+halfC.toFixed(1) : '0 '+C.toFixed(1);
    const lblEl=document.getElementById(id.replace('-arc-','-tip-'));
    if(lblEl){
      const tp=Math.min(Math.max(pct,0.01),0.99);
      const theta=Math.PI+tp*Math.PI;
      const tipX=cx+r*Math.cos(theta), tipY=cy+r*Math.sin(theta);
      lblEl.setAttribute('x',tipX.toFixed(1));
      lblEl.setAttribute('y',(tipY-12).toFixed(1));
      lblEl.textContent=pct>0.005 ? Math.round(ratio*100)+'%' : '';
      lblEl.setAttribute('text-anchor',tipX<cx-15?'end':tipX>cx+15?'start':'middle');
    }
  }
  function renderRingsDashboard(recebido, esperado, custos, extras){
    extras=extras||0;
    const mAtual=metasMesAtual();
    const meta=mAtual.receita||1, teto=mAtual.gastos||1;
    const total=recebido+extras-custos;
    /* arco verde: RECEITAS ÷ ESPERADO; arco laranja: DESPESAS ÷ LIMITE */
    const pVerde=Math.max(0,esperado>0?(recebido+extras)/esperado:0);
    const pDesp=Math.max(0,teto>0?custos/teto:0);
    setFinArc('fin-arc-meta', pVerde, 50);
    setFinArc('fin-arc-desp', pDesp, 50);
    const fset=(id,v)=>{ const elx=document.getElementById(id); if(elx) elx.textContent=v; };
    fset('fin-total', fmtMoney(total));
    const pctMeta=Math.round(meta>0?total/meta*100:0);
    const pctEl=document.getElementById('fin-pct');
    if(pctEl) pctEl.innerHTML='<span class="fin2-pct-v">'+(pctMeta>=0?'↑':'↓')+' '+Math.abs(pctMeta)+'%</span> <span class="fin2-pct-l">até a meta</span>';
    fset('fin-esperado', fmtMoney(esperado));
    fset('fin-limite', fmtMoney(teto));
    fset('fin-receitas', fmtMoney(recebido+extras));
    fset('fin-despesas', fmtMoney(custos));
  }
  /* mesmo gráfico de anéis do Dashboard, reaproveitado no card "Resumo
     Financeiro" de Relatórios (prefixo 'rf-'), mas com os valores somados
     pro período selecionado ali (relRangeMeses()) em vez de fixos no mês
     corrente — meta/teto somam a meta/teto que esteve em vigor em cada mês
     do período (ver metasDoMes), pra continuar comparável e refletir o
     histórico real de cada mês, não o valor atual multiplicado. */
  function renderResumoFinanceiroRelatorios(){
    if(!document.getElementById('rf-fin-arc-meta')) return;
    const meses=relRangeMeses();
    const s=relStatsAgregadas();
    const extrasPeriodo=meses.reduce((acc,m)=>acc+receitasDoMes(m.ano,m.mes),0);
    const recebido=s.recebido-extrasPeriodo, esperado=s.porReceber, custos=s.custos, extras=extrasPeriodo;
    const somaMetas=meses.reduce((acc,m)=>{ const mm=metasDoMes(m.ano,m.mes); acc.receita+=mm.receita||0; acc.gastos+=mm.gastos||0; return acc; }, {receita:0,gastos:0});
    const meta=somaMetas.receita||1, teto=somaMetas.gastos||1;
    const total=recebido+extras-custos;
    /* arco verde: RECEITAS ÷ ESPERADO; arco laranja: DESPESAS ÷ LIMITE */
    const pVerde=Math.max(0,esperado>0?(recebido+extras)/esperado:0);
    const pDesp=Math.max(0,teto>0?custos/teto:0);
    setFinArc('rf-fin-arc-meta', pVerde, 150);
    setFinArc('rf-fin-arc-desp', pDesp, 105);
    const set=(id,val)=>{ const elx=document.getElementById(id); if(elx) elx.textContent=val; };
    set('rf-fin-total', fmtMoney(total));
    set('rf-fin-pct', Math.round(meta>0?total/meta*100:0)+'% da meta');
    set('rf-fin-esperado', fmtMoney(esperado));
    set('rf-fin-limite', fmtMoney(teto));
    set('rf-fin-receitas', fmtMoney(recebido+extras));
    set('rf-fin-despesas', fmtMoney(custos));
  }
  /* anel genérico com suporte a "voltas": se num ultrapassa den, o arco não
     reinicia do zero — para cheio (círculo completo) e fica assim, com o
     arco e a pista (o círculo imediatamente anterior no SVG) a ganhar um
     brilho/sombreado para indicar que a meta já foi ultrapassada. A volta já
     dada nunca desaparece nem é substituída por uma volta parcial nova. */
  /* card Estatísticas Operacionais da Dashboard — barra sempre com 20 blocos
     fixos, cada um valendo 5% do total. Sem etiqueta numérica flutuante — só
     os blocos preenchidos comunicam o progresso (o valor exato já aparece
     no texto à direita da barra).
     "Fechados" é a única métrica sem percentual de um total (é a contagem
     bruta de projetos fechados no período, começando em 0): em vez de 5%
     por bloco, cada bloco ali vale exatamente 1 projeto — passar
     modo='contagem' pra essa. */
  function pintarMetricaOp(prefixo, num, den, textoAtual, textoTotal, modo, idPrefix){
    idPrefix=idPrefix||'opm-';
    const sec=document.getElementById(idPrefix+prefixo);
    const track=document.getElementById(idPrefix+prefixo+'-track');
    const end=document.getElementById(idPrefix+prefixo+'-end');
    if(!sec || !track || !end) return;
    const N=20;
    let alcancados, pct;
    if(modo==='contagem'){
      alcancados=Math.max(0, Math.min(N, Math.round(num)));
      pct=Math.round(alcancados/N*100);
    } else {
      const temMeta = den>0;
      const ratio = temMeta ? Math.min(1, num/den) : 0;
      pct = Math.round(ratio*100);
      alcancados = Math.floor(ratio*N); // cada bloco = 5% do total
    }
    sec.style.setProperty('--fill', pct);
    let html='';
    for(let i=0;i<N;i++) html += '<span class="segment'+(i<alcancados?' is-filled':'')+'"></span>';
    track.innerHTML=html;
    /* formato "concluído/total": o número concluído usa a mesma cor da
       barra preenchida, o total permanece branco — modo 'contagem' (Fechados)
       não tem um total distinto do próprio valor, então mostra só o número. */
    end.innerHTML = modo==='contagem'
      ? '<span class="ve-cur">'+escapeHtml(textoTotal)+'</span>'
      : '<span class="ve-cur">'+escapeHtml(textoAtual)+'</span><span class="ve-sep">/</span><span class="ve-tot">'+escapeHtml(textoTotal)+'</span>';
  }
  /* Réplicas exatas dos filtros "Com o cliente" / "A meu cargo" de Trabalhos
     (jobPassaChipDataset) — usadas pelos anéis "Aguardando"/"Demandas" do card
     Performance, para que o número do anel bata sempre 1:1 com o que aparece
     ao clicar. Antes disto, os anéis usavam opPendenciasCliente()/
     opPendenciasMinhas() (pensadas para a lista de Relatórios, com critérios
     mais estreitos — ex.: "Demandas" exigia só aRealizar/aEntregar, sem exigir
     contrato fechado), o que podia mostrar "6/7" no anel e nada na lista ao
     clicar, porque o filtro real exige o contrato já assinado. */
  function pendenciasClienteParaAnel(){
    return jobsVisiveis().filter(j=>!j.arquivado).filter(j=>{
      const c=classificarTrabalho(j);
      return !c.fechado || c.pagamentoPendente;
    });
  }
  function pendenciasMinhasParaAnel(){
    return jobsVisiveis().filter(j=>!j.arquivado).filter(j=>{
      const c=classificarTrabalho(j);
      return c.fechado && (c.aRealizar || c.aEntregar);
    });
  }
  /* ano/mes opcionais (mes=1-12) — omitidos, usa o mês/ano reais de hoje (mesmo
     comportamento de sempre, todo call site existente continua igual). Passados,
     permite recalcular as estatísticas para qualquer mês (navegação de Relatórios,
     histórico de 12 meses) sem inventar dados — as datas já estavam guardadas em
     cada job/pagamento, só faltava um jeito de filtrar por um mês arbitrário. */
  function calcularEstatisticasMes(ano, mes){
    let recebido=0, porReceber=0;
    let contratosFechados=0, trabalhosRealizar=0, trabalhosRealizados=0, trabalhosEntregar=0, trabalhosEntregues=0;
    let pagamentosPendentesCount=0, pagamentosTotalCount=0, trabalhosAtivos=0, trabalhosConcluidos=0;
    const hoje=new Date();
    const anoRef = ano!=null ? ano : hoje.getFullYear();
    const mesRef = mes!=null ? mes : hoje.getMonth()+1; // 1-12
    const mesAtualISO=anoRef+'-'+String(mesRef).padStart(2,'0');
    const mesAnt=new Date(anoRef, mesRef-2, 1);
    const mesAnteriorISO=mesAnt.getFullYear()+'-'+String(mesAnt.getMonth()+1).padStart(2,'0');
    let fechadosEsteMes=0, fechadosMesAnterior=0;
    let realizadosEsteMes=0, realizadosMesAnterior=0;
    let entreguesEsteMes=0, entreguesMesAnterior=0;
    /* "Executados" (card Performance) = trabalhos que a pessoa marcou como
       concluído (arquivarTrabalho, motivo 'concluido'), não o estado
       automático classificarTrabalho().concluido — são conceitos diferentes:
       um é uma ação manual da pessoa, o outro é calculado a partir do estado
       do trabalho. */
    let executadosCount=0, executadosEsteMes=0, executadosMesAnterior=0;
    /* soma das horas dos trabalhos com data neste mês / mês anterior, a partir
       da duração calculada (hora início/fim) — card "Estatísticas Operacionais".
       horasEsteMes = previstas (todos os trabalhos do mês, pela data agendada);
       horasExecutadasEsteMes = só os cujo marco principal já está "feito" — a
       barra de Horas mostra executadas/previstas, sem meta manual. */
    let horasEsteMes=0, horasMesAnterior=0, horasExecutadasEsteMes=0, horasExecutadasMesAnterior=0;
    /* contadores "Atual/Total" do card Estatísticas Operacionais — todos
       agrupados pela mesma coorte (trabalhos com dateRaw neste mês/mês
       anterior), para que numerador e denominador de cada linha sempre
       venham do mesmo conjunto de trabalhos e a barra segmentada represente
       um progresso real (0–100%), não dois totais de períodos diferentes. */
    let totalJobsEsteMes=0, totalJobsMesAnterior=0;
    let eventosPrevistosEsteMes=0, eventosPrevistosMesAnterior=0;
    let eventosExecutadosEsteMes=0, eventosExecutadosMesAnterior=0;
    let entreguesPorDataEsteMes=0, entreguesPorDataMesAnterior=0;
    let fechadosPorDataEsteMes=0, fechadosPorDataMesAnterior=0;
    /* trabalhos deletados (descartados) não entram em nenhuma estatística
       operacional (contagens, horas, prazos); trabalhos concluídos e
       arquivados continuam a contar — aconteceram de facto. Pagamentos já
       recebidos são a única exceção: entram sempre, mesmo de um trabalho
       apagado depois (ver loop separado logo abaixo e jobTemPagamentoRecebido). */
    const todos=jobsVisiveis().filter(j=>!j.arquivado || j.arquivado.motivo!=='deletado');
    todos.forEach(j=>{
      (j.payments||[]).forEach(p=>{
        const val=Number(p.amount)||0;
        if(p.status==='pago'){
          const d=p.pagoEm||p.dueDate;
          if(d && d.slice(0,7)===mesAtualISO){ recebido+=val; pagamentosTotalCount++; }
        } else if(p.dueDate && p.dueDate.slice(0,7)===mesAtualISO){
          porReceber+=val; pagamentosPendentesCount++; pagamentosTotalCount++;
        }
      });
      const c=classificarTrabalho(j);
      if(c.fechado) contratosFechados++;
      if(c.concluido) trabalhosConcluidos++;
      else if(c.fechado && !c.aEntregar) trabalhosAtivos++;
      const assinadoISO=j.contract&&j.contract.signedAtISO;
      if(assinadoISO){
        if(assinadoISO.slice(0,7)===mesAtualISO) fechadosEsteMes++;
        else if(assinadoISO.slice(0,7)===mesAnteriorISO) fechadosMesAnterior++;
      }
      if(j.arquivado && j.arquivado.motivo==='concluido'){
        executadosCount++;
        const mm=(j.arquivado.em||'').slice(0,7);
        if(mm===mesAtualISO) executadosEsteMes++; else if(mm===mesAnteriorISO) executadosMesAnterior++;
      }
      const mmJob=(j.dateRaw||'').slice(0,7);
      if(mmJob===mesAtualISO){ totalJobsEsteMes++; if(c.fechado) fechadosPorDataEsteMes++; }
      else if(mmJob===mesAnteriorISO){ totalJobsMesAnterior++; if(c.fechado) fechadosPorDataMesAnterior++; }
      const msEvento=(j.milestones||[]).find(m=>m.key==='principal');
      const msEntrega=(j.milestones||[]).find(m=>m.key==='entrega');
      if(j.duracaoHoras && j.dateRaw){
        if(mmJob===mesAtualISO){
          horasEsteMes+=j.duracaoHoras;
          if(msEvento && msEvento.status==='feito') horasExecutadasEsteMes+=j.duracaoHoras;
        }
        else if(mmJob===mesAnteriorISO){
          horasMesAnterior+=j.duracaoHoras;
          if(msEvento && msEvento.status==='feito') horasExecutadasMesAnterior+=j.duracaoHoras;
        }
      }
      if(msEvento){
        if(mmJob===mesAtualISO){ eventosPrevistosEsteMes++; if(msEvento.status==='feito') eventosExecutadosEsteMes++; }
        else if(mmJob===mesAnteriorISO){ eventosPrevistosMesAnterior++; if(msEvento.status==='feito') eventosExecutadosMesAnterior++; }
        if(msEvento.status!=='feito') trabalhosRealizar++;
        else{
          trabalhosRealizados++;
          const mm=msEvento.feitoEm&&msEvento.feitoEm.slice(0,7);
          if(mm===mesAtualISO) realizadosEsteMes++; else if(mm===mesAnteriorISO) realizadosMesAnterior++;
        }
      }
      if(msEntrega){
        if(mmJob===mesAtualISO && msEntrega.status==='feito') entreguesPorDataEsteMes++;
        else if(mmJob===mesAnteriorISO && msEntrega.status==='feito') entreguesPorDataMesAnterior++;
        if(msEntrega.status!=='feito') trabalhosEntregar++;
        else{
          trabalhosEntregues++;
          const mm=msEntrega.feitoEm&&msEntrega.feitoEm.slice(0,7);
          if(mm===mesAtualISO) entreguesEsteMes++; else if(mm===mesAnteriorISO) entreguesMesAnterior++;
        }
      }
    });
    /* Trabalhos apagados ficam de fora do loop acima (não contam pra
       contagens/horas/prazos), mas um pagamento já marcado como Pago neles
       continua a ser receita real — soma à parte, sem afetar nenhuma outra
       estatística. */
    jobsVisiveis().filter(j=>j.arquivado && j.arquivado.motivo==='deletado').forEach(j=>{
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        const d=p.pagoEm||p.dueDate;
        if(d && d.slice(0,7)===mesAtualISO){ recebido+=Number(p.amount)||0; pagamentosTotalCount++; }
      });
    });
    /* "Aguardando" (pendências do lado do cliente) e "Demandas" (pendências do
       meu lado) — contagem viva (não é um evento datado), por isso a
       tendência é aproximada por mês do trabalho a que cada pendência
       pertence (dateRaw), consistente com o resto do cartão. */
    const bucketPorMesDoJob=jobs=>{
      let esteMes=0, mesAnterior=0;
      jobs.forEach(j=>{
        const mm=(j.dateRaw||'').slice(0,7);
        if(mm===mesAtualISO) esteMes++; else if(mm===mesAnteriorISO) mesAnterior++;
      });
      return {esteMes, mesAnterior};
    };
    const pendCliente=pendenciasClienteParaAnel();
    const pendMeu=pendenciasMinhasParaAnel();
    const pendClienteBucket=bucketPorMesDoJob(pendCliente);
    const pendMeuBucket=bucketPorMesDoJob(pendMeu);
    /* recebido inclui entradas manuais avulsas (botão + do card Financeiro), além
       dos pagamentos de trabalhos já marcados como pagos */
    return {recebido:recebido+receitasDoMes(anoRef,mesRef), porReceber, contratosFechados, totalJobs:todos.length,
      fechadosEsteMes, fechadosMesAnterior, realizadosEsteMes, realizadosMesAnterior, entreguesEsteMes, entreguesMesAnterior,
      trabalhosRealizar, trabalhosRealizados, trabalhosEntregar, trabalhosEntregues,
      pagamentosPendentesCount, pagamentosTotalCount, trabalhosAtivos, trabalhosConcluidos,
      executadosCount, executadosEsteMes, executadosMesAnterior,
      horasEsteMes, horasMesAnterior, horasExecutadasEsteMes, horasExecutadasMesAnterior,
      totalJobsEsteMes, totalJobsMesAnterior,
      eventosPrevistosEsteMes, eventosPrevistosMesAnterior, eventosExecutadosEsteMes, eventosExecutadosMesAnterior,
      entreguesPorDataEsteMes, entreguesPorDataMesAnterior, fechadosPorDataEsteMes, fechadosPorDataMesAnterior,
      pendClienteCount:pendCliente.length, pendClienteEsteMes:pendClienteBucket.esteMes, pendClienteMesAnterior:pendClienteBucket.mesAnterior,
      pendMeuCount:pendMeu.length, pendMeuEsteMes:pendMeuBucket.esteMes, pendMeuMesAnterior:pendMeuBucket.mesAnterior,
      custos:custosDoMes(anoRef,mesRef), meta:metasDoMes(anoRef,mesRef).receita, limiteGastos:metasDoMes(anoRef,mesRef).gastos};
  }
  function horasCompacto(v){
    v=v||0;
    const h=Math.floor(v), m=Math.round((v-h)*60);
    return m>0 ? (h+'h'+String(m).padStart(2,'0')) : (h+'h');
  }
  /* mesmo cálculo de horasCompacto, mas sem o sufixo "h" — só o valor
     numérico (usado no indicador "Horas" do card Operacional). */
  function horasOpNum(v){
    v=v||0;
    const h=Math.floor(v), m=Math.round((v-h)*60);
    return m>0 ? (h+':'+String(m).padStart(2,'0')) : String(h);
  }
  function renderMonthTicker(){
    const s=calcularEstatisticasMes();
    /* mesmos data sources que renderRelOpBars() — Dashboard e Relatórios
       devem mostrar os mesmos números para o mesmo mês */
    const totalJobs=s.totalJobsEsteMes||0;
    const eventosTot=s.eventosPrevistosEsteMes||0;
    /* Horas: executadas + sessões reais registradas, sobre total previsto no mês */
    var _wsHrsEste=(typeof wsTotalSecMesAtual==='function'?wsTotalSecMesAtual():0)/3600;
    var _horasExec=s.horasExecutadasEsteMes+_wsHrsEste;
    pintarMetricaOp('horas', _horasExec, s.horasEsteMes, horasOpNum(_horasExec), horasOpNum(s.horasEsteMes));
    /* Pendências (cliente) sobre trabalhos do mês — não global */
    pintarMetricaOp('pendencias', s.pendClienteEsteMes||0, totalJobs, String(s.pendClienteEsteMes||0), String(totalJobs));
    /* Demandas (meu lado) sobre trabalhos do mês — não global */
    pintarMetricaOp('demandas', s.pendMeuEsteMes||0, totalJobs, String(s.pendMeuEsteMes||0), String(totalJobs));
    /* Fechados: trabalhos do mês com contrato assinado (consistente com Relatórios) */
    pintarMetricaOp('fechados', s.fechadosPorDataEsteMes||0, 0, '', String(s.fechadosPorDataEsteMes||0), 'contagem');
    /* Executados: eventos realizados sobre eventos previstos no mês */
    pintarMetricaOp('executados', s.eventosExecutadosEsteMes||0, eventosTot, String(s.eventosExecutadosEsteMes||0), String(eventosTot));
    /* Concluídos: entregas do mês sobre total de trabalhos do mês */
    pintarMetricaOp('concluidos', s.entreguesPorDataEsteMes||0, totalJobs, String(s.entreguesPorDataEsteMes||0), String(totalJobs));
    /* card ropm-* agora vive no dashboard — relatórios extintos */
    if(typeof renderRelOpBars==='function') renderRelOpBars(s);
    if(typeof renderDestaques==='function') renderDestaques();
    /* s.recebido inclui as entradas manuais avulsas (ver calcularEstatisticasMes) —
       separadas aqui só para o card Financeiro do Dashboard mostrar "Extras" como
       categoria própria, sem mexer no que Relatórios entende por "Recebido". */
    const extrasMes=receitasDoMes();
    renderRingsDashboard(s.recebido-extrasMes, s.porReceber, s.custos, extrasMes);
    atualizarNotifDot();
    const nomesMesesPt=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const nomesMesesEn=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const nomesMesesEs=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const nomesMeses=LANG==='en'?nomesMesesEn:LANG==='es'?nomesMesesEs:nomesMesesPt;
    const mesEl=document.getElementById('ms-mes-atual');
    if(mesEl) mesEl.textContent=nomesMeses[new Date().getMonth()];
    renderTasksList();
    if(typeof renderAgenda==='function') renderAgenda();
  }
  function diasEntre(dataISO){
    const hoje=new Date(); hoje.setHours(0,0,0,0);
    const dt=new Date(dataISO+'T00:00:00');
    return Math.round((dt-hoje)/86400000);
  }
  /* Dashboard = "próximas ações", não trabalhos completos. Cada item é uma
     única ação pendente derivada de um trabalho (assinar contrato, receber
     pagamento, realizar o evento, entregar o material) — nunca o trabalho
     inteiro. O card só mostra título/cliente/ação/prazo; quem quiser ver
     endereço, hora, equipa e observações abre o trabalho (Projetos), que
     continua a ser a única fonte completa dessa informação (evita duas
     listas com os mesmos dados). */
  function gerarItensRadar(){
    const itens=[];
    jobsVisiveis().filter(j=>!j.arquivado).forEach(j=>{
      const cliente=j.client||'';
      if(j.structure && j.structure.contrato && j.contract && j.contract.status!=='assinado'){
        itens.push({ dataISO:j.dateRaw||new Date().toISOString().slice(0,10), nome:j.nome||j.client, cliente, acao:t('tasks.actionSign'), jobId:j.id, tipo:'contrato', idx:null });
      }
      (j.payments||[]).forEach((p,i)=>{
        if(p.status==='pago' || !p.dueDate) return;
        itens.push({ dataISO:p.dueDate, nome:j.nome||j.client, cliente, acao:t('tasks.actionReceivePayment'), jobId:j.id, tipo:'pagamento', idx:i });
      });
      if(j.dateRaw){
        const msEvento=(j.milestones||[]).find(m=>m.key==='principal');
        if(msEvento && msEvento.status!=='feito'){
          const acao=t('tasks.actionExecute').replace('{tipo}', (j.typeLabel||'').toLowerCase()||t('tasks.actionExecute').replace('{tipo}','').trim());
          itens.push({ dataISO:j.dateRaw, nome:j.nome||j.client, cliente, acao, jobId:j.id, tipo:'evento', idx:null, hora:j.horaIni||'', horaFim:j.horaFim||'' });
        }
      }
      /* entrega final — antes não virava tarefa nenhuma no Dashboard; usa a
         data prevista real (Etapa "Entrega e Aprovação") quando existe,
         senão cai na data do evento como âncora aproximada. */
      const msEntrega=(j.milestones||[]).find(m=>m.key==='entrega');
      if(msEntrega && msEntrega.status!=='feito'){
        const dataEntrega=(j.entrega && j.entrega.dataEntrega) || j.dateRaw;
        if(dataEntrega) itens.push({ dataISO:dataEntrega, nome:j.nome||j.client, cliente, acao:t('milestone.finalDelivery'), jobId:j.id, tipo:'entrega', idx:null });
      }
    });
    /* Lembretes soltos (sem trabalho) entram sempre que tiverem data — os
       vinculados a um trabalho não aparecem aqui, ficam só na secção
       "Lembretes" dentro da página do trabalho. */
    Object.values(lembretesData).forEach(l=>{
      if(l.feito || l.jobId || !l.data) return;
      itens.push({ dataISO:l.data, hora:l.hora||'', nome:l.titulo, cliente:'', acao:t('reminder.action'), jobId:null, tipo:'lembrete', idx:l.id });
    });
    /* Listas só entram se tiverem data E prioridade — sem isso não há como
       ordená-las entre os outros itens do radar. Vinculadas a um trabalho
       também aparecem aqui (com a foto do cliente do trabalho), além de
       continuarem na secção "Listas" da página do trabalho. */
    Object.values(listasData).forEach(ls=>{
      if(ls.feito || !ls.data || !ls.prioridade) return;
      const jobLs=ls.jobId?jobsData[ls.jobId]:null;
      itens.push({ dataISO:ls.data, hora:ls.hora||'', nome:ls.titulo, cliente:jobLs?jobLs.client:'', acao:t('list.action'), jobId:ls.jobId||null, tipo:'lista', idx:ls.id });
    });
    /* Tarefas (modo Simples do painel unificado) — só entram se tiverem
       data. Vinculadas a um trabalho também aparecem aqui (com a foto do
       cliente do trabalho), além de continuarem na secção "Tarefas" da
       página do trabalho. */
    Object.values(tarefasData).forEach(tk=>{
      if(tk.tipo!=='simples' || tk.feito || !tk.data) return;
      const jobTk=tk.jobId?jobsData[tk.jobId]:null;
      itens.push({ dataISO:tk.data, hora:tk.hora||'', horaFim:tk.horaFim||'', nome:tk.titulo, cliente:jobTk?jobTk.client:'', acao:t('task.action'), jobId:tk.jobId||null, tipo:'tarefa', idx:tk.id });
    });
    const mesAtualISO=new Date().toISOString().slice(0,7);
    const itensDoMes=itens.filter(it=> diasEntre(it.dataISO)<0 || it.dataISO.slice(0,7)===mesAtualISO);
    itensDoMes.sort((a,b)=> a.dataISO!==b.dataISO ? a.dataISO.localeCompare(b.dataISO) : (a.hora||'').localeCompare(b.hora||''));
    return itensDoMes;
  }
  function gerarNivelPrioridade(dataISO){
    const d=diasEntre(dataISO);
    if(d<0) return 'critica';
    if(d===0) return 'alta';
    if(d===1) return 'media';
    return 'normal';
  }
  /* badge de prazo do card de Tarefas: verde=dias restantes, amarelo=hoje/
     amanhã, vermelho=dias em atraso. Reaproveita as mesmas 3 cores do
     .sig-tag (contrato/pagamento) em vez de criar paleta nova. */
  /* rótulo simples do prazo — só o tempo em si (Hoje/Amanhã/N dias), sem
     "restante(s)"/"em atraso": a cor (âmbar/vermelho) já comunica a urgência. */
  /* ícone de Pendência (depende do cliente) / Demanda (depende de mim) —
     reaproveita exatamente os mesmos ícones dos filtros "cliente"/"meucargo"
     do módulo de Projetos (Trabalhos), pra manter a mesma linguagem visual. */
  const ICON_PENDENCIA_DEMANDA={
    pendencia:'<span class="nav-ico" style="width:14px;height:14px;display:inline-block;mask-image:url(https://api.iconify.design/boxicons:arrow-up-right-stroke-square.svg);-webkit-mask-image:url(https://api.iconify.design/boxicons:arrow-up-right-stroke-square.svg)"></span>',
    demanda:'<span class="nav-ico" style="width:14px;height:14px;display:inline-block;mask-image:url(https://api.iconify.design/boxicons:arrow-down-left-stroke-square.svg);-webkit-mask-image:url(https://api.iconify.design/boxicons:arrow-down-left-stroke-square.svg)"></span>',
  };
  /* chip de tipo: TASK / LIST / STAGE-name */
  function tipoChipHtml(it){
    const SOLTO=['lembrete','lista','tarefa'];
    if(!SOLTO.includes(it.tipo))
      return '<span class="tsk-tag tsk-tag--tipo stage">'+it.tipo.toUpperCase()+'</span>';
    if(it.tipo==='lista') return '<span class="tsk-tag tsk-tag--tipo">LIST</span>';
    if(it.tipo==='tarefa'&&it.idx){
      const tk=tarefasData[it.idx];
      if(tk&&tk.itens&&tk.itens.length>=2) return '<span class="tsk-tag tsk-tag--tipo">LIST</span>';
    }
    return '<span class="tsk-tag tsk-tag--tipo">TASK</span>';
  }
  /* chip de prazo: verde / âmbar / vermelho */
  function prazoChipHtml(dataISO){
    if(!dataISO) return '';
    const d=diasEntre(dataISO);
    let cl,lbl;
    if(d<0){ const n=Math.abs(d); cl='tsk-prazo-late'; lbl=n+(n===1?' DIA':' DIAS'); }
    else if(d===0){ cl='tsk-prazo-amber'; lbl='HOJE'; }
    else if(d===1){ cl='tsk-prazo-amber'; lbl='AMANHÃ'; }
    else{ cl='tsk-prazo-neutral'; lbl=d+' DIAS'; }
    return '<span class="tsk-tag tsk-tag--prazo '+cl+'">'+lbl+'</span>';
  }
  /* círculo de progresso em unicode aproximado */
  /* anel SVG de progresso para os chips de tag */
  function progRingHtml(f,tot){
    if(!tot) return '';
    const r=7,cx=9,cy=9,C=2*Math.PI*r;
    const arc=(f/tot*C).toFixed(1),gap=(C-f/tot*C).toFixed(1);
    const done=f>=tot;
    return '<span class="tsk-tag tsk-tag--prog'+(done?' done':'')+'">'+
      '<svg viewBox="0 0 18 18" width="12" height="12" style="flex:none">'+
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" class="prg-bg"/>'+
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" class="prg-fill" stroke-dasharray="'+arc+' '+gap+'" transform="rotate(-90,'+cx+','+cy+')"/>'+
      '</svg>'+
      f+'/'+tot+'</span>';
  }
  let _tcArquivados=new Set();
  /* Pill ativa da Dashboard de Tarefas — Hoje/Tarefas/Lembretes/Agenda,
     cada uma filtra #tasks-list de forma diferente (ver renderTasksList). */
  let _tasksListMode='hoje';
  function filtrarListaTarefas(el,modo){
    _tasksListMode=modo;
    document.querySelectorAll('#tasks-filter-row .chip').forEach(c=>c.classList.toggle('on',c===el));
    renderTasksList();
  }
  /* Todas as tarefas simples (tipo 'simples', não concluídas) — com ou
     sem data, ligadas ou não a um trabalho. gerarItensRadar() só inclui
     as que TÊM data (fica só com o que entra na timeline cronológica);
     esta função é a fonte para as pills "Tarefas" e "Lembretes", que
     precisam de ver também as que não têm data marcada. */
  function gerarTarefasCompletas(){
    return Object.values(tarefasData).filter(function(tk){ return tk.tipo==='simples' && !tk.feito; })
      .map(function(tk){
        const job=tk.jobId?jobsData[tk.jobId]:null;
        return { dataISO:tk.data||'', hora:tk.hora||'', nome:tk.titulo, cliente:job?job.client:'',
          jobId:tk.jobId||null, tipo:'tarefa', idx:tk.id, prioridade:tk.prioridade||'Normal' };
      });
  }
  /* Uma linha da lista — mais leve que .tsk-card (o carrossel já cobre o
     formato "cartão"); reaproveita .pick-row, o mesmo padrão de Contatos/
     Biblioteca, para a lista ler como lista, não como mais um carrossel. */
  function construirLinhaTarefa(it){
    const onclick=it.jobId?("openJob('"+it.jobId+"')"):("abrirDetalheItemSolto('"+it.tipo+"',"+(typeof it.idx==='string'?"'"+it.idx+"'":it.idx)+")");
    let sub=it.cliente?escapeHtml(it.cliente):'';
    if(it.dataISO){
      const pts=it.dataISO.split('-');
      const dataTxt=parseInt(pts[2],10)+' '+mesAbrev(parseInt(pts[1],10)-1);
      sub=(sub?sub+' · ':'')+dataTxt+(it.hora?' · '+escapeHtml(it.hora):'');
    } else if(!sub){
      sub=t('tasks.noDate');
    }
    const prioClasse=it.prioridade==='Urgente'?'tsk-row-prio--urgente':(it.prioridade==='Importante'?'tsk-row-prio--importante':'tsk-row-prio--normal');
    const prioDot=it.prioridade?'<span class="tsk-row-prio '+prioClasse+'"></span>':'';
    return '<div class="pick-row" onclick="'+onclick+'">'+prioDot
      +'<div class="u-flex-min"><div class="nm">'+escapeHtml(it.nome||'')+'</div><div class="sub">'+sub+'</div></div>'
      +'<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>'
      +'</div>';
  }
  const AGD_COMPROMISSO_TIPOS=['evento','entrega','pagamento','contrato'];
  function renderTasksList(){
    const wrap=document.getElementById('tasks-list');
    if(!wrap) return;
    const radar=gerarItensRadar().filter(function(it){
      return !_tcArquivados.has((it.jobId||it.tipo||'')+'_'+(it.idx!=null?it.idx:''));
    });
    const futuros=radar.filter(function(it){ return !it.dataISO||diasEntre(it.dataISO)>=0; });
    const atrasados=radar.filter(function(it){ return it.dataISO&&diasEntre(it.dataISO)<0; });

    /* Banner "N tarefas atrasadas" — atrasados saem da timeline cronológica
       (misturados, o dia de hoje ficava difícil de ler) e só aparecem aqui. */
    const banner=document.getElementById('tsk-overdue-banner');
    if(banner){
      if(atrasados.length){
        banner.classList.remove('u-hidden');
        const txt=document.getElementById('tsk-overdue-txt');
        if(txt) txt.textContent=atrasados.length+' '+(atrasados.length===1?t('tasks.overdueSingular'):t('tasks.overduePlural'));
      } else banner.classList.add('u-hidden');
    }

    let itens;
    if(_tasksListMode==='tarefas'){
      itens=gerarTarefasCompletas();
    } else if(_tasksListMode==='lembretes'){
      itens=gerarTarefasCompletas().filter(function(it){ return !it.jobId&&!it.dataISO; });
    } else if(_tasksListMode==='agenda'){
      itens=futuros.filter(function(it){ return AGD_COMPROMISSO_TIPOS.indexOf(it.tipo)!==-1; });
    } else { /* 'hoje' — cronológico, sem os atrasados */
      itens=futuros;
    }

    renderNotificacoesPendentes();
    if(!itens.length){ wrap.innerHTML='<div class="tsk-row-empty">'+t('tasks.emptyList')+'</div>'; return; }
    wrap.innerHTML=itens.map(construirLinhaTarefa).join('');
  }
  function abrirAtrasados(){
    const radar=gerarItensRadar().filter(function(it){
      return it.dataISO&&diasEntre(it.dataISO)<0&&!_tcArquivados.has((it.jobId||it.tipo||'')+'_'+(it.idx!=null?it.idx:''));
    });
    const lista=document.getElementById('atrasados-lista');
    if(lista) lista.innerHTML=radar.length?radar.map(construirLinhaTarefa).join(''):'<div class="tsk-row-empty">'+t('tasks.emptyList')+'</div>';
    const scrim=document.getElementById('atrasados-scrim'), sheet=document.getElementById('atrasados-sheet');
    if(scrim) scrim.classList.remove('u-hidden');
    if(sheet) sheet.classList.remove('u-hidden');
  }
  function fecharAtrasados(){
    const scrim=document.getElementById('atrasados-scrim'), sheet=document.getElementById('atrasados-sheet');
    if(scrim) scrim.classList.add('u-hidden');
    if(sheet) sheet.classList.add('u-hidden');
  }
  /* Sinal de urgência por nível: em vez de ícone/bolinha, uma tag com moldura
     (cor de acordo com o nível) + o próprio card ganha um leve degradê do lado
     direito — atrasado (crítica) = laranja-avermelhado, próximo vencimento
     (alta/média) = amarelo, demais tarefas do mês (normal) = verde. Todo nível
     agora usa a mesma linguagem visual (tag + degradê), nada de ícone de alerta
     nem bolinha solta. */
  /* ícones dos cards de Tarefas (Dashboard) e Projetos (Trabalhos) —
     linguagem própria (preenchidos, recortes em espaço negativo),
     deliberadamente diferente do traço fino genérico do resto da app.
     .calendar é reaproveitado por ambos (mesma linguagem visual entre a
     versão resumida e a listagem completa); client/action são exclusivos
     do card de Tarefas. */
  const RTK_ICONS={
    client:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4"/><path d="M4.5 21c0-4.7 3.4-7.5 7.5-7.5s7.5 2.8 7.5 7.5z"/></svg>',
    action:'<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 5.3 5 4.7-5 4.7-1.4-1.4L12.6 12l-3.2-3.3z"/></svg>',
    calendar:'<span class="nav-ico" style="width:13px;height:13px;display:inline-block;mask-image:url(https://api.iconify.design/material-symbols:calendar-month-sharp.svg);-webkit-mask-image:url(https://api.iconify.design/material-symbols:calendar-month-sharp.svg)"></span>',
    clock:'<span class="nav-ico" style="width:13px;height:13px;display:inline-block;mask-image:url(https://api.iconify.design/material-symbols:clock-loader-20.svg);-webkit-mask-image:url(https://api.iconify.design/material-symbols:clock-loader-20.svg)"></span>',
    check:'<span class="nav-ico rtk-check-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg);-webkit-mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg)"></span>',
    checkSimples:'<span class="nav-ico rtk-check-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg);-webkit-mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg)"></span>',
    checkLista:'<span class="nav-ico rtk-check-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg);-webkit-mask-image:url(https://api.iconify.design/streamline-block:basic-ui-check-2.svg)"></span>',
  };
  /* mesmos ícones dos botões Simples/Checklist do menu Criar > Tarefa —
     usados no card de Tarefas (Dashboard) pra marcar itens soltos (sem
     trabalho vinculado); nos vinculados, viram um selinho no canto da foto
     do cliente em vez do quadrado sozinho. */
  function rtkIconeSolto(tipo){
    return tipo==='tarefa' ? RTK_ICONS.checkSimples : tipo==='lista' ? RTK_ICONS.checkLista : RTK_ICONS.check;
  }
  function clienteFotoPorNome(nome){
    if(!nome) return null;
    const cli=Object.values(clientesData).find(c=>c.nome===nome);
    return (cli && cli.foto) || null;
  }
  /* data literal (dd Mmm aaaa) — o prazo deixou de mostrar "Hoje"/"Amanhã"/
     "N dias" e passa a mostrar sempre a data exata em que a tarefa deve
     acontecer, com um ícone de calendário à esquerda. */
  function rtkDataCompleta(dataISO){
    const partes=dataISO.split('-');
    return partes[2]+' - '+partes[1];
  }
  function construirCardRadar(it){
    const nivel=gerarNivelPrioridade(it.dataISO);
    const urgClasse = nivel==='critica' ? 'late' : (nivel==='alta'||nivel==='media') ? 'soon' : 'normal';
    const solto = it.tipo==='lembrete' || it.tipo==='lista' || it.tipo==='tarefa';
    let card='<div class="card radar-card '+urgClasse+'" data-task data-job-id="'+(it.jobId||'')+'" data-tipo="'+it.tipo+'" data-idx="'+(it.idx!=null?it.idx:'')+'" onclick="onRadarCardClick(event,this)">';
    /* Ícone (checkbox/checklist) só nos itens criados manualmente como
       tarefa/lista/lembrete: sem trabalho vinculado, o quadrado inteiro vira
       o ícone; vinculados a um trabalho, a foto do cliente aparece com o
       mesmo ícone como selinho no canto. Cards gerados pelo sistema a partir
       de um trabalho (contrato/pagamento/evento/entrega) mostram só a foto,
       sem selinho nenhum. */
    const avatarBlock = !solto
      ? avatarHtml(it.cliente||it.nome,68,clienteFotoPorNome(it.cliente))
      : it.jobId
        ? '<div class="rtk-avatar-wrap">'+avatarHtml(it.cliente||it.nome,68,clienteFotoPorNome(it.cliente))+'<span class="rtk-avatar-badge">'+rtkIconeSolto(it.tipo)+'</span></div>'
        : '<div class="rtk-avatar-wrap rtk-avatar-check">'+rtkIconeSolto(it.tipo)+'</div>';
    const nomeEsq = it.cliente ? '<div class="rtk-left-name">'+escapeHtml(it.cliente)+'</div>' : '';
    card+='<div class="rtk-side">'+
      avatarBlock+
      nomeEsq+
    '</div>';
    card+='<div class="rtk-body">';
    card+='<div class="rtk-title">'+escapeHtml(it.nome)+'</div>';
    card+='<div class="rtk-prazo">'+RTK_ICONS.calendar+'<span>'+rtkDataCompleta(it.dataISO)+'</span></div>';
    card+='<div class="rtk-prazo rtk-hora">'+RTK_ICONS.clock+'<span>'+(it.hora ? escapeHtml(it.hora) : '—')+'</span></div>';
    card+='</div>';
    card+='</div>';
    const editarAction = solto
      ? '<button class="radar-swipe-btn editar" onclick="event.stopPropagation();abrirDetalheItemSolto(\''+it.tipo+'\',\''+it.idx+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>Editar</button>'
      : '<button class="radar-swipe-btn editar" onclick="event.stopPropagation();openJob(\''+it.jobId+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>Editar</button>';
    return '<div class="radar-card-wrap">'+
      '<div class="radar-swipe-actions left">'+editarAction+'</div>'+
      '<div class="radar-swipe-actions right">'+
        '<button class="radar-swipe-btn concluir" onclick="event.stopPropagation();concluirItemRadar(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>Concluir</button>'+
        '<button class="radar-swipe-btn arquivar" onclick="event.stopPropagation();arquivarItemRadar(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>Arquivar</button>'+
      '</div>'+
      card+
    '</div>';
  }
  function renderRadarDashboard(){
    const itens=gerarItensRadar();
    const atrasados=itens.filter(it=>diasEntre(it.dataISO)<0);
    const proximos=itens.filter(it=>diasEntre(it.dataISO)>=0);
    const wrapAtr=document.getElementById('radar-atrasados');
    const wrapProx=document.getElementById('radar-proximos');
    if(wrapAtr) wrapAtr.innerHTML=atrasados.map(construirCardRadar).join('');
    if(wrapProx) wrapProx.innerHTML=proximos.map(construirCardRadar).join('');
    ativarSwipeRadar();
  }
  function onRadarCardClick(e, card){
    if(card.dataset.swiped==='1'){ e.preventDefault(); e.stopPropagation(); return; }
    const tipo=card.dataset.tipo;
    if(tipo==='lembrete'||tipo==='lista'||tipo==='tarefa'){ abrirDetalheItemSolto(tipo, card.dataset.idx); return; }
    openJob(card.dataset.jobId);
  }
  function concluirItemRadar(btn){
    const card=btn.closest('.radar-card-wrap').querySelector('.radar-card');
    const jobId=card.dataset.jobId, tipo=card.dataset.tipo, idx=card.dataset.idx;
    if(tipo==='lembrete'){
      if(lembretesData[idx]){ lembretesData[idx].feito=true; saveLembretesData(); }
    } else if(tipo==='lista'){
      if(listasData[idx]){ listasData[idx].feito=true; saveListasData(); }
    } else if(tipo==='tarefa'){
      if(tarefasData[idx]){ tarefasData[idx].feito=true; saveTarefasData(); }
    } else {
      const job=jobsData[jobId];
      if(!job){ showToast(t('toast.jobNotFound')); return; }
      if(tipo==='pagamento'){
        marcarPagoDynamic(jobId, parseInt(idx,10));
      } else if(tipo==='contrato'){
        openJob(jobId);
        return;
      } else {
        const ms=(job.milestones||[]).find(m=>m.key==='principal');
        if(ms){ ms.status='feito'; ms.feitoEm=new Date().toISOString(); pushHistory(job,t('toast.markedDone')); saveJobsData(); }
      }
    }
    card.closest('.radar-card-wrap').style.display='none';
    renderMonthTicker();
    showToast(t('toast.done'));
  }
  /* "Arquivar" um item do radar de tarefas remove-o só da lista de hoje —
     não altera o trabalho/pagamento/marco por trás. Diferente de "Concluir"
     (que marca o item como feito de verdade): arquivar é só "tirar da frente
     por agora", volta a aparecer se a condição que o gerou continuar válida
     na próxima vez que a lista for recalculada a partir dos dados reais. */
  function arquivarItemRadar(btn){
    const wrap=btn.closest('.radar-card-wrap');
    if(wrap) wrap.style.display='none';
    showToast(t('toast.archivedFromRadar'));
  }
  function marcarMilestoneFeito(jobId, key){
    const job=jobsData[jobId];
    if(!job) return;
    const ms=(job.milestones||[]).find(m=>m.key===key);
    if(!ms || ms.status==='feito') return;
    ms.status='feito';
    ms.feitoEm=new Date().toISOString();
    pushHistory(job, t('toast.markedDone')+' — '+ms.t);
    saveJobsData();
    renderJobDetailDynamic(jobId);
    updateJobCard(jobId);
    renderMonthTicker();
    showToast(t('toast.done'));
    /* entrega marcada como feita = o cliente já pode ver o resultado final */
    if(key==='entrega') dispararEmailEvento('entregaDisponivel', job.email, job);
  }
  function ativarSwipeRadar(){
    const LARG_DIR=144, LARG_ESQ=72;
    document.querySelectorAll('.radar-card').forEach(card=>{
      if(card.dataset.swipeBound) return;
      card.dataset.swipeBound='1';
      const wrap=card.closest('.radar-card-wrap');
      const acoesDir=wrap&&wrap.querySelector('.radar-swipe-actions.right');
      const acoesEsq=wrap&&wrap.querySelector('.radar-swipe-actions.left');
      /* estado explícito de 3 posições — o card só pode estar fechado, com as
         ações da esquerda reveladas, ou com as da direita reveladas. Nunca os
         dois ao mesmo tempo, nunca um estado intermediário permanente. */
      let openSide='closed'; // 'closed' | 'left' | 'right'
      let startX=0, baseX=0, curX=0, dragging=false, pointerId=null;
      let hapticLight=false, hapticFull=false;
      /* z-index dos botões fica acima do card (para a transição de arrasto não
         "engolir" o clique) — por isso o lado que não está revelado precisa de
         pointer-events:none explícito, ou fica clicável por baixo do card mesmo
         invisível (opacity:0 sozinho não desliga clique). */
      const setActions=x=>{
        if(x<0 && acoesDir){
          const p=Math.min(1, -x/LARG_DIR);
          acoesDir.style.opacity=p; acoesDir.style.transform='scale('+(.85+.15*p)+')'; acoesDir.style.pointerEvents=p>0?'auto':'none';
          if(acoesEsq){ acoesEsq.style.opacity=0; acoesEsq.style.pointerEvents='none'; }
        } else if(x>0 && acoesEsq){
          const p=Math.min(1, x/LARG_ESQ);
          acoesEsq.style.opacity=p; acoesEsq.style.transform='scale('+(.85+.15*p)+')'; acoesEsq.style.pointerEvents=p>0?'auto':'none';
          if(acoesDir){ acoesDir.style.opacity=0; acoesDir.style.pointerEvents='none'; }
        } else {
          if(acoesDir){ acoesDir.style.opacity=0; acoesDir.style.pointerEvents='none'; }
          if(acoesEsq){ acoesEsq.style.opacity=0; acoesEsq.style.pointerEvents='none'; }
        }
      };
      card.addEventListener('pointerdown', e=>{
        startX=e.clientX; dragging=true; pointerId=e.pointerId;
        baseX = openSide==='left' ? LARG_ESQ : openSide==='right' ? -LARG_DIR : 0;
        curX=baseX;
        hapticLight=false; hapticFull=false;
        card.style.transition='none';
        try{ card.setPointerCapture(pointerId); }catch(err){}
      });
      card.addEventListener('pointermove', e=>{
        if(!dragging || e.pointerId!==pointerId) return;
        let x=baseX+(e.clientX-startX);
        /* a partir de um estado já aberto, o arrasto só pode levar de volta
           ao centro — nunca atravessar para o lado oposto na mesma gesture,
           o que evitaria a "troca automática de lado". */
        if(openSide==='left') x=Math.max(0, Math.min(LARG_ESQ, x));
        else if(openSide==='right') x=Math.max(-LARG_DIR, Math.min(0, x));
        else x=Math.max(-LARG_DIR, Math.min(LARG_ESQ, x));
        curX=x;
        if(Math.abs(x-baseX)>4 && wrap) wrap.classList.add('active');
        card.style.transform='translateX('+x+'px)';
        setActions(x);
        const range = x<0 ? LARG_DIR : LARG_ESQ;
        const p = range>0 ? Math.abs(x)/range : 0;
        if(p>=.3 && !hapticLight){ hapticLight=true; haptic('light'); }
        if(p>=1 && !hapticFull){ hapticFull=true; haptic('medium'); }
      });
      const fim=e=>{
        if(!dragging || (e && e.pointerId!==pointerId)) return;
        dragging=false;
        if(pointerId!=null){ try{ card.releasePointerCapture(pointerId); }catch(err){} }
        card.style.transition='transform .2s ease';
        const abreDir = curX<=-LARG_DIR*.4, abreEsq = curX>=LARG_ESQ*.4;
        openSide = abreDir ? 'right' : (abreEsq ? 'left' : 'closed');
        const finalX = abreDir ? -LARG_DIR : (abreEsq ? LARG_ESQ : 0);
        card.style.transform = 'translateX('+finalX+'px)';
        [acoesDir, acoesEsq].forEach(el=>{ if(el) el.style.transition='opacity .2s ease, transform .2s ease'; });
        setActions(finalX);
        if(openSide==='closed' && wrap){
          setTimeout(()=>{ wrap.classList.remove('active'); }, 200);
        }
      };
      card.addEventListener('pointerup', fim);
      card.addEventListener('pointercancel', fim);
    });
  }
