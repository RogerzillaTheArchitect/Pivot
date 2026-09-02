/* Pivots — trabalhos assinatura
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  let sigCanvasCtx=null, sigDrawing=false, sigHasDrawing=false;
  function inicializarCanvasAssinatura(){
    const canvas=document.getElementById('sig-canvas');
    if(!canvas || canvas.dataset.bound) return;
    canvas.dataset.bound='1';
    sigHasDrawing=false;
    const dpr=window.devicePixelRatio||1;
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*dpr; canvas.height=110*dpr;
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    ctx.strokeStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#EAEDEC':'#15261C'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.lineJoin='round';
    sigCanvasCtx=ctx;
    let lastX=0, lastY=0;
    const pos=e=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
    canvas.addEventListener('pointerdown', e=>{ sigDrawing=true; const p=pos(e); lastX=p.x; lastY=p.y; });
    canvas.addEventListener('pointermove', e=>{
      if(!sigDrawing) return;
      const p=pos(e);
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
      lastX=p.x; lastY=p.y; sigHasDrawing=true;
    });
    const parar=()=>{ sigDrawing=false; };
    canvas.addEventListener('pointerup', parar);
    canvas.addEventListener('pointerleave', parar);
  }
  function limparAssinaturaCanvas(){
    const canvas=document.getElementById('sig-canvas');
    if(!canvas || !sigCanvasCtx) return;
    sigCanvasCtx.clearRect(0,0,canvas.width,canvas.height);
    sigHasDrawing=false;
  }
  /* Pad de assinatura dedicado ao preview do Portal do Cliente (#client-dynamic).
     Antes reaproveitava o id "sig-canvas" partilhado com o popup de assinatura de
     acordo de colaboração (dentro do mesmo app autenticado) — se os dois ficassem
     montados ao mesmo tempo, getElementById('sig-canvas') pegava sempre o primeiro
     do documento, deixando o outro pad sem responder ao desenho. Id e funções
     próprias eliminam essa colisão, no mesmo padrão já usado pela assinatura do
     Perfil (perfil-sig-canvas). */
  let sigClienteCanvasCtx=null, sigClienteDrawing=false, sigClienteHasDrawing=false;
  function inicializarCanvasAssinaturaCliente(){
    const canvas=document.getElementById('sig-canvas-cliente');
    if(!canvas || canvas.dataset.bound) return;
    canvas.dataset.bound='1';
    sigClienteHasDrawing=false;
    const dpr=window.devicePixelRatio||1;
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*dpr; canvas.height=110*dpr;
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    ctx.strokeStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#EAEDEC':'#15261C'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.lineJoin='round';
    sigClienteCanvasCtx=ctx;
    let lastX=0, lastY=0;
    const pos=e=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
    canvas.addEventListener('pointerdown', e=>{ sigClienteDrawing=true; const p=pos(e); lastX=p.x; lastY=p.y; });
    canvas.addEventListener('pointermove', e=>{
      if(!sigClienteDrawing) return;
      const p=pos(e);
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
      lastX=p.x; lastY=p.y; sigClienteHasDrawing=true;
    });
    const parar=()=>{ sigClienteDrawing=false; };
    canvas.addEventListener('pointerup', parar);
    canvas.addEventListener('pointerleave', parar);
  }
  function limparAssinaturaCanvasCliente(){
    const canvas=document.getElementById('sig-canvas-cliente');
    if(!canvas || !sigClienteCanvasCtx) return;
    sigClienteCanvasCtx.clearRect(0,0,canvas.width,canvas.height);
    sigClienteHasDrawing=false;
  }
  async function capturarMetadadosAssinatura(textoDocumento, comGeo){
    const meta={
      dataHoraUTC: new Date().toISOString(),
      navegador: navigator.userAgent,
      idioma: navigator.language,
      dispositivo: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      ip: 'não disponível', hash: 'não disponível', geo: null
    };
    try{
      const resp=await fetch('https://api.ipify.org?format=json');
      if(resp.ok){ const data=await resp.json(); meta.ip=data.ip; }
    }catch(e){ /* sem rede ou bloqueado — fica "não disponível", honesto */ }
    try{
      const enc=new TextEncoder().encode(textoDocumento);
      const hashBuffer=await crypto.subtle.digest('SHA-256', enc);
      meta.hash=Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){ /* navegador sem Web Crypto — fica "não disponível" */ }
    if(comGeo && navigator.geolocation){
      try{
        meta.geo = await new Promise((res)=>{
          navigator.geolocation.getCurrentPosition(
            p=>res(p.coords.latitude.toFixed(4)+', '+p.coords.longitude.toFixed(4)),
            ()=>res(null), {timeout:3000}
          );
        });
      }catch(e){ meta.geo=null; }
    }
    return meta;
  }
  /* ===== Regra de negócio: assinatura de contrato =====
     Antes, esta validação, a mutação de job.contract/milestones/histórico,
     a persistência e a nova renderização estavam todas misturadas numa
     única função. Passam a ser 3 responsabilidades separadas: */
  function validarDadosAssinatura(nome, aceite1, aceite2, exigeDocumento, docNumero){
    if(!nome) return 'Falta o nome.';
    if(!sigHasDrawing) return 'Desenhe sua assinatura no quadro.';
    if(exigeDocumento && !docNumero) return 'Indique o número do documento de identificação.';
    if(!aceite1 || !aceite2) return 'Aceita os dois termos para continuar.';
    return null;
  }
  /* Mutação pura do estado do contrato — não toca no DOM nem em storage */
  function aplicarAssinaturaContrato(job, {nome, meta, assinaturaImg}){
    job.contract.status='assinado';
    job.contract.signerName=nome;
    job.contract.signedAt=new Date().toLocaleDateString(jsLocale(),{day:'2-digit',month:'short',year:'numeric'});
    job.contract.signedAtISO=new Date().toISOString().slice(0,10);
    job.contract.assinaturaMeta=meta;
    job.contract.assinaturaImg=assinaturaImg;
    job.contract.versao=(job.contract.blocks||[]).filter(b=>b.on).length+' blocos';
    const m=job.milestones.find(m=>m.t.indexOf('Assinatura')===0);
    if(m){ m.status='feito'; m.m='assinado a '+job.contract.signedAt; }
    pushHistory(job,t('history.clientSignedContract'), 'cliente');
    pushHistory(job,t('toast.emailGenerated'));
  }
  async function assinarContratoCliente(id){
    const job=jobsData[id];
    const nome=document.getElementById('sig-nome').value.trim();
    const a1=document.getElementById('sig-aceite1').checked;
    const a2=document.getElementById('sig-aceite2').checked;
    const docTipoEl=document.getElementById('sig-doc-tipo');
    const docNumeroEl=document.getElementById('sig-doc-numero');
    const docTipo = job.contract.exigirDocumento && docTipoEl ? docTipoEl.value : null;
    const docNumero = job.contract.exigirDocumento && docNumeroEl ? docNumeroEl.value.trim() : null;
    const erro=validarDadosAssinatura(nome, a1, a2, job.contract.exigirDocumento, docNumero);
    if(erro){ clientToast(erro); return; }
    /* Documento capturado no passo de assinatura também é uma variável do
       cliente — sem isto, [CLIENT_DOCUMENT] podia ficar por preencher no
       contrato mesmo depois de o número já ter sido informado aqui. */
    if(docNumero){
      if(!job.contract.fieldValues) job.contract.fieldValues={};
      job.contract.fieldValues.CLIENT_DOCUMENT=docTipo+' '+docNumero;
      job.contract.blocks.forEach(b=>{ if(b.tpl) b.customText=LegalLibrary.resolveClauseText(b.tpl, job.contract.fieldValues); });
    }
    const comGeo=document.getElementById('sig-geo-opt').checked;
    let textoDocumento=job.contract.blocks.filter(b=>b.on).map(b=>blockName(b)+': '+blockText(job,b)).join('\n');
    /* o documento entra no texto que é hasheado — assim a folha de prova
       comprova não só quem disse assinar, mas com que documento afirmou
       fazê-lo, e qualquer alteração posterior a este dado quebra o hash. */
    if(docNumero) textoDocumento += '\nDocumento do signatário: '+docTipo+' '+docNumero;
    clientToast('A confirmar assinatura…');
    const meta=await capturarMetadadosAssinatura(textoDocumento, comGeo);
    meta.documentoTipo=docTipo;
    meta.documentoNumero=docNumero;
    const canvas=document.getElementById('sig-canvas-cliente');
    const assinaturaImg = canvas ? canvas.toDataURL('image/png') : null;
    aplicarAssinaturaContrato(job, {nome, meta, assinaturaImg});
    updateJobCard(id);
    saveJobsData();
    renderClientDynamic(id);
    clientToast('Contrato assinado. Confirmação gerada.');
  }

  /* jsPDF só é carregado (via CDN) na primeira vez que uma cópia de contrato é
     mesmo pedida — antes carregava sempre no <head>, mesmo em sessões que nunca
     descarregam um PDF. */
  let _jspdfLoading=null;
  function carregarJsPDF(){
    if(window.jspdf) return Promise.resolve();
    if(_jspdfLoading) return _jspdfLoading;
    _jspdfLoading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload=resolve;
      s.onerror=()=>{ _jspdfLoading=null; reject(new Error('jspdf load failed')); };
      document.head.appendChild(s);
    });
    return _jspdfLoading;
  }
  function descarregarCopiaContrato(id){
    const job=jobsData[id];
    if(!window.jspdf){
      showToast(t('toast.preparingPdf'));
      carregarJsPDF().then(()=>descarregarCopiaContrato(id)).catch(()=>showToast(t('toast.pdfLoadError')));
      return;
    }
    const { jsPDF }=window.jspdf;
    const doc=new jsPDF({unit:'mm', format:'a4'});
    const pageW=doc.internal.pageSize.getWidth();
    const mX=20;
    let y=22;

    doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(21,38,28);
    doc.text('Pivots', mX, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(140,135,124);
    doc.text('Contrato gerado automaticamente', pageW-mX, y, {align:'right'});
    y+=4;
    doc.setDrawColor(38,100,95); doc.setLineWidth(0.9);
    doc.line(mX, y, pageW-mX, y);
    y+=13;

    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(21,38,28);
    doc.text(t('contract.prefix')+job.typeLabel, mX, y);
    y+=9;
    doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(86,82,74);
    doc.text('Cliente: '+job.client, mX, y); y+=6;
    if(job.date){ doc.text('Data do evento: '+job.date+(job.local?(' · '+job.local):''), mX, y); y+=6; }
    doc.text('Valor total: '+fmtMoney(job.value), mX, y); y+=12;

    job.contract.blocks.filter(b=>b.on).forEach(b=>{
      if(y>248){ doc.addPage(); y=22; }
      doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(38,100,95);
      doc.text(blockName(b), mX, y); y+=6.5;
      doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(21,38,28);
      const lines=doc.splitTextToSize(blockText(job,b), pageW-mX*2);
      doc.text(lines, mX, y);
      y+=lines.length*5+9;
    });

    if(y>235){ doc.addPage(); y=22; }
    y+=4;
    doc.setDrawColor(229,224,214); doc.setLineWidth(0.4);
    doc.line(mX, y, pageW-mX, y);
    y+=11;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(21,38,28);
    doc.text('Assinatura', mX, y); y+=8;
    doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(86,82,74);
    doc.text('Assinado por: '+(job.contract.signerName||'— por assinar —'), mX, y); y+=6;
    doc.text('Em: '+(job.contract.signedAt||'—'), mX, y); y+=8;
    if(job.contract.assinaturaImg){
      try{ doc.addImage(job.contract.assinaturaImg, 'PNG', mX, y, 60, 20); y+=24; }catch(e){}
    }
    if(perfilData.assinaturaImg){
      y+=6;
      doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(86,82,74);
      doc.text('Assinado por: '+(perfilData.nome||'Prestador'), mX, y); y+=8;
      try{ doc.addImage(perfilData.assinaturaImg, 'PNG', mX, y, 60, 20); y+=24; }catch(e){}
    }

    doc.setFontSize(8.3); doc.setTextColor(156,150,139);
    doc.text('Modelo editável gerado pelo Pivots — não constitui aconselhamento jurídico.', mX, 287);

    if(job.contract.assinaturaMeta){
      doc.addPage();
      let yc=24;
      doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(21,38,28);
      doc.text('Certificado de assinatura', mX, yc); yc+=4;
      doc.setDrawColor(38,100,95); doc.setLineWidth(0.7);
      doc.line(mX, yc, pageW-mX, yc); yc+=12;
      const meta=job.contract.assinaturaMeta;
      const linhas=[
        ['Documento', 'Contrato — '+job.typeLabel],
        ['Signatário', job.contract.signerName||'—'],
      ];
      if(meta.documentoNumero) linhas.push(['Documento de identificação apresentado', (meta.documentoTipo||'Documento')+' '+meta.documentoNumero]);
      linhas.push(
        ['Versão do contrato', job.contract.versao||'—'],
        ['Data e hora (UTC)', meta.dataHoraUTC],
        ['Endereço IP', meta.ip],
        ['Dispositivo', meta.dispositivo],
        ['Navegador', meta.navegador],
        ['Hash do documento (SHA-256)', meta.hash],
      );
      if(meta.geo) linhas.push(['Localização (autorizada pelo signatário)', meta.geo]);
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      linhas.forEach(([label,val])=>{
        doc.setTextColor(140,135,124);
        doc.text(label, mX, yc); yc+=5.2;
        doc.setTextColor(21,38,28);
        const wrapped=doc.splitTextToSize(String(val), pageW-mX*2);
        doc.text(wrapped, mX, yc); yc+=wrapped.length*5+4.5;
      });
      doc.setFontSize(8); doc.setTextColor(156,150,139);
      doc.text('Gerado automaticamente pelo Pivots no momento da assinatura, para reforçar rastreabilidade.', mX, 287);
    }

    doc.save('contrato-'+job.client.toLowerCase().replace(/\s+/g,'-')+'.pdf');
    showToast(t('toast.pdfDownloaded'));
  }

  /* Swipe do card de Projeto reaproveita EXATAMENTE o mesmo mecanismo dos
     cards de Tarefas (ativarSwipeRadar / .radar-card-wrap / .radar-swipe-
     actions.left/.right) — mesma animação, mesmos gestos de 3 posições
     (fechado/esquerda/direita), em vez da implementação própria que só
     revelava tudo (editar+concluir+deletar) de um lado só. Arrasta pra
     direita revela Editar; pra esquerda revela Concluir e Arquivar. */
  function renderJobCard(job){
    const existente=document.querySelector('.job[data-job-id="'+job.id+'"]');
    if(existente){ const w=existente.closest('.job-card-wrap'); (w||existente).remove(); }
    if(job.arquivado) return;
    const div=document.createElement('div');
    div.className='job job2';
    div.dataset.jobId=job.id;
    updateJobCardInner(div, job);
    attachJobCardHandlers(div);
    inserirJobCardOrdenado(div, job);
  }
  function attachJobCardHandlers(div){
    let timer=null, lpFired=false;
    div.addEventListener('pointerdown',()=>{
      lpFired=false;
      timer=setTimeout(()=>{
        lpFired=true;
        div.classList.add('lp-open');
        if(navigator.vibrate)navigator.vibrate(12);
      },2000);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>div.addEventListener(ev,()=>clearTimeout(timer)));
    div.addEventListener('click',e=>{
      if(lpFired){lpFired=false;return;}
      if(div.classList.contains('lp-open')){div.classList.remove('lp-open');return;}
      openJob(div.dataset.jobId);
    });
  }
  function jobActEditar(btn){ openJob(btn.closest('.job').dataset.jobId); }
  function jobActArquivar(btn){
    const id=btn.closest('.job').dataset.jobId;
    confirmarDeletarTrabalho(id);
  }
  function jobActConcluir(btn){
    const id=btn.closest('.job').dataset.jobId;
    arquivarTrabalho(id,'concluido');
  }
  /* arquivo de trabalhos: Concluir e Deletar são ações distintas, ambas reversíveis —
     o trabalho sai da lista ativa (e do calendário) e passa a viver no Histórico,
     de onde pode ser restaurado a qualquer momento. */
  /* Concluir/Arquivar encerram o acesso do cliente ao portal na hora — não
     faz sentido o link continuar válido para um trabalho parado. Expira
     TODOS os tokens já gerados para este trabalho (o link muda a cada vez
     que se "Gera Link" de novo — ver gerarLinkContrato —, então pode haver
     mais que um token na tabela), não só o mais recente. Enviar o link
     (gerarLinkContrato) nunca chama esta função — continua sendo só mais um
     passo do fluxo, não conclui nada sozinho. */
  async function expirarPortalCliente(job){
    try{
      await sb.from('portal_tokens').update({expires_at:new Date().toISOString()}).eq('workspace_id', currentWorkspaceId).eq('job_id', job.id);
    }catch(e){ console.error('Erro ao expirar o portal do cliente:', e); }
  }
  function arquivarTrabalho(id, motivo){
    const job=jobsData[id];
    if(!job) return;
    job.arquivado={ motivo, em:new Date().toISOString() };
    pushHistory(job, motivo==='concluido' ? t('history.jobArchivedDone') : t('history.jobArchivedDeleted'));
    saveJobsData();
    expirarPortalCliente(job);
    const existente=document.querySelector('.job[data-job-id="'+id+'"]');
    if(existente){ const w=existente.closest('.job-card-wrap'); (w||existente).remove(); }
    const empty=document.getElementById('jobsEmpty');
    if(empty) empty.style.display = document.querySelectorAll('#v-trabalhos .job').length===0 ? 'block':'none';
    if(typeof renderCalendar==='function') renderCalendar();
    if(typeof renderHistorico==='function') renderHistorico();
    showToast(motivo==='concluido' ? t('toast.jobArchivedDone') : t('toast.jobArchivedDeleted'));
    /* a solicitação de avaliação fica de fora — pedir logo a seguir a concluir
       pode soar apressado; o freelancer decide a altura certa no painel
       "Notificar cliente" da página do trabalho */
    if(motivo==='concluido') dispararEmailEvento('projetoConcluido', job.email, job);
  }
  function confirmarDeletarTrabalho(id){
    const job=jobsData[id];
    if(!job) return;
    if(confirm(t('history.deleteConfirm').replace('{client}', job.client))){
      arquivarTrabalho(id, 'deletado');
    }
  }
  function restaurarTrabalho(id){
    const job=jobsData[id];
    if(!job) return;
    job.arquivado=null;
    pushHistory(job, t('history.jobRestored'));
    saveJobsData();
    renderJobCard(job);
    if(typeof renderCalendar==='function') renderCalendar();
    if(typeof renderHistorico==='function') renderHistorico();
    showToast(t('toast.jobRestored'));
  }
  /* card de trabalho arquivado (concluído ou apagado) — reaproveitado tanto pela
     view Histórico quanto pelo filtro "Arquivados" da lista de Trabalhos. */
  function htmlCardArquivado(job){
    const done=job.arquivado.motivo==='concluido';
    const dataFmt=new Date(job.arquivado.em).toLocaleDateString(jsLocale(),{day:'2-digit',month:'short',year:'numeric'});
    return '<div class="job hist-card">'+
      '<div class="job-top"><div class="job-top-l">'+avatarHtml(job.client,30,clienteFotoPorNome(job.client))+'<div><div class="job-client">'+escapeHtml(job.client)+'</div><div class="job-type">'+escapeHtml(job.typeLabel)+'</div></div></div>'+
      '<div class="state '+(done?'s-active':'s-wait')+'">'+(done?t('jobs.history.done'):t('jobs.history.deleted'))+'</div></div>'+
      '<div class="job-next"><div class="nd" style="background:'+(done?'var(--brand)':'var(--late)')+'"></div><span>'+dataFmt+'</span></div>'+
      '<button class="btn soft u-w-full u-mt-10" onclick="restaurarTrabalho(\''+job.id+'\')">'+t('action.restore')+'</button>'+
    '</div>';
  }
  function jobsArquivados(){
    return jobsVisiveis().filter(j=>j.arquivado).sort((a,b)=> new Date(b.arquivado.em)-new Date(a.arquivado.em));
  }
  function renderHistorico(){
    const wrap=document.getElementById('historico-lista');
    if(!wrap) return;
    const itens=jobsArquivados();
    wrap.innerHTML=itens.map(htmlCardArquivado).join('');
    const empty=document.getElementById('historicoEmpty');
    if(empty) empty.style.display = itens.length===0 ? 'block':'none';
  }
  /* lista de arquivados embutida na própria tela de Trabalhos (chip "Arquivados") —
     esconde os job-card-wrap normais e injeta os cards arquivados num container à parte,
     em vez de reaproveitar o filtro por dataset (os arquivados nunca chegam a ser
     renderizados como .job normais, ver renderJobCard). */
  function renderJobsArquivadosList(){
    const wrap=document.getElementById('jobsArquivadosList');
    if(!wrap) return;
    document.querySelectorAll('#v-trabalhos .job-card-wrap').forEach(w=>w.style.display='none');
    document.getElementById('jobsEmpty').style.display='none';
    const itens=jobsArquivados();
    wrap.style.display='block';
    wrap.innerHTML = itens.length ? itens.map(htmlCardArquivado).join('') :
      '<div class="empty" style="padding:46px 16px"><div class="empty-mark u-btn-neutral"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg></div><h3 class="u-lg-label">'+t('jobs.archivedEmpty')+'</h3></div>';
  }
  /* ===== Classificação canónica de trabalho — fonte única usada em todo o lado ===== */
  /* Visibilidade por atribuição de equipa: Admin vê tudo; trabalhos sem
     atribuição (ou contas sem equipa) ficam visíveis a todos, como antes. */
  function jobVisivelParaMim(job){
    return souAdmin() || !job.assignedTo || !job.assignedTo.length || job.assignedTo.includes(currentUser.id);
  }
  function jobsVisiveis(){ return Object.values(jobsData).filter(jobVisivelParaMim); }
  /* Um trabalho "apagado" (arquivado com motivo:'deletado' — é o mesmo botão
     "Arquivar" do rodapé do trabalho, ver arquivarTrabalho/confirmarDeletarTrabalho)
     some das métricas operacionais (contagens, horas, prazos) normalmente.
     Mas se algum pagamento dele já foi marcado como Pago, esse valor já
     entrou de fato na receita — arquivar/apagar só muda a visualização do
     trabalho, nunca pode apagar dinheiro já recebido do histórico
     financeiro. Usado pelos agregadores de Relatórios para nunca excluir um
     valor pago só por causa do estado de arquivamento. */
  function jobTemPagamentoRecebido(job){
    return (job.payments||[]).some(p=>p.status==='pago');
  }
  function classificarTrabalho(job){
    const hojeISO=new Date().toISOString().slice(0,10);
    const fechado = job.contract.status==='assinado';
    const msEvento=(job.milestones||[]).find(m=>m.key==='principal');
    const msEntrega=(job.milestones||[]).find(m=>m.key==='entrega');
    const aRealizar = !!(msEvento && msEvento.status!=='feito');
    const aEntregar = !!(msEntrega && msEntrega.status!=='feito');
    const executado = !!(msEvento && msEvento.status==='feito');
    const entregue = !!(msEntrega && msEntrega.status==='feito');
    const atrasado = (job.payments||[]).some(p=>p.status!=='pago' && p.dueDate && p.dueDate<hojeISO);
    const pagamentoPendente = (job.payments||[]).some(p=>p.status!=='pago');
    const concluido = fechado && !aRealizar && !aEntregar && !pagamentoPendente;
    return {fechado, aRealizar, aEntregar, executado, entregue, atrasado, pagamentoPendente, concluido};
  }
  /* mesma logica de urgencia dos cards de Tarefas (Dashboard): a data mais
     proxima relevante do trabalho (pagamento pendente mais cedo ou data do
     evento) decide late/soon/normal — atrasado = vermelho, hoje/amanhã =
     amarelo, 2+ dias = verde. */
  function proximaDataRelevanteJob(job){
    const datas=[];
    (job.payments||[]).forEach(p=>{ if(p.status!=='pago' && p.dueDate) datas.push(p.dueDate); });
    if(job.dateRaw) datas.push(job.dateRaw);
    if(!datas.length) return null;
    datas.sort();
    const atrasadas=datas.filter(d=>diasEntre(d)<0);
    return atrasadas.length ? atrasadas.sort((a,b)=>diasEntre(a)-diasEntre(b))[0] : datas.find(d=>diasEntre(d)>=0) || datas[0];
  }
  function classificarUrgenciaJob(job){
    const dataAlvo=proximaDataRelevanteJob(job);
    if(!dataAlvo) return 'normal';
    return gerarNivelPrioridade(dataAlvo)==='critica' ? 'late' : (['alta','media'].includes(gerarNivelPrioridade(dataAlvo)) ? 'soon' : 'normal');
  }
  /* Ordenação da lista de Projetos: atrasado não é categoria, é prioridade —
     continua aparecendo na lista normal, só que sempre primeiro. Ordem:
     atrasados (mais atrasado primeiro) → hoje → mais próximos → futuros →
     sem data nenhuma por último. Mesma data-alvo usada pelo indicador de
     prioridade (proximaDataRelevanteJob), pra ordenação e cor baterem certo. */
  function scoreOrdemJob(job){
    const dataAlvo=proximaDataRelevanteJob(job);
    return dataAlvo ? diasEntre(dataAlvo) : 900000;
  }
  function inserirJobCardOrdenado(el, job){
    const lista=document.getElementById('v-trabalhos');
    const empty=document.getElementById('jobsEmpty');
    const score=scoreOrdemJob(job);
    const existentes=[...lista.querySelectorAll('.job-card-wrap,.job.job2')];
    const proximo=existentes.find(w=>{
      const jel=w.classList.contains('job')?w:w.querySelector('.job');
      const outroJob=jel&&jobsData[jel.dataset.jobId];
      return outroJob&&scoreOrdemJob(outroJob)>score;
    });
    lista.insertBefore(el, proximo||empty);
  }
  /* Etapa atual do projeto (linha 4 do card) — o "gargalo" de agora, na
     ordem natural do fluxo: Assinatura → Briefing → Evento → Seleção →
     Edição → Entrega → Concluído. Reaproveita os mesmos campos já usados
     em classificarTrabalho()/construirTimelineBidirecional() — nenhuma
     lógica nova, só a etiqueta de qual etapa está pendente agora. */
  function etapaAtualJob(job){
    const c=classificarTrabalho(job);
    if(c.concluido) return t('jobs.stage.done');
    if(!c.fechado) return t('jobs.stage.signature');
    if(job.structure && job.structure.briefing && job.briefing && !job.briefing.respondido) return t('jobs.stage.briefing');
    if(c.aRealizar) return t('jobs.stage.event');
    const e=job.entrega||{};
    if((e.triagem && !e.triagemConcluida) || (e.selecao && !e.selecaoConcluida)) return t('jobs.stage.selection');
    if(e.permiteAjustes && (e.ajustes||[]).some(a=>a.status==='utilizado')) return t('jobs.stage.editing');
    if(c.aEntregar) return t('jobs.stage.delivery');
    return t('jobs.stage.done');
  }
  /* mesmo ícone de Pendência/Demanda do card de Tarefas (Dashboard) — indica
     se a etapa atual do projeto depende do cliente (assinatura/briefing) ou
     de mim (evento/seleção/edição/entrega); null quando já concluído. */
  function etapaIconJob(job){
    const c=classificarTrabalho(job);
    if(c.concluido) return null;
    if(!c.fechado) return ICON_PENDENCIA_DEMANDA.pendencia;
    if(job.structure && job.structure.briefing && job.briefing && !job.briefing.respondido) return ICON_PENDENCIA_DEMANDA.pendencia;
    return ICON_PENDENCIA_DEMANDA.demanda;
  }
  /* Mesmo formato de data usado nos cards de tarefas da Dashboard
     (rtkDataCompleta) — dd · mm — para o sistema todo usar um único padrão
     visual de data, em vez de "12 Jul" aqui e "12 · 07" lá. */
  function fmtDataLinhaJob(job){
    if(!job.dateRaw) return t('jobs.dateNotSet');
    const partes=job.dateRaw.split('-');
    return partes[2]+' · '+partes[1];
  }
  function fmtHoraLinhaJob(job){
    if(!job.horaIni) return '';
    return job.horaIni+(job.horaFim?(' - '+job.horaFim):'');
  }
  /* Card de Projeto — só responde 2 perguntas (que projeto é este, em que
     etapa está): título, cliente (avatar+nome), data/hora numa linha, etapa
     atual. Endereço/valor/observações/equipa só existem na página interna
     do projeto (ver #v-detalhe), pra não duplicar informação em duas
     listas. Prioridade (atrasado/hoje/futuro) é só o glow inferior do
     card — mesmo sistema visual do card Tarefas (Dashboard) — nunca texto. */
  function updateJobCardInner(div, job){
    const c=classificarTrabalho(job);
    div.dataset.state= c.concluido?'done':(c.aEntregar?'deliver':(c.fechado?'active':'wait'));
    div.dataset.pending= c.pagamentoPendente?'1':'0';
    div.dataset.overdue= c.atrasado?'1':'0';
    div.dataset.signature= c.fechado?'signed':'pending';
    div.dataset.payment= c.pagamentoPendente?'pending':'none';
    div.dataset.fechado= c.fechado?'1':'0';
    div.dataset.realizar= c.aRealizar?'1':'0';
    div.dataset.entregar= c.aEntregar?'1':'0';
    div.dataset.executado= c.executado?'1':'0';
    div.dataset.entregue= c.entregue?'1':'0';
    const urgClasse = c.concluido ? '' : classificarUrgenciaJob(job);
    div.className='job job2'+(urgClasse?' '+urgClasse:'');
    /* Badge de pendências — soma das flags que classificarTrabalho() já
       calcula (nenhum dado novo). Pedido explícito: dar para perceber, só
       de olhar para o card, se há pendências e quantas — sem abrir o
       projeto (ver reorganização da Dashboard de Tarefas). */
    const nPendencias=[c.pagamentoPendente,c.atrasado,c.aRealizar,c.aEntregar].filter(Boolean).length;
    const pendenciasBadge=(!c.concluido&&nPendencias>0)
      ?'<div class="j2-pend-badge">⚠ '+nPendencias+'</div>' : '';
    const hora=fmtHoraLinhaJob(job);
    const icoEdit='<svg viewBox="0 0 11 11" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1.5L9.5 4 3.5 10H1V7.5L7 1.5z"/></svg>';
    const icoArch='<svg viewBox="0 0 11 11" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="1" y="4" width="9" height="6" rx="1"/><path d="M1 2h9v2H1z" fill="currentColor" stroke="none"/><path d="M3.5 7h4" stroke-linecap="round"/></svg>';
    const icoDone='<svg viewBox="0 0 11 11" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.5l3 3L9.5 2"/></svg>';
    div.innerHTML=
      pendenciasBadge+
      '<div class="j2-body">'+
        avatarHtml(job.client,44,clienteFotoPorNome(job.client))+
        '<div class="j2-info">'+
          '<div class="j2-title">'+escapeHtml(job.nome||job.typeLabel||'')+'</div>'+
          '<div class="j2-contact">'+RTK_ICONS.client+'<span>'+escapeHtml(job.client)+'</span></div>'+
        '</div>'+
      '</div>'+
      '<div class="j2-foot">'+
        '<div class="j2-dt">'+RTK_ICONS.calendar+'<span>'+escapeHtml(fmtDataLinhaJob(job))+'</span></div>'+
        (hora?'<div class="j2-dt">'+RTK_ICONS.clock+'<span>'+escapeHtml(hora)+'</span></div>':'')+
        '<div class="j2-dt">'+(etapaIconJob(job)||RTK_ICONS.action)+'<span>'+escapeHtml(etapaAtualJob(job))+'</span></div>'+
      '</div>'+
      '<div class="j2-lp-overlay">'+
        '<button class="j2-act-btn" onclick="event.stopPropagation();jobActEditar(this)">'+icoEdit+'<span>'+t('action.edit')+'</span></button>'+
        '<button class="j2-act-btn j2-arch" onclick="event.stopPropagation();jobActArquivar(this)">'+icoArch+'<span>Arquivar</span></button>'+
        '<button class="j2-act-btn j2-done" onclick="event.stopPropagation();jobActConcluir(this)">'+icoDone+'<span>'+t('action.complete')+'</span></button>'+
      '</div>';
  }
  function updateJobCard(id){
    const job=jobsData[id];
    const div=document.querySelector('.job[data-job-id="'+id+'"]');
    if(!div) return;
    updateJobCardInner(div, job);
    inserirJobCardOrdenado(div, job);
  }

  /* persistência real entre sessões — via StorageAdapter (ver mais abaixo) */
  function saveJobsData(){
    savePersisted('pivot-jobsData', ()=>jobsData);
  }
  async function loadJobsData(){
    await loadPersisted('pivot-jobsData', d=>{
      jobsData=d;
      migrarBriefingsAntigos();
      migrarPagamentosAntigos();
      migrarMilestoneEntrega();
      limparTrabalhosDuplicados();
      avancarRecorrencias();
      jobsVisiveis().forEach(job=>renderJobCard(job));
      renderMonthTicker();
    });
  }
  /* limpeza de trabalhos duplicados por criação em duplo-clique/duplo-toque
     (bug já bloqueado na origem, mas contas que criaram trabalhos duplicados
     antes da correção continuam com os registos antigos — e cada duplicado
     gera as suas próprias notificações/tarefas na dashboard, dando a
     impressão de que tudo aparece a dobrar). Só remove quando os dois
     trabalhos são praticamente idênticos (mesmo cliente, tipo, data e valor,
     criados a poucos segundos um do outro) E nenhum dos dois foi tocado desde
     então (sem assinatura, sem pagamento recebido, sem etapa concluída) —
     nesse caso é seguro assumir que é o mesmo clique a duplicar-se, nunca
     dois trabalhos reais que a pessoa quis mesmo criar separadamente. */
  function idTimestampJob(jobId){
    const m=String(jobId||'').match(/^job(\d+)/);
    return m ? parseInt(m[1],10) : null;
  }
  function jobIntocadoDesdeCriacao(j){
    const semAssinatura = !j.contract || j.contract.status!=='assinado';
    const semPagoAlgum = !(j.payments||[]).some(p=>p.status==='pago');
    const semMilestoneFeito = !(j.milestones||[]).some(m=>m.status==='feito');
    return semAssinatura && semPagoAlgum && semMilestoneFeito;
  }
  function limparTrabalhosDuplicados(){
    const jobs=jobsVisiveis().filter(j=>!j.arquivado);
    const remover=new Set();
    for(let i=0;i<jobs.length;i++){
      const a=jobs[i];
      if(remover.has(a.id)) continue;
      const ta=idTimestampJob(a.id);
      if(ta==null) continue;
      for(let k=i+1;k<jobs.length;k++){
        const b=jobs[k];
        if(remover.has(b.id)) continue;
        const tb=idTimestampJob(b.id);
        if(tb==null) continue;
        const mesmoCliente=(a.client||'').trim().toLowerCase()===(b.client||'').trim().toLowerCase();
        const mesmoTipo=(a.typeLabel||'').trim().toLowerCase()===(b.typeLabel||'').trim().toLowerCase();
        const mesmaData=(a.dateRaw||null)===(b.dateRaw||null);
        const mesmoValor=(a.value||0)===(b.value||0);
        const pertoNoTempo=Math.abs(ta-tb)<=5000;
        if(mesmoCliente && mesmoTipo && mesmaData && mesmoValor && pertoNoTempo &&
           jobIntocadoDesdeCriacao(a) && jobIntocadoDesdeCriacao(b)){
          remover.add(b.id);
        }
      }
    }
    if(remover.size>0){
      remover.forEach(id=>delete jobsData[id]);
      saveJobsData();
    }
    return remover.size;
  }
  /* trabalhos criados antes da etapa "entrega" passar a ser universal (ver
     gerarMilestones) não têm essa milestone — sem isto, ficariam presos para
     sempre fora da contagem do anel "Entregues" do card Performance. */
  function migrarMilestoneEntrega(){
    let alterou=false;
    jobsVisiveis().forEach(job=>{
      if(!job.milestones) return;
      if(!job.milestones.some(m=>m.key==='entrega')){
        job.milestones.push({key:'entrega', t:t('milestone.finalDelivery'), status:'futuro', m:t('milestone.deliveryPending')});
        alterou=true;
      }
    });
    if(alterou) saveJobsData();
  }
  function migrarBriefingsAntigos(){
    jobsVisiveis().forEach(job=>{
      if(!job.structure || !job.structure.briefing || !job.briefing) return;
      if(job.briefing.cronograma===undefined || job.briefing.cronograma===null) job.briefing.cronograma=[];
      if(job.briefing.pessoasImportantes===undefined || job.briefing.pessoasImportantes===null) job.briefing.pessoasImportantes=[];
      if(job.briefing.observacoes===undefined) job.briefing.observacoes='';
    });
    saveJobsData();
  }
  /* Trabalhos criados antes da correção do valor dos pagamentos guardavam
     "amount" já formatado como texto (ex: "1.200 €") em vez de número puro,
     o que produzia "NaN €" sempre que o valor era formatado outra vez.
     Corrige esses registos antigos na primeira vez que são carregados. */
  function migrarPagamentosAntigos(){
    let alterou=false;
    const parseValor=v=>parseFloat(String(v==null?'0':v).replace(/[^\d.,]/g,'').replace(/\./g,'').replace(',','.'))||0;
    jobsVisiveis().forEach(job=>{
      /* Corrigir o valor do trabalho ANTES dos pagamentos, para poder recalcular
         o sinal/pagamento final (50/50) a partir de um valor válido. */
      if(typeof job.value!=='number' || isNaN(job.value)){
        job.value=parseValor(job.value);
        alterou=true;
      }
      (job.payments||[]).forEach(p=>{
        if(typeof p.amount!=='number' || isNaN(p.amount)){
          const parsed=parseValor(p.amount);
          /* Se o valor guardado for irrecuperável (0) mas o trabalho tem valor,
             assume a divisão padrão 50/50 usada em gerarPagamentos. */
          p.amount = (parsed>0) ? parsed : (job.value>0 ? job.value*0.5 : 0);
          alterou=true;
        }
      });
      /* Milestones antigas guardam o texto do valor já formatado (ex: "Sinal NaN €"),
         gerado uma única vez na criação do trabalho. Corrigir job.value acima não
         atualiza esse texto — é preciso regenerar as milestones sempre que contêm "NaN". */
      if((job.milestones||[]).some(m=>String(m.t||'').indexOf('NaN')!==-1)){
        const antigas=job.milestones;
        const novas=gerarMilestones(job);
        job.milestones=novas.map(nova=>{
          const antiga=antigas.find(m=>m.key===nova.key);
          return antiga ? Object.assign({},nova,{status:antiga.status}) : nova;
        });
        alterou=true;
      }
    });
    if(alterou) saveJobsData();
  }
