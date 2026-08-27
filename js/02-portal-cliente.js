/* Pivots — portal cliente
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  async function abrirPortalPorToken(token, codigo){
    const { data, error } = await sb.rpc('portal_get_job', { p_token: token, p_codigo: codigo||null });
    if (error || !data) return null;
    return data;
  }
  let ppToken=null, ppJob=null, ppJobId=null, ppExpiresAt=null, ppCodigo=null;
  let colabToken=null, colabData=null, colabCodigo=null;
  /* convite de equipa: o link gerado por api/team/invite.js aponta para
     APP_URL+"?convite=1" — a própria Supabase já autentica a pessoa ao seguir
     o link (isso serve de verificação do email), mas falta definir nome e
     password antes de entrar na app. Ver concluirCadastroConvite(). */
  let precisaCompletarConvite=false;
  async function iniciarColabPublicoSeAplicavel(){
    if (!colabToken) return;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('landing-page').style.display='none';
    document.querySelector('.shell').style.display='none';
    document.getElementById('colab-publico').style.display='block';
    const { data, error } = await sb.rpc('colab_get', { p_token: colabToken, p_codigo: colabCodigo||null });
    if (error || !data){ renderColabPublicoEstado('<h3>Link inválido</h3><p class="u-hint-bare">Este link não é válido ou já não existe.</p>'); return; }
    if (data.needsCode){ renderColabCodigoAcessoForm(); return; }
    colabData = data;
    renderColabPublicoPrincipal();
  }
  /* Igual ao código de acesso do portal do cliente (ver renderPortalCodigoAcessoForm) —
     o link sozinho não basta quando não há conta Pivots por trás. */
  function renderColabCodigoAcessoForm(){
    renderColabPublicoEstado(`
      <h3 class="u-m-006">${t('portal.codeTitle')}</h3>
      <p class="u-hint-bare u-m-016">${t('portal.codeHint')}</p>
      <div class="field"><input class="u-code-display" id="colab-codigo-input" inputmode="numeric" maxlength="6" placeholder="000000"></div>
      <p id="colab-codigo-erro" style="color:#B23A2E;font-size:12.5px;display:none;margin:4px 2px 0">${t('portal.codeWrong')}</p>
      <button class="btn primary u-w-full u-mt-12" onclick="confirmarCodigoAcessoColab()">${t('portal.codeConfirm')}</button>`);
    setTimeout(()=>{ const el=document.getElementById('colab-codigo-input'); if(el) el.focus(); }, 60);
  }
  async function confirmarCodigoAcessoColab(){
    const codigo=(document.getElementById('colab-codigo-input').value||'').trim();
    const { data, error } = await sb.rpc('colab_get', { p_token: colabToken, p_codigo: codigo });
    if (error || !data || data.needsCode){
      const erro=document.getElementById('colab-codigo-erro'); if(erro) erro.style.display='block';
      return;
    }
    colabCodigo=codigo;
    colabData = data;
    renderColabPublicoPrincipal();
  }
  function renderColabPublicoEstado(html){ document.getElementById('colab-card').innerHTML = html; }
  function renderColabPublicoPrincipal(){
    const d=colabData;
    const perm=d.permissoes||{};
    const esc=d.escopo||{};
    const precisaAssinar = d.acordo && d.acordo.modelo && !d.acordo.assinado;
    let html = '<div class="pp-badge">'+t('collab.title')+'</div>';
    html += '<h2 style="font-family:var(--font-headline);font-weight:600;margin:0 0 4px">'+escapeHtml(esc.jobNome||d.jobNome||'')+'</h2>';
    html += '<p class="u-label-soft u-m-016">'+t(NIVEIS_COLAB.find(x=>x[0]===d.nivelAcesso)[1])+'</p>';

    if (precisaAssinar){
      html += '<div class="u-mb-18"><h4 style="margin:0 0 8px">'+escapeHtml(d.acordo.nome || (MODELOS_ACORDO[d.acordo.modelo]?t(MODELOS_ACORDO[d.acordo.modelo].nomeKey):''))+'</h4>';
      html += '<p style="font-size:13px;color:var(--ink-soft);white-space:pre-wrap">'+escapeHtml(d.acordo.texto||'')+'</p>';
      html += '<div class="field"><label>'+t('field.name')+'</label><input id="colab-sig-nome" placeholder="Nome e apelido"></div>';
      html += '<div class="field"><label>'+t('signature.instructions')+'</label><div class="sig-pad-wrap"><canvas id="sig-canvas"></canvas><span class="sig-pad-clear" onclick="limparAssinaturaCanvas()">'+t('signature.clear')+'</span></div></div>';
      html += '<button class="btn primary u-w-full u-mt-6" onclick="assinarAcordoColabPublico()">'+t('action.save')+'</button></div>';
      renderColabPublicoEstado(html);
      setTimeout(inicializarCanvasAssinatura, 30);
      return;
    }

    if (perm.briefing && esc.briefing) html += '<div class="pp-block"><h4>'+t('job.briefing')+'</h4><p>'+escapeHtml(esc.briefing.observacoes||'')+'</p></div>';
    if (perm.datas && esc.datas) html += '<div class="pp-block"><h4>'+t('wizard.date')+'</h4><p>'+escapeHtml(esc.datas.date||'')+(esc.datas.local?(' · '+escapeHtml(esc.datas.local)):'')+'</p></div>';
    if (perm.horas && esc.horasPrevistas) html += '<div class="pp-block"><h4>'+t('job.hoursEstimated')+'</h4><p>'+esc.horasPrevistas+'h</p></div>';
    if (perm.checklist && esc.checklist && esc.checklist.length) html += '<div class="pp-block"><h4>'+t('wizard.model.checklist')+'</h4>'+esc.checklist.map(c=>'<p>• '+escapeHtml(c.t)+'</p>').join('')+'</div>';
    if (perm.contrato && esc.contrato) html += '<div class="pp-block"><h4>'+t('job.contract')+'</h4><p>'+escapeHtml(esc.contrato.status||'')+'</p></div>';
    if (perm.financeiro && esc.financeiro) html += '<div class="pp-block"><h4>'+t('job.value')+'</h4><p>'+fmtMoney(esc.financeiro.value||0)+'</p></div>';

    html += '<div class="u-divider-top">'+
      '<h4 class="u-m-010">'+t('collab.deliverTitle')+'</h4>'+
      '<div class="field"><label>'+t('collab.deliverLink')+'</label><input id="colab-entrega-link" placeholder="https://…"></div>'+
      '<div class="field"><label>'+t('collab.deliverNotes')+'</label><textarea id="colab-entrega-notas"></textarea></div>'+
      '<button class="btn primary u-w-full" onclick="enviarEntregaColabPublico()">'+t('collab.deliverSubmit')+'</button>'+
      (d.entregas&&d.entregas.length? '<p style="font-size:12px;color:var(--neutral);margin-top:10px">'+d.entregas.length+' '+t('collab.deliverySentCount')+'</p>':'')+
      '</div>';
    renderColabPublicoEstado(html);
  }
  async function assinarAcordoColabPublico(){
    const nome=document.getElementById('colab-sig-nome').value.trim();
    if (!nome){ showToast(t('toast.writePersonName')); return; }
    const canvas=document.getElementById('sig-canvas');
    if (!canvas || !sigHasDrawing){ showToast(t('toast.drawSignatureFirst')); return; }
    const signatureImg=canvas.toDataURL('image/png');
    const { data, error } = await sb.rpc('colab_sign_agreement', { p_token: colabToken, p_signer_name: nome, p_signature_data_url: signatureImg });
    if (error || !data || !data.ok){ showToast(t('toast.inviteError')); return; }
    const r = await sb.rpc('colab_get', { p_token: colabToken, p_codigo: colabCodigo||null });
    if (r.data) colabData = r.data;
    renderColabPublicoPrincipal();
  }
  async function enviarEntregaColabPublico(){
    const link=document.getElementById('colab-entrega-link').value.trim();
    const notas=document.getElementById('colab-entrega-notas').value.trim();
    if (!link && !notas){ showToast(t('toast.writePersonName')); return; }
    const entrega={ link, notas, enviadoEm:new Date().toISOString() };
    const { data, error } = await sb.rpc('colab_submit_delivery', { p_token: colabToken, p_entrega: entrega });
    if (error || !data || !data.ok){ showToast(t('toast.inviteError')); return; }
    const r = await sb.rpc('colab_get', { p_token: colabToken, p_codigo: colabCodigo||null });
    if (r.data) colabData = r.data;
    showToast(t('collab.deliverySent'));
    document.getElementById('colab-entrega-link').value='';
    document.getElementById('colab-entrega-notas').value='';
    renderColabPublicoPrincipal();
  }
  async function iniciarPortalPublicoSeAplicavel(){
    if (!ppToken) return;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('landing-page').style.display='none';
    document.querySelector('.shell').style.display='none';
    const el=document.getElementById('portal-publico');
    el.style.display='block';
    const data = await abrirPortalPorToken(ppToken);
    if (!data){ renderPortalPublicoEstado('<h3>Link inválido</h3><p class="u-hint-bare">Este link não é válido ou já não existe.</p>'); return; }
    if (data.needsCode){ renderPortalCodigoAcessoForm(); return; }
    if (data.expired){ renderPortalPublicoEstado('<h3>Link expirado</h3><p class="u-hint-bare">Este link já passou do prazo. Pede ao profissional para gerar um novo.</p>'); return; }
    ppJob = data.job; ppJobId = data.jobId; ppExpiresAt = data.expiresAt||null;
    if(!localStorage.getItem('portal-termos-'+ppToken)) { renderPortalTermosAcesso(); return; }
    renderPortalPublicoPrincipal();
  }
  /* O link sozinho não basta — o portal também exige um código de acesso de
     6 dígitos (ver gerarCodigoAcessoPortal). Isto reduz o risco de alguém
     que intercete só o link conseguir ver informações do projeto. */
  function renderPortalCodigoAcessoForm(){
    renderPortalPublicoEstado(`
      <h3 class="u-m-006">${t('portal.codeTitle')}</h3>
      <p class="u-hint-bare u-m-016">${t('portal.codeHint')}</p>
      <div class="field"><input class="u-code-display" id="pp-codigo-input" inputmode="numeric" maxlength="6" placeholder="000000"></div>
      <p id="pp-codigo-erro" style="color:#B23A2E;font-size:12.5px;display:none;margin:4px 2px 0">${t('portal.codeWrong')}</p>
      <button class="btn primary u-w-full u-mt-12" onclick="confirmarCodigoAcessoPortal()">${t('portal.codeConfirm')}</button>`);
    setTimeout(()=>{ const el=document.getElementById('pp-codigo-input'); if(el) el.focus(); }, 60);
  }
  async function confirmarCodigoAcessoPortal(){
    const codigo=(document.getElementById('pp-codigo-input').value||'').trim();
    const data = await abrirPortalPorToken(ppToken, codigo);
    if (!data || data.needsCode){
      const erro=document.getElementById('pp-codigo-erro'); if(erro) erro.style.display='block';
      return;
    }
    ppCodigo=codigo;
    if (data.expired){ renderPortalPublicoEstado('<h3>Link expirado</h3><p class="u-hint-bare">Este link já passou do prazo. Pede ao profissional para gerar um novo.</p>'); return; }
    ppJob = data.job; ppJobId = data.jobId; ppExpiresAt = data.expiresAt||null;
    if(!localStorage.getItem('portal-termos-'+ppToken)) { renderPortalTermosAcesso(); return; }
    renderPortalPublicoPrincipal();
  }
  function renderPortalTermosAcesso(){
    renderPortalPublicoEstado(`
      <h3 style="margin:0 0 10px;font-size:18px">${t('portal.termsTitle')||'Termos de Utilização'}</h3>
      <p style="font-size:13px;color:var(--ink-soft);line-height:1.6;margin:0 0 16px">${t('portal.termsBody')||'Ao aceder a este portal, confirmas que irás utilizar as informações aqui partilhadas apenas para os fins acordados com o profissional. Os dados são confidenciais e não devem ser partilhados com terceiros.'}</p>
      <label class="cc-check u-mb-16"><input type="checkbox" id="pp-termos-check"><span>${t('portal.termsAccept')||'Li e aceito os termos de utilização deste portal.'}</span></label>
      <button class="btn primary u-w-full" onclick="aceitarTermosPortal()">${t('portal.termsConfirm')||'Continuar'}</button>`);
  }
  function aceitarTermosPortal(){
    const check=document.getElementById('pp-termos-check');
    if(!check||!check.checked){ return; }
    localStorage.setItem('portal-termos-'+ppToken,'1');
    renderPortalPublicoPrincipal();
  }
  function renderPortalPublicoEstado(html){
    document.getElementById('pp-card').innerHTML = html;
  }
  /* Data de criação: jobs novos já guardam criadoEm; jobs antigos extraem a
     data do próprio id ('job'+Date.now()+...), sem precisar de migração. */
  function dataCriacaoJob(job){
    if (job.criadoEm) return new Date(job.criadoEm);
    const m=String(job.id||'').match(/^job(\d+)/);
    return m ? new Date(parseInt(m[1],10)) : null;
  }
  /* Um único link — o dispositivo decide qual app abrir (Google Maps na
     maioria dos casos; em iOS/Android com Waze ou Apple Maps instalados, o
     próprio sistema costuma oferecer a escolha ao abrir um link de rota do
     Google Maps). Evita ter de detectar user-agent e apontar para apps
     diferentes manualmente. */
  /* No telemóvel, um link "https://www.google.com/maps/..." abre sempre o
     Google Maps (site ou app), nunca deixa escolher entre os apps de mapa
     instalados — o que não faz sentido em iOS, onde o normal é abrir a
     própria app Mapas da Apple. No desktop continua a abrir o site do
     Google Maps normalmente (não há app nativa pra abrir). */
  function linkRotaInteligente(job){
    const destino = job.geo && job.geo.lat ? (job.geo.lat+','+job.geo.lon) : (job.localCompleto||job.local||'');
    const destinoCod=encodeURIComponent(destino);
    const ua=(navigator.userAgent||'')+(navigator.platform||'');
    const isIOS=/iPhone|iPad|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
    const isAndroid=/Android/.test(ua);
    if(isIOS) return 'https://maps.apple.com/?daddr='+destinoCod;
    /* geo: no Android deixa o próprio sistema mostrar a lista de apps de
       mapa instalados (Google Maps, Waze, etc.) — é o equivalente Android
       do "dar a opção de escolher" pedido; não há mecanismo universal
       parecido no iOS além de abrir a Mapas da Apple diretamente. */
    if(isAndroid) return 'geo:0,0?q='+destinoCod;
    return 'https://www.google.com/maps/dir/?api=1&destination='+destinoCod;
  }
  function renderPortalPublicoPrincipal(){
    const job=ppJob;
    const jaAssinado = job.contract && job.contract.status==='assinado';
    /* Assinatura Inteligente: enquanto houver uma variável [CLIENT_*] por
       preencher, o contrato final (com o texto já substituído) e o botão de
       assinar nem aparecem — só o formulário pedindo essas variáveis ao
       cliente (ver camposClientePendentes/confirmarFormularioCliente). */
    const pendentesCliente = jaAssinado ? [] : camposClientePendentes(job);
    const precisaBriefing = job.structure && job.structure.briefing && job.briefing && !job.briefing.respondido;
    let html = '<div class="pp-badge">'+(jaAssinado?'Contrato assinado':'Portal do Cliente')+'</div>';
    html += '<h2 style="font-family:\'Jost\',sans-serif;font-weight:600;margin:0 0 4px">'+escapeHtml(job.client||'')+'</h2>';
    html += '<p class="u-label-soft u-m-016">'+escapeHtml(job.typeLabel||'')+(job.date?(' · '+escapeHtml(job.date)):'')+(job.local?(' · '+escapeHtml(job.local)):'')+'</p>';

    // Cabeçalho: contacto, data de criação, valor total
    const criadoEm=dataCriacaoJob(job);
    const cabecalhoBits=[];
    if (job.email) cabecalhoBits.push(escapeHtml(job.email));
    if (criadoEm) cabecalhoBits.push(t('portal.createdOn')+' '+criadoEm.toLocaleDateString(jsLocale(),{day:'2-digit',month:'2-digit',year:'numeric'}));
    if (job.value) cabecalhoBits.push(t('job.value')+': '+fmtMoney(job.value));
    if (cabecalhoBits.length) html += '<p style="font-size:12.5px;color:var(--neutral);margin:-10px 0 16px">'+cabecalhoBits.join(' · ')+'</p>';

    if (ppExpiresAt && !jaAssinado){
      const d=new Date(ppExpiresAt);
      html += '<div class="pp-deadline">Disponível até<b>'+d.toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'})+'</b></div>';
    }

    // Local — mapa real (via geocodificação) com rota inteligente
    if (job.local) html += mapCardHtml(job);

    // Contrato — status claro (pendente/assinado), modelo usado, sem edição pós-envio
    if (job.structure && job.structure.contrato){
      html += '<div class="pp-block u-mb-4"><h4>'+t('job.contract')+' '+contractStatusTagHtml(job)+'</h4>'+
        (job.contract.templateName ? '<p>'+t('resumo.contractTemplate')+': '+escapeHtml(job.contract.templateName)+'</p>' : '')+
        (jaAssinado ? '<p>'+t('portal.signedOn')+' '+escapeHtml(job.contract.signedAt||'')+'</p>' : '')+
        '</div>';
    }

    if (job.contract && job.contract.blocks && job.contract.blocks.length && !pendentesCliente.length){
      html += '<div class="u-mb-18">'+job.contract.blocks.filter(b=>b.on).map(b=>
        '<div class="pp-block"><h4>'+escapeHtml(blockName(b))+'</h4><p>'+escapeHtml(blockText(job,b))+'</p></div>'
      ).join('')+'</div>';
    }

    if (job.paymentMethods && job.paymentMethods.length){
      html += '<div class="pp-block u-mb-18"><h4>'+t('payment.method.howToPay')+'</h4>'+
        job.paymentMethods.filter(m=>m.valor).map(m=>'<p><b>'+escapeHtml(m.label)+':</b> '+escapeHtml(m.valor)+'</p>').join('')+
        '</div>';
    }

    if (job.structure && job.structure.briefing && job.briefing){
      const nQ=(job.briefing.perguntas||[]).length;
      const nRespondidas=job.briefing.respondido ? nQ : (job.briefing.perguntas||[]).filter(p=>p.resposta).length;
      html += '<div class="pp-block u-mb-4"><h4>'+t('job.briefing')+'</h4>'+
        (nQ ? '<p>'+t('portal.briefingAnswered')+': '+nRespondidas+'/'+nQ+'</p>' : '')+
        (job.briefing.respondido ? '<p style="color:var(--c-text-green);font-weight:600">'+t('entrega.markedDone')+'</p>' : ('<p>'+t('portal.briefingPending')+(ppExpiresAt?(' · '+t('portal.deadline')+' '+new Date(ppExpiresAt).toLocaleDateString(jsLocale())):'')+'</p>'))+
        '</div>';
    }

    if (jaAssinado){
      html += '<p style="font-size:13px;color:var(--ink)">Assinado por '+escapeHtml(job.contract.signerName||'')+' · '+escapeHtml(job.contract.signedAt||'')+'</p>';
    } else if (pendentesCliente.length){
      html += renderFormularioClienteHtml(job,'ppcf-');
      html += '<button class="btn primary u-w-full u-mt-6" onclick="confirmarFormularioClientePublico()">'+t('action.confirmAndContinue')+'</button>';
    } else {
      html += '<div class="field"><label>O seu nome completo</label><input id="pp-sig-nome" placeholder="Nome e apelido"></div>';
      html += '<div class="field"><label>Assinatura — desenhe com o dedo ou o rato</label>'+
        '<div class="sig-pad-wrap"><canvas id="sig-canvas"></canvas><span class="sig-pad-clear" onclick="limparAssinaturaCanvas()">Limpar</span></div></div>';
      html += '<button class="btn primary u-w-full u-mt-6" onclick="assinarContratoPublico()">Assinar contrato</button>';
    }

    if (precisaBriefing){
      ppPessoasTemp = (job.briefing.pessoasImportantes || []).slice();
      html += '<div class="u-divider-top">'+
        '<h4 class="u-m-014">Briefing</h4>';

      html += '<div class="briefing-card"><div class="briefing-card-head">Cronograma do evento</div>'+
        '<p class="briefing-card-hint">Momentos importantes e horários (opcional)</p>'+
        '<div class="cron-rows" id="pp-cron-rows">'+
        (job.briefing.cronograma||[]).map(m=>
          '<div class="cron-row"><input class="cron-desc" value="'+escapeHtml(m.momento||'')+'" placeholder="Momento"><input type="time" class="cron-hora" value="'+escapeHtml(m.hora||'')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cron-rm" onclick="this.closest(\'.cron-row\').remove()"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
        ).join('')+
        '</div>'+
        '<button class="btn ghost u-w-full u-mt-4" onclick="adicionarMomentoCronogramaPublico()">+ Adicionar momento</button></div>';

      html += '<div class="briefing-card u-mt-12"><div class="briefing-card-head">Pessoas importantes</div>'+
        '<p class="briefing-card-hint">Quem deve ser contactado no dia</p>'+
        '<div id="pp-pessoas-lista"></div>'+
        '<div class="field-row"><div class="field"><label>Nome</label><input id="pp-pessoa-nome" placeholder="Nome"></div>'+
        '<div class="field"><label>Função</label><input id="pp-pessoa-funcao" placeholder="Ex: Noivo, Organizador…"></div></div>'+
        '<button class="btn soft u-w-full" onclick="adicionarPessoaImportantePublico()">+ Adicionar pessoa</button></div>';

      html += '<div class="briefing-card u-mt-12"><div class="briefing-card-head">Observações importantes</div>'+
        '<div class="field"><textarea id="pp-briefing-texto" placeholder="Conta-nos os detalhes importantes para o teu projeto…">'+escapeHtml(job.briefing.observacoes||'')+'</textarea></div></div>';

      html += '<button class="btn primary u-w-full u-mt-14" onclick="enviarBriefingPublico()">Enviar briefing</button></div>';
    }

    html += renderEntregaAprovacaoPublico(job);
    html += renderTimelinePublicoHtml(job);

    html += renderPagamentosPublico(job);

    renderPortalPublicoEstado(html);
    if (precisaBriefing) renderPessoasImportantesPublico();
    if (!jaAssinado && !pendentesCliente.length) setTimeout(inicializarCanvasAssinatura, 30);
    setTimeout(inicializarMapasCard, 30);
  }
  /* Confirma o formulário de variáveis do cliente no Portal público. Escreve
     em ppJob (em memória, o mesmo objeto já usado por todo o resto desta
     tela) e re-resolve as cláusulas para exibição — a substituição fica
     imediatamente correta para o cliente ver e assinar. A persistência
     definitiva destes valores no lado do servidor (Supabase) depende de uma
     RPC própria ainda por criar (ex.: portal_submit_field_values); até lá,
     os valores entram no contrato assinado (blockText/customText já
     resolvido) mas não sobrevivem a um reload do link antes da assinatura. */
  function confirmarFormularioClientePublico(){
    if(!confirmarFormularioCliente(ppJob,'ppcf-')){ alert(t('toast.clientFormIncomplete')); return; }
    renderPortalPublicoPrincipal();
  }
  /* ===== Pagamentos no Portal do Cliente =====
     O cliente vê cada parcela (paga/pendente/aguardando confirmação) e pode
     marcar como paga anexando um comprovante — que é comprimido e limitado
     de tamanho antes do envio. O proprietário confirma depois (mesmo fluxo
     de marcarPagoDynamic já usado internamente para o status "a_confirmar"). */
  const COMPROVANTE_TAMANHO_MAX=15*1024*1024; // 15MB — antes de comprimir
  function renderPagamentosPublico(job){
    if (!job.structure || !job.structure.pagamentos || !(job.payments||[]).length) return '';
    let html='<div class="u-divider-top">'+
      '<h4 class="u-m-014">'+t('job.payments')+'</h4>';
    html += job.payments.map((p,i)=>{
      const statusTxt = p.status==='pago' ? t('payment.statusPaid') : (p.status==='a_confirmar' ? t('payment.statusReceiptReceived') : t('payment.statusPending'));
      let acao='';
      if (p.status==='pendente'){
        acao = '<div class="field" style="margin:8px 0 6px"><input type="file" accept="image/*,.pdf" id="pp-comprovante-'+i+'"></div>'+
          '<button class="btn soft u-w-full" onclick="enviarComprovantePublico('+i+')">'+t('payment.markPaid')+'</button>';
      } else if (p.comprovativo){
        acao = '<a class="u-sm" href="'+p.comprovativo+'" target="_blank" rel="noopener">'+t('payment.viewReceipt')+'</a>';
      }
      return '<div class="pp-block"><h4>'+escapeHtml(p.label||t('payment.installmentDefault'))+' — '+fmtMoney(p.amount||0)+'</h4>'+
        '<p>'+statusTxt+(p.dueDate?(' · '+p.dueDate.split('-').reverse().join('/')):'')+'</p>'+acao+'</div>';
    }).join('');
    html += '</div>';
    return html;
  }
  async function enviarComprovantePublico(index){
    const fileEl=document.getElementById('pp-comprovante-'+index);
    const file=fileEl && fileEl.files[0];
    if (!file){ showToast(t('payment.chooseFileFirst')); return; }
    if (file.size>COMPROVANTE_TAMANHO_MAX){ showToast(t('payment.fileTooLarge')); return; }
    let dataUrl;
    try{ dataUrl=await arquivoParaDataUrlComprimido(file); }catch(e){ showToast(t('toast.uploadFileFirst')); return; }
    const { data, error } = await sb.rpc('portal_submit_payment_receipt', { p_token: ppToken, p_index: index, p_comprovante_data_url: dataUrl });
    if (error || !data || !data.ok){ showToast(t('toast.inviteError')); return; }
    const data2 = await abrirPortalPorToken(ppToken, ppCodigo);
    if (data2 && data2.job) ppJob = data2.job;
    showToast(t('payment.receiptSent'));
    renderPortalPublicoPrincipal();
  }
  /* ===== Triagem / Seleção / Ajustes no Portal do Cliente =====
     Cada fase só aparece se o proprietário a ligou na Etapa 5 do wizard.
     O cliente marca como concluída, o que atualiza a timeline — o
     proprietário é avisado só na app (sino de notificações, via
     job.history/gerarAtividadeCliente), sem email, já que a ação passou a
     ser dele, não do cliente. */
  function renderEntregaAprovacaoPublico(job){
    const e=job.entrega;
    if (!e || (!e.triagem && !e.selecao && !e.permiteAjustes)) return '';
    let html='<div class="u-divider-top">'+
      '<h4 class="u-m-014">'+t('wizard.step5')+'</h4>';
    if (e.triagem){
      html += '<div class="pp-block"><h4>'+t('entrega.screening')+'</h4>'+
        (e.triagemLink ? '<p><a href="'+escapeHtml(e.triagemLink)+'" target="_blank" rel="noopener">'+escapeHtml(e.triagemLink)+'</a></p>' : '')+
        (e.triagemConcluida
          ? '<p class="u-c-green">✓ '+t('entrega.markedDone')+'</p>'
          : '<button class="btn soft u-w-full u-mt-8" onclick="marcarFaseEntregaPublico(\'triagemConcluida\')">'+t('entrega.markDone')+'</button>')+
      '</div>';
    }
    if (e.selecao){
      html += '<div class="pp-block u-mt-10"><h4>'+t('entrega.selection')+'</h4>'+
        (e.selecaoLink ? '<p><a href="'+escapeHtml(e.selecaoLink)+'" target="_blank" rel="noopener">'+escapeHtml(e.selecaoLink)+'</a></p>' : '')+
        (e.selecaoConcluida
          ? '<p class="u-c-green">✓ '+t('entrega.markedDone')+'</p>'
          : '<button class="btn soft u-w-full u-mt-8" onclick="marcarFaseEntregaPublico(\'selecaoConcluida\')">'+t('entrega.markDone')+'</button>')+
      '</div>';
    }
    if (e.permiteAjustes && e.ajustes && e.ajustes.length){
      html += '<div class="pp-block u-mt-10"><h4>'+t('entrega.allowAdjustments')+'</h4>';
      html += e.ajustes.map((a,i)=>{
        if (a.status==='utilizado' || a.status==='concluido'){
          return '<div class="u-mb-10"><b class="u-label">'+escapeHtml(a.nome)+'</b><p style="font-size:12.5px;color:var(--ink-soft);margin:2px 0 0">'+escapeHtml(a.observacoes||'')+'</p></div>';
        }
        return '<div class="u-mb-10"><b class="u-label">'+escapeHtml(a.nome)+'</b>'+
          (a.link ? '<p style="margin:2px 0 6px"><a href="'+escapeHtml(a.link)+'" target="_blank" rel="noopener">'+escapeHtml(a.link)+'</a></p>' : '')+
          '<div class="field u-mb-6"><textarea id="pp-ajuste-obs-'+i+'" placeholder="'+t('entrega.observationsPlaceholder')+'"></textarea></div>'+
          '<button class="btn soft u-w-full" onclick="enviarObservacaoAjustePublico('+i+')">'+t('entrega.observations')+'</button></div>';
      }).join('');
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
  async function marcarFaseEntregaPublico(campo){
    const { data, error } = await sb.rpc('portal_update_entrega', { p_token: ppToken, p_patch: { [campo]: true } });
    if (error || !data || !data.ok){ showToast(t('toast.inviteError')); return; }
    const data2 = await abrirPortalPorToken(ppToken, ppCodigo);
    if (data2 && data2.job) ppJob = data2.job;
    renderPortalPublicoPrincipal();
  }
  async function enviarObservacaoAjustePublico(index){
    const texto=(document.getElementById('pp-ajuste-obs-'+index).value||'').trim();
    if (!texto){ alert(t('entrega.observationsPlaceholder')); return; }
    const { data, error } = await sb.rpc('portal_request_ajuste', { p_token: ppToken, p_index: index, p_observacoes: texto });
    if (error || !data || !data.ok){ showToast(t('toast.inviteError')); return; }
    const data2 = await abrirPortalPorToken(ppToken, ppCodigo);
    if (data2 && data2.job) ppJob = data2.job;
    renderPortalPublicoPrincipal();
  }
  /* ===== Timeline bidirecional =====
     Cada passo é do cliente ou da equipe — o projeto avança à medida que
     cada lado conclui a sua parte. Só entram passos cujas funcionalidades
     estão realmente ativas neste trabalho (contrato, pagamentos, triagem,
     seleção, ajustes, entrega final). */
  /* Cada passo ganha: status (done/progress/pending/late — usado para o
     ícone colorido 🟢🔵🟡🔴 em toda a aplicação), desc (contexto do que está
     a acontecer) e data quando existir. acaoLabel/acaoFn só aparecem em
     passos que a EQUIPA pode concluir diretamente por aqui — ações do
     cliente (assinar, pagar, selecionar) não têm botão, porque acontecem no
     Portal do Cliente. */
  function construirTimelineBidirecional(job){
    const e=job.entrega||{};
    const pagos=(job.payments||[]).filter(p=>p.status==='pago').length;
    const enviados=(job.payments||[]).filter(p=>p.status==='pago'||p.status==='a_confirmar').length;
    const hoje=new Date().toISOString().slice(0,10);
    const atrasado=(job.payments||[]).some(p=>p.status!=='pago' && p.dueDate && p.dueDate<hoje);
    const passos=[];
    if (job.structure && job.structure.contrato){
      const feito=job.contract && job.contract.status==='assinado';
      passos.push({label:t('timeline.contractSigned'), quem:'cliente', feito, status: feito?'done':'pending',
        desc: feito ? (t('job.contract.signedByPrefix2')+(job.contract.signerName||'')) : t('timeline.desc.awaitingSignature'),
        data: feito ? job.contract.signedAt : null});
    }
    if (job.structure && job.structure.pagamentos && (job.payments||[]).length){
      passos.push({label:t('timeline.paymentSent'), quem:'cliente', feito: enviados>0, status: enviados>0?'done':(atrasado?'late':'pending'),
        desc: enviados>0 ? t('timeline.desc.paymentReceived') : t('timeline.desc.awaitingPayment'), data:null});
      passos.push({label:t('timeline.paymentValidated'), quem:'equipe', feito: pagos>0, status: pagos>0?'done':(enviados>0?'progress':'pending'),
        desc: pagos>0 ? t('timeline.desc.paymentConfirmed') : t('timeline.desc.awaitingConfirmation'), data:null});
    }
    if (e.triagem) passos.push({label:t('entrega.screening'), quem:'cliente', feito: !!e.triagemConcluida, status: e.triagemConcluida?'done':'progress',
      desc: e.triagemConcluida ? t('timeline.desc.doneByClient') : t('timeline.desc.clientSelecting'), data:null});
    if (e.selecao) passos.push({label:t('entrega.selection'), quem:'cliente', feito: !!e.selecaoConcluida, status: e.selecaoConcluida?'done':'progress',
      desc: e.selecaoConcluida ? t('timeline.desc.doneByClient') : t('timeline.desc.clientSelecting'), data:null});
    if (e.permiteAjustes && e.ajustes && e.ajustes.length){
      const utilizados=e.ajustes.filter(a=>a.status==='utilizado'||a.status==='concluido').length;
      const concluidos=e.ajustes.filter(a=>a.status==='concluido').length;
      passos.push({label:t('timeline.adjustmentRequested'), quem:'cliente', feito: utilizados>0, status: utilizados>0?'done':'pending',
        desc: utilizados>0 ? (utilizados+' '+t('entrega.allowAdjustments').toLowerCase()) : t('timeline.desc.noRequestsYet'), data:null});
      // Cada ajuste solicitado e ainda sem link precisa que a equipe
      // disponibilize o material revisado antes de poder ser concluído —
      // o link só é pedido agora, nunca na criação do trabalho.
      e.ajustes.forEach((a,idx)=>{
        if (a.status==='utilizado' && !a.link){
          passos.push({label:a.nome||(t('entrega.adjustmentDefault')+' '+(idx+1)), quem:'equipe', feito:false, status:'progress',
            desc: t('timeline.desc.awaitingAdjustmentMaterial'), data:null,
            acaoLabel: t('entrega.attachMaterialLink'),
            acaoFn: ('abrirAnexarLinkAjuste(\''+job.id+'\','+idx+')')});
        }
      });
      const pendentes=utilizados-concluidos;
      const todosComLink = e.ajustes.filter(a=>a.status==='utilizado').every(a=>a.link);
      passos.push({label:t('timeline.adjustmentDone'), quem:'equipe', feito: utilizados>0 && pendentes===0, status: (utilizados>0 && pendentes===0)?'done':(utilizados>0?'progress':'pending'),
        desc: concluidos+'/'+utilizados, data:null,
        acaoLabel: (pendentes>0 && todosComLink) ? t('action.complete') : null,
        acaoFn: (pendentes>0 && todosComLink) ? ('concluirAjustesPendentesJob(\''+job.id+'\')') : null});
    }
    /* Entrega Final só pode ser concluída depois de anexar o link real do
       material (Drive/Dropbox/WeTransfer/etc) — nunca vira "feito" sem
       link. Mesmo depois de concluída, continua editável (o botão some,
       mas o link fica disponível no #detalhe e é reenviado ao cliente
       automaticamente via marcarMilestoneFeito → dispararEmailEvento). */
    const entregaMs=(job.milestones||[]).find(m=>m.key==='entrega');
    const entregaFeita = entregaMs && entregaMs.status==='feito';
    passos.push({label:t('milestone.finalDelivery'), quem:'equipe', feito: entregaFeita,
      status: entregaFeita?'done':'pending',
      desc: entregaFeita ? (e.linkDownload||t('timeline.desc.delivered')) : t('timeline.desc.deliveryPending'),
      data: e.dataEntrega ? e.dataEntrega.split('-').reverse().join('/') : null,
      acaoLabel: entregaFeita ? t('entrega.editDeliveryLink') : t('action.complete'),
      acaoFn: 'abrirConcluirEntregaFinal(\''+job.id+'\')'});
    return passos;
  }
  function abrirConcluirEntregaFinal(jobId){
    const job=jobsData[jobId];
    const linkAtual=(job.entrega&&job.entrega.linkDownload)||'';
    openInfo(t('entrega.finalDeliveryTitle'), `
      <p class="u-sm-soft u-mb-12">${t('entrega.finalDeliveryHint')}</p>
      <div class="field"><label>${t('entrega.downloadLink')}</label><input id="link-entrega-final-input" placeholder="https://…" value="${escapeHtml(linkAtual)}"></div>
      <button class="btn dark u-w-full u-mt-10" onclick="salvarEntregaFinalComLink('${jobId}')">${t('action.save')}</button>`);
  }
  function salvarEntregaFinalComLink(jobId){
    const link=(document.getElementById('link-entrega-final-input').value||'').trim();
    if(!link){ showToast(t('entrega.linkRequired')); return; }
    const job=jobsData[jobId];
    if(!job.entrega) job.entrega={};
    job.entrega.linkDownload=link;
    const ms=(job.milestones||[]).find(m=>m.key==='entrega');
    const jaEstavaFeita = ms && ms.status==='feito';
    saveJobsData();
    closeInfo();
    if(jaEstavaFeita){
      renderJobDetailDynamic(jobId);
      showToast(t('toast.changesSaved'));
    } else {
      marcarMilestoneFeito(jobId,'entrega');
    }
  }
  function abrirAnexarLinkAjuste(jobId, idx){
    const job=jobsData[jobId]; const a=job.entrega.ajustes[idx];
    openInfo(t('entrega.attachMaterialLink'), `
      <div class="field"><label>${t('entrega.materialLink')}</label><input id="link-ajuste-input" placeholder="https://…" value="${escapeHtml(a.link||'')}"></div>
      <button class="btn primary u-w-full" onclick="salvarLinkAjuste('${jobId}',${idx})">${t('action.save')}</button>`);
  }
  function salvarLinkAjuste(jobId, idx){
    const link=(document.getElementById('link-ajuste-input').value||'').trim();
    if(!link) return;
    const job=jobsData[jobId];
    job.entrega.ajustes[idx].link=link;
    saveJobsData();
    closeInfo();
    renderJobDetailDynamic(jobId);
    showToast(t('toast.changesSaved'));
  }
  function concluirAjustesPendentesJob(jobId){
    const job=jobsData[jobId]; if(!job || !job.entrega) return;
    (job.entrega.ajustes||[]).forEach(a=>{ if(a.status==='utilizado') a.status='concluido'; });
    pushHistory(job, t('toast.done'));
    saveJobsData(); renderJobDetailDynamic(jobId);
    showToast(t('toast.done'));
  }
  function renderTimelinePublicoHtml(job){
    const passos=construirTimelineBidirecional(job);
    if (!passos.length) return '';
    let html='<div class="u-divider-top">'+
      '<h4 class="u-m-014">'+t('timeline.title')+'</h4><div class="pp-timeline">';
    html += passos.map(p=>
      '<div class="pp-timeline-step'+(p.feito?' done':'')+'">'+
        '<div class="pp-timeline-dot"></div>'+
        '<div><div class="nm">'+escapeHtml(p.label)+'</div><span class="sub">'+escapeHtml(p.desc||'')+(p.data?(' · '+escapeHtml(p.data)):'')+'</span></div>'+
      '</div>'
    ).join('');
    html += '</div></div>';
    return html;
  }
  let ppPessoasTemp = [];
  function renderPessoasImportantesPublico(){
    const wrap=document.getElementById('pp-pessoas-lista');
    if (!wrap) return;
    wrap.innerHTML = ppPessoasTemp.length ? ppPessoasTemp.map((c,i)=>
      '<div class="conv-row"><div class="conv-av">'+avatarHtml(c.nome,32)+'</div>'+
      '<div class="conv-info"><div class="nm">'+escapeHtml(c.nome)+'</div><div class="sub">'+escapeHtml(c.funcao)+'</div></div>'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="conv-rm" onclick="removerPessoaImportantePublico('+i+')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
    ).join('') : '<p class="u-sm-nd u-mb-10">Ainda sem pessoas adicionadas.</p>';
  }
  function adicionarPessoaImportantePublico(){
    const nomeEl=document.getElementById('pp-pessoa-nome'), funcaoEl=document.getElementById('pp-pessoa-funcao');
    const nome=nomeEl.value.trim(), funcao=funcaoEl.value.trim();
    if (!nome || !funcao) return;
    ppPessoasTemp.push({nome, funcao});
    nomeEl.value=''; funcaoEl.value='';
    renderPessoasImportantesPublico();
  }
  function removerPessoaImportantePublico(i){
    ppPessoasTemp.splice(i,1);
    renderPessoasImportantesPublico();
  }
  function adicionarMomentoCronogramaPublico(){
    const wrap=document.getElementById('pp-cron-rows');
    const row=document.createElement('div');
    row.className='cron-row';
    row.innerHTML='<input class="cron-desc" placeholder="Momento"><input type="time" class="cron-hora"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cron-rm" onclick="this.closest(\'.cron-row\').remove()"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    wrap.appendChild(row);
    row.querySelector('.cron-desc').focus();
  }
  async function assinarContratoPublico(){
    const nome=document.getElementById('pp-sig-nome').value.trim();
    if (!nome){ alert('Escreve o teu nome completo.'); return; }
    const canvas=document.getElementById('sig-canvas');
    if (!canvas || !sigHasDrawing){ alert('Desenha a tua assinatura primeiro.'); return; }
    const signatureImg=canvas.toDataURL('image/png');
    const { data, error } = await sb.rpc('portal_sign_contract', { p_token: ppToken, p_signer_name: nome, p_signature_data_url: signatureImg });
    if (error || !data || !data.ok){ alert('Não foi possível assinar. Tenta novamente.'); return; }
    const data2 = await abrirPortalPorToken(ppToken, ppCodigo);
    if (data2 && data2.job) ppJob = data2.job;
    renderPortalPublicoPrincipal();
  }
  async function enviarBriefingPublico(){
    const texto=document.getElementById('pp-briefing-texto').value.trim();
    const linhas=document.querySelectorAll('#pp-cron-rows .cron-row');
    const cronograma=[...linhas].map(row=>({
      momento: row.querySelector('.cron-desc').value.trim(),
      hora: row.querySelector('.cron-hora').value
    })).filter(m=>m.momento);
    if (!texto && !cronograma.length && !ppPessoasTemp.length){ alert('Escreve alguma informação antes de enviar.'); return; }
    const briefing = { observacoes: texto, cronograma, pessoasImportantes: ppPessoasTemp };
    const { data, error } = await sb.rpc('portal_submit_briefing', { p_token: ppToken, p_briefing: briefing });
    if (error || !data || !data.ok){ alert('Não foi possível enviar. Tenta novamente.'); return; }
    const data2 = await abrirPortalPorToken(ppToken, ppCodigo);
    if (data2 && data2.job) ppJob = data2.job;
    renderPortalPublicoPrincipal();
  }
