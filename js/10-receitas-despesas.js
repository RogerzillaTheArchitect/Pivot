/* Pivots — receitas despesas
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== Registo manual (botão + do card Financeiro) — despesa OU recebido avulso,
     sem estar ligado a um trabalho. Despesa cai em custosData (já existente);
     Recebido cai em receitasData (novo, mesmo formato). ===== */
  /* Categorias de despesa/receita — dropdown pré-definido (não mais texto
     livre com sugestões): garante que "Distribuição Financeira" e o Card
     Fluxo conseguem agrupar/rotular por categoria de verdade. */
  const DESPESA_CATEGORIAS_SUGERIDAS=['Freelancers','Equipamentos','Marketing','Softwares','Viagens','Assinaturas','Deslocação','Outros'];
  const RECEITA_CATEGORIAS_SUGERIDAS=['Projeto','Consultoria','Venda de produto','Aula/Workshop','Comissão','Outros'];
  function categoriaSelectHtml(id, opcoes, valorAtual){
    return '<select id="'+id+'">'+
      '<option value="">'+t('reports.expenseCategoryPlaceholder')+'</option>'+
      opcoes.map(c=>'<option value="'+escapeHtml(c)+'"'+(c===valorAtual?' selected':'')+'>'+escapeHtml(c)+'</option>').join('')+
    '</select>';
  }
  /* Telas exclusivas de Receita/Despesa do menu Criar — captura rápida com
     Título/Categoria/Valor/Data/Observações. Distintas das listas completas
     de gerenciamento (Financeiro > Receitas/Despesas), que vivem em
     abrirReceitas()/abrirDespesas(). */
  function limparFormularioReceitaPanel(){
    ['rc-titulo','rc-valor','rc-notas'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    const dataEl=document.getElementById('rc-data'); if(dataEl) dataEl.value=new Date().toISOString().slice(0,10);
    const catEl=document.getElementById('rc-categoria');
    if(catEl) catEl.innerHTML='<option value="">'+t('reports.expenseCategoryPlaceholder')+'</option>'+RECEITA_CATEGORIAS_SUGERIDAS.map(c=>'<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>').join('');
  }
  function criarReceitaPanel(){
    const titulo=(document.getElementById('rc-titulo').value||'').trim();
    const valor=parseFloat(document.getElementById('rc-valor').value);
    if(!titulo || !valor){ showToast(t('toast.fillDescValue')); return; }
    const id='rec'+Date.now();
    receitasData[id]={ id, descricao:titulo, categoria:(document.getElementById('rc-categoria').value||'').trim(),
      valor, data:document.getElementById('rc-data').value||new Date().toISOString().slice(0,10),
      notas:document.getElementById('rc-notas').value.trim() };
    saveReceitasData();
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    closeSheet();
    showToast(t('toast.incomeAdded'));
  }
  function limparFormularioDespesaPanel(){
    ['ds-titulo','ds-valor','ds-notas'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    const dataEl=document.getElementById('ds-data'); if(dataEl) dataEl.value=new Date().toISOString().slice(0,10);
    const catEl=document.getElementById('ds-categoria');
    if(catEl) catEl.innerHTML='<option value="">'+t('reports.expenseCategoryPlaceholder')+'</option>'+DESPESA_CATEGORIAS_SUGERIDAS.map(c=>'<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>').join('');
  }
  function criarDespesaPanel(){
    const titulo=(document.getElementById('ds-titulo').value||'').trim();
    const valor=parseFloat(document.getElementById('ds-valor').value);
    if(!titulo || !valor){ showToast(t('toast.fillDescValue')); return; }
    const id='cst'+Date.now();
    custosData[id]={ id, descricao:titulo, categoria:(document.getElementById('ds-categoria').value||'').trim(),
      valor, data:document.getElementById('ds-data').value||new Date().toISOString().slice(0,10),
      notas:document.getElementById('ds-notas').value.trim() };
    saveCustosData();
    registrarAnalyticsDespesa(custosData[id]);
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    closeSheet();
    showToast(t('toast.costAdded'));
  }
  let receitasData={};
  function saveReceitasData(){ savePersisted('pivot-receitasData', ()=>receitasData); }
  async function loadReceitasData(){ await loadPersisted('pivot-receitasData', d=>{ receitasData=d; }); }
  function receitasDoMes(anoParam, mesParam){
    const hoje=new Date(); const ano=anoParam!=null?anoParam:hoje.getFullYear(), mes=mesParam!=null?mesParam:hoje.getMonth()+1;
    return Object.values(receitasData).filter(r=>{
      if(!r.data) return true;
      const [y,m]=r.data.split('-').map(Number);
      return y===ano && m===mes;
    }).reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
  }
  /* ===== Listas de Relatórios: Recebidos (parcelas de contrato + manuais) e
     Despesas (todas manuais) de um mês — ano/mes omitidos usam o mês atual real. ===== */
  function listaRecebidosDoMes(anoParam, mesParam){
    const hoje=new Date();
    const ano=anoParam!=null?anoParam:hoje.getFullYear(), mes=mesParam!=null?mesParam:hoje.getMonth()+1;
    const mesISO=ano+'-'+String(mes).padStart(2,'0');
    const itens=[];
    jobsVisiveis().forEach(j=>{
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        const d=p.pagoEm||p.dueDate;
        if(!d || d.slice(0,7)!==mesISO) return;
        itens.push({ desc:p.label||t('field.payment'), cliente:j.client||j.typeLabel||'', categoria:j.client||j.typeLabel||t('field.payment'), jobId:j.id, valor:Number(p.amount)||0, data:d, manual:false });
      });
    });
    Object.values(receitasData).forEach(r=>{
      if(!r.data || r.data.slice(0,7)!==mesISO) return;
      itens.push({ desc:r.descricao, id:r.id, categoria:r.categoria||'', valor:Number(r.valor)||0, data:r.data, manual:true });
    });
    return itens.sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  }
  function listaDespesasDoMes(anoParam, mesParam){
    const hoje=new Date();
    const ano=anoParam!=null?anoParam:hoje.getFullYear(), mes=mesParam!=null?mesParam:hoje.getMonth()+1;
    const mesISO=ano+'-'+String(mes).padStart(2,'0');
    return Object.values(custosData).filter(c=>c.data && c.data.slice(0,7)===mesISO)
      .map(c=>({ desc:c.descricao, id:c.id, categoria:c.categoria||'', valor:Number(c.valor)||0, data:c.data }))
      .sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  }
  function editarReceitaManual(id){
    const r=receitasData[id]; if(!r) return;
    const html='<div class="field"><label>'+t('reports.expenseName')+'</label><input id="rec-edit-nome" value="'+escapeHtml(r.descricao)+'"></div>'+
      '<div class="field"><label>'+t('field.date')+'</label><input id="rec-edit-data" type="date" value="'+(r.data||'')+'"></div>'+
      '<div class="field"><label data-t="reports.expenseCategory">Categoria</label>'+categoriaSelectHtml('rec-edit-categoria', RECEITA_CATEGORIAS_SUGERIDAS, r.categoria||'')+'</div>'+
      '<div class="field"><label>'+t('reports.expenseValue')+'</label><input id="rec-edit-valor" type="number" min="0" inputmode="decimal" value="'+r.valor+'"></div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="salvarEdicaoReceita(\''+id+'\')">'+t('reports.saveExpense')+'</button>';
    openInfo(t('home.entryIncome'), html, abrirReceitas);
  }
  function salvarEdicaoReceita(id){
    const r=receitasData[id]; if(!r) return;
    const desc=(document.getElementById('rec-edit-nome').value||'').trim();
    const valor=parseFloat(document.getElementById('rec-edit-valor').value);
    if(!desc || !valor){ showToast(t('toast.fillDescValue')); return; }
    r.descricao=desc; r.valor=valor; r.data=document.getElementById('rec-edit-data').value||r.data;
    r.categoria=(document.getElementById('rec-edit-categoria').value||'').trim();
    saveReceitasData();
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    abrirReceitas();
    showToast(t('toast.incomeAdded'));
  }
  function removerReceita(id){
    delete receitasData[id];
    saveReceitasData();
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    if(document.getElementById('rec-lista')) renderReceitasLista(); else closeInfo();
  }
  /* ===== Despesas — tela dedicada (própria, sem nada em comum com Receitas):
     botão Adicionar no topo abre o formulário à parte (Título/Valor/Data/
     Categoria em dropdown); a lista é sempre a tela raiz, cards deslizáveis
     reaproveitando o mesmo swipe do radar (.radar-card-wrap/ativarSwipeRadar)
     — esquerda revela Excluir, direita revela Editar. ===== */
  function abrirDespesas(){
    const m=metasMesAtual();
    const html=
      '<div class="exp-limit-row">'+
        '<span class="exp-limit-lbl">'+t('settings.limitLabel')+'</span>'+
        '<input type="number" min="0" id="exp-limit-input" class="exp-limit-inp" value="'+(m.gastos||'')+'" placeholder="500" onchange="salvarLimiteInline()" onblur="salvarLimiteInline()">'+
      '</div>'+
      '<button class="btn btn-warn u-w-full u-mb-14" onclick="abrirFormNovaDespesa()">+ '+t('reports.addExpense')+'</button>'+
      '<div id="exp-lista"></div>';
    openInfo(t('reports.expensesTitle'), html);
    renderDespesasLista();
  }
  function salvarLimiteInline(){
    const inp=document.getElementById('exp-limit-input');
    if(!inp) return;
    metasMesAtual().gastos=parseFloat(inp.value)||0;
    saveMetas();
    renderMonthTicker();
  }
  function toggleFinAcoes(id,evt){
    if(evt) evt.stopPropagation();
    const el=document.getElementById('fid-'+id);
    if(!el) return;
    document.querySelectorAll('.fin-item-row.open').forEach(function(o){if(o!==el)o.classList.remove('open');});
    el.classList.toggle('open');
  }
  function abrirFormNovaDespesa(){
    const hoje=new Date().toISOString().slice(0,10);
    const html='<div class="field"><label>'+t('reports.expenseName')+'</label><input id="exp-nome" placeholder="Uber, equipamento…"></div>'+
      '<div class="field"><label>'+t('field.date')+'</label><input id="exp-data" type="date" value="'+hoje+'"></div>'+
      '<div class="field"><label data-t="reports.expenseCategory">Categoria</label>'+categoriaSelectHtml('exp-categoria', DESPESA_CATEGORIAS_SUGERIDAS, '')+'</div>'+
      '<div class="field"><label>'+t('reports.expenseValue')+'</label><input id="exp-valor" type="number" min="0" inputmode="decimal" placeholder="18" onkeydown="if(event.key===\'Enter\')guardarDespesaNova()"></div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="guardarDespesaNova()">'+t('reports.addExpense')+'</button>';
    openInfo(t('reports.addExpense'), html, abrirDespesas);
  }
  function guardarDespesaNova(){
    const nomeEl=document.getElementById('exp-nome'), valEl=document.getElementById('exp-valor'),
      catEl=document.getElementById('exp-categoria'), dataEl=document.getElementById('exp-data');
    const desc=(nomeEl.value||'').trim(), valor=parseFloat(valEl.value), categoria=(catEl&&catEl.value||'').trim();
    if(!desc || !valor){ showToast(t('toast.fillDescValue')); return; }
    const id='cst'+Date.now();
    custosData[id]={ id, descricao:desc, valor, categoria, data:(dataEl&&dataEl.value)||new Date().toISOString().slice(0,10) };
    saveCustosData();
    registrarAnalyticsDespesa(custosData[id]);
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    abrirDespesas();
    showToast(t('toast.costAdded'));
  }
  function renderDespesasLista(){
    const wrap=document.getElementById('exp-lista');
    if(!wrap) return;
    const lista=Object.values(custosData).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
    wrap.innerHTML = lista.length ? lista.map(c=>
      '<div class="card fin-item fin-item-row" id="fid-'+c.id+'" onclick="toggleFinAcoes(\''+c.id+'\',event)">'+
        '<div class="fin-item-title">'+escapeHtml(c.descricao)+'</div>'+
        '<div class="fin-item-date">'+(c.data?c.data.split('-').reverse().join('/'):'')+'</div>'+
        '<div class="fin-item-sub">'+(c.categoria?escapeHtml(c.categoria):'')+'</div>'+
        '<div class="fin-item-valor">'+fmtMoney(c.valor)+'</div>'+
        '<div class="fin-item-over">'+
          '<button class="fin-act-btn" onclick="event.stopPropagation();editarDespesa(\''+c.id+'\')"><span class="fin-act-ico">'+ICON_LAPIS+'</span><span>'+t('action.edit')+'</span></button>'+
          '<button class="fin-act-btn fin-act-del" onclick="event.stopPropagation();removerCusto(\''+c.id+'\')"><span class="fin-act-ico">'+ICON_LIXO+'</span><span>'+t('action.remove')+'</span></button>'+
        '</div>'+
      '</div>'
    ).join('') : '<p class="u-label-nd u-p-10-2">'+t('cost.empty')+'</p>';
  }
  function editarDespesa(id){
    const c=custosData[id]; if(!c) return;
    const html='<div class="field"><label>'+t('reports.expenseName')+'</label><input id="exp-edit-nome" value="'+escapeHtml(c.descricao)+'"></div>'+
      '<div class="field"><label>'+t('field.date')+'</label><input id="exp-edit-data" type="date" value="'+(c.data||'')+'"></div>'+
      '<div class="field"><label data-t="reports.expenseCategory">Categoria</label>'+categoriaSelectHtml('exp-edit-categoria', DESPESA_CATEGORIAS_SUGERIDAS, c.categoria||'')+'</div>'+
      '<div class="field"><label>'+t('reports.expenseValue')+'</label><input id="exp-edit-valor" type="number" min="0" inputmode="decimal" value="'+c.valor+'"></div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="salvarEdicaoDespesa(\''+id+'\')">'+t('reports.saveExpense')+'</button>';
    openInfo(t('reports.editExpense'), html, abrirDespesas);
  }
  function salvarEdicaoDespesa(id){
    const c=custosData[id]; if(!c) return;
    const desc=(document.getElementById('exp-edit-nome').value||'').trim();
    const valor=parseFloat(document.getElementById('exp-edit-valor').value);
    if(!desc || !valor){ showToast(t('toast.fillDescValue')); return; }
    c.descricao=desc; c.valor=valor; c.data=document.getElementById('exp-edit-data').value||c.data;
    c.categoria=(document.getElementById('exp-edit-categoria').value||'').trim();
    saveCustosData();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    abrirDespesas();
    showToast(t('toast.costAdded'));
  }
  /* ===== Receitas — tela dedicada (própria, sem nada em comum com Despesas):
     mesma linguagem de tela (botão Adicionar no topo, cards deslizáveis) mas
     card com layout próprio (título em cima; projeto/data/valor numa linha
     embaixo). Lançamentos automáticos (parcela de contrato paga) aparecem
     sem swipe/edição/exclusão — só os manuais (receitasData) respondem aos
     gestos. */
  function abrirReceitas(){
    const html='<button class="btn primary u-w-full u-mb-14" onclick="abrirFormNovaReceita()">+ '+t('reports.addIncome')+'</button>'+
      '<div id="rec-lista"></div>';
    openInfo(t('reports.incomeTitle'), html);
    renderReceitasLista();
  }
  function abrirFormNovaReceita(){
    const hoje=new Date().toISOString().slice(0,10);
    const html='<div class="field"><label>'+t('field.title')+'</label><input id="rec-nome" placeholder="Freelance extra, venda…"></div>'+
      '<div class="field"><label>'+t('field.date')+'</label><input id="rec-data" type="date" value="'+hoje+'"></div>'+
      '<div class="field"><label data-t="reports.expenseCategory">Categoria</label>'+categoriaSelectHtml('rec-categoria', RECEITA_CATEGORIAS_SUGERIDAS, '')+'</div>'+
      '<div class="field"><label>'+t('reports.expenseValue')+'</label><input id="rec-valor" type="number" min="0" inputmode="decimal" placeholder="50" onkeydown="if(event.key===\'Enter\')guardarReceitaNova()"></div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="guardarReceitaNova()">'+t('reports.addIncome')+'</button>';
    openInfo(t('reports.addIncome'), html, abrirReceitas);
  }
  function guardarReceitaNova(){
    const nomeEl=document.getElementById('rec-nome'), valEl=document.getElementById('rec-valor'),
      catEl=document.getElementById('rec-categoria'), dataEl=document.getElementById('rec-data');
    const desc=(nomeEl.value||'').trim(), valor=parseFloat(valEl.value), categoria=(catEl&&catEl.value||'').trim();
    if(!desc || !valor){ showToast(t('toast.fillDescValue')); return; }
    const id='rec'+Date.now();
    receitasData[id]={ id, descricao:desc, valor, categoria, data:(dataEl&&dataEl.value)||new Date().toISOString().slice(0,10) };
    saveReceitasData();
    renderMonthTicker();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    abrirReceitas();
    showToast(t('toast.incomeAdded'));
  }
  function renderReceitasLista(){
    const wrap=document.getElementById('rec-lista');
    if(!wrap) return;
    const automaticos=[];
    jobsVisiveis().forEach(j=>{
      (j.payments||[]).forEach(p=>{
        if(p.status!=='pago') return;
        automaticos.push({ desc:p.label||t('field.payment'), projeto:j.client||j.typeLabel||'', valor:Number(p.amount)||0, data:p.pagoEm||p.dueDate, jobId:j.id });
      });
    });
    const manuais=Object.values(receitasData);
    const itens=automaticos.map(it=>Object.assign({},it,{manual:false}))
      .concat(manuais.map(r=>({ id:r.id, desc:r.descricao, projeto:r.categoria||'', valor:Number(r.valor)||0, data:r.data, manual:true })))
      .sort((a,b)=>(b.data||'').localeCompare(a.data||''));
    if(!itens.length){ wrap.innerHTML='<p class="u-label-nd u-p-10-2">'+t('cost.empty')+'</p>'; return; }
    wrap.innerHTML=itens.map(it=>{
      const dataFmt=it.data?it.data.split('-').reverse().join('/'):'';
      const corpo='<div class="fin-item-title">'+escapeHtml(it.desc)+'</div>'+
          '<div class="fin-item-date">'+dataFmt+'</div>'+
          '<div class="fin-item-sub">'+escapeHtml(it.projeto||'')+'</div>'+
          '<div class="fin-item-valor">'+fmtMoney(it.valor)+'</div>';
      if(!it.manual){
        /* lançamento automático (parcela de contrato) — só leitura */
        return '<div class="card fin-item fin-item-auto">'+corpo+'</div>';
      }
      return '<div class="card fin-item fin-item-row" id="fid-'+it.id+'" onclick="toggleFinAcoes(\''+it.id+'\',event)">'+
        '<div class="fin-item-title">'+escapeHtml(it.desc)+'</div>'+
        '<div class="fin-item-date">'+(it.data?it.data.split('-').reverse().join('/'):'')+'</div>'+
        '<div class="fin-item-sub">'+escapeHtml(it.projeto||'')+'</div>'+
        '<div class="fin-item-valor">'+fmtMoney(it.valor)+'</div>'+
        '<div class="fin-item-over">'+
          '<button class="fin-act-btn" onclick="event.stopPropagation();editarReceitaManual(\''+it.id+'\')"><span class="fin-act-ico">'+ICON_LAPIS+'</span><span>'+t('action.edit')+'</span></button>'+
          '<button class="fin-act-btn fin-act-del" onclick="event.stopPropagation();removerReceita(\''+it.id+'\')"><span class="fin-act-ico">'+ICON_LIXO+'</span><span>'+t('action.remove')+'</span></button>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  function pushHistory(job,text,tipo){
    job.history=job.history||[];
    job.history.unshift({ts:new Date().toLocaleString(jsLocale(),{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}), text, tipo:tipo||'sistema', tsRaw:Date.now()});
  }
  function gerarMilestones(job){
    const ms=[];
    const labelPrincipal='Evento';
    const recorrente = !!(job.recorrencia);
    if(job.structure.contrato) ms.push({key:'contrato', t:t('milestone.contractSigned'), status:'pendente', m:'aguarda envio'});
    if(job.structure.pagamentos && !recorrente) ms.push({key:'sinal', t:t('milestone.signal')+fmtMoney(job.value*0.5), status:'futuro', m:t('milestone.afterSignature')});
    ms.push({key:'principal', t:labelPrincipal+' — '+job.typeLabel, status:'futuro', m:(job.date||'data a definir')+(job.local?(' · '+job.local):'')});
    if(job.structure.pagamentos && !recorrente) ms.push({key:'pagamento_final', t:t('milestone.finalPayment')+fmtMoney(job.value*0.5), status:'futuro', m:t('milestone.after')+(labelPrincipal==='Evento'?'o evento':('a '+labelPrincipal.toLowerCase()))});
    /* a entrega é uma etapa universal do trabalho (tal como o evento principal),
       não depende de o job ter ou não uma checklist de entrega ativada — antes
       disto, "checklist:false" era o valor fixo de todo job novo, e como esta
       marca nunca ficava "true", a etapa de entrega nunca existia e o anel
       "Entregues" do card Performance ficava sempre a 0/0 */
    ms.push({key:'entrega', t:t('milestone.finalDelivery'), status:'futuro', m:t('milestone.deliveryPending')});
    return ms;
  }
  function gerarPagamentos(job){
    const half=job.value*0.5;
    const hojeIso=new Date().toISOString().slice(0,10);
    return [
      {label:'Sinal', amount:half, status:'pendente', dueDate:hojeIso, comprovativo:null},
      {label:'Pagamento final', amount:half, status:'pendente', dueDate:job.dateRaw||null, comprovativo:null}
    ];
  }

  /* ============================================================
     CONTRATOS RECORRENTES — mensalidades, avenças, retainers.
     job.recorrencia = null (trabalho único, comportamento normal) ou:
       { ativa, frequencia, valorPorCiclo, inicio, fim|null,
         proximaCobranca, ciclosGerados }
     Cada ciclo vira uma parcela em job.payments (mesma estrutura de sempre —
     assim toda a UI de pagamentos, os anéis e os lembretes já funcionam sem
     alteração). avancarRecorrencias() corre ao carregar os dados e vai
     acrescentando o próximo ciclo à medida que a data chega, sem o
     utilizador recriar o trabalho. O dia do vencimento é o dia da data de
     início (ex.: início a 05/08 → cobra dia 5 de cada mês/trimestre/etc.). */
  const RECORRENCIA_FREQ = {
    semanal:    { labelKey:'recur.freq.weekly',    unidade:'dia', passo:7,  sufixoKey:'recur.per.week' },
    quinzenal:  { labelKey:'recur.freq.biweekly',  unidade:'dia', passo:14, sufixoKey:'recur.per.biweek' },
    mensal:     { labelKey:'recur.freq.monthly',   unidade:'mes', passo:1,  sufixoKey:'recur.per.month' },
    trimestral: { labelKey:'recur.freq.quarterly', unidade:'mes', passo:3,  sufixoKey:'recur.per.quarter' },
    semestral:  { labelKey:'recur.freq.biannual',  unidade:'mes', passo:6,  sufixoKey:'recur.per.semester' },
    anual:      { labelKey:'recur.freq.yearly',    unidade:'mes', passo:12, sufixoKey:'recur.per.year' }
  };
  /* Avança uma data ISO segundo a frequência. Para 'mes' preserva o dia
     original, ajustando para o último dia quando o mês de destino é mais
     curto (ex.: dia 31 → 30 de abril, 28/29 de fevereiro). */
  function avancarDataRecorrencia(freq, iso){
    const cfg = RECORRENCIA_FREQ[freq]; if(!cfg) return iso;
    const [y,m,d] = iso.split('-').map(Number);
    if(cfg.unidade==='dia'){
      const dt = new Date(Date.UTC(y, m-1, d)); dt.setUTCDate(dt.getUTCDate()+cfg.passo);
      return dt.toISOString().slice(0,10);
    }
    let nm = (m-1)+cfg.passo, ny = y + Math.floor(nm/12); nm = nm%12;
    const ultimoDia = new Date(Date.UTC(ny, nm+1, 0)).getUTCDate();
    const dia = Math.min(d, ultimoDia);
    return new Date(Date.UTC(ny, nm, dia)).toISOString().slice(0,10);
  }
  function labelCicloRecorrencia(job, iso){
    const dt = new Date(iso+'T00:00:00');
    return t('recur.cycleLabel')+' '+dt.toLocaleDateString(jsLocale(), {month:'long', year:'numeric'});
  }
  /* Cria a recorrência a partir dos dados do wizard e devolve a primeira
     parcela (ciclo inicial) já pendente. */
  function iniciarRecorrencia(job, freq, valorPorCiclo, inicioIso, fimIso){
    job.recorrencia = {
      ativa:true, frequencia:freq, valorPorCiclo:valorPorCiclo,
      inicio:inicioIso, fim:fimIso||null,
      proximaCobranca:inicioIso, ciclosGerados:0
    };
    return avancarRecorrencias(job, true);
  }
  /* Gera os ciclos em atraso/vencidos de UM job (ou de todos, se chamada sem
     argumento a partir do load). devolve o nº de parcelas criadas. Gera o
     ciclo inicial mesmo que a data seja futura (forcarPrimeiro), para o
     trabalho já nascer com a primeira cobrança visível; os seguintes só
     entram quando a sua data chega. Cap de segurança de 60 ciclos por
     passagem, para uma recorrência antiga nunca gerar milhares de parcelas. */
  function avancarRecorrencias(job, forcarPrimeiro){
    if(!job){
      let total=0; Object.values(jobsData).forEach(j=>{ total+=avancarRecorrencias(j,false)||0; });
      if(total) saveJobsData();
      return total;
    }
    const r=job.recorrencia; if(!r || !r.ativa) return 0;
    const hojeIso=new Date().toISOString().slice(0,10);
    let criadas=0, guarda=0;
    while(guarda++ < 60){
      if(r.fim && r.proximaCobranca > r.fim){ r.ativa=false; break; }
      const venceHojeOuAntes = r.proximaCobranca <= hojeIso;
      if(!(forcarPrimeiro && r.ciclosGerados===0) && !venceHojeOuAntes) break;
      job.payments = job.payments || [];
      job.payments.push({
        label: labelCicloRecorrencia(job, r.proximaCobranca),
        amount: r.valorPorCiclo, status:'pendente',
        dueDate: r.proximaCobranca, comprovativo:null, recorrente:true
      });
      r.ciclosGerados++; criadas++;
      r.proximaCobranca = avancarDataRecorrencia(r.frequencia, r.proximaCobranca);
      forcarPrimeiro=false;
    }
    return criadas;
  }
  function addDiasISO(iso, delta){
    const d=new Date(iso+'T00:00:00');
    d.setDate(d.getDate()+delta);
    return d;
  }
  function fmtDiaMesPt(d){ return d.toLocaleDateString(jsLocale(),{day:'2-digit',month:'short'}); }
  /* lembretes de pagamento: 7/1/0 dias antes, sempre — deixou de haver um
     "perfil de lembretes" global escolhido em Perfil; o único controlo é o
     toggle na última etapa do wizard de trabalho (liga/desliga por projeto). */
  const LEMBRETES_OFFSETS_PADRAO=[-7,-1,0];
  function gerarLembreteLabel(delta){
    if(delta===0) return t('reminder.onTheDay');
    const n=Math.abs(delta);
    return n+' '+(n===1?t('field.dayLabel'):t('field.daysLabel'))+t('reminder.daysBeforeSuffix');
  }
  function gerarLembretes(job){
    const offsets=LEMBRETES_OFFSETS_PADRAO;
    if(!job || !job.dateRaw){
      return offsets.map(d=>({t:gerarLembreteLabel(d), alvo:'pagamentos', offset:d, dataISO:null, enviado:false}));
    }
    return offsets.map(delta=>({t:gerarLembreteLabel(delta)+' — '+fmtDiaMesPt(addDiasISO(job.dateRaw,delta)), alvo:'pagamento final', offset:delta, dataISO:addDiasISO(job.dateRaw,delta).toISOString().slice(0,10), enviado:false}));
  }
  function gerarBriefing(job){
    return { perguntas:[], respondido:false, pessoasImportantes:[], cronograma:[], observacoes:'', prazo: job.dateRaw||null };
  }
  function gerarEstadoInformacoesCliente(job){
    if(job.contract.status!=='assinado' && job.contract.status!=='enviado') return statusEmoji('pending')+' Não enviado';
    if(job.briefing.respondido) return statusEmoji('done')+' Concluído';
    if(job.briefing.prazo && diasEntre(job.briefing.prazo)<0) return statusEmoji('late')+' Prazo expirado';
    const temAlgo = (job.briefing.cronograma&&job.briefing.cronograma.length) || (job.briefing.pessoasImportantes&&job.briefing.pessoasImportantes.length) || (job.briefing.observacoes&&job.briefing.observacoes.trim());
    return temAlgo ? (statusEmoji('progress')+' Parcialmente preenchido') : (statusEmoji('pending')+' Aguardando preenchimento');
  }
  const CHECKLIST_ITENS_DEFAULT=['checklist.item.finalMaterial','checklist.item.sendToClient','checklist.item.confirmReceipt'];
  function gerarChecklist(job){
    const itens=CHECKLIST_ITENS_DEFAULT.map(key=>({t:t(key), feito:false}));
    return {itens};
  }

  const blocoNomes={
    identificacao:'Identificação das partes', pagamento:'Pagamento', entrega:'Entrega',
    cancelamento:'Cancelamento', direitos:'Direitos de imagem', confidencialidade:'Confidencialidade',
    forcaMaior:'Força maior', alteracaoEscopo:'Alteração de âmbito',
    propriedadeIntelectual:'Materiais de trabalho', garantias:'Garantias e revisões',
    servicosIncluidos:'Serviços incluídos'
  };
  /* Cada função aceita (job, params) — params vem de b.params, definido por
     Motor de cláusulas genérico (interim) — usado por todo trabalho/modelo
     em branco (blocosModeloPadrao) e por qualquer contrato já existente
     que referencie uma destas 9 chaves. Mantido de propósito mesmo após a
     remoção do catálogo falso da Biblioteca: é a lógica que gera o texto
     final de QUALQUER contrato hoje, inclusive os já criados por usuários
     reais — substituí-lo exige primeiro um gerador de blocos ligado à
     Biblioteca Jurídica oficial (blocos com nomes/estrutura do Blueprint,
     não estas 9 chaves em português). Cada função aceita (job, params); o
     texto reage a alterações no job (valor, data, local) porque só é
     calculado no momento de renderizar. */
  const blocoTextos={
    identificacao: (job,p)=>t('contract.between').replace('{company}',perfilData.empresa||'Pivots').replace('{client}',job.client).replace('{job}',job.typeLabel).toLowerCase()+(job.date?(' em '+job.date):'')+(job.local?(', em '+job.local):'')+'.',
    pagamento: (job,p)=>{
      const sinal = (p&&p.percentSinal!=null) ? p.percentSinal : 50;
      const prazoSaldo = (p&&p.prazoSaldo) || 'à data do evento';
      return 'O valor total é de '+fmtMoney(job.value)+', dividido em sinal de '+fmtMoney(job.value*sinal/100)+' ('+sinal+'%) à assinatura e '+fmtMoney(job.value*(100-sinal)/100)+' até '+prazoSaldo+'.';
    },
    entrega: (job,p)=>{
      // Se o trabalho tem dados reais da Etapa "Entrega e Aprovação" (formato
      // escolhido, data de entrega, ajustes configurados), usa-os para
      // preencher a cláusula existente em vez dos valores genéricos do
      // modelo — sem criar nenhuma cláusula nova.
      const e=job.entrega;
      if(e && (e.dataEntrega || e.formatoEntrega)){
        const formatoLabelMap={digital:'por download digital', galeria:'por galeria online', pendrive:'em pen drive', hd:'em HD externo', album:'em álbum', impressao:'em formato impresso', outro:'conforme combinado'};
        const formato = formatoLabelMap[e.formatoEntrega] || (p&&p.formatoEntrega) || 'por galeria online';
        let txt = 'O material final é entregue '+formato;
        if(e.dataEntrega){
          const dataFmt = e.dataEntrega.split('-').reverse().join('/');
          txt += ', com previsão de entrega em '+dataFmt+'.';
        } else {
          const dias=(p&&p.prazoEntregaDias!=null)?p.prazoEntregaDias:60;
          const marco=(p&&p.marcoEntrega)||'o evento';
          txt += ', em até '+dias+' dias após '+marco+'.';
        }
        if(e.permiteAjustes && e.ajustes && e.ajustes.length) txt += ' O cliente tem direito a '+e.ajustes.length+' '+(e.ajustes.length===1?'rodada de revisão':'rodadas de revisão')+' sobre o material entregue.';
        return txt;
      }
      const dias = (p&&p.prazoEntregaDias!=null) ? p.prazoEntregaDias : 60;
      const formato = (p&&p.formatoEntrega) || 'por galeria online';
      const marco = (p&&p.marcoEntrega) || 'o evento';
      return 'O material final é entregue '+formato+', em até '+dias+' dias após '+marco+'.';
    },
    cancelamento: (job,p)=>{
      const dias = (p&&p.diasCancelamento!=null) ? p.diasCancelamento : 30;
      const pct = (p&&p.percentReembolso!=null) ? p.percentReembolso : 50;
      return 'Em caso de cancelamento pelo cliente com mais de '+dias+' dias de antecedência, o sinal é reembolsável a '+pct+'%. Após esse prazo, não é reembolsável.';
    },
    direitos: (job,p)=> (p&&p.cessaoTotal)
      ? 'Os direitos de utilização dos materiais finais são cedidos ao Cliente após o pagamento integral, incluindo uso comercial, promocional e institucional.'
      : 'O prestador detém os direitos de imagem para fins de portfólio e divulgação, salvo acordo escrito em contrário.',
    confidencialidade: (job,p)=>'Ambas as partes comprometem-se a não divulgar informação confidencial trocada no âmbito deste trabalho.',
    forcaMaior: (job,p)=>'Nenhuma das partes é responsável por atrasos ou incumprimentos causados por circunstâncias fora do seu controlo razoável (condições climatéricas extremas, falhas de equipamento de terceiros, restrições de última hora), devendo a data ser remarcada de comum acordo assim que possível.',
    alteracaoEscopo: (job,p)=>'Qualquer alteração ao âmbito acordado (serviços adicionais, extensão de duração, entregas extra) só é válida mediante confirmação escrita e o correspondente ajuste de preço e prazo.',
    propriedadeIntelectual: (job,p)=>'O prestador mantém a titularidade dos ficheiros de trabalho, métodos e materiais preliminares, que não integram a entrega final.',
    garantias: (job,p)=>'O prestador compromete-se a corrigir, sem custo adicional, quaisquer erros técnicos que lhe sejam imputáveis, identificados até 15 dias após a entrega.',
    /* p.servicos é um snapshot (nome/categoria/descricao/valor) capturado na
       Etapa 6 do wizard, não uma referência viva ao modelo em Perfil >
       Serviços — se o modelo mudar depois, o texto já gerado não muda. */
    servicosIncluidos: (job,p)=>{
      const lista=(p&&p.servicos)||[];
      if(!lista.length) return 'Nenhum serviço adicional foi especificado para este trabalho.';
      return 'Este trabalho inclui os seguintes serviços:\n'+lista.map(s=>
        '• '+s.nome+(s.descricao?' — '+s.descricao:'')+(s.valor?' ('+fmtMoney(s.valor)+')':'')
      ).join('\n');
    }
  };
  function genId(){ return 'b'+Math.random().toString(36).slice(2,9); }
  function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Aviso legal obrigatório — anexado a todo contrato gerado e mostrado no ato de compra.
  function blockIcon(name){
    const n=(name||'').toLowerCase();
    const m=[
      [/identif|partes|parties|contratante|arrendador|locador|prestador|vendedor|seller|buyer|comprador|staffing|pessoal envolvido/,'fluent:people-16-regular'],
      [/subcontrat|subempreit/,'fluent:people-team-16-regular'],
      [/assinatura|signature|execut|signing/,'fluent:signature-16-regular'],
      [/pagamento|payment|fee|price|valor|invoice|billing|compensation|deposit|fiança|honorár|remunera|draw.*schedule|schedule.*payment/,'fluent:money-16-regular'],
      [/cancelamento|cancellation|termination|rescisão|resolu/,'fluent:dismiss-circle-16-regular'],
      [/penalidade|penalty|penali|multa|delay.*penalt|penalt.*delay/,'fluent:error-circle-16-regular'],
      [/prazo|period|duration|term|vigência|service.*schedule|schedule.*service|cronograma/,'fluent:calendar-16-regular'],
      [/weather|clima|atraso.*clima|clima.*atraso/,'fluent:arrow-clockwise-16-regular'],
      [/confidential|sigilo|nda|non.disclosure/,'fluent:lock-closed-16-regular'],
      [/propriedade intelectual|intellectual property|direitos autorais|copyright/,'fluent:ribbon-16-regular'],
      [/licen[çc]/,'fluent:document-checkmark-16-regular'],
      [/responsabilidade|liability|insurance|seguro|dano.*oculto/,'fluent:shield-16-regular'],
      [/scope|âmbito|entregável|deliverable|objeto|object/,'fluent:clipboard-task-16-regular'],
      [/serviços adicionais|additional services|serviços sazon|seasonal/,'fluent:star-16-regular'],
      [/jurisd|foro|lei aplicável|governing|general provision|disposição geral/,'fluent:scales-16-regular'],
      [/revis|feedback|review|aprova|quality.*control|quality.*inspections|inspeç|vistoria/,'fluent:checkmark-circle-16-regular'],
      [/devolução|return/,'fluent:arrow-undo-16-regular'],
      [/imagem|record|gravação|fotograf|mídia|media|direito de imagem/,'fluent:camera-16-regular'],
      [/exclu|non.compete|concorrência|prohibit|proibido/,'fluent:prohibited-16-regular'],
      [/repair|conserto|workmanship|garantia.*execução/,'fluent:wrench-screwdriver-16-regular'],
      [/technical|rider|técnico|logística|logistic|maintenance|manutenção/,'fluent:wrench-16-regular'],
      [/change.*order|ordem.*alteração|mudanças.*cor/,'fluent:edit-settings-16-regular'],
      [/material|paint|tinta|surface.*prep|preparação.*superfície|limpeza|cleanup|waste|resídu|debris|descarte/,'fluent:box-16-regular'],
      [/equip|maquinário|machinery|asset|fixture|acabamento|supply|supplies|suprimento|plantas|plant/,'fluent:box-16-regular'],
      [/hosting|infraestruct|server|servidor/,'fluent:server-16-regular'],
      [/backup|recovery|recuperação/,'fluent:arrow-clockwise-16-regular'],
      [/safety|segurança do canteiro|site.*safe/,'fluent:shield-lock-16-regular'],
      [/segurança|security/,'fluent:shield-lock-16-regular'],
      [/property|imóvel|gestão.*imóvel|manager|gerent/,'fluent:home-16-regular'],
      [/access|acesso/,'fluent:key-16-regular'],
      [/report|relatório|accounting|contabilidade/,'fluent:chart-multiple-16-regular'],
      [/catering|buffet|aliment|food|comida/,'fluent:food-16-regular'],
      [/guest|convidado|número.*pessoa|animais.*moradores|pets/,'fluent:people-team-16-regular'],
      [/allerg|dietar|restrição alimentar/,'fluent:heart-pulse-16-regular'],
      [/sponsor|patrocínio/,'fluent:megaphone-16-regular'],
      [/transparency|disclosure|divulgação/,'fluent:eye-16-regular'],
      [/perform|atuação|espetáculo|show/,'fluent:star-16-regular'],
      [/content|conteúdo/,'fluent:document-text-16-regular'],
      [/warranty|garantia/,'fluent:ribbon-16-regular'],
      [/irrigation|irrigação/,'fluent:drop-16-regular'],
    ];
    for(const [re,icon] of m){ if(re.test(n)) return '<span class="nav-ico block-type-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/'+icon+'.svg);-webkit-mask-image:url(https://api.iconify.design/'+icon+'.svg)"></span>'; }
    return '<span class="nav-ico block-type-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/fluent:document-16-regular.svg);-webkit-mask-image:url(https://api.iconify.design/fluent:document-16-regular.svg)"></span>';
  }
  const BIB_BLOCK_LABELS={
    /* Bloco abaixo agrupado fora da ordem alfabética de propósito — nomes de
       bloco introduzidos pelos 8 novos contratos de Home & Trade Services. */
    "Scope of Work":{pt:"Âmbito do Trabalho",es:"Alcance del Trabajo"},
    "Materials and Paint Specifications":{pt:"Materiais e Especificações de Tinta",es:"Materiales y Especificaciones de Pintura"},
    "Site Preparation and Access":{pt:"Preparação e Acesso ao Local",es:"Preparación y Acceso al Lugar"},
    "Surface Preparation":{pt:"Preparação de Superfícies",es:"Preparación de Superficies"},
    "Color Changes and Additional Work":{pt:"Mudanças de Cor e Trabalho Adicional",es:"Cambios de Color y Trabajo Adicional"},
    "Cleanup and Waste Disposal":{pt:"Limpeza e Descarte de Resíduos",es:"Limpieza y Eliminación de Residuos"},
    "Weather Delays":{pt:"Atrasos Climáticos",es:"Retrasos por Clima"},
    "Payment and Draw Schedule":{pt:"Pagamento e Cronograma de Desembolsos",es:"Pago y Calendario de Desembolsos"},
    "Permits and Approvals":{pt:"Licenças e Aprovações",es:"Permisos y Aprobaciones"},
    "Change Orders":{pt:"Ordens de Alteração",es:"Órdenes de Cambio"},
    "Materials and Fixtures":{pt:"Materiais e Acabamentos",es:"Materiales y Accesorios"},
    "Subcontractors":{pt:"Subempreiteiros",es:"Subcontratistas"},
    "Site Conditions and Hidden Damage":{pt:"Condições do Local e Danos Ocultos",es:"Condiciones del Sitio y Daños Ocultos"},
    "Warranty of Workmanship":{pt:"Garantia de Execução",es:"Garantía de Mano de Obra"},
    "Insurance and Licensing":{pt:"Seguro e Licenciamento",es:"Seguro y Licencias"},
    "Permits and Regulatory Compliance":{pt:"Licenças e Conformidade Regulatória",es:"Permisos y Cumplimiento Normativo"},
    "Materials and Equipment":{pt:"Materiais e Equipamentos",es:"Materiales y Equipos"},
    "Site Safety":{pt:"Segurança do Canteiro",es:"Seguridad en el Sitio"},
    "Inspections and Quality Control":{pt:"Vistorias e Controlo de Qualidade",es:"Inspecciones y Control de Calidad"},
    "Delay Penalties":{pt:"Penalizações por Atraso",es:"Penalizaciones por Retraso"},
    "Insurance and Bonding":{pt:"Seguro e Caução",es:"Seguro y Fianza"},
    "Service Schedule":{pt:"Cronograma de Serviço",es:"Calendario de Servicio"},
    "Access to Premises":{pt:"Acesso ao Imóvel",es:"Acceso al Inmueble"},
    "Cleaning Supplies and Equipment":{pt:"Produtos e Equipamentos de Limpeza",es:"Productos y Equipos de Limpieza"},
    "Pets and Household Members":{pt:"Animais e Moradores",es:"Mascotas y Convivientes"},
    "Cancellation and Rescheduling Policy":{pt:"Política de Cancelamento e Reagendamento",es:"Política de Cancelación y Reprogramación"},
    "Damage Policy":{pt:"Política de Danos",es:"Política de Daños"},
    "Additional Services":{pt:"Serviços Adicionais",es:"Servicios Adicionales"},
    "Access and Security":{pt:"Acesso e Segurança",es:"Acceso y Seguridad"},
    "Supplies and Equipment":{pt:"Suprimentos e Equipamentos",es:"Suministros y Equipos"},
    "Staffing and Personnel":{pt:"Pessoal Envolvido",es:"Personal Involucrado"},
    "Quality Control and Inspections":{pt:"Controlo de Qualidade e Vistorias",es:"Control de Calidad e Inspecciones"},
    "Cancellation and Termination":{pt:"Cancelamento e Rescisão",es:"Cancelación y Rescisión"},
    "Materials and Plants":{pt:"Materiais e Plantas",es:"Materiales y Plantas"},
    "Irrigation and Equipment":{pt:"Irrigação e Equipamento",es:"Riego y Equipo"},
    "Access to Property":{pt:"Acesso ao Imóvel",es:"Acceso al Inmueble"},
    "Waste and Debris Removal":{pt:"Remoção de Resíduos e Detritos",es:"Retiro de Residuos y Escombros"},
    "Seasonal and Additional Services":{pt:"Serviços Sazonais e Adicionais",es:"Servicios Estacionales y Adicionales"},
    "Inventory of Goods":{pt:"Inventário dos Bens",es:"Inventario de Bienes"},
    "Packing Services":{pt:"Serviço de Embalagem",es:"Servicio de Embalaje"},
    "Valuation and Insurance Coverage":{pt:"Avaliação e Cobertura de Seguro",es:"Valoración y Cobertura de Seguro"},
    "Storage Services":{pt:"Serviços de Armazenamento",es:"Servicios de Almacenamiento"},
    "Delivery Window and Delays":{pt:"Janela de Entrega e Atrasos",es:"Ventana de Entrega y Retrasos"},
    "Damage Claims Procedure":{pt:"Procedimento de Reclamação de Danos",es:"Procedimiento de Reclamación de Daños"},
    "Access and Parking":{pt:"Acesso e Estacionamento",es:"Acceso y Estacionamiento"},
    "Cancellation Policy":{pt:"Política de Cancelamento",es:"Política de Cancelación"},
    "Estimate and Payment":{pt:"Orçamento e Pagamento",es:"Presupuesto y Pago"},
    "Materials":{pt:"Materiais",es:"Materiales"},
    "Additional Work Discovered":{pt:"Trabalho Adicional Identificado",es:"Trabajo Adicional Detectado"},
    "Cleanup":{pt:"Limpeza",es:"Limpieza"},
    "24/7 Support":{pt:"Suporte 24/7",es:"Soporte 24/7"},
    "3D Rendering":{pt:"Renderização 3D",es:"Renderizado 3D"},
    "API Versioning":{pt:"Versionamento de API",es:"Versionado de API"},
    "Acceptance":{pt:"Aceitação",es:"Aceptación"},
    "Acceptance Criteria":{pt:"Critérios de Aceitação",es:"Criterios de Aceptación"},
    "Acceptance Testing":{pt:"Testes de Aceitação",es:"Pruebas de Aceptación"},
    "Access Authorization":{pt:"Autorização de Acesso",es:"Autorización de Acceso"},
    "Accommodation":{pt:"Alojamento",es:"Alojamiento"},
    "Accounting Scope":{pt:"Âmbito Contabilístico",es:"Alcance Contable"},
    "Additional Audits":{pt:"Auditorias Adicionais",es:"Auditorías Adicionales"},
    "Additional Campaigns":{pt:"Campanhas Adicionais",es:"Campañas Adicionales"},
    "Additional Consultations":{pt:"Consultas Adicionais",es:"Consultas Adicionales"},
    "Additional Deliverables":{pt:"Entregáveis Adicionais",es:"Entregables Adicionales"},
    "Additional Hours":{pt:"Horas Adicionais",es:"Horas Adicionales"},
    "Additional Materials":{pt:"Materiais Adicionais",es:"Materiales Adicionales"},
    "Additional Pages":{pt:"Páginas Adicionais",es:"Páginas Adicionales"},
    "Additional Platforms":{pt:"Plataformas Adicionais",es:"Plataformas Adicionales"},
    "Additional Positions":{pt:"Posições Adicionais",es:"Posiciones Adicionales"},
    "Additional Reports":{pt:"Relatórios Adicionais",es:"Informes Adicionales"},
    "Additional Research":{pt:"Pesquisa Adicional",es:"Investigación Adicional"},
    "Additional Revisions":{pt:"Revisões Adicionais",es:"Revisiones Adicionales"},
    "Additional Screens":{pt:"Ecrãs Adicionais",es:"Pantallas Adicionales"},
    "Additional Sessions":{pt:"Sessões Adicionais",es:"Sesiones Adicionales"},
    "Additional Versions":{pt:"Versões Adicionais",es:"Versiones Adicionales"},
    "Advertising Scope":{pt:"Âmbito Publicitário",es:"Alcance Publicitario"},
    "Album":{pt:"Álbum",es:"Álbum"},
    "Analytics":{pt:"Análises",es:"Analítica"},
    "Analytics Reports":{pt:"Relatórios de Análise",es:"Informes de Analítica"},
    "App Store Publication":{pt:"Publicação na App Store",es:"Publicación en App Store"},
    "Approval Process":{pt:"Processo de Aprovação",es:"Proceso de Aprobación"},
    "Approvals":{pt:"Aprovações",es:"Aprobaciones"},
    "Architect Responsibilities":{pt:"Responsabilidades do Arquiteto",es:"Responsabilidades del Arquitecto"},
    "Architecture":{pt:"Arquitetura",es:"Arquitectura"},
    "Archival Footage Licensing":{pt:"Licenciamento de Imagens de Arquivo",es:"Licencia de Metraje de Archivo"},
    "Assessment Tools":{pt:"Ferramentas de Avaliação",es:"Herramientas de Evaluación"},
    "Assignment":{pt:"Cessão",es:"Cesión"},
    "Audit Scope":{pt:"Âmbito da Auditoria",es:"Alcance de la Auditoría"},
    "Authentication":{pt:"Autenticação",es:"Autenticación"},
    "Availability":{pt:"Disponibilidade",es:"Disponibilidad"},
    "Brand Strategy Workshop":{pt:"Workshop de Estratégia de Marca",es:"Taller de Estrategia de Marca"},
    "Brand Usage":{pt:"Uso da Marca",es:"Uso de la Marca"},
    "Budget Responsibility":{pt:"Responsabilidade Orçamental",es:"Responsabilidad Presupuestaria"},
    "Business Consulting":{pt:"Consultoria Empresarial",es:"Consultoría Empresarial"},
    "Business Requirements":{pt:"Requisitos de Negócio",es:"Requisitos de Negocio"},
    "Campaign Management":{pt:"Gestão de Campanhas",es:"Gestión de Campañas"},
    "Cancellation":{pt:"Cancelamento",es:"Cancelación"},
    "Candidate Guarantees":{pt:"Garantias do Candidato",es:"Garantías del Candidato"},
    "Certificates":{pt:"Certificados",es:"Certificados"},
    "Certification":{pt:"Certificação",es:"Certificación"},
    "Certified Translation":{pt:"Tradução Certificada",es:"Traducción Certificada"},
    "Client Responsibilities":{pt:"Responsabilidades do Cliente",es:"Responsabilidades del Cliente"},
    "Cloud Hosting":{pt:"Alojamento na Cloud",es:"Alojamiento en la Nube"},
    "Cloud Infrastructure":{pt:"Infraestrutura Cloud",es:"Infraestructura en la Nube"},
    "Commercial Exclusivity":{pt:"Exclusividade Comercial",es:"Exclusividad Comercial"},
    "Commercial Usage":{pt:"Uso Comercial",es:"Uso Comercial"},
    "Commercial Usage Rights":{pt:"Direitos de Uso Comercial",es:"Derechos de Uso Comercial"},
    "Commission Rules":{pt:"Regras de Comissão",es:"Reglas de Comisión"},
    "Community Access":{pt:"Acesso à Comunidade",es:"Acceso a la Comunidad"},
    "Community Management":{pt:"Gestão de Comunidade",es:"Gestión de Comunidad"},
    "Compensation":{pt:"Remuneração",es:"Compensación"},
    "Confidential Information":{pt:"Informação Confidencial",es:"Información Confidencial"},
    "Confidentiality":{pt:"Confidencialidade",es:"Confidencialidad"},
    "Conflict of Interest":{pt:"Conflito de Interesses",es:"Conflicto de Interés"},
    "Consulting Hours":{pt:"Horas de Consultoria",es:"Horas de Consultoría"},
    "Consulting Scope":{pt:"Âmbito da Consultoria",es:"Alcance de la Consultoría"},
    "Content Calendar":{pt:"Calendário de Conteúdos",es:"Calendario de Contenidos"},
    "Content Production":{pt:"Produção de Conteúdo",es:"Producción de Contenido"},
    "Contract Object":{pt:"Objeto do Contrato",es:"Objeto del Contrato"},
    "Copyright":{pt:"Direitos de Autor",es:"Derechos de Autor"},
    "Corrective Action Reviews":{pt:"Revisões de Ações Corretivas",es:"Revisiones de Acciones Correctivas"},
    "Course Recording":{pt:"Gravação do Curso",es:"Grabación del Curso"},
    "Course Scope":{pt:"Âmbito do Curso",es:"Alcance del Curso"},
    "Crash Monitoring":{pt:"Monitorização de Falhas",es:"Monitoreo de Fallos"},
    "Creative Brief":{pt:"Briefing Criativo",es:"Brief Creativo"},
    "Creative Direction":{pt:"Direção Criativa",es:"Dirección Creativa"},
    "Creative Production":{pt:"Produção Criativa",es:"Producción Creativa"},
    "Curriculum":{pt:"Currículo",es:"Currículo"},
    "Customer Protection":{pt:"Proteção do Cliente",es:"Protección del Cliente"},
    "Data Protection":{pt:"Proteção de Dados",es:"Protección de Datos"},
    "Deadlines":{pt:"Prazos",es:"Plazos"},
    "Definition of Confidential Information":{pt:"Definição de Informação Confidencial",es:"Definición de Información Confidencial"},
    "Deliverables":{pt:"Entregáveis",es:"Entregables"},
    "Design Scope":{pt:"Âmbito do Design",es:"Alcance del Diseño"},
    "Design System":{pt:"Sistema de Design",es:"Sistema de Diseño"},
    "DevOps":{pt:"DevOps",es:"DevOps"},
    "Developer Responsibilities":{pt:"Responsabilidades do Programador",es:"Responsabilidades del Desarrollador"},
    "Developer Support":{pt:"Suporte ao Programador",es:"Soporte al Desarrollador"},
    "Development Methodology":{pt:"Metodologia de Desenvolvimento",es:"Metodología de Desarrollo"},
    "Dispute Resolution":{pt:"Resolução de Litígios",es:"Resolución de Disputas"},
    "Documentation":{pt:"Documentação",es:"Documentación"},
    "Domain Registration":{pt:"Registo de Domínio",es:"Registro de Dominio"},
    "Drone Operation":{pt:"Operação de Drone",es:"Operación de Dron"},
    "Drone Services":{pt:"Serviços de Drone",es:"Servicios de Dron"},
    "Duration":{pt:"Duração",es:"Duración"},
    "Editorial Calendar":{pt:"Calendário Editorial",es:"Calendario Editorial"},
    "Editorial Scope":{pt:"Âmbito Editorial",es:"Alcance Editorial"},
    "Emergency Campaigns":{pt:"Campanhas de Emergência",es:"Campañas de Emergencia"},
    "Emergency Content":{pt:"Conteúdo de Emergência",es:"Contenido de Emergencia"},
    "Emergency Procedures":{pt:"Procedimentos de Emergência",es:"Procedimientos de Emergencia"},
    "Emergency Services":{pt:"Serviços de Emergência",es:"Servicios de Emergencia"},
    "Emergency Support":{pt:"Suporte de Emergência",es:"Soporte de Emergencia"},
    "Endpoints":{pt:"Endpoints",es:"Endpoints"},
    "Equipment Rental":{pt:"Aluguer de Equipamento",es:"Alquiler de Equipo"},
    "Escalation":{pt:"Escalonamento",es:"Escalamiento"},
    "Exceptions":{pt:"Exceções",es:"Excepciones"},
    "Exclusive Assignment":{pt:"Cessão Exclusiva",es:"Cesión Exclusiva"},
    "Exclusive Territory":{pt:"Território Exclusivo",es:"Territorio Exclusivo"},
    "Exclusivity":{pt:"Exclusividade",es:"Exclusividad"},
    "Expenses":{pt:"Despesas",es:"Gastos"},
    "Expert Opinion":{pt:"Parecer de Especialista",es:"Opinión de Experto"},
    "Express Delivery":{pt:"Entrega Expresso",es:"Entrega Exprés"},
    "Extended Licensing":{pt:"Licenciamento Alargado",es:"Licencia Extendida"},
    "Extended Usage Rights":{pt:"Direitos de Uso Alargados",es:"Derechos de Uso Extendidos"},
    "Extra Revision Rounds":{pt:"Rondas de Revisão Extra",es:"Rondas de Revisión Adicionales"},
    "Extra Videos":{pt:"Vídeos Extra",es:"Vídeos Adicionales"},
    "Financial Planning":{pt:"Planeamento Financeiro",es:"Planificación Financiera"},
    "Flight Authorization":{pt:"Autorização de Voo",es:"Autorización de Vuelo"},
    "Follow-up Meetings":{pt:"Reuniões de Acompanhamento",es:"Reuniones de Seguimiento"},
    "Follow-up Support":{pt:"Suporte de Acompanhamento",es:"Soporte de Seguimiento"},
    "Force Majeure":{pt:"Força Maior",es:"Fuerza Mayor"},
    "Formatting":{pt:"Formatação",es:"Formato"},
    "Furniture Procurement":{pt:"Aquisição de Mobiliário",es:"Adquisición de Mobiliario"},
    "Future Works":{pt:"Trabalhos Futuros",es:"Trabajos Futuros"},
    "General Provisions":{pt:"Disposições Gerais",es:"Disposiciones Generales"},
    "Glossary Creation":{pt:"Criação de Glossário",es:"Creación de Glosario"},
    "Google Play Publication":{pt:"Publicação na Google Play",es:"Publicación en Google Play"},
    "Governance":{pt:"Governação",es:"Gobernanza"},
    "Graphic Design":{pt:"Design Gráfico",es:"Diseño Gráfico"},
    "Guarantees":{pt:"Garantias",es:"Garantías"},
    "Hosting":{pt:"Alojamento",es:"Alojamiento"},
    "Identification":{pt:"Identificação",es:"Identificación"},
    "Image Rights":{pt:"Direitos de Imagem",es:"Derechos de Imagen"},
    "Implementation Support":{pt:"Suporte à Implementação",es:"Soporte de Implementación"},
    "Infrastructure":{pt:"Infraestrutura",es:"Infraestructura"},
    "Infrastructure Monitoring":{pt:"Monitorização de Infraestrutura",es:"Monitoreo de Infraestructura"},
    "Inspection Scope":{pt:"Âmbito da Inspeção",es:"Alcance de la Inspección"},
    "Installation Supervision":{pt:"Supervisão de Instalação",es:"Supervisión de Instalación"},
    "Instructor Responsibilities":{pt:"Responsabilidades do Instrutor",es:"Responsabilidades del Instructor"},
    "Insurance":{pt:"Seguro",es:"Seguro"},
    "Intellectual Property":{pt:"Propriedade Intelectual",es:"Propiedad Intelectual"},
    "Interactive Prototype":{pt:"Protótipo Interativo",es:"Prototipo Interactivo"},
    "Interview Authorization":{pt:"Autorização de Entrevista",es:"Autorización de Entrevista"},
    "Interview Release":{pt:"Liberação de Entrevista",es:"Liberación de Entrevista"},
    "Investment Reports":{pt:"Relatórios de Investimento",es:"Informes de Inversión"},
    "Jurisdiction":{pt:"Jurisdição",es:"Jurisdicción"},
    "Keyword Research":{pt:"Pesquisa de Palavras-chave",es:"Investigación de Palabras Clave"},
    "Landing Pages":{pt:"Landing Pages",es:"Landing Pages"},
    "Languages":{pt:"Idiomas",es:"Idiomas"},
    "Liability":{pt:"Responsabilidade",es:"Responsabilidad"},
    "License":{pt:"Licença",es:"Licencia"},
    "License Grant":{pt:"Concessão de Licença",es:"Concesión de Licencia"},
    "Licensing":{pt:"Licenciamento",es:"Licenciamiento"},
    "Liquidated Damages":{pt:"Cláusula Penal",es:"Cláusula Penal"},
    "Maintenance":{pt:"Manutenção",es:"Mantenimiento"},
    "Maintenance Scope":{pt:"Âmbito da Manutenção",es:"Alcance del Mantenimiento"},
    "Maintenance Window":{pt:"Janela de Manutenção",es:"Ventana de Mantenimiento"},
    "Maintenance Windows":{pt:"Janelas de Manutenção",es:"Ventanas de Mantenimiento"},
    "Management Scope":{pt:"Âmbito de Gestão",es:"Alcance de Gestión"},
    "Marketing":{pt:"Marketing",es:"Marketing"},
    "Marketing Scope":{pt:"Âmbito de Marketing",es:"Alcance de Marketing"},
    "Marketing Support":{pt:"Suporte de Marketing",es:"Soporte de Marketing"},
    "Meeting Schedule":{pt:"Calendário de Reuniões",es:"Calendario de Reuniones"},
    "Meetings":{pt:"Reuniões",es:"Reuniones"},
    "Mentorship Scope":{pt:"Âmbito da Mentoria",es:"Alcance de la Mentoría"},
    "Milestones":{pt:"Marcos",es:"Hitos"},
    "Minimum Sales":{pt:"Vendas Mínimas",es:"Ventas Mínimas"},
    "Model Release":{pt:"Liberação de Modelo",es:"Liberación de Modelo"},
    "Monitoring":{pt:"Monitorização",es:"Monitoreo"},
    "Monthly Meetings":{pt:"Reuniões Mensais",es:"Reuniones Mensuales"},
    "Monthly Renewals":{pt:"Renovações Mensais",es:"Renovaciones Mensuales"},
    "Monthly Reports":{pt:"Relatórios Mensais",es:"Informes Mensuales"},
    "Moral Rights":{pt:"Direitos Morais",es:"Derechos Morales"},
    "Municipal Approval":{pt:"Aprovação Municipal",es:"Aprobación Municipal"},
    "Music Licensing":{pt:"Licenciamento Musical",es:"Licencia Musical"},
    "Musician Hiring":{pt:"Contratação de Músicos",es:"Contratación de Músicos"},
    "Negotiation Representation":{pt:"Representação em Negociação",es:"Representación en Negociación"},
    "Non-Circumvention":{pt:"Não Contornação",es:"No Circunvención"},
    "Non-Solicitation":{pt:"Não Aliciamento",es:"No Solicitación"},
    "Objectives":{pt:"Objetivos",es:"Objetivos"},
    "Obligations":{pt:"Obrigações",es:"Obligaciones"},
    "On-site Consulting":{pt:"Consultoria no Local",es:"Consultoría en Sitio"},
    "On-site Support":{pt:"Suporte no Local",es:"Soporte en Sitio"},
    "On-site Visits":{pt:"Visitas no Local",es:"Visitas en Sitio"},
    "Online Meetings":{pt:"Reuniões Online",es:"Reuniones en Línea"},
    "Online Sessions":{pt:"Sessões Online",es:"Sesiones en Línea"},
    "Operational Limitations":{pt:"Limitações Operacionais",es:"Limitaciones Operativas"},
    "Paid Media":{pt:"Media Paga",es:"Medios Pagados"},
    "Participant Recruitment":{pt:"Recrutamento de Participantes",es:"Reclutamiento de Participantes"},
    "Payment":{pt:"Pagamento",es:"Pago"},
    "Payroll":{pt:"Processamento Salarial",es:"Nómina"},
    "Penalties":{pt:"Penalidades",es:"Penalizaciones"},
    "Performance":{pt:"Desempenho",es:"Desempeño"},
    "Performance Bonus":{pt:"Bónus de Desempenho",es:"Bono de Desempeño"},
    "Performance Bonuses":{pt:"Bónus de Desempenho",es:"Bonos de Desempeño"},
    "Permitted Use":{pt:"Uso Permitido",es:"Uso Permitido"},
    "Photography":{pt:"Fotografia",es:"Fotografía"},
    "Portfolio Authorization":{pt:"Autorização de Portefólio",es:"Autorización de Portafolio"},
    "Posting Schedule":{pt:"Calendário de Publicações",es:"Calendario de Publicaciones"},
    "Presentation Meetings":{pt:"Reuniões de Apresentação",es:"Reuniones de Presentación"},
    "Pricing":{pt:"Preços",es:"Precios"},
    "Printing":{pt:"Impressão",es:"Impresión"},
    "Printing Coordination":{pt:"Coordenação de Impressão",es:"Coordinación de Impresión"},
    "Priority Matrix":{pt:"Matriz de Prioridades",es:"Matriz de Prioridades"},
    "Priority Support":{pt:"Suporte Prioritário",es:"Soporte Prioritario"},
    "Production Schedule":{pt:"Calendário de Produção",es:"Calendario de Producción"},
    "Production Scope":{pt:"Âmbito de Produção",es:"Alcance de Producción"},
    "Products":{pt:"Produtos",es:"Productos"},
    "Professional Liability":{pt:"Responsabilidade Profissional",es:"Responsabilidad Profesional"},
    "Progress Reports":{pt:"Relatórios de Progresso",es:"Informes de Progreso"},
    "Project Revisions":{pt:"Revisões do Projeto",es:"Revisiones del Proyecto"},
    "Project Scope":{pt:"Âmbito do Projeto",es:"Alcance del Proyecto"},
    "Property Visits":{pt:"Visitas ao Imóvel",es:"Visitas a la Propiedad"},
    "Publishing":{pt:"Publicação",es:"Publicación"},
    "Publishing Schedule":{pt:"Calendário de Publicação",es:"Calendario de Publicación"},
    "Quality Standards":{pt:"Padrões de Qualidade",es:"Estándares de Calidad"},
    "Recruitment Scope":{pt:"Âmbito de Recrutamento",es:"Alcance de Reclutamiento"},
    "Reinspection":{pt:"Reinspeção",es:"Reinspección"},
    "Renewal":{pt:"Renovação",es:"Renovación"},
    "Reports":{pt:"Relatórios",es:"Informes"},
    "Representation Before Authorities":{pt:"Representação Perante Autoridades",es:"Representación Ante Autoridades"},
    "Requirements":{pt:"Requisitos",es:"Requisitos"},
    "Rescheduling":{pt:"Reagendamento",es:"Reprogramación"},
    "Research Consent":{pt:"Consentimento de Pesquisa",es:"Consentimiento de Investigación"},
    "Research Scope":{pt:"Âmbito da Pesquisa",es:"Alcance de la Investigación"},
    "Resolution Time":{pt:"Tempo de Resolução",es:"Tiempo de Resolución"},
    "Response Time":{pt:"Tempo de Resposta",es:"Tiempo de Respuesta"},
    "Responsibilities":{pt:"Responsabilidades",es:"Responsabilidades"},
    "Restricted Activities":{pt:"Atividades Restritas",es:"Actividades Restringidas"},
    "Restrictions":{pt:"Restrições",es:"Restricciones"},
    "Return of Information":{pt:"Devolução de Informação",es:"Devolución de Información"},
    "Revenue Sharing":{pt:"Partilha de Receitas",es:"Reparto de Ingresos"},
    "Revisions":{pt:"Revisões",es:"Revisiones"},
    "Risk Management":{pt:"Gestão de Risco",es:"Gestión de Riesgos"},
    "Royalties":{pt:"Royalties",es:"Regalías"},
    "Rush Delivery":{pt:"Entrega Urgente",es:"Entrega Urgente"},
    "SEO":{pt:"SEO",es:"SEO"},
    "SEO Optimization":{pt:"Otimização SEO",es:"Optimización SEO"},
    "SEO Scope":{pt:"Âmbito de SEO",es:"Alcance de SEO"},
    "SLA":{pt:"SLA",es:"SLA"},
    "Safety Requirements":{pt:"Requisitos de Segurança",es:"Requisitos de Seguridad"},
    "Schedule":{pt:"Cronograma",es:"Cronograma"},
    "Scope of Services":{pt:"Âmbito dos Serviços",es:"Alcance de los Servicios"},
    "Second Photographer":{pt:"Segundo Fotógrafo",es:"Segundo Fotógrafo"},
    "Second Videographer":{pt:"Segundo Videógrafo",es:"Segundo Videógrafo"},
    "Security":{pt:"Segurança",es:"Seguridad"},
    "Security Audit":{pt:"Auditoria de Segurança",es:"Auditoría de Seguridad"},
    "Service Credits":{pt:"Créditos de Serviço",es:"Créditos de Servicio"},
    "Service Level Agreement":{pt:"Acordo de Nível de Serviço",es:"Acuerdo de Nivel de Servicio"},
    "Service Levels":{pt:"Níveis de Serviço",es:"Niveles de Servicio"},
    "Service Provider Responsibilities":{pt:"Responsabilidades do Prestador de Serviços",es:"Responsabilidades del Proveedor de Servicios"},
    "Services":{pt:"Serviços",es:"Servicios"},
    "Session Recording":{pt:"Gravação de Sessão",es:"Grabación de Sesión"},
    "Session Schedule":{pt:"Calendário de Sessões",es:"Calendario de Sesiones"},
    "Signatures":{pt:"Assinaturas",es:"Firmas"},
    "Site Inspections":{pt:"Inspeções ao Local",es:"Inspecciones del Sitio"},
    "Site Supervision":{pt:"Supervisão do Local",es:"Supervisión del Sitio"},
    "Site Visits":{pt:"Visitas ao Local",es:"Visitas al Sitio"},
    "Social Clips":{pt:"Clipes para Redes Sociais",es:"Clips para Redes Sociales"},
    "Source Code Ownership":{pt:"Propriedade do Código-Fonte",es:"Propiedad del Código Fuente"},
    "Source Documentation":{pt:"Documentação de Origem",es:"Documentación de Origen"},
    "Source Files":{pt:"Ficheiros de Origem",es:"Archivos de Origen"},
    "Student Responsibilities":{pt:"Responsabilidades do Aluno",es:"Responsabilidades del Alumno"},
    "Studio Rental":{pt:"Aluguer de Estúdio",es:"Alquiler de Estudio"},
    "Subtitles":{pt:"Legendas",es:"Subtítulos"},
    "Supplier Coordination":{pt:"Coordenação de Fornecedores",es:"Coordinación de Proveedores"},
    "Supplier Responsibilities":{pt:"Responsabilidades do Fornecedor",es:"Responsabilidades del Proveedor"},
    "Support":{pt:"Suporte",es:"Soporte"},
    "Support Materials":{pt:"Materiais de Suporte",es:"Materiales de Soporte"},
    "Support Period":{pt:"Período de Suporte",es:"Período de Soporte"},
    "Talent Release":{pt:"Liberação de Talento",es:"Liberación de Talento"},
    "Technical Assistance":{pt:"Assistência Técnica",es:"Asistencia Técnica"},
    "Technical Implementation":{pt:"Implementação Técnica",es:"Implementación Técnica"},
    "Technical Requirements":{pt:"Requisitos Técnicos",es:"Requisitos Técnicos"},
    "Technical Responsibility":{pt:"Responsabilidade Técnica",es:"Responsabilidad Técnica"},
    "Technical Scope":{pt:"Âmbito Técnico",es:"Alcance Técnico"},
    "Technical Specifications":{pt:"Especificações Técnicas",es:"Especificaciones Técnicas"},
    "Technical Stack":{pt:"Stack Técnico",es:"Stack Técnico"},
    "Technical Support":{pt:"Suporte Técnico",es:"Soporte Técnico"},
    "Term":{pt:"Prazo",es:"Plazo"},
    "Termination":{pt:"Rescisão",es:"Rescisión"},
    "Territory":{pt:"Território",es:"Territorio"},
    "Testing":{pt:"Testes",es:"Pruebas"},
    "Timeline":{pt:"Cronograma",es:"Cronograma"},
    "Tracking Setup":{pt:"Configuração de Rastreamento",es:"Configuración de Seguimiento"},
    "Trademark Responsibility":{pt:"Responsabilidade sobre Marca Registada",es:"Responsabilidad sobre Marca Registrada"},
    "Training":{pt:"Formação",es:"Capacitación"},
    "Training Programs":{pt:"Programas de Formação",es:"Programas de Capacitación"},
    "Transcription":{pt:"Transcrição",es:"Transcripción"},
    "Transferred Works":{pt:"Obras Transferidas",es:"Obras Transferidas"},
    "Translations":{pt:"Traduções",es:"Traducciones"},
    "Travel":{pt:"Deslocações",es:"Viajes"},
    "Travel Expenses":{pt:"Despesas de Deslocação",es:"Gastos de Viaje"},
    "Updates":{pt:"Atualizações",es:"Actualizaciones"},
    "Urgent Delivery":{pt:"Entrega Urgente",es:"Entrega Urgente"},
    "Urgent Inspection":{pt:"Inspeção Urgente",es:"Inspección Urgente"},
    "Urgent Requests":{pt:"Pedidos Urgentes",es:"Solicitudes Urgentes"},
    "Video Podcast":{pt:"Podcast em Vídeo",es:"Podcast en Vídeo"},
    "Video Production":{pt:"Produção de Vídeo",es:"Producción de Vídeo"},
    "Virtual Tour":{pt:"Tour Virtual",es:"Tour Virtual"},
    "Visual Effects":{pt:"Efeitos Visuais",es:"Efectos Visuales"},
    "Voice Talent":{pt:"Talento de Voz",es:"Talento de Voz"},
    "Voice-over":{pt:"Voz Off",es:"Voz en Off"},
    "Voting Rights":{pt:"Direitos de Voto",es:"Derechos de Voto"},
    "Warranty":{pt:"Garantia",es:"Garantía"},
    "Warranty Disclaimer":{pt:"Exclusão de Garantia",es:"Exclusión de Garantía"},
    "Weather Conditions":{pt:"Condições Climatéricas",es:"Condiciones Climáticas"},
    "Weather Policy":{pt:"Política Climática",es:"Política Climática"},
    "Weekly Reports":{pt:"Relatórios Semanais",es:"Informes Semanales"},
    "Working Hours":{pt:"Horário de Trabalho",es:"Horario de Trabajo"},
    "Worldwide Rights":{pt:"Direitos Mundiais",es:"Derechos Mundiales"},
    "Writing Scope":{pt:"Âmbito de Redação",es:"Alcance de Redacción"}
  };
  function blockName(b){ if(b.key) return blocoNomes[b.key]; const m=BIB_BLOCK_LABELS[b.name]; if(m){ if(LANG==='pt') return m.pt; if(LANG==='es') return m.es; return b.name; } return b.name||'Bloco'; }
  /* Subtítulo descritivo sob o nome do bloco (ver referência visual do
     editor) — cobre os nomes de bloco mais comuns da Biblioteca (inclui os
     8 novos contratos de Home & Trade Services); qualquer nome fora do mapa
     cai num subtítulo genérico em vez de ficar sem nada. */
  const BIB_BLOCK_SUBTITLES={
    "Identification":{pt:"Definição das partes",en:"Defines the parties",es:"Definición de las partes"},
    "Contract Object":{pt:"Descrição do objeto do contrato",en:"Describes the contract's subject",es:"Descripción del objeto del contrato"},
    "Scope of Work":{pt:"O que será executado",en:"What will be performed",es:"Qué se realizará"},
    "Scope of Services":{pt:"O que será executado",en:"What will be performed",es:"Qué se realizará"},
    "Management Scope":{pt:"O que será executado",en:"What will be performed",es:"Qué se realizará"},
    "Services":{pt:"Escopo dos serviços",en:"Services scope",es:"Alcance de los servicios"},
    "Payment":{pt:"Valores e condições",en:"Amounts and terms",es:"Valores y condiciones"},
    "Payment and Draw Schedule":{pt:"Valores e condições",en:"Amounts and terms",es:"Valores y condiciones"},
    "Estimate and Payment":{pt:"Orçamento e condições de pagamento",en:"Estimate and payment terms",es:"Presupuesto y condiciones de pago"},
    "Timeline":{pt:"Prazos de execução",en:"Execution timeline",es:"Plazos de ejecución"},
    "Service Schedule":{pt:"Frequência e horários",en:"Frequency and hours",es:"Frecuencia y horarios"},
    "Materials and Paint Specifications":{pt:"Fornecimento de materiais",en:"Materials supply",es:"Suministro de materiales"},
    "Materials and Fixtures":{pt:"Fornecimento de materiais",en:"Materials supply",es:"Suministro de materiales"},
    "Materials and Equipment":{pt:"Fornecimento de materiais",en:"Materials supply",es:"Suministro de materiales"},
    "Materials and Plants":{pt:"Fornecimento de plantas",en:"Plant supply",es:"Suministro de plantas"},
    "Materials":{pt:"Fornecimento de materiais",en:"Materials supply",es:"Suministro de materiales"},
    "Permits and Approvals":{pt:"Licenças e aprovações",en:"Permits and approvals",es:"Permisos y aprobaciones"},
    "Permits and Regulatory Compliance":{pt:"Licenças e aprovações",en:"Permits and approvals",es:"Permisos y aprobaciones"},
    "Change Orders":{pt:"Alterações ao escopo",en:"Scope changes",es:"Cambios de alcance"},
    "Site Preparation and Access":{pt:"Acesso ao local",en:"Site access",es:"Acceso al lugar"},
    "Access to Property":{pt:"Acesso ao local",en:"Site access",es:"Acceso al lugar"},
    "Access to Premises":{pt:"Acesso ao imóvel",en:"Premises access",es:"Acceso al inmueble"},
    "Access and Security":{pt:"Acesso e segurança",en:"Access and security",es:"Acceso y seguridad"},
    "Access and Parking":{pt:"Acesso e estacionamento",en:"Access and parking",es:"Acceso y estacionamiento"},
    "Surface Preparation":{pt:"Preparação das superfícies",en:"Surface preparation",es:"Preparación de superficies"},
    "Color Changes and Additional Work":{pt:"Mudanças de cor e trabalho extra",en:"Color changes and extra work",es:"Cambios de color y trabajo extra"},
    "Cleanup and Waste Disposal":{pt:"Limpeza e remoção de resíduos",en:"Cleanup and waste removal",es:"Limpieza y retiro de residuos"},
    "Waste and Debris Removal":{pt:"Limpeza e remoção de resíduos",en:"Cleanup and waste removal",es:"Limpieza y retiro de residuos"},
    "Cleanup":{pt:"Limpeza do local",en:"Site cleanup",es:"Limpieza del lugar"},
    "Weather Delays":{pt:"Atrasos por condições climáticas",en:"Weather-related delays",es:"Retrasos por clima"},
    "Warranty":{pt:"Garantias e responsabilidades",en:"Warranties and liability",es:"Garantías y responsabilidad"},
    "Warranty of Workmanship":{pt:"Garantias e responsabilidades",en:"Warranties and liability",es:"Garantías y responsabilidad"},
    "Client Responsibilities":{pt:"Obrigações do contratante",en:"Client obligations",es:"Obligaciones del cliente"},
    "Responsibilities":{pt:"Obrigações das partes",en:"Parties' obligations",es:"Obligaciones de las partes"},
    "Insurance":{pt:"Cobertura de seguro",en:"Insurance coverage",es:"Cobertura de seguro"},
    "Insurance and Bonding":{pt:"Cobertura de seguro",en:"Insurance coverage",es:"Cobertura de seguro"},
    "Insurance and Licensing":{pt:"Cobertura de seguro",en:"Insurance coverage",es:"Cobertura de seguro"},
    "Liability":{pt:"Garantias e responsabilidades",en:"Warranties and liability",es:"Garantías y responsabilidad"},
    "General Provisions":{pt:"Disposições gerais",en:"General provisions",es:"Disposiciones generales"},
    "Signatures":{pt:"Assinaturas das partes",en:"Parties' signatures",es:"Firmas de las partes"},
    "Subcontractors":{pt:"Contratação de subempreiteiros",en:"Subcontractor engagement",es:"Contratación de subcontratistas"},
    "Site Safety":{pt:"Normas de segurança",en:"Safety standards",es:"Normas de seguridad"},
    "Safety Requirements":{pt:"Normas de segurança",en:"Safety standards",es:"Normas de seguridad"},
    "Inspections and Quality Control":{pt:"Vistorias e controlo de qualidade",en:"Inspections and quality control",es:"Inspecciones y control de calidad"},
    "Quality Control and Inspections":{pt:"Vistorias e controlo de qualidade",en:"Inspections and quality control",es:"Inspecciones y control de calidad"},
    "Delay Penalties":{pt:"Penalizações por atraso",en:"Delay penalties",es:"Penalizaciones por retraso"},
    "Additional Services":{pt:"Serviços adicionais",en:"Additional services",es:"Servicios adicionales"},
    "Seasonal and Additional Services":{pt:"Serviços sazonais",en:"Seasonal services",es:"Servicios estacionales"},
    "Supplies and Equipment":{pt:"Fornecimento de equipamentos",en:"Supplies and equipment",es:"Suministros y equipos"},
    "Cleaning Supplies and Equipment":{pt:"Fornecimento de equipamentos",en:"Supplies and equipment",es:"Suministros y equipos"},
    "Staffing and Personnel":{pt:"Pessoal envolvido",en:"Staffing",es:"Personal involucrado"},
    "Damage Policy":{pt:"Política de danos",en:"Damage policy",es:"Política de daños"},
    "Damage Claims Procedure":{pt:"Política de danos",en:"Damage claims",es:"Reclamos por daños"},
    "Cancellation and Rescheduling Policy":{pt:"Política de cancelamento",en:"Cancellation policy",es:"Política de cancelación"},
    "Cancellation and Termination":{pt:"Política de cancelamento",en:"Cancellation policy",es:"Política de cancelación"},
    "Cancellation Policy":{pt:"Política de cancelamento",en:"Cancellation policy",es:"Política de cancelación"},
    "Confidentiality":{pt:"Confidencialidade",en:"Confidentiality",es:"Confidencialidad"},
    "Pets and Household Members":{pt:"Animais e moradores",en:"Pets and household members",es:"Mascotas y convivientes"},
    "Irrigation and Equipment":{pt:"Equipamento de rega",en:"Irrigation equipment",es:"Equipo de riego"},
    "Storage Services":{pt:"Armazenamento",en:"Storage",es:"Almacenamiento"},
    "Valuation and Insurance Coverage":{pt:"Cobertura e avaliação dos bens",en:"Valuation and coverage",es:"Valoración y cobertura"},
    "Delivery Window and Delays":{pt:"Janela de entrega",en:"Delivery window",es:"Ventana de entrega"},
    "Inventory of Goods":{pt:"Inventário dos bens",en:"Goods inventory",es:"Inventario de bienes"},
    "Packing Services":{pt:"Serviço de embalagem",en:"Packing service",es:"Servicio de embalaje"},
    "Additional Work Discovered":{pt:"Trabalho adicional identificado",en:"Additional work found",es:"Trabajo adicional detectado"},
    "Deliverables":{pt:"Entregáveis do projeto",en:"Project deliverables",es:"Entregables del proyecto"}
  };
  function blockSubtitle(b){
    const m=BIB_BLOCK_SUBTITLES[b.name];
    if(m) return m[LANG]||m.en;
    return t('builder.blockSubtitleGeneric');
  }
  function blockText(job,b){ return (b.customText!=null) ? b.customText : (b.key ? blocoTextos[b.key](job,b.params) : ''); }

  /* Builder unificado — modelo em branco (builderContext=null) ou trabalho real (builderContext=jobId) */
  let builderContext=null;
  let builderModeloOrigem=null;
  /* Guarda os blocos de um modelo em branco (sem builderModeloOrigem) entre
     chamadas de getBuilderJob() — sem isto, cada chamada devolvia um array
     novo de blocosModeloPadrao(), então nenhuma edição feita nesse estado
     (incluir bloco, alterar texto, etc.) sobrevivia à próxima leitura. */
  let builderBlankBlocks=null;
  let builderBlankFieldValues={};
  /* Devolve o objeto vivo de valores de campos dinâmicos do contexto atual do
     Builder (job real, modelo importado ou modelo em branco), criando-o se
     preciso — é ele que o painel de substituição em massa edita. */
  function getBuilderFieldValues(){
    if(builderContext){ const j=jobsData[builderContext]; if(!j.contract.fieldValues) j.contract.fieldValues={}; return j.contract.fieldValues; }
    if(builderModeloOrigem){ if(!builderModeloOrigem.fieldValues) builderModeloOrigem.fieldValues={}; return builderModeloOrigem.fieldValues; }
    return builderBlankFieldValues;
  }
  function blocosModeloPadrao(){
    return [
      {id:'m1', key:'identificacao', customText:null, on:true},
      {id:'m2', key:'pagamento', customText:null, on:true},
      {id:'m3', key:'entrega', customText:null, on:true},
      {id:'m4', key:'cancelamento', customText:null, on:true},
      {id:'m5', key:'direitos', customText:null, on:false}
    ];
  }
  function getBuilderJob(){
    if(builderContext) return jobsData[builderContext];
    if(!builderModeloOrigem && !builderBlankBlocks) builderBlankBlocks=blocosModeloPadrao();
    return { id:'__template__', client:(builderModeloOrigem&&builderModeloOrigem.client)||'', typeLabel:'', value:0, date:null, local:'', email:'',
      contract:{ blocks: (builderModeloOrigem&&builderModeloOrigem.blocks) || builderBlankBlocks } };
  }
  /* Quando jobId + modeloOrigem vêm juntos (fluxo "Selecionar Contrato" do
     Portal Operacional), o modelo escolhido tem de ser aplicado ao job de
     verdade — renderBuilder() só mostra job.contract.blocks como já estão,
     nunca lia builderModeloOrigem sozinho. Sem isto, o card de Contrato
     continuava a mostrar "vazio" mesmo depois de escolher um modelo. */
  let builderVoltarView='trabalhos';
  /* Contexto de edição de contrato de colaborador — {modo, jobId} enquanto o
     utilizador edita blocos/cláusulas no builder normal antes de escolher os
     destinatários; distinto de builderContext (job real) e do modo "novo
     modelo em branco". Reaproveita o builder completo em vez de duplicar a
     interface de edição (blocos, cláusulas, campos dinâmicos). */
  let builderColabCtx=null;
  function abrirBuilder(jobId, modeloOrigem){
    builderContext=jobId||null;
    builderModeloOrigem=modeloOrigem||null;
    builderBlankBlocks=null;
    builderBlankFieldValues={};
    if(!jobId){
      const activeEl=document.querySelector('.view.active');
      if(activeEl && activeEl.id!=='v-builder') builderVoltarView=activeEl.id.replace(/^v-/,'');
    }
    if(jobId && modeloOrigem && modeloOrigem.blocks){
      const job=jobsData[jobId];
      if(job){
        job.contract.blocks = modeloOrigem.blocks.map(b=>Object.assign({}, b));
        if(modeloOrigem.fieldValues) job.contract.fieldValues = Object.assign({}, modeloOrigem.fieldValues);
        if(modeloOrigem.nome) job.contract.templateName = modeloOrigem.nome;
        if(job.contract.status==='vazio') job.contract.status='rascunho';
        marcarContratoAlterado(job);
        saveJobsData();
      }
    }
    mudarBuilderTab('estrutura');
    renderBuilder();
    go('builder');
  }
  function voltarDoBuilder(){
    if(builderColabCtx){ builderColabCtx=null; go('detalhe'); return; }
    if(builderContext){ openJob(builderContext); } else { go(builderVoltarView); }
  }
  function guardarBuilderContexto(){
    if(builderColabCtx){
      const ctx=builderColabCtx;
      builderColabCtx=null;
      const modeloOrigem={ nome:(builderModeloOrigem&&builderModeloOrigem.nome)||null,
        blocks: getBuilderJob().contract.blocks.map(b=>Object.assign({}, b)),
        fieldValues: Object.assign({}, getBuilderFieldValues()) };
      go('detalhe');
      if(ctx.modo==='colaboradorMassa') abrirAplicarContratoMassa(ctx.jobId, modeloOrigem);
      else aplicarContratoEscolhidoAoColaborador(ctx.jobId, modeloOrigem);
      return;
    }
    if(builderContext){ saveJobsData(); showToast(t('toast.changesSaved')); return; }
    openInfo(t('builder.saveTemplateTitle'), `
      <div class="field"><label data-t="field.name">Nome</label><input id="modelo-contrato-nome" placeholder="${t('builder.templateNamePlaceholder')}"></div>
      <button class="btn primary u-w-full" onclick="confirmarGuardarModeloContrato()">${t('action.save')}</button>`);
  }
  let modelosContratoData={};
  function saveModelosContratoData(){ savePersisted('pivot-modelosContrato', ()=>modelosContratoData); }
  async function loadModelosContratoData(){ await loadPersisted('pivot-modelosContrato', d=>{ modelosContratoData=d||{}; }); }
  function confirmarGuardarModeloContrato(){
    { const limite=LIMITE_MODELOS_PLANO[perfilData.plano||'Free'];
      if(Object.keys(modelosContratoData).length>=limite){ abrirLimitePlanoModal('plan.limit.templatesTitle','plan.limit.templatesBody',limite); return; } }
    const nomeEl=document.getElementById('modelo-contrato-nome');
    const nome=nomeEl.value.trim();
    if(!nome){ nomeEl.focus(); return; }
    const id='mc'+Date.now();
    modelosContratoData[id]={ id, nome, blocks: getBuilderJob().contract.blocks.map(b=>Object.assign({},b)), criadoEm:new Date().toISOString(), usos:0 };
    saveModelosContratoData();
    closeInfo();
    showToast(t('toast.savedAsTemplate'));
  }
  function renderListaUsarModelo(){
    const wrap=document.getElementById('usar-modelo-lista');
    if(!wrap) return;
    const q=(document.getElementById('usar-modelo-busca').value||'').trim().toLowerCase();
    const modelos=Object.values(modelosContratoData).filter(m=>!q || m.nome.toLowerCase().includes(q));
    wrap.innerHTML = modelos.length ? modelos.map(m=>
      '<div class="pick-row" onclick="usarModeloContrato(\''+m.id+'\')">'+
      '<div><div class="nm">'+escapeHtml(m.nome)+'</div><div class="sub">'+m.blocks.length+' '+t('builder.blocksCount')+(m.usos?(' · '+t('builder.usedPrefix')+' '+m.usos+'x'):'')+'</div></div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>'
    ).join('') : '<p class="u-label-nd">'+t('collab.none')+'</p>';
  }
  function usarModeloContrato(id){
    const m=modelosContratoData[id];
    if(!m) return;
    m.usos=(m.usos||0)+1;
    saveModelosContratoData();
    const blocks=m.blocks.map((b,i)=>Object.assign({}, b, {id:'use'+Date.now()+i}));
    if(twEmWizard){
      twModeloEscolhido={ nome:m.nome, blocks };
      twEmWizard=false;
      panelBack();
      renderModeloEscolhidoWizard();
      showToast(t('toast.templateImported'));
      return;
    }
    abrirBuilderParaSelecao({ client:'', nome:m.nome, blocks });
  }

  /* ============================================================
     IMPORTAÇÃO DE ARQUIVO — Modelos → + Criar → Arquivo
     Extração + reconstrução estrutural 100% no browser (sem backend, sem
     IA, sem serviços externos): PDF.js / Mammoth.js / Tesseract.js carregados
     via CDN sob demanda, o mesmo padrão já usado por carregarLeaflet().
     A heurística de segmentação em Blocos/Cláusulas é determinística —
     nunca depende de vocabulário específico, só de sinais estruturais
     (hierarquia, isolamento visual, tipografia, enumeração, continuidade).
     Cada Bloco/Cláusula reconstruído é guardado no MESMO formato de bloco
     já usado pelo builder ({id,key:null,name,customText,on}) — as cláusulas
     ficam preservadas como parágrafos separados por linha em branco dentro
     de customText, o que mantém 100% de compatibilidade com o editor de
     blocos existente depois de guardado. A edição verdadeiramente por
     cláusula (mover entre blocos, reordenar, criar, remover) acontece aqui,
     na Tela de Revisão, antes de o Modelo ser criado. ============ */
