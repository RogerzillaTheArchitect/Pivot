/* Pivots — builder contratos
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  const IMP_FORMATOS = ['PDF','DOCX','DOC','JPG','JPEG','PNG','WEBP'];
  let _pdfjsLoading=null, _mammothLoading=null, _tesseractLoading=null;
  function carregarScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src; s.onload=resolve; s.onerror=()=>reject(new Error('falha ao carregar '+src));
      document.head.appendChild(s);
    });
  }
  function carregarPdfJs(){
    if(typeof pdfjsLib!=='undefined') return Promise.resolve();
    if(_pdfjsLoading) return _pdfjsLoading;
    _pdfjsLoading=carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js').then(()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }).catch(e=>{ _pdfjsLoading=null; throw e; });
    return _pdfjsLoading;
  }
  function carregarMammoth(){
    if(typeof mammoth!=='undefined') return Promise.resolve();
    if(_mammothLoading) return _mammothLoading;
    _mammothLoading=carregarScript('https://cdn.jsdelivr.net/npm/mammoth@1.7.2/mammoth.browser.min.js').catch(e=>{ _mammothLoading=null; throw e; });
    return _mammothLoading;
  }
  function carregarTesseract(){
    if(typeof Tesseract!=='undefined') return Promise.resolve();
    if(_tesseractLoading) return _tesseractLoading;
    _tesseractLoading=carregarScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js').catch(e=>{ _tesseractLoading=null; throw e; });
    return _tesseractLoading;
  }

  let impState=null; // {fileName, blocos:[{id,titulo,clausulas:[{id,texto}]}]}
  let impDragBound=false;

  function abrirImportarArquivo(){
    document.getElementById('imp-formats').innerHTML = IMP_FORMATOS.map(f=>'<span>'+f+'</span>').join('');
    document.getElementById('imp-progress').style.display='none';
    document.getElementById('imp-progress').innerHTML='';
    document.getElementById('imp-fail').style.display='none';
    document.getElementById('imp-file-input').value='';
    bindImportDropzone();
    go('importar-arquivo');
  }
  function bindImportDropzone(){
    if(impDragBound) return;
    impDragBound=true;
    const zona=document.getElementById('imp-dropzone');
    ['dragenter','dragover'].forEach(ev=>zona.addEventListener(ev, e=>{ e.preventDefault(); zona.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(ev=>zona.addEventListener(ev, e=>{ e.preventDefault(); zona.classList.remove('drag-over'); }));
    zona.addEventListener('drop', e=>{ if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) handleImportFiles(e.dataTransfer.files); });
  }
  const IMP_STEPS=['import.stepExtract','import.stepRebuild','import.stepValidate'];
  function impSetStep(idx){
    const wrap=document.getElementById('imp-progress');
    wrap.style.display='block';
    wrap.innerHTML=IMP_STEPS.map((k,i)=>
      '<div class="imp-progress-step '+(i<idx?'done':i===idx?'on':'')+'"><div class="imp-progress-dot"></div>'+t(k)+'</div>'
    ).join('');
  }
  function impFalhar(msg){
    document.getElementById('imp-progress').style.display='none';
    const fail=document.getElementById('imp-fail');
    fail.style.display='block';
    fail.textContent = msg || t('import.failMessage');
  }
  async function handleImportFiles(fileList){
    const file=fileList && fileList[0];
    if(!file) return;
    document.getElementById('imp-fail').style.display='none';
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!IMP_FORMATOS.map(f=>f.toLowerCase()).includes(ext)){
      impFalhar(t('import.unsupportedFormat'));
      return;
    }
    try{
      impSetStep(0);
      const extraido = await impExtrairConteudo(file, ext);
      impSetStep(1);
      const resultado = impSegmentarEstrutura(extraido);
      impSetStep(2);
      if(!impEstruturaValida(resultado.blocos)){
        impFalhar(t('import.failMessage'));
        return;
      }
      impState={ fileName:file.name, blocos:resultado.blocos, variaveisDetectadas:resultado.contagemVariaveis };
      revRender();
      go('revisao-importacao');
    }catch(err){
      console.error('[import]', err);
      if(err && err.message==='legacy-doc-unsupported'){ impFalhar(t('import.docUnsupported')); return; }
      impFalhar(t('import.failMessage'));
    }
  }

  /* ----- Extração ----- */
  async function impExtrairConteudo(file, ext){
    if(ext==='docx') return impExtrairDocx(file);
    if(ext==='doc') throw new Error('legacy-doc-unsupported');
    if(ext==='pdf') return impExtrairPdf(file);
    return impExtrairImagem(file); // jpg/jpeg/png/webp
  }
  // DOCX: mammoth preserva estilos de título (Heading 1/2/...) como <h1>/<h2>,
  // o sinal estrutural mais confiável que temos para separar Blocos de
  // Cláusulas sem depender de nenhuma palavra específica.
  const IMP_MARCADOR_POR_NIVEL=['1','a','i']; // numérico / letra / romano — só cosmético, nunca reprocessado
  function impNumeralPorNivel(nivel, posicao){
    const estilo=IMP_MARCADOR_POR_NIVEL[Math.min(nivel, IMP_MARCADOR_POR_NIVEL.length-1)];
    if(estilo==='a') return String.fromCharCode(97+(posicao%26))+') ';
    if(estilo==='i'){
      const alg=['i','ii','iii','iv','v','vi','vii','viii','ix','x'];
      return (alg[posicao%alg.length])+') ';
    }
    return (posicao+1)+'. ';
  }
  // mammoth já lê a numeração nativa do Word (numbering.xml) e gera <ol>/<li>
  // aninhados de verdade — mas <ol> só aparecia como filho direto do corpo do
  // documento, então textContent() grudava TODOS os <li> (a, b, c...) num
  // único blob sem separador nenhum. Percorre recursivamente preservando cada
  // <li> como item individual, e antepõe um marcador cosmético (1./a)/i)) pra
  // o texto continuar legível fora do contexto visual da lista original.
  function impAchatarListaDocx(ol, nivel, out){
    [...ol.children].filter(li=>li.tagName==='LI').forEach((li, idx)=>{
      const subLista=[...li.children].find(c=>c.tagName==='OL'||c.tagName==='UL');
      const textoProprio=[...li.childNodes].filter(n=>!(n.nodeType===1 && (n.tagName==='OL'||n.tagName==='UL')))
        .map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();
      const negrito=!!li.querySelector('strong,b') && /^<(strong|b)>.*<\/(strong|b)>$/i.test(li.innerHTML.replace(subLista?subLista.outerHTML:'','').trim());
      if(textoProprio) out.push({tag:'LI', texto:impNumeralPorNivel(nivel,idx)+textoProprio, negrito});
      if(subLista) impAchatarListaDocx(subLista, nivel+1, out);
    });
  }
  async function impExtrairDocx(file){
    await carregarMammoth();
    const buf=await file.arrayBuffer();
    const {value: html} = await mammoth.convertToHtml({arrayBuffer: buf});
    const doc=new DOMParser().parseFromString('<div>'+html+'</div>', 'text/html');
    const filhos=[...doc.body.firstChild.children].filter(n=>n.tagName!=='TABLE');
    const nodes=[];
    filhos.forEach(n=>{
      if(n.tagName==='OL'||n.tagName==='UL'){ impAchatarListaDocx(n, 0, nodes); return; }
      const negrito=/^<(strong|b)>.*<\/(strong|b)>$/i.test(n.innerHTML.trim());
      const texto=(n.textContent||'').replace(/\s+/g,' ').trim();
      if(texto) nodes.push({tag:n.tagName, texto, negrito});
    });
    const niveisTitulo=[...new Set(nodes.filter(n=>/^H[1-6]$/.test(n.tag)).map(n=>+n.tag[1]))];
    // Muitos contratos do Word estilizam TODA cláusula numerada como título
    // (só para gerar sumário automático) — tratar qualquer nível de H1-H6
    // como fronteira de Bloco fragmenta em dezenas de blocos de 1 frase, sem
    // contexto. Só o nível de título mais RASO do documento vira Bloco;
    // níveis mais fundos (se existirem) ficam como texto normal dentro do
    // bloco corrente, preservando o contexto ao redor. Sem NENHUM estilo de
    // título real, um parágrafo inteiro em negrito e curto assume esse papel
    // (ver nivelBloco==null em impSegmentarDeHtml).
    const nivelBloco = niveisTitulo.length ? Math.min(...niveisTitulo) : null;
    return {tipo:'estruturado', nivelBloco, nodes};
  }
  // pdf.js entrega os itens de texto soltos (posição x/y, sem noção de linha).
  // Juntar tudo com espaço (como era antes) perdia toda quebra de linha dentro
  // de uma página — a segmentação em blocos/cláusulas só via parágrafos nas
  // bordas entre páginas. Reconstrução real: nova linha quando o Y muda mais
  // que ~1.5pt em relação ao item anterior; um salto de Y bem maior que a
  // altura do texto é tratado como parágrafo novo (linha em branco).
  function impReconstruirLinhasPdf(content){
    const linhas=[]; let linhaAtual=''; let ultimoY=null;
    content.items.forEach(it=>{
      if(!it.str) return;
      const y=it.transform[5];
      if(ultimoY===null){ linhaAtual=it.str; }
      else if(Math.abs(y-ultimoY)>1.5){
        linhas.push(linhaAtual);
        if(ultimoY-y > (it.height||10)*1.8) linhas.push('');
        linhaAtual=it.str;
      } else {
        linhaAtual += (linhaAtual && !/\s$/.test(linhaAtual) && !/^\s/.test(it.str) ? ' ' : '') + it.str;
      }
      ultimoY=y;
    });
    if(linhaAtual) linhas.push(linhaAtual);
    return linhas.join('\n');
  }
  // Muitos PDFs exportados do Word geram automaticamente um sumário/bookmarks
  // nativo a partir dos estilos de Título — quando existe, é a hierarquia
  // definida pelo PRÓPRIO AUTOR do documento, mais confiável que qualquer
  // heurística nossa. Usado só como reforço: se um parágrafo isolado bater
  // com um título conhecido do sumário, a classificação de capítulo é
  // automática (ver titulosConhecidos em impPareceCabecalhoBloco). Quando o
  // PDF não tem outline (a maioria dos contratos simples não tem), cai sem
  // custo nenhum para a heurística de texto normal.
  async function impExtrairTitulosOutlinePdf(pdf){
    try{
      const outline=await pdf.getOutline();
      if(!outline || !outline.length) return null;
      const titulos=new Set();
      outline.forEach(item=>{ if(item.title) titulos.add(item.title.trim().toLowerCase()); });
      return titulos.size ? titulos : null;
    }catch(e){ return null; }
  }
  async function impExtrairPdf(file){
    await carregarPdfJs();
    const buf=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    const titulosConhecidos=await impExtrairTitulosOutlinePdf(pdf);
    const paginas=[];
    let totalChars=0;
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);
      const content=await page.getTextContent();
      const texto=impReconstruirLinhasPdf(content);
      const linhas=texto.split('\n').map(l=>l.trim()).filter(Boolean);
      paginas.push({page, linhas, texto});
      totalChars+=texto.trim().length;
    }
    // Páginas praticamente sem texto extraído = provavelmente digitalizadas
    // (imagem). Fazemos OCR só dessas páginas, mantendo o restante direto.
    const precisaOcr = totalChars < pdf.numPages*20;
    if(!precisaOcr){
      const linhasLimpas = impRemoverCabecalhosRodapes(paginas.map(p=>p.linhas));
      return {tipo:'plano', texto: linhasLimpas.map(ls=>ls.join('\n')).join('\n\n'), titulosConhecidos};
    }
    await carregarTesseract();
    let textoOcr='';
    for(const {page, texto} of paginas){
      if(texto.length>30){ textoOcr+=texto+'\n\n'; continue; }
      const viewport=page.getViewport({scale:2});
      const canvas=document.createElement('canvas');
      canvas.width=viewport.width; canvas.height=viewport.height;
      await page.render({canvasContext:canvas.getContext('2d'), viewport}).promise;
      const {data:{text}} = await Tesseract.recognize(canvas, 'por');
      textoOcr+=text+'\n\n';
    }
    return {tipo:'plano', texto:textoOcr, titulosConhecidos};
  }
  // Linhas que se repetem (quase) exatamente no topo/rodapé de várias páginas
  // — logo do escritório, "Contrato XYZ — Página N", nome do cliente no
  // cabeçalho — são ruído de formatação, não estrutura jurídica. Compara só
  // as 2 primeiras/últimas linhas de cada página, normalizando dígitos (pra
  // pegar "Página 1"/"Página 2" como a mesma linha), e remove o que se repete
  // em pelo menos 60% das páginas.
  function impChaveLinha(l){ return l.replace(/\d+/g,'#'); }
  function impRemoverCabecalhosRodapes(linhasPorPagina){
    if(linhasPorPagina.length<3) return linhasPorPagina;
    const contagem={};
    linhasPorPagina.forEach(linhas=>{
      const bordas=new Set([...linhas.slice(0,2), ...linhas.slice(-2)].filter(Boolean));
      bordas.forEach(l=>{ const k=impChaveLinha(l); contagem[k]=(contagem[k]||0)+1; });
    });
    const limiar=Math.max(2, Math.ceil(linhasPorPagina.length*0.6));
    const repetidos=new Set(Object.entries(contagem).filter(([,c])=>c>=limiar).map(([k])=>k));
    if(!repetidos.size) return linhasPorPagina;
    return linhasPorPagina.map(linhas=>linhas.filter((l,idx)=>{
      const naBorda = idx<2 || idx>=linhas.length-2;
      return !(naBorda && l && repetidos.has(impChaveLinha(l)));
    }));
  }
  async function impExtrairImagem(file){
    await carregarTesseract();
    const {data:{text}} = await Tesseract.recognize(file, 'por');
    return {tipo:'plano', texto:text};
  }

  /* ----- Normalização ----- */
  function impNormalizarTexto(texto){
    return texto
      .replace(/\r\n?/g,'\n')
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .split('\n').map(l=>l.trim()).join('\n')
      .trim();
  }

  /* ----- Limpeza de conteúdo não reutilizável -----
     O objetivo não é recriar o PDF, é aproveitar só a estrutura jurídica
     reutilizável. Cabeçalhos/rodapés/assinaturas/tabelas/dados bancários não
     viram bloco nem cláusula — são descartados linha a linha, por formato
     (nunca por o conteúdo "parecer" ou não relevante). */
  const IMP_RE_ASSINATURA = /^(assinatura|rubrica|testemunha(s)?|local\s+e\s+data|nome\s+leg[íi]vel|carimbo|ci[êe]nte(\s+e\s+de\s+acordo)?)\b/i;
  const IMP_RE_LINHA_BRANCO_ASSINATURA = /^[_\-.\s]{6,}$/;
  const IMP_RE_PAGINACAO = /^p[áa]gina\s*\d+(\s*(de|\/)\s*\d+)?$/i;
  const IMP_RE_DADOS_BANCARIOS = /\b(IBAN|SWIFT|BIC|N[úu]mero de conta|Ag[êe]ncia|NIB)\b/i;
  // Densidade bruta de dígitos falha para frases normais que citam um valor
  // E uma data ("O valor é de R$3.000, pago em 01/02/2026" já tem 14
  // dígitos) — apagava cláusulas reais. Conta por TOKEN: uma linha de
  // tabela de verdade tem a maioria das palavras sendo só números/moeda
  // ("Sessão 1  2  500,00  1000,00"); uma frase tem poucos tokens
  // numéricos no meio de palavras normais.
  function impLinhaTabular(linha){
    const tokens=linha.trim().split(/\s+/).filter(Boolean);
    if(tokens.length<3) return false;
    const numericos=tokens.filter(tk=>/^[\d.,%$€R\-\/]+$/.test(tk)).length;
    return numericos>=3 && (numericos/tokens.length)>=0.55;
  }
  function impLinhaEhRuido(linha){
    if(!linha) return false;
    const curta=linha.length<70;
    if(curta && IMP_RE_ASSINATURA.test(linha)) return true;
    if(IMP_RE_LINHA_BRANCO_ASSINATURA.test(linha)) return true;
    if(curta && IMP_RE_PAGINACAO.test(linha)) return true;
    if(curta && IMP_RE_DADOS_BANCARIOS.test(linha)) return true;
    if(impLinhaTabular(linha)) return true;
    return false;
  }
  function impLimparLinhasRuido(texto){
    return texto.split('\n').filter(l=>!impLinhaEhRuido(l.trim())).join('\n');
  }

  /* ----- Variáveis -----
     Dados específicos DESTE contrato (nome do cliente, datas, valores,
     documentos, contacto) não pertencem a um Template reutilizável — viram
     placeholders, mantendo a frase à volta intacta. Nunca usado para
     classificar Bloco/Cláusula, só para substituir tokens dentro do texto
     já segmentado. */
  function impSubstituirVariaveis(texto){
    let contagem=0;
    const marcar=(regex, token)=>{ texto=texto.replace(regex, ()=>{ contagem++; return token; }); };
    marcar(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, '[CLIENT_EMAIL]');
    marcar(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '[CLIENT_DOCUMENT]');
    marcar(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CLIENT_DOCUMENT]');
    marcar(/\(\d{2}\)\s?\d{4,5}-?\d{4}\b/g, '[CLIENT_PHONE]');
    marcar(/\b\d{2}\s\d{4,5}-\d{4}\b/g, '[CLIENT_PHONE]');
    marcar(/\b\d{1,2}\s+de\s+[a-zà-ú]+\s+de\s+\d{4}\b/gi, '[DATE]');
    marcar(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g, '[DATE]');
    marcar(/\b(R\$|US\$|€)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/gi, '[TOTAL_VALUE]');
    texto=texto.replace(/\b(CONTRATANTE|CONTRATADO|CLIENTE|LOCAT[ÁA]RIO|LOCADOR|OUTORGANTE|OUTORGADO)(\s*:?\s*)([A-ZÀ-Ý][A-Za-zà-ÿ'’-]+(?:\s+[A-ZÀ-Ý][A-Za-zà-ÿ'’-]+){1,4})/g,
      (m,label,sep)=>{ contagem++; return label+sep+'[CLIENT_NAME]'; });
    return {texto, contagem};
  }

  /* ----- Segmentação estrutural (determinística, sem IA) -----
     Classificador por NÍVEL, não um regex único: o formato do próprio
     marcador já diz a que nível ele pertence — "1." é capítulo, "1.1" é
     cláusula, "a)"/"(a)" é item, "ii)"/"(iii)" é subitem (2+ letras, evita
     ambiguidade com item de letra única), "•/-/▪" é lista. Nunca depende de
     uma palavra específica para reconhecer o NÍVEL, só CLÁUSULA/SEÇÃO/etc.
     como sinal extra de que é capítulo mesmo sem numeração. */
  // Espaço depois do marcador é OPCIONAL em todos os padrões (\s* não \s+):
  // texto extraído de PDF real frequentemente vem sem espaço por kerning
  // apertado ("1.DEFINIÇÕES." em vez de "1. DEFINIÇÕES."). O "(?!\d)" no
  // capítulo garante que "1.1" (cláusula) nunca é confundido com "1."
  // (capítulo), independente de ter espaço ou não.
  const IMP_RE_BLOCO_MARCADOR = /^(CL[ÁA]USULA|SE[ÇC][ÃA]O|CAP[ÍI]TULO|ANEXO|T[ÍI]TULO|PAR[ÁA]GRAFO)\b/i;
  const IMP_RE_CAPITULO_NUM = /^\d{1,3}[.)](?!\d)\s*\S/;
  const IMP_MARCADORES_NIVEL = [
    {nivel:'clausula', re:/^\d{1,3}\.\d{1,3}(\.\d{1,3})*[.)]?\s*\S/},
    {nivel:'item', re:/^\(?[a-zA-Z]\)\.?\s*\S/},
    {nivel:'subitem', re:/^\(?[ivxlcIVXLC]{2,6}\)\.?\s*\S/},
    {nivel:'lista', re:/^[•▪◦‣]\s*\S/},
    {nivel:'lista', re:/^-\s+\S/}
  ];
  function impClassificarMarcador(linha){
    if(IMP_RE_CAPITULO_NUM.test(linha)) return 'capitulo';
    for(const m of IMP_MARCADORES_NIVEL) if(m.re.test(linha)) return m.nivel;
    return null;
  }
  function impPontuacaoRatioCaps(linha){
    const letras=linha.replace(/[^A-Za-zÀ-ÿ]/g,'');
    if(!letras.length) return 0;
    const maiusc=letras.replace(/[^A-ZÀ-Ý]/g,'');
    return maiusc.length/letras.length;
  }
  // Um "candidato a cabeçalho" é uma LINHA curta — nunca exigimos que esteja
  // isolada por linha em branco. PDFs reais de espaçamento simples raramente
  // têm folga entre um título e o corpo do texto seguinte; exigir isso
  // fazia o parser não reconhecer nenhum título e tudo virar 1 bloco só
  // (bug relatado com contrato real). Cada linha física já reconstruída
  // (impReconstruirLinhasPdf) é a unidade certa de análise.
  function impCandidatoACabecalho(linha){ return linha.length<=90; }
  // Decide, para o DOCUMENTO INTEIRO, qual é o nível que representa Capítulo/
  // Bloco — uma vez só, antes de montar qualquer registro (por isso recebe
  // TODAS as linhas, não uma de cada vez). Sem essa decisão prévia, uma
  // cláusula numerada solta ("1. Prazo de pagamento") no meio de um Bloco
  // que já usa CLÁUSULA/CAPÍTULO como cabeçalho real virava Bloco novo por
  // engano. Prioridade: palavra-chave jurídica explícita > numeração crua >
  // (sem nenhum marcador formal em lugar nenhum) heurística genérica de
  // isolamento/caixa-alta, como último recurso.
  function impDeterminarNivelCapitulo(linhas){
    const candidatos=linhas.filter(impCandidatoACabecalho);
    if(candidatos.some(l=>IMP_RE_BLOCO_MARCADOR.test(l))) return 'keyword';
    if(candidatos.some(l=>IMP_RE_CAPITULO_NUM.test(l))) return 'numero';
    return null;
  }
  // titulosConhecidos: linhas confirmadas como capítulo por uma fonte externa
  // confiável (sumário/bookmarks nativos do PDF) — força a classificação
  // independente do nível decidido, sempre.
  function impPareceCabecalhoBloco(linha, anterior, seguinte, nivelCapitulo, titulosConhecidos){
    if(!impCandidatoACabecalho(linha)) return false;
    if(titulosConhecidos && titulosConhecidos.has(linha.trim().toLowerCase())) return true;
    // Nível já decidido para o documento inteiro: só ESSE tipo de marcador
    // vira Bloco — uma cláusula numerada solta não "rouba" o papel de
    // capítulo só por estar isolada na própria linha.
    if(nivelCapitulo==='keyword') return IMP_RE_BLOCO_MARCADOR.test(linha);
    if(nivelCapitulo==='numero') return IMP_RE_CAPITULO_NUM.test(linha);
    // Nenhum marcador formal em lugar nenhum do documento — último recurso,
    // heurística por pontuação de sinais (isolamento, caixa alta, etc.).
    let sinais=0;
    if(!/[,.;:]$/.test(linha)) sinais++;
    if(impPontuacaoRatioCaps(linha)>0.7) sinais++;
    if(linha.length<60) sinais++;
    if(!anterior) sinais++;
    if(seguinte && seguinte.length>linha.length) sinais++;
    return sinais>=3;
  }
  // Um cabeçalho isolado sem nenhuma cláusula por baixo (ex: o título do
  // documento, classificado como possível bloco pela heurística) não é um
  // Bloco válido — só ruído. Mantemos pelo menos 1, mesmo vazio, para o
  // caso extremo de tudo ter sido descartado.
  function impPosProcessarBlocos(blocos){
    const comConteudo=blocos.filter(b=>b.clausulas.length>0);
    blocos = comConteudo.length ? comConteudo : blocos;
    return impFundirBlocosFragmentados(blocos);
  }
  function impSegmentarEstrutura(extraido){
    let blocos, contagemVariaveis=0;
    if(extraido.tipo==='estruturado'){
      const r=impSegmentarDeHtml(extraido.nodes, extraido.nivelBloco);
      blocos=r.blocos; contagemVariaveis=r.contagemVariaveis;
    } else {
      let texto=impNormalizarTexto(extraido.texto||'');
      texto=impLimparLinhasRuido(texto);
      const sub=impSubstituirVariaveis(texto);
      texto=impNormalizarTexto(sub.texto);
      contagemVariaveis=sub.contagem;
      blocos=impSegmentarDeTexto(texto, extraido.titulosConhecidos);
    }
    blocos=impPosProcessarBlocos(blocos);
    return {blocos, contagemVariaveis};
  }
  // Um bloco com 0-1 cláusula curta e sem marcador jurídico forte no título
  // (CLÁUSULA/SEÇÃO/CAPÍTULO/...) é fragmento, não estrutura de verdade —
  // acontece sobretudo com DOCX que estiliza toda cláusula numerada como
  // título só para gerar sumário. Funde no bloco anterior, preservando o
  // título curto como início de uma cláusula (não perde texto nenhum).
  function impFundirBlocosFragmentados(blocos){
    if(blocos.length<=1) return blocos;
    const fundidos=[];
    blocos.forEach((b,i)=>{
      const fragil = b.clausulas.length<=1 && !IMP_RE_BLOCO_MARCADOR.test(b.titulo||'') &&
        (b.clausulas.length===0 || (b.clausulas[0].texto||'').length<40);
      // Conteúdo antes de qualquer cabeçalho reconhecido (título/preâmbulo
      // do documento, ex: "Holmes Place Contrato de Adesão" antes da
      // primeira cláusula real) cai no bloco de fallback "Bloco 1" — não é
      // estrutura jurídica reutilizável, é metadado do documento. Descartado
      // por completo, não fundido em lugar nenhum.
      if(i===0 && fragil && b.titulo==='Bloco 1' && blocos.length>1) return;
      if(fragil && fundidos.length){
        const anterior=fundidos[fundidos.length-1];
        const textoTitulo=(b.titulo||'').trim();
        if(textoTitulo) anterior.clausulas.push({id:genId(), texto:textoTitulo});
        b.clausulas.forEach(c=>anterior.clausulas.push(c));
      } else {
        fundidos.push(b);
      }
    });
    return fundidos;
  }
  function impSegmentarDeHtml(nodes, nivelBloco){
    const blocos=[];
    let atual=null;
    let contagemVariaveis=0;
    nodes.forEach(n=>{
      // Com estilo de Título real no documento, só o nível mais raso conta.
      // Sem NENHUM (nivelBloco null), um parágrafo curto inteiramente em
      // negrito assume o papel de cabeçalho — sinal visual, não palavra.
      const ehCabecalho = nivelBloco!=null
        ? (/^H[1-6]$/.test(n.tag) && +n.tag[1]===nivelBloco)
        : (n.tag==='P' && n.negrito && n.texto.length<90);
      if(ehCabecalho){
        atual={id:genId(), titulo:n.texto, clausulas:[]};
        blocos.push(atual);
        return;
      }
      if(impLinhaEhRuido(n.texto)) return;
      const sub=impSubstituirVariaveis(n.texto);
      contagemVariaveis+=sub.contagem;
      if(!atual){ atual={id:genId(), titulo:'Bloco 1', clausulas:[]}; blocos.push(atual); }
      // Títulos de nível mais fundo (ex: H3 dentro de um documento cujo
      // nível de Bloco é H1) preservam-se como o início de uma cláusula —
      // dão contexto, mas não fragmentam em blocos novos.
      impAdicionarClausulasDeParagrafo(atual, sub.texto);
    });
    return {blocos, contagemVariaveis};
  }
  // Linha a linha, não por parágrafo separado por linha em branco — ver o
  // comentário de impCandidatoACabecalho. Cabeçalho de Bloco fecha a
  // cláusula em andamento e abre um Bloco novo; marcador de cláusula/item/
  // subitem/lista fecha a cláusula em andamento e começa outra dentro do
  // MESMO Bloco; qualquer outra linha continua a cláusula corrente.
  function impSegmentarDeTexto(texto, titulosConhecidos){
    const linhas=texto.split('\n').map(l=>l.trim()).filter(Boolean);
    // Decidido UMA VEZ pra todo o documento, antes de criar qualquer Bloco —
    // ver impDeterminarNivelCapitulo.
    const nivelCapitulo=impDeterminarNivelCapitulo(linhas);
    const blocos=[];
    let atualBloco=null;
    let atualTexto=[];
    function fecharClausula(){
      const tx=atualTexto.join(' ').trim();
      if(tx){
        if(!atualBloco){ atualBloco={id:genId(), titulo:'Bloco 1', clausulas:[]}; blocos.push(atualBloco); }
        atualBloco.clausulas.push({id:genId(), texto:tx});
      }
      atualTexto=[];
    }
    linhas.forEach((linha,i)=>{
      const anterior = i>0 ? linhas[i-1] : '';
      const seguinte = i<linhas.length-1 ? linhas[i+1] : '';
      if(impPareceCabecalhoBloco(linha, anterior, seguinte, nivelCapitulo, titulosConhecidos)){
        fecharClausula();
        atualBloco={id:genId(), titulo:linha, clausulas:[]};
        blocos.push(atualBloco);
        return;
      }
      const nivel=impClassificarMarcador(linha);
      if(nivel && atualTexto.length){
        fecharClausula();
      }
      atualTexto.push(linha);
    });
    fecharClausula();
    return blocos;
  }
  // Dentro de um parágrafo já isolado, qualquer marcador de nível
  // cláusula/item/subitem/lista (1.1 / a) / ii) / •) abre uma cláusula nova
  // — nunca concatenados; sem nenhum marcador, o parágrafo inteiro é uma
  // única cláusula. Nunca fragmenta no meio de uma frase.
  function impAdicionarClausulasDeParagrafo(bloco, texto){
    const linhas=texto.split('\n').map(l=>l.trim()).filter(Boolean);
    let atualTexto=[];
    function fechar(){
      const tx=atualTexto.join(' ').trim();
      if(tx) bloco.clausulas.push({id:genId(), texto:tx});
      atualTexto=[];
    }
    linhas.forEach(l=>{
      const nivel=impClassificarMarcador(l);
      if(nivel && atualTexto.length){
        fechar();
      }
      atualTexto.push(l);
    });
    fechar();
  }
  function impEstruturaValida(blocos){
    if(!blocos || !blocos.length) return false;
    const totalClausulas=blocos.reduce((s,b)=>s+b.clausulas.length,0);
    if(!totalClausulas) return false;
    if(blocos.length===1 && totalClausulas<=1) return false;
    return true;
  }

  /* ----- Tela de Revisão -----
     Reaproveita tal e qual a linguagem visual do editor de blocos real
     (.block/.block-header/.block-name/.block-chev/.block-preview.collapsed/
     .clause-list/.clause/.clause-n/.clause-txt) em vez de inventar um
     componente novo — cabeçalho recolhido por padrão, clica no nome do
     bloco para abrir, clica na cláusula para editar inline. As variáveis
     [CLIENT_NAME]/[TOTAL_VALUE]/etc. aparecem aqui como texto simples; ao
     guardar como Modelo, vão para b.tpl e passam a ser os mesmos "Campos
     Dinâmicos" clicáveis/preenchíveis que já existem no builder — nenhuma
     UI nova precisa ser inventada para isso, só alimentar a que já existe. */
  function revRender(){
    document.getElementById('rev-sub').textContent = impState.fileName;
    const hint=document.getElementById('rev-variaveis');
    if(hint){
      if(impState.variaveisDetectadas>0){
        hint.style.display='block';
        hint.textContent=t('import.variablesDetected').replace('{{n}}', impState.variaveisDetectadas);
      } else hint.style.display='none';
    }
    const wrap=document.getElementById('rev-blocos');
    wrap.innerHTML = impState.blocos.map(revBlocoHtml).join('');
    revBindDragBlocos();
  }
  function revBlocoHtml(b){
    const opcoesBloco = impState.blocos.map(o=>'<option value="'+o.id+'"'+(o.id===b.id?' selected':'')+'>'+escapeHtml(o.titulo||'')+'</option>').join('');
    return '<div class="block" data-bid="'+b.id+'">'+
      '<div class="block-header">'+
        '<span class="handle" data-handle>'+ICON_GRIP+'</span>'+
        '<div class="block-name" onclick="revToggleBlocoPreview(\''+b.id+'\')">'+
        '<input class="revb-title" value="'+escapeHtml(b.titulo||'')+'" onclick="event.stopPropagation()" oninput="revRenomearBloco(\''+b.id+'\',this.value)">'+
        '<svg class="block-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>'+
        '<span class="icon-sm" title="'+t('action.remove')+'" onclick="revRemoverBloco(\''+b.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></span>'+
      '</div>'+
      '<div class="block-preview collapsed" id="revbprev-'+b.id+'">'+
        '<div class="clause-list" id="revclist-'+b.id+'">'+b.clausulas.map((c,idx)=>revClausulaHtml(b,c,idx,opcoesBloco)).join('')+'</div>'+
        '<button class="addclause" onclick="revAdicionarClausula(\''+b.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'+t('import.addClause')+'</button>'+
      '</div></div>';
  }
  function revClausulaHtml(b,c,idx,opcoesBloco){
    return '<div class="clause" id="revcl-'+b.id+'-'+c.id+'" onclick="revEditarClausula(\''+b.id+'\',\''+c.id+'\')">'+
      '<span class="clause-n">'+(idx+1)+'</span>'+
      '<div class="clause-txt">'+escapeHtml(c.texto)+'</div>'+
      '<div class="revc-actions" onclick="event.stopPropagation()">'+
      '<select class="revc-move" onchange="revMoverClausula(\''+b.id+'\',\''+c.id+'\',this.value)">'+opcoesBloco+'</select>'+
      '<span class="revc-rm" title="'+t('action.remove')+'" onclick="revRemoverClausula(\''+b.id+'\',\''+c.id+'\')">✕</span>'+
      '</div></div>';
  }
  function revAcharBloco(bid){ return impState.blocos.find(b=>b.id===bid); }
  function revToggleBlocoPreview(bid){
    const prev=document.getElementById('revbprev-'+bid);
    if(prev) prev.classList.toggle('collapsed');
  }
  function revRenomearBloco(bid, valor){ const b=revAcharBloco(bid); if(b){ b.titulo=valor; } }
  // Edição inline por cláusula — clicar na cláusula entra em edição (mesmo
  // padrão de editarClausula/guardarClausula do builder real).
  function revEditarClausula(bid, cid){
    const b=revAcharBloco(bid); if(!b) return;
    const c=b.clausulas.find(x=>x.id===cid); if(!c) return;
    const el=document.getElementById('revcl-'+bid+'-'+cid);
    if(!el || el.querySelector('textarea')) return;
    const idx=b.clausulas.indexOf(c);
    el.classList.add('editing');
    el.removeAttribute('onclick');
    el.innerHTML='<span class="clause-n">'+(idx+1)+'</span>'+
      '<div class="clause-edit"><textarea class="block-textarea" id="revcedit-'+bid+'-'+cid+'">'+escapeHtml(c.texto)+'</textarea>'+
      '<div class="block-edit-actions"><button class="btn soft" onclick="event.stopPropagation();revRender()">'+t('action.cancel')+'</button>'+
      '<button class="btn primary" onclick="event.stopPropagation();revGuardarClausula(\''+bid+'\',\''+cid+'\')">'+t('action.save')+'</button></div></div>';
    const ta=document.getElementById('revcedit-'+bid+'-'+cid); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function revGuardarClausula(bid, cid){
    const b=revAcharBloco(bid); if(!b) return;
    const c=b.clausulas.find(x=>x.id===cid); if(!c) return;
    c.texto=document.getElementById('revcedit-'+bid+'-'+cid).value;
    revRender();
  }
  function revRemoverClausula(bid, cid){
    const b=revAcharBloco(bid); if(!b) return;
    b.clausulas=b.clausulas.filter(c=>c.id!==cid);
    revRender();
  }
  function revAdicionarClausula(bid){
    const b=revAcharBloco(bid); if(!b) return;
    b.clausulas.push({id:genId(), texto:''});
    revRender();
    const prev=document.getElementById('revbprev-'+bid); if(prev) prev.classList.remove('collapsed');
    revEditarClausula(bid, b.clausulas[b.clausulas.length-1].id);
  }
  function revMoverClausula(bidOrigem, cid, bidDestino){
    if(bidOrigem===bidDestino) return;
    const origem=revAcharBloco(bidOrigem), destino=revAcharBloco(bidDestino);
    if(!origem||!destino) return;
    const idx=origem.clausulas.findIndex(c=>c.id===cid);
    if(idx<0) return;
    const [c]=origem.clausulas.splice(idx,1);
    destino.clausulas.push(c);
    revRender();
  }
  function revRemoverBloco(bid){
    if(impState.blocos.length<=1){ showToast(t('import.needOneBlock')); return; }
    impState.blocos=impState.blocos.filter(b=>b.id!==bid);
    revRender();
  }
  function revAdicionarBloco(){
    impState.blocos.push({id:genId(), titulo:t('import.newBlockName'), clausulas:[]});
    revRender();
  }
  function revBindDragBlocos(){
    const list=document.getElementById('rev-blocos');
    if(list.dataset.dragBound) return;
    list.dataset.dragBound='1';
    let dragEl=null;
    list.addEventListener('pointerdown', e=>{
      const handle=e.target.closest('[data-handle]');
      if(!handle) return;
      dragEl=handle.closest('.block');
      dragEl.classList.add('dragging');
      try{ handle.setPointerCapture(e.pointerId); }catch(err){}
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
    function onMove(e){
      if(!dragEl) return;
      const siblings=[...list.querySelectorAll('.block')].filter(b=>b!==dragEl);
      for(const sib of siblings){
        const r=sib.getBoundingClientRect();
        if(e.clientY>r.top && e.clientY<r.bottom){
          if(e.clientY < r.top + r.height/2){ list.insertBefore(dragEl, sib); }
          else { list.insertBefore(dragEl, sib.nextSibling); }
        }
      }
    }
    function onUp(){
      if(dragEl) dragEl.classList.remove('dragging');
      dragEl=null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      const ids=[...list.querySelectorAll('.block')].map(el=>el.dataset.bid);
      impState.blocos.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
    }
  }
  function cancelarRevisaoImportacao(){
    impState=null;
    go('importar-arquivo');
  }
  function abrirGuardarModeloImportado(){
    openInfo(t('builder.saveTemplateTitle'), `
      <div class="field"><label data-t="field.name">Nome</label><input id="modelo-importado-nome" placeholder="${t('builder.templateNamePlaceholder')}"></div>
      <button class="btn primary u-w-full" onclick="confirmarGuardarModeloImportado()">${t('action.save')}</button>`);
  }
  // b.tpl guarda o texto com [PLACEHOLDERS]; b.customText é a versão
  // resolvida (aqui, sem valores ainda, então igual ao tpl) — mesmo par
  // usado em todo o resto do builder para que os Campos Dinâmicos (painel
  // no topo do editor) reconheçam as variáveis detectadas na importação
  // automaticamente, sem precisar de nenhuma UI nova.
  function confirmarGuardarModeloImportado(){
    { const limite=LIMITE_MODELOS_PLANO[perfilData.plano||'Free'];
      if(Object.keys(modelosContratoData).length>=limite){ abrirLimitePlanoModal('plan.limit.templatesTitle','plan.limit.templatesBody',limite); return; } }
    const nomeEl=document.getElementById('modelo-importado-nome');
    const nome=nomeEl.value.trim();
    if(!nome){ nomeEl.focus(); return; }
    const blocks = impState.blocos.map(b=>{
      const tpl = b.clausulas.map(c=>c.texto).filter(Boolean).join('\n\n');
      return { id: genId(), key:null, name: b.titulo || t('import.newBlockName'),
        tpl, customText: LegalLibrary.resolveClauseText(tpl, {}), on:true };
    }).filter(b=>b.customText);
    const id='mc'+Date.now();
    modelosContratoData[id]={ id, nome, blocks, criadoEm:new Date().toISOString(), usos:0, origemImportacao:impState.fileName };
    saveModelosContratoData();
    closeInfo();
    impState=null;
    showToast(t('toast.savedAsTemplate'));
    go('bibliotecas');
  }

  function gerarLinkDoBuilder(){
    if(!builderContext) return;
    openJob(builderContext);
    abrirDefinirPrazoPortal(builderContext);
  }
  /* ===== Regra de negócio: contrato ↔ trabalho =====
     Um contrato já enviado ou assinado deixa de poder ser editado.
     Esta regra estava duplicada de forma idêntica em 3 funções; passa a
     existir num único ponto, reutilizado por todas. */
  function contratoBloqueadoParaEdicao(job){
    return job.contract.status==='enviado' || job.contract.status==='assinado';
  }
  function renderBuilder(){
    const job=getBuilderJob();
    const isJob=!!builderContext;
    const locked = isJob && contratoBloqueadoParaEdicao(job);
    document.getElementById('builder-title').textContent= isJob? (t('job.contract')+' — '+job.client) : t('builder.title');
    document.getElementById('builder-sub').textContent= isJob? (job.typeLabel+' · '+(job.date||t('wizard.date'))) : (builderColabCtx ? (builderModeloOrigem&&builderModeloOrigem.nome||'') : (builderModeloOrigem ? (builderModeloOrigem.client ? t('builder.basedOnPrefix')+builderModeloOrigem.client : builderModeloOrigem.nome||t('builder.newTemplateSub')) : t('builder.newTemplateSub')));
    document.getElementById('builder-back-label').textContent= isJob? job.client : (builderColabCtx ? t('collab.contractsSection') : t('nav.jobs'));
    renderBuilderCampos(job, locked);
    document.getElementById('builder-tab-varcount').textContent= builderCamposDinamicos(job).length;
    document.getElementById('blocklist').innerHTML= job.contract.blocks.map(b=>blockCardHtml(job,b,locked)).join('');
    document.getElementById('addblock-btn').style.display= locked ? 'none' : 'flex';
    const saveTplBtn=document.getElementById('save-tpl-btn');
    saveTplBtn.style.display= locked ? 'none' : 'block';
    saveTplBtn.textContent= builderColabCtx ? t('wizard.continue') : t('action.save');
    document.getElementById('builder-locked-notice').style.display= locked ? 'flex' : 'none';
    document.getElementById('builder-progress').style.display= (isJob && job.contract.status==='rascunho') ? 'block':'none';
  }
  /* Estrutura (blocos/cláusulas) x Variáveis (campos dinâmicos) — duas abas
     em vez de tudo empilhado na mesma tela. Reabre sempre em "Estrutura"
     (abrirBuilder chama isto), nunca preserva a aba anterior entre
     contratos diferentes. */
  let builderTabAtual='estrutura';
  function mudarBuilderTab(tab){
    builderTabAtual=tab;
    document.getElementById('builder-tab-btn-estrutura').classList.toggle('on', tab==='estrutura');
    document.getElementById('builder-tab-btn-variaveis').classList.toggle('on', tab==='variaveis');
    document.getElementById('builder-tab-content-estrutura').style.display = tab==='estrutura' ? 'block' : 'none';
    document.getElementById('builder-tab-content-variaveis').style.display = tab==='variaveis' ? 'block' : 'none';
  }
  /* Tutorial deixou de ficar sempre visível no topo do editor — agora é um
     modal (openInfo) sob demanda, reaproveitando as 3 dicas que antes
     ficavam fixas na tela principal. */
  function abrirTutorialBuilder(){
    const html=
      '<div class="builder-legend u-m-0">'+
        '<span class="bl-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"/></svg><span>'+t('builder.legendReorder')+'</span></span>'+
        '<span class="bl-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>'+t('builder.legendEdit')+'</span></span>'+
        '<span class="bl-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg><span>'+t('builder.legendToggle')+'</span></span>'+
        '<span class="bl-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M12 4v16m-8-8h16"/></svg><span>'+t('builder.legendMenu')+'</span></span>'+
        '<span class="bl-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3M15 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3"/></svg><span>'+t('builder.legendVariables')+'</span></span>'+
      '</div>';
    openInfo(t('builder.tutorialTitle'), html);
  }
  /* Divide o texto de um bloco em cláusulas individuais (separadas por linha
     em branco) — usado para exibir cada cláusula numerada e editável. */
  function blocoClausulas(job,b){
    const txt=blockText(job,b)||'';
    const arr=txt.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
    return arr.length?arr:[txt];
  }
  /* Renderiza o texto de UMA cláusula (a partir do tpl, que ainda tem os
     [PLACEHOLDERS]) destacando cada campo dinâmico como uma tag clicável —
     mostra o valor já preenchido (ou o nome do campo entre colchetes, se
     vazio) e abre o popup Aplicar/Aplicar a Todos ao tocar. Escapa o resto
     do texto manualmente porque só os trechos que caem fora dos
     placeholders vêm direto da string crua do contrato. */
  function clauseTextComTagsHtml(bid, clauseIdx, tplTexto){
    const re=/\[([A-Z0-9_]+)\]/g;
    const fv=getBuilderFieldValues();
    const contadores={};
    let out=''; let lastIndex=0; let m;
    while((m=re.exec(tplTexto))){
      out += escapeHtml(tplTexto.slice(lastIndex, m.index));
      const campo=m[1];
      const ocorrencia = contadores[campo]==null ? 0 : contadores[campo];
      contadores[campo]=ocorrencia+1;
      const valor = fv[campo];
      const texto = valor!=null ? escapeHtml(valor) : '['+escapeHtml(dynFieldLabel(campo))+']';
      out += '<span class="dynf-tag" onclick="event.stopPropagation();abrirPopupOcorrenciaCampo(\''+bid+'\','+clauseIdx+',\''+campo+'\','+ocorrencia+')">'+texto+'</span>';
      lastIndex=re.lastIndex;
    }
    out += escapeHtml(tplTexto.slice(lastIndex));
    return out;
  }
  const ICON_KEBAB='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
  function clauseListInnerHtml(job,b,editavel){
    const clausesTxt=blocoClausulas(job,b);
    const clausesTpl = b.tpl!=null ? b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean) : null;
    const usarTags = clausesTpl && clausesTpl.length===clausesTxt.length;
    return clausesTxt.map((txt,idx)=>
      '<div class="clause" id="cl-'+b.id+'-'+idx+'"'+(editavel?' onclick="editarClausula(\''+b.id+'\','+idx+')"':'')+'>'+
        '<span class="clause-n">'+(idx+1)+'</span>'+
        '<div class="clause-txt">'+(usarTags ? clauseTextComTagsHtml(b.id, idx, clausesTpl[idx]) : escapeHtml(txt))+'</div>'+
        (editavel?'<button type="button" class="clause-kebab" onclick="event.stopPropagation();abrirMenuClausula(\''+b.id+'\','+idx+')">'+ICON_KEBAB+'</button>':'')+
      '</div>'
    ).join('');
  }
  /* Menu de ações por cláusula (editar/duplicar/mover/excluir) — reaproveita
     o mesmo openInfo usado no resto do app em vez de um dropdown próprio. */
  function abrirMenuClausula(bid, idx){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(!b) return;
    const total=blocoClausulas(job,b).length;
    const item=(label,onclick,disabled)=>'<div class="pick-row'+(disabled?' disabled':'')+'" '+(disabled?'':'onclick="'+onclick+'"')+'><div><div class="nm">'+label+'</div></div></div>';
    const html=
      item(t('builder.clauseEdit'), "closeInfo();editarClausula('"+bid+"',"+idx+")")+
      item(t('builder.clauseDuplicate'), "duplicarClausulaBuilder('"+bid+"',"+idx+")")+
      item(t('builder.clauseMoveUp'), "moverClausulaBuilder('"+bid+"',"+idx+",-1)", idx===0)+
      item(t('builder.clauseMoveDown'), "moverClausulaBuilder('"+bid+"',"+idx+",1)", idx===total-1)+
      item(t('builder.clauseDelete'), "excluirClausulaBuilder('"+bid+"',"+idx+")");
    openInfo(t('builder.clauseMenuTitle')+' '+(idx+1), html);
  }
  /* As 3 ações abaixo mantêm customText e tpl sempre com o MESMO número de
     itens e no mesmo índice — o mesmo cuidado já usado em guardarClausula —
     senão o rastreamento de tags de campo dinâmico por cláusula (usarTags em
     clauseListInnerHtml) desalinha. */
  function duplicarClausulaBuilder(bid, idx){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    closeInfo();
    if(!b) return;
    const txtArr=blocoClausulas(job,b); txtArr.splice(idx+1,0,txtArr[idx]); b.customText=txtArr.join('\n\n');
    if(b.tpl){ const tp=b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean); if(tp.length===txtArr.length-1){ tp.splice(idx+1,0,tp[idx]); b.tpl=tp.join('\n\n'); } else { b.tpl=null; } }
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
    showToast(t('toast.blockTextUpdated'));
  }
  function moverClausulaBuilder(bid, idx, direcao){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    closeInfo();
    if(!b) return;
    const novoIdx=idx+direcao;
    const txtArr=blocoClausulas(job,b);
    if(novoIdx<0 || novoIdx>=txtArr.length) return;
    [txtArr[idx],txtArr[novoIdx]]=[txtArr[novoIdx],txtArr[idx]]; b.customText=txtArr.join('\n\n');
    if(b.tpl){ const tp=b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean); if(tp.length===txtArr.length){ [tp[idx],tp[novoIdx]]=[tp[novoIdx],tp[idx]]; b.tpl=tp.join('\n\n'); } else { b.tpl=null; } }
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
  }
  function excluirClausulaBuilder(bid, idx){
    closeInfo();
    openInfo(t('builder.clauseDelete'), '<p class="u-label-soft u-mb-14">'+t('builder.clauseDeleteConfirm')+'</p><button class="btn primary" style="width:100%;background:var(--late);border-color:var(--late)" onclick="confirmarExcluirClausulaBuilder(\''+bid+'\','+idx+')">'+t('builder.clauseDelete')+'</button>');
  }
  function confirmarExcluirClausulaBuilder(bid, idx){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    closeInfo();
    if(!b) return;
    const txtArr=blocoClausulas(job,b);
    if(txtArr.length<=1) return;
    txtArr.splice(idx,1); b.customText=txtArr.join('\n\n');
    if(b.tpl){ const tp=b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean); if(tp.length===txtArr.length+1){ tp.splice(idx,1); b.tpl=tp.join('\n\n'); } else { b.tpl=null; } }
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
    showToast(t('toast.blockTextUpdated'));
  }
  /* Popup de edição de UMA ocorrência de campo dinâmico dentro do texto —
     "Aplicar" muda só esta ocorrência (congela o valor nesse ponto exato do
     tpl, independente do resto); "Aplicar a Todos" usa o mesmo mecanismo
     global já existente (setBuilderCampo), que já resolve todas as
     ocorrências dessa tag em todos os blocos do contrato. */
  function abrirPopupOcorrenciaCampo(bid, clauseIdx, campo, ocorrencia){
    const fv=getBuilderFieldValues();
    const valorAtual=fv[campo]||'';
    const html='<div class="field"><input id="dynf-tag-input" value="'+escapeHtml(valorAtual)+'" placeholder="'+t('builder.dynFieldPlaceholder')+'" autocomplete="off"></div>'+
      '<button class="btn primary u-w-full u-mt-6" onclick="aplicarPopupOcorrenciaCampo(\''+bid+'\','+clauseIdx+',\''+campo+'\','+ocorrencia+',false)">'+t('builder.dynFieldApply')+'</button>'+
      '<button class="btn soft u-w-full u-mt-8" onclick="aplicarPopupOcorrenciaCampo(\''+bid+'\','+clauseIdx+',\''+campo+'\','+ocorrencia+',true)">'+t('builder.dynFieldApplyAll')+'</button>';
    openInfo(dynFieldLabel(campo), html);
    setTimeout(()=>{ const el=document.getElementById('dynf-tag-input'); if(el){ el.focus(); el.select(); } },0);
  }
  function aplicarPopupOcorrenciaCampo(bid, clauseIdx, campo, ocorrencia, todasOcorrencias){
    const valor=document.getElementById('dynf-tag-input').value||'';
    if(todasOcorrencias){
      setBuilderCampo(campo, valor);
      closeInfo();
      renderBuilderCampos(getBuilderJob(), false);
    } else {
      aplicarValorOcorrencia(bid, clauseIdx, campo, ocorrencia, valor);
    }
  }
  /* "Congela" só esta ocorrência do campo: substitui o [PLACEHOLDER] exato
     (contando ocorrências dentro da própria cláusula) pelo valor literal no
     tpl do bloco — as demais ocorrências da mesma tag, neste ou noutros
     blocos, continuam ligadas ao valor global e não são afetadas. */
  function aplicarValorOcorrencia(bid, clauseIdx, campo, ocorrencia, valor){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(!b || b.tpl==null) return;
    const partes=b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
    const alvo=partes[clauseIdx];
    if(alvo==null) return;
    const marcador='['+campo+']';
    let idx=-1, count=-1, searchFrom=0;
    while(true){
      idx=alvo.indexOf(marcador, searchFrom);
      if(idx===-1) break;
      count++;
      if(count===ocorrencia) break;
      searchFrom=idx+marcador.length;
    }
    if(idx===-1) return;
    partes[clauseIdx] = alvo.slice(0,idx) + valor + alvo.slice(idx+marcador.length);
    b.tpl = partes.join('\n\n');
    const fv=getBuilderFieldValues();
    b.customText = LegalLibrary.resolveClauseText(b.tpl, fv);
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    closeInfo();
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
    renderBuilderCampos(job, builderContext && contratoBloqueadoParaEdicao(job));
  }
  /* O handle de arraste e o toggle ficam só na linha do cabeçalho (flex row);
     a lista de cláusulas é filha direta do .block, sem colunas ao lado —
     antes, handle+toggle formavam duas colunas que corriam a ALTURA TODA do
     bloco (por serem flex-items ao lado de .block-main), deixando uma faixa
     vazia enorme à esquerda/direita de cada cláusula mesmo só ocupando a
     altura do cabeçalho. Reservar esse espaço só onde ele é usado devolve
     a largura total pro texto. */
  function blockCardHtml(job,b,locked){
    const editavel = !locked && !(builderContext && contratoBloqueadoParaEdicao(job));
    const addBtn = !locked ? '<button class="addclause" onclick="event.stopPropagation();abrirAdicionarClausulas(\''+b.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'+t('library.addClausesBtn')+'</button>' : '';
    return '<div class="block'+(b.on?'':' off')+(locked?' locked':'')+'" data-bid="'+b.id+'">'+
      '<div class="block-header">'+
        (locked? '<div class="handle-spacer"></div>' : '<div class="handle" data-handle>'+ICON_GRIP+'</div>')+
        '<div class="block-name" onclick="toggleBlocoPreview(\''+b.id+'\')">'+
        '<div class="block-name-main"><div class="bn-row">'+blockIcon(b.name||b.key||'')+'<span class="bn-title">'+escapeHtml(blockName(b))+'</span></div><span class="block-subtitle">'+escapeHtml(blockSubtitle(b))+'</span></div>'+
        '<svg class="block-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>'+
        '<div class="toggle'+(b.on?' on':'')+(locked?' disabled':'')+'"'+(locked?'':' onclick="toggleBloco(\''+b.id+'\',this)"')+'><div class="kn"></div></div>'+
      '</div>'+
      '<div class="block-preview collapsed" id="bprev-'+b.id+'">'+
        '<div class="clause-list" id="clist-'+b.id+'">'+clauseListInnerHtml(job,b,editavel)+'</div>'+addBtn+
      '</div></div>';
  }
  function toggleBlocoPreview(bid){
    const prev=document.getElementById('bprev-'+bid);
    if(prev) prev.classList.toggle('collapsed');
  }
  /* Edição inline por cláusula (sem botão de lápis — clicar na cláusula
     entra em edição). Mantém customText e tpl consistentes por índice. */
  function editarClausula(bid, idx){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(!b || (builderContext && contratoBloqueadoParaEdicao(job))) return;
    const el=document.getElementById('cl-'+bid+'-'+idx);
    if(!el || el.querySelector('textarea')) return;
    const txt=blocoClausulas(job,b)[idx]||'';
    el.classList.add('editing');
    el.removeAttribute('onclick');
    el.innerHTML='<span class="clause-n">'+(idx+1)+'</span>'+
      '<div class="clause-edit"><textarea class="block-textarea" id="cedit-'+bid+'-'+idx+'">'+escapeHtml(txt)+'</textarea>'+
      '<div class="block-edit-actions"><button class="btn soft" onclick="event.stopPropagation();cancelarEdicaoBloco(\''+bid+'\')">'+t('action.cancel')+'</button>'+
      '<button class="btn primary" onclick="event.stopPropagation();guardarClausula(\''+bid+'\','+idx+')">'+t('action.save')+'</button></div></div>';
    const ta=document.getElementById('cedit-'+bid+'-'+idx); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function guardarClausula(bid, idx){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(!b) return;
    const novo=document.getElementById('cedit-'+bid+'-'+idx).value;
    const cur=blocoClausulas(job,b); cur[idx]=novo; b.customText=cur.join('\n\n');
    if(b.tpl){ const tp=b.tpl.split(/\n{2,}/); if(tp.length===cur.length){ tp[idx]=novo; b.tpl=tp.join('\n\n'); } else { b.tpl=b.customText; } }
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
    showToast(t('toast.blockTextUpdated'));
  }
  /* ===== Campos dinâmicos — substituição em massa =====
     Reúne todos os [PLACEHOLDERS] presentes no tpl de qualquer bloco do
     contrato; substituir um valor aqui aplica em todas as ocorrências, em
     todos os blocos (re-resolve o tpl). Vindo da criação por projeto, os
     valores já preenchidos aparecem na lista e continuam editáveis. */
  const DYN_FIELD_LABELS={
    CLIENT_NAME:{pt:'Contratante',en:'Client',es:'Contratante'},
    CLIENT_ADDRESS:{pt:'Endereço do contratante',en:'Client address',es:'Dirección del contratante'},
    PROVIDER_NAME:{pt:'Prestador',en:'Provider',es:'Prestador'},
    PROVIDER_ADDRESS:{pt:'Endereço do prestador',en:'Provider address',es:'Dirección del prestador'},
    PROJECT_NAME:{pt:'Projeto',en:'Project',es:'Proyecto'},
    TOTAL_VALUE:{pt:'Valor total',en:'Total value',es:'Valor total'},
    START_DATE:{pt:'Data de início',en:'Start date',es:'Fecha de inicio'},
    DELIVERY_DATE:{pt:'Data de entrega',en:'Delivery date',es:'Fecha de entrega'},
    LOCATION:{pt:'Local',en:'Location',es:'Lugar'},
    DATE:{pt:'Data',en:'Date',es:'Fecha'},
    CLIENT_EMAIL:{pt:'Email do contratante',en:'Client email',es:'Email del contratante'},
    CLIENT_DOCUMENT:{pt:'Documento do contratante',en:'Client document',es:'Documento del contratante'},
    CLIENT_PHONE:{pt:'Telefone do contratante',en:'Client phone',es:'Teléfono del contratante'},
    COMPLETION_DATE:{pt:'Data de conclusão',en:'Completion date',es:'Fecha de finalización'},
    PAYMENT_METHOD:{pt:'Forma de pagamento',en:'Payment method',es:'Forma de pago'},
    LATE_PAYMENT_RATE:{pt:'Multa por atraso',en:'Late payment penalty',es:'Multa por atraso'},
    DEPOSIT_AMOUNT:{pt:'Primeiro pagamento',en:'Deposit',es:'Depósito'},
    APPLICABLE_LAW:{pt:'Legislação aplicável',en:'Applicable law',es:'Legislación aplicable'},
    DISPUTE_RESOLUTION_MECHANISM:{pt:'Resolução de litígios',en:'Dispute resolution',es:'Resolución de litigios'},
    SIGNATURE_DATE:{pt:'Data de assinatura',en:'Signature date',es:'Fecha de firma'},
    PROPERTY_ADDRESS:{pt:'Local do projeto',en:'Property address',es:'Dirección del inmueble'},
    PROJECT_SITE_ADDRESS:{pt:'Local da obra',en:'Site address',es:'Dirección de la obra'},
    PREMISES_ADDRESS:{pt:'Local do imóvel',en:'Premises address',es:'Dirección del local'},
    ORIGIN_ADDRESS:{pt:'Endereço de origem',en:'Origin address',es:'Dirección de origen'},
    DESTINATION_ADDRESS:{pt:'Endereço de destino',en:'Destination address',es:'Dirección de destino'},
    PROJECT_PLANS_REFERENCE:{pt:'Projeto/plantas',en:'Plans reference',es:'Referencia de planos'},
    WARRANTY_PERIOD:{pt:'Garantia',en:'Warranty period',es:'Garantía'},
    PLANT_WARRANTY_PERIOD:{pt:'Garantia das plantas',en:'Plant warranty',es:'Garantía de las plantas'},
    PAYMENT_MILESTONES:{pt:'Cronograma de pagamento',en:'Payment schedule',es:'Cronograma de pago'},
    MATERIALS_ALLOWANCE:{pt:'Verba de materiais',en:'Materials allowance',es:'Presupuesto de materiales'},
    MATERIALS_MARKUP_RATE:{pt:'Margem sobre materiais',en:'Materials markup',es:'Margen de materiales'},
    PERMIT_RESPONSIBILITY:{pt:'Responsável pelas licenças',en:'Permit responsibility',es:'Responsable de permisos'},
    DELAY_PENALTY_RATE:{pt:'Multa por atraso (obra)',en:'Delay penalty rate',es:'Multa por retraso'},
    DELAY_PENALTY_CAP:{pt:'Limite da multa',en:'Delay penalty cap',es:'Límite de la multa'},
    PERFORMANCE_BOND_AMOUNT:{pt:'Caução de performance',en:'Performance bond',es:'Fianza de cumplimiento'},
    CANCELLATION_NOTICE_PERIOD:{pt:'Aviso de cancelamento',en:'Cancellation notice',es:'Aviso de cancelación'},
    CANCELLATION_FEE:{pt:'Taxa de cancelamento',en:'Cancellation fee',es:'Tarifa de cancelación'},
    TERMINATION_NOTICE_PERIOD:{pt:'Aviso de rescisão',en:'Termination notice',es:'Aviso de rescisión'},
    DAMAGE_REPORTING_PERIOD:{pt:'Prazo p/ reportar danos',en:'Damage reporting period',es:'Plazo para reportar daños'},
    ACCESS_METHOD:{pt:'Forma de acesso',en:'Access method',es:'Forma de acceso'},
    SERVICE_FREQUENCY:{pt:'Frequência',en:'Frequency',es:'Frecuencia'},
    SERVICE_DAY_AND_TIME:{pt:'Dia e horário',en:'Day & time',es:'Día y horario'},
    SERVICE_HOURS:{pt:'Horário do serviço',en:'Service hours',es:'Horario del servicio'},
    SEASONAL_SCHEDULE:{pt:'Calendário sazonal',en:'Seasonal schedule',es:'Calendario estacional'},
    CLEANING_TASKS_INCLUDED:{pt:'Tarefas incluídas',en:'Tasks included',es:'Tareas incluidas'},
    LANDSCAPING_SERVICES_INCLUDED:{pt:'Serviços',en:'Services',es:'Servicios'},
    SURFACES_TO_BE_PAINTED:{pt:'Superfícies',en:'Surfaces',es:'Superficies'},
    PAINT_BRAND_AND_TYPE:{pt:'Marca e tipo de tinta',en:'Paint brand & type',es:'Marca y tipo de pintura'},
    COLOR_SPECIFICATIONS:{pt:'Cores',en:'Colors',es:'Colores'},
    RENOVATION_SCOPE:{pt:'Escopo da obra',en:'Renovation scope',es:'Alcance de la renovación'},
    CONSTRUCTION_SCOPE:{pt:'Escopo da obra',en:'Construction scope',es:'Alcance de la obra'},
    MOVING_DATE:{pt:'Data da mudança',en:'Moving date',es:'Fecha de la mudanza'},
    INVENTORY_LIST_REFERENCE:{pt:'Inventário',en:'Inventory list',es:'Inventario'},
    PACKING_SERVICES_INCLUDED:{pt:'Serviço de embalagem',en:'Packing services',es:'Servicio de embalaje'},
    INSURANCE_COVERAGE_LEVEL:{pt:'Nível de cobertura',en:'Coverage level',es:'Nivel de cobertura'},
    DECLARED_VALUE:{pt:'Valor declarado',en:'Declared value',es:'Valor declarado'},
    STORAGE_DURATION:{pt:'Duração do armazenamento',en:'Storage duration',es:'Duración del almacenamiento'},
    STORAGE_FEE:{pt:'Taxa de armazenamento',en:'Storage fee',es:'Tarifa de almacenamiento'},
    CLAIM_NOTICE_PERIOD:{pt:'Prazo p/ reclamações',en:'Claim notice period',es:'Plazo de reclamación'},
    REPAIR_TASKS_DESCRIPTION:{pt:'Tarefas',en:'Tasks',es:'Tareas'},
    ESTIMATED_COST:{pt:'Orçamento estimado',en:'Estimated cost',es:'Costo estimado'},
    /* Campos do cliente para a Assinatura Inteligente — nunca pedidos ao
       criador do contrato, só ao cliente no formulário antes de assinar
       (ver camposClienteContrato/renderFormularioClienteHtml). */
    CLIENT_TAX_ID:{pt:'CPF/NIF do contratante',en:'Client tax ID',es:'CPF/NIF del contratante'},
    CLIENT_RG:{pt:'RG do contratante',en:'Client ID number',es:'DNI del contratante'},
    CLIENT_CITY:{pt:'Cidade do contratante',en:'Client city',es:'Ciudad del contratante'},
    CLIENT_STATE:{pt:'Estado do contratante',en:'Client state',es:'Estado del contratante'},
    CLIENT_ZIP:{pt:'CEP do contratante',en:'Client zip code',es:'Código postal del contratante'},
    CLIENT_NATIONALITY:{pt:'Nacionalidade do contratante',en:'Client nationality',es:'Nacionalidad del contratante'},
    CLIENT_BIRTH_DATE:{pt:'Data de nascimento do contratante',en:'Client date of birth',es:'Fecha de nacimiento del contratante'},
    CLIENT_COMPANY:{pt:'Empresa do contratante',en:'Client company',es:'Empresa del contratante'},
    CLIENT_JOB_TITLE:{pt:'Cargo do contratante',en:'Client job title',es:'Cargo del contratante'}
  };
  function dynFieldLabel(campo){
    const m=DYN_FIELD_LABELS[campo];
    if(m) return m[LANG]||m.en||campo;
    return bibTraduzirCampo(campo);
  }
  /* Campos que não fazem sentido durante a criação — a data de assinatura só
     existe depois de o contrato ser efetivamente assinado pelas partes. */
  const DYN_FIELD_EXCLUIR=new Set(['SIGNATURE_DATE','SIGNED_DATE','DATE_SIGNED']);
  function builderCamposDinamicos(job){
    const ordem=[]; const vistos=new Set(); const re=/\[([A-Z0-9_]+)\]/g;
    (job.contract.blocks||[]).forEach(b=>{
      if(!b.tpl) return;
      let m; while((m=re.exec(b.tpl))){ if(!DYN_FIELD_EXCLUIR.has(m[1]) && !vistos.has(m[1])){ vistos.add(m[1]); ordem.push(m[1]); } }
    });
    return ordem;
  }
  /* ===== Assinatura Inteligente de Contratos =====
     Variáveis [CLIENT_*] pertencem ao cliente, nunca ao criador do contrato —
     este bloco intercepta o fluxo ANTES da assinatura (Portal do Cliente
     público e a simulação "ver como cliente" dentro da app) e pede só essas
     variáveis diretamente a quem vai assinar, pré-preenchidas a partir do
     registo do cliente (clientesData) sempre que já existirem. Só depois de
     todas preenchidas é que o contrato final (com as variáveis já
     substituídas) é mostrado e o botão de assinar aparece. */
  const CLIENT_FIELD_CLIENTE_PROP={
    CLIENT_NAME:'nome', CLIENT_EMAIL:'email', CLIENT_PHONE:'telefone', CLIENT_DOCUMENT:'documento',
    CLIENT_TAX_ID:'documento', CLIENT_RG:'rg', CLIENT_ADDRESS:'endereco', CLIENT_CITY:'cidade',
    CLIENT_STATE:'estado', CLIENT_ZIP:'cep', CLIENT_NATIONALITY:'nacionalidade',
    CLIENT_BIRTH_DATE:'dataNascimento', CLIENT_COMPANY:'empresa', CLIENT_JOB_TITLE:'cargo'
  };
  function camposClienteContrato(job){
    return builderCamposDinamicos(job).filter(f=>f.startsWith('CLIENT_'));
  }
  function clienteRegistroDoJob(job){
    return Object.values(clientesData).find(c=>c.nome===job.client) || null;
  }
  /* Devolve o valor já disponível pra um campo CLIENT_* — na ordem: o que já
     foi confirmado neste contrato, depois o registo do cliente, depois os
     dados soltos do próprio job (nome/email) — nunca pede de novo algo que
     já se sabe. */
  function valorPreenchidoCampoCliente(job, campo){
    const fv=(job.contract&&job.contract.fieldValues)||{};
    if(fv[campo]) return fv[campo];
    const prop=CLIENT_FIELD_CLIENTE_PROP[campo];
    const cli=clienteRegistroDoJob(job);
    if(cli && prop && cli[prop]) return cli[prop];
    if(campo==='CLIENT_NAME' && job.client) return job.client;
    if(campo==='CLIENT_EMAIL' && job.email) return job.email;
    return '';
  }
  function camposClientePendentes(job){
    return camposClienteContrato(job).filter(c=>!valorPreenchidoCampoCliente(job,c));
  }
  /* HTML do formulário — um input por campo em falta, já com o valor
     conhecido preenchido (só falta confirmar ou editar); usado tanto pelo
     Portal do Cliente público (ppcf-) como pela simulação "ver como
     cliente" dentro da app (cwcf-). */
  function renderFormularioClienteHtml(job, idPrefix){
    const pendentes=camposClientePendentes(job);
    let html='<div class="csec-label">'+t('portal.clientFormTitle')+'</div>'+
      '<p style="font-size:12.5px;color:var(--neutral);margin:-6px 2px 14px">'+t('portal.clientFormHint')+'</p>';
    pendentes.forEach(campo=>{
      const valor=valorPreenchidoCampoCliente(job,campo);
      html+='<div class="field"><label>'+escapeHtml(dynFieldLabel(campo))+'</label>'+
        '<input id="'+idPrefix+campo+'" value="'+escapeHtml(valor)+'"></div>';
    });
    return html;
  }
  /* Lê o formulário, valida que nada ficou em falta, escreve cada valor no
     fieldValues do contrato (mesmo mecanismo de setBuilderCampo, sem
     depender do contexto do Builder) e RE-RESOLVE todas as cláusulas — só
     depois disso o contrato final (sem nenhum [CLIENT_*] sobrando) fica
     pronto para ser mostrado e assinado. Também grava os valores no
     registo do cliente (clientesData), para que da próxima vez o
     formulário já venha pré-preenchido. Devolve false se algo ficou vazio. */
  function confirmarFormularioCliente(job, idPrefix){
    const pendentes=camposClientePendentes(job);
    const valores={};
    for(const campo of pendentes){
      const el=document.getElementById(idPrefix+campo);
      const valor=(el?el.value:'').trim();
      if(!valor) return false;
      valores[campo]=valor;
    }
    if(!job.contract.fieldValues) job.contract.fieldValues={};
    const fv=job.contract.fieldValues;
    const cli=clienteRegistroDoJob(job);
    Object.keys(valores).forEach(campo=>{
      fv[campo]=valores[campo];
      const prop=CLIENT_FIELD_CLIENTE_PROP[campo];
      if(prop && cli) cli[prop]=valores[campo];
    });
    if(cli) saveClientesData();
    (job.contract.blocks||[]).forEach(b=>{ if(b.tpl) b.customText=LegalLibrary.resolveClauseText(b.tpl, fv); });
    return true;
  }
  /* Agrupamento das Variáveis por categoria (Pessoas/Projeto/Serviços/
     Financeiro/Datas/Jurídico) — mapa explícito para os campos mais comuns
     da Biblioteca (cobre os 8 novos contratos de Home & Trade Services e os
     campos universais repetidos em dezenas de outros); para qualquer campo
     fora do mapa, cai numa heurística por palavras-chave no próprio nome,
     nunca deixa um campo "sem grupo". */
  const DYN_GROUP_ORDER=['pessoas','projeto','servicos','financeiro','datas','juridico'];
  const DYN_GROUP_META={
    pessoas:{label:{pt:'Pessoas',en:'People',es:'Personas'},icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="11" cy="7" r="4"/>'},
    projeto:{label:{pt:'Projeto',en:'Project',es:'Proyecto'},icon:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'},
    servicos:{label:{pt:'Serviços',en:'Services',es:'Servicios'},icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>'},
    financeiro:{label:{pt:'Financeiro',en:'Financial',es:'Financiero'},icon:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/>'},
    datas:{label:{pt:'Datas',en:'Dates',es:'Fechas'},icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
    juridico:{label:{pt:'Jurídico',en:'Legal',es:'Jurídico'},icon:'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'}
  };
  const DYN_FIELD_GROUP_MAP={
    CLIENT_NAME:'pessoas', CLIENT_ADDRESS:'pessoas', CLIENT_EMAIL:'pessoas', CLIENT_DOCUMENT:'pessoas', CLIENT_PHONE:'pessoas',
    CLIENT_TAX_ID:'pessoas', CLIENT_RG:'pessoas', CLIENT_CITY:'pessoas', CLIENT_STATE:'pessoas', CLIENT_ZIP:'pessoas',
    CLIENT_NATIONALITY:'pessoas', CLIENT_BIRTH_DATE:'pessoas', CLIENT_COMPANY:'pessoas', CLIENT_JOB_TITLE:'pessoas',
    PROVIDER_NAME:'pessoas', PROVIDER_ADDRESS:'pessoas',
    PROJECT_NAME:'projeto', PROPERTY_ADDRESS:'projeto', PROJECT_SITE_ADDRESS:'projeto', PREMISES_ADDRESS:'projeto',
    ORIGIN_ADDRESS:'projeto', DESTINATION_ADDRESS:'projeto', PROJECT_PLANS_REFERENCE:'projeto', LOCATION:'projeto',
    RENOVATION_SCOPE:'projeto', CONSTRUCTION_SCOPE:'projeto', SURFACES_TO_BE_PAINTED:'projeto', INVENTORY_LIST_REFERENCE:'projeto',
    CLEANING_TASKS_INCLUDED:'servicos', LANDSCAPING_SERVICES_INCLUDED:'servicos', PAINT_BRAND_AND_TYPE:'servicos',
    COLOR_SPECIFICATIONS:'servicos', SERVICE_FREQUENCY:'servicos', SERVICE_DAY_AND_TIME:'servicos', SERVICE_HOURS:'servicos',
    SEASONAL_SCHEDULE:'servicos', PACKING_SERVICES_INCLUDED:'servicos', REPAIR_TASKS_DESCRIPTION:'servicos', ACCESS_METHOD:'servicos',
    TOTAL_VALUE:'financeiro', PAYMENT_METHOD:'financeiro', LATE_PAYMENT_RATE:'financeiro', DEPOSIT_AMOUNT:'financeiro',
    PAYMENT_MILESTONES:'financeiro', MATERIALS_ALLOWANCE:'financeiro', MATERIALS_MARKUP_RATE:'financeiro',
    DELAY_PENALTY_RATE:'financeiro', DELAY_PENALTY_CAP:'financeiro', PERFORMANCE_BOND_AMOUNT:'financeiro',
    CANCELLATION_FEE:'financeiro', STORAGE_FEE:'financeiro', DECLARED_VALUE:'financeiro', INSURANCE_COVERAGE_LEVEL:'financeiro',
    ESTIMATED_COST:'financeiro',
    START_DATE:'datas', DELIVERY_DATE:'datas', COMPLETION_DATE:'datas', MOVING_DATE:'datas', SIGNATURE_DATE:'datas', DATE:'datas',
    CANCELLATION_NOTICE_PERIOD:'datas', TERMINATION_NOTICE_PERIOD:'datas', DAMAGE_REPORTING_PERIOD:'datas',
    CLAIM_NOTICE_PERIOD:'datas', WARRANTY_PERIOD:'datas', PLANT_WARRANTY_PERIOD:'datas', STORAGE_DURATION:'datas',
    APPLICABLE_LAW:'juridico', DISPUTE_RESOLUTION_MECHANISM:'juridico', PERMIT_RESPONSIBILITY:'juridico'
  };
  function inferirGrupoCampo(campo){
    const explicito=DYN_FIELD_GROUP_MAP[campo];
    if(explicito) return explicito;
    if(/^(CLIENT|PROVIDER|CONTRACTOR|ASSIGNEE|ASSIGNOR|AGENT|CANDIDATE)/.test(campo)) return 'pessoas';
    if(/_DATE$|_PERIOD$|_DURATION$|_NOTICE|_DEADLINE/.test(campo)) return 'datas';
    if(/LAW|DISPUTE|LIABILITY|JURISDICTION|GOVERNING|COMPLIANCE|PERMIT|LICENSE|REGULAT/.test(campo)) return 'juridico';
    if(/VALUE|PRICE|AMOUNT|RATE|FEE|COST|BUDGET|PAYMENT|DEPOSIT|BOND|MARKUP|ALLOWANCE/.test(campo)) return 'financeiro';
    if(/ADDRESS|SITE|PROPERTY|PREMISES|LOCATION|PLANS/.test(campo)) return 'projeto';
    return 'servicos';
  }
  function renderBuilderCampos(job, locked){
    const wrap=document.getElementById('builder-dynfields');
    if(!wrap) return;
    const campos=builderCamposDinamicos(job);
    if(!campos.length){
      wrap.innerHTML='<div class="dynf-head-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3M15 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3"/></svg><span>'+t('builder.tabVariables')+'</span></div>'+
        '<p class="u-label-nd u-p-8-2">'+t('builder.varsEmpty')+'</p>';
      return;
    }
    const fv=getBuilderFieldValues();
    const preenchidos=campos.filter(c=>fv[c]!=null && fv[c]!=='').length;
    const grupos={};
    campos.forEach(c=>{ const g=inferirGrupoCampo(c); (grupos[g]=grupos[g]||[]).push(c); });
    const seta='<svg class="dynf-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    let html='<div class="dynf-head-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3M15 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3"/></svg><span>'+t('builder.tabVariables')+'</span></div>'+
      '<div class="dynf-hint">'+t('builder.dynFieldsHint')+'</div>'+
      '<div class="dynf-summary">'+t('builder.varsTotal').replace('{n}', campos.length)+' • '+t('builder.varsFilled').replace('{n}', preenchidos)+' • '+t('builder.varsPending').replace('{n}', campos.length-preenchidos)+'</div>';
    DYN_GROUP_ORDER.filter(g=>grupos[g] && grupos[g].length).forEach(g=>{
      const meta=DYN_GROUP_META[g];
      const itens=grupos[g];
      html+='<div class="dynf-group">'+
        '<div class="dynf-group-head" onclick="toggleDynfGroup(this)">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'+meta.icon+'</svg>'+
          '<span>'+(meta.label[LANG]||meta.label.en)+'</span><span class="dynf-count">'+itens.length+'</span>'+
          '<svg class="dynf-group-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'+
        '</div>'+
        '<div class="dynf-group-body">'+
          itens.map(c=>{
            const val=fv[c]!=null?fv[c]:'';
            const display = val!=='' ? escapeHtml(val) : '<span class="dynf-empty">'+t('builder.dynFieldPlaceholder')+'</span>';
            return locked
              ? '<div class="dynf-row-ro"><span class="dynf-key">'+escapeHtml(dynFieldLabel(c))+'</span><span class="dynf-val">'+display+'</span></div>'
              : '<div class="dynf-row" onclick="abrirEditarVariavelBuilder(\''+c+'\')"><span class="dynf-key">'+escapeHtml(dynFieldLabel(c))+'</span><span class="dynf-val">'+display+'</span>'+seta+'</div>';
          }).join('')+
        '</div>'+
      '</div>';
    });
    wrap.innerHTML=html;
  }
  function toggleDynfGroup(el){
    el.parentElement.classList.toggle('collapsed');
  }
  /* Editar UMA variável (aplica a todas as ocorrências no contrato — igual ao
     comportamento anterior do input inline) + atalho para ver onde ela
     aparece, sem sair do modal primeiro. */
  function abrirEditarVariavelBuilder(campo){
    const fv=getBuilderFieldValues();
    const valorAtual=fv[campo]||'';
    const html='<div class="field"><input id="dynf-var-input" value="'+escapeHtml(valorAtual)+'" placeholder="'+t('builder.dynFieldPlaceholder')+'" autocomplete="off"></div>'+
      '<button class="btn primary u-w-full u-mt-6" onclick="salvarEditarVariavelBuilder(\''+campo+'\')">'+t('action.save')+'</button>'+
      '<button class="btn soft u-w-full u-mt-8" onclick="verNoContrato(\''+campo+'\')">'+t('builder.showWhereUsed')+'</button>';
    openInfo(dynFieldLabel(campo), html);
    setTimeout(()=>{ const el=document.getElementById('dynf-var-input'); if(el){ el.focus(); el.select(); } },0);
  }
  function salvarEditarVariavelBuilder(campo){
    const el=document.getElementById('dynf-var-input');
    setBuilderCampo(campo, el?el.value:'');
    closeInfo();
    renderBuilderCampos(getBuilderJob(), builderContext && contratoBloqueadoParaEdicao(getBuilderJob()));
    const badge=document.getElementById('builder-tab-varcount'); if(badge) badge.textContent=builderCamposDinamicos(getBuilderJob()).length;
  }
  /* Botão "Ver no contrato" do modal de edição de variável — fecha o modal e
     troca para a aba Estrutura ANTES de tentar rolar até a cláusula. Antes
     disto, localizarCampoNoBuilder rodava primeiro, com #builder-tab-content-
     estrutura ainda display:none (a aba Variáveis estava ativa): scrollIntoView
     num elemento dentro de um ancestral escondido não tem efeito nenhum, então
     ao trocar de aba em seguida a tela ficava no topo, no bloco errado. Um
     pequeno atraso depois de tornar a aba visível garante que o layout já foi
     recalculado antes de medir/rolar. */
  function verNoContrato(campo){
    closeInfo();
    mudarBuilderTab('estrutura');
    setTimeout(()=>localizarCampoNoBuilder(campo), 60);
  }
  /* Toca no nome do campo (lado esquerdo) → leva até a cláusula onde ele
     aparece no contrato (expande o bloco, rola e dá um flash), pra mostrar o
     contexto ANTES de editar — o valor continua editável ali mesmo, no
     input à direita, sem popup nenhum. */
  function localizarCampoNoBuilder(campo){
    const job=getBuilderJob();
    const blocos=job.contract.blocks||[];
    for(const b of blocos){
      if(!b.tpl || !b.tpl.includes('['+campo+']')) continue;
      const prev=document.getElementById('bprev-'+b.id);
      if(prev) prev.classList.remove('collapsed');
      const tplClauses=b.tpl.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
      const idx=tplClauses.findIndex(c=>c.includes('['+campo+']'));
      const alvo = (idx>=0 && document.getElementById('cl-'+b.id+'-'+idx)) || (prev&&prev.closest('.block'));
      if(alvo){
        alvo.scrollIntoView({behavior:'smooth', block:'center'});
        alvo.classList.add('campo-flash');
        setTimeout(()=>alvo.classList.remove('campo-flash'), 1300);
      }
      return;
    }
  }
  function setBuilderCampo(campo, valor){
    const fv=getBuilderFieldValues();
    if(valor==='') delete fv[campo]; else fv[campo]=valor;
    const job=getBuilderJob();
    job.contract.blocks.forEach(b=>{ if(b.tpl) b.customText=LegalLibrary.resolveClauseText(b.tpl, fv); });
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    /* Atualiza as cláusulas no lugar (sem re-render) para não perder o foco do
       input que está sendo digitado; ignora blocos em modo de edição. */
    const editavel = !(builderContext && contratoBloqueadoParaEdicao(job));
    job.contract.blocks.forEach(b=>{
      const lst=document.getElementById('clist-'+b.id);
      if(lst && !lst.querySelector('textarea')) lst.innerHTML=clauseListInnerHtml(job,b,editavel);
    });
  }
  function cancelarEdicaoBloco(bid){
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
  }
  function toggleBloco(bid, el){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(builderContext && contratoBloqueadoParaEdicao(job)) return;
    b.on=!b.on;
    el.classList.toggle('on');
    el.closest('.block').classList.toggle('off');
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
  }
  function persistBlockOrder(){
    const job=getBuilderJob();
    const ids=[...document.querySelectorAll('#blocklist .block')].map(el=>el.dataset.bid);
    job.contract.blocks.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
    if(builderContext) saveJobsData();
  }

  function abrirBibliotecaBlocos(){
    if(builderContext && contratoBloqueadoParaEdicao(getBuilderJob())) return;
    const html=
      '<div class="pick-row" onclick="abrirExplorarBlocosOficiais()"><div><div class="nm">'+t('library.blocksExplore')+'</div></div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>'+
      '<div class="pick-row" onclick="abrirCriarNovoBloco()"><div><div class="nm">'+t('library.blocksCreateNew')+'</div></div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>';
    openInfo(t('builder.blockLibrary'), html);
  }
  /* ===== Import seletivo (checkbox) de BLOCOS e CLÁUSULAS =====
     Fluxo: vai até a Biblioteca de Modelos completa (mesma tela "Modelos",
     com busca/filtros/badges — bibPickModeCallback marca o modo 'blocos' ou
     'clausulas' e abrirDetalheBibliotecaPrincipal roteia o botão principal
     pra cá em vez de importar o modelo inteiro), escolhe um contrato, entra
     nele, marca as checkboxes dos blocos (ou, no modo cláusulas, entra num
     bloco e marca as cláusulas) e importa de volta pro contrato em edição
     no Builder — sem destruir o estado do Builder, que fica intacto durante
     a navegação (voltaBuilderAposSelecao devolve a view). */
  const BIB_CHECK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';
  const BIB_CHEVR_SVG='<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';
  function bibBlocoTagKey(status){ return status==='REQUIRED'?'library.blockRequired':status==='CONDITIONAL'?'library.blockConditional':'library.blockOptional'; }
  /* Volta pro Builder depois de importar — se um bloco alvo for passado,
     rola até ele (expandido) em vez de simplesmente deixar o go('builder')
     resetar o scroll pro topo da página, que era a queixa: o utilizador
     perdia de vista onde os itens tinham acabado de ser importados. */
  function voltaBuilderAposSelecao(bidParaFoco){
    closeInfo(); bibPickModeCallback=null; go('builder');
    if(!bidParaFoco) return;
    setTimeout(()=>{
      const prev=document.getElementById('bprev-'+bidParaFoco);
      if(!prev) return;
      prev.classList.remove('collapsed');
      const blockEl=prev.closest('.block');
      if(blockEl){
        blockEl.scrollIntoView({behavior:'smooth', block:'center'});
        blockEl.classList.add('campo-flash');
        setTimeout(()=>blockEl.classList.remove('campo-flash'), 1300);
      }
    }, 60);
  }

  // ---- BLOCOS ----
  function abrirExplorarBlocosOficiais(){
    bibPickModeCallback={modo:'blocos'};
    closeInfo();
    go('bibliotecas');
  }
  let bibSelBlocosDetail=null, bibSelBlocosSet=new Set(), bibSelBlocosTitulo='';
  async function abrirSelecaoBlocosContrato(rawId, lang, titulo){
    bibSelBlocosTitulo=titulo;
    openInfo(titulo, '<p class="u-label-nd">…</p>');
    const detail=await LegalLibrary.getDetail(rawId, lang);
    bibSelBlocosDetail={rawId, lang, blocks:(detail&&detail.blocks)||[]};
    bibSelBlocosSet=new Set();
    renderSelecaoBlocos();
  }
  function renderSelecaoBlocos(){
    const blocks=bibSelBlocosDetail.blocks;
    const rows=blocks.map((b,idx)=>{
      const on=bibSelBlocosSet.has(idx);
      const nCl=(b.clauses||[]).length;
      const icone = b.status==='REQUIRED' ? BIB_ICON_REQUIRED : b.status==='CONDITIONAL' ? BIB_ICON_CONDITIONAL : BIB_ICON_OPTIONAL;
      return '<div class="pick-check'+(on?' on':'')+'" onclick="toggleSelBloco('+idx+')">'+
        '<div class="pc-box'+(on?' on':'')+'">'+BIB_CHECK_SVG+'</div>'+
        '<div class="pc-main"><div class="pc-nm">'+escapeHtml(blockName({key:null,name:b.name}))+'</div>'+
        '<div class="pc-sub">'+nCl+' '+t('library.clausesCount')+' <span class="bib-struct-tag">'+icone+t(bibBlocoTagKey(b.status))+'</span></div></div></div>';
    }).join('');
    const n=bibSelBlocosSet.size;
    document.getElementById('infoTitle').textContent=bibSelBlocosTitulo;
    document.getElementById('infoBody').innerHTML='<div class="pick-list">'+(rows||('<p class="u-label-nd u-p-8-2">'+t('library.empty')+'</p>'))+'</div>'+
      '<button class="btn primary u-w-full u-mt-10"'+(n?'':' disabled')+' onclick="confirmarImportBlocos()">'+BIB_ICON_ARROW+t('library.import')+(n?' ('+n+')':'')+'</button>';
  }
  function toggleSelBloco(idx){ if(bibSelBlocosSet.has(idx))bibSelBlocosSet.delete(idx); else bibSelBlocosSet.add(idx); renderSelecaoBlocos(); }
  function confirmarImportBlocos(){
    if(!bibSelBlocosSet.size) return;
    const job=getBuilderJob(); const fv=getBuilderFieldValues(); const blocks=bibSelBlocosDetail.blocks;
    let added=0, primeiroBid=null;
    [...bibSelBlocosSet].sort((a,b)=>a-b).forEach(idx=>{
      const b=blocks[idx]; if(!b||!b.clauses||!b.clauses.length) return;
      const tpl=b.clauses.map(c=>c.text).join('\n\n');
      const novoBid=genId();
      job.contract.blocks.push({id:novoBid, key:null, name:b.name, tpl, customText:LegalLibrary.resolveClauseText(tpl, fv), on:true});
      if(!primeiroBid) primeiroBid=novoBid;
      added++;
    });
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    voltaBuilderAposSelecao(primeiroBid);
    showToast(added+' '+t('library.blocksImportedToast'));
  }

  // ---- CLÁUSULAS (dentro de um bloco do contrato em edição) ----
  let bibClauseTargetBid=null;
  function abrirAdicionarClausulas(bid){
    if(builderContext && contratoBloqueadoParaEdicao(getBuilderJob())) return;
    bibClauseTargetBid=bid;
    const html=
      '<div class="pick-row" onclick="abrirExplorarClausulasOficiais()"><div><div class="nm">'+t('library.clausesExplore')+'</div></div>'+BIB_CHEVR_SVG+'</div>'+
      '<div class="pick-row" onclick="abrirCriarNovaClausula()"><div><div class="nm">'+t('library.clausesCreateNew')+'</div></div>'+BIB_CHEVR_SVG+'</div>';
    openInfo(t('library.clausesAdd'), html);
  }
  function abrirCriarNovaClausula(){
    const bid=bibClauseTargetBid;
    openInfo(t('library.clausesCreateNew'),
      '<div class="field"><textarea id="novaclausula-texto" rows="5" placeholder="'+t('library.clauseTextPlaceholder')+'"></textarea></div>'+
      '<button class="btn primary u-w-full u-mt-10" onclick="salvarNovaClausulaManual()">'+t('action.save')+'</button>',
      ()=>abrirAdicionarClausulas(bid)
    );
  }
  function salvarNovaClausulaManual(){
    const texto=(document.getElementById('novaclausula-texto').value||'').trim();
    if(!texto){ showToast(t('library.clauseTextRequired')); return; }
    appendClausulasAoBloco(bibClauseTargetBid, [texto]);
    closeInfo();
  }
  function abrirExplorarClausulasOficiais(){
    bibPickModeCallback={modo:'clausulas'};
    closeInfo();
    go('bibliotecas');
  }
  let bibSelClausDetail=null, bibSelClausBlockIdx=null, bibSelClausSet=new Set(), bibSelClausTitulo='';
  let bibSelClausContratoCtx=null;
  async function abrirSelecaoBlocoParaClausulas(rawId, lang, titulo){
    bibSelClausContratoCtx={rawId, lang, titulo};
    openInfo(titulo, '<p class="u-label-nd">…</p>');
    const detail=await LegalLibrary.getDetail(rawId, lang);
    bibSelClausDetail={blocks:(detail&&detail.blocks)||[]};
    const rows=bibSelClausDetail.blocks.map((b,idx)=>{
      const nomeTraduzido=blockName({key:null,name:b.name});
      return '<div class="prow" onclick="abrirSelecaoClausulasDoBloco('+idx+',\''+escapeHtml(nomeTraduzido).replace(/'/g,"\\'")+'\')">'+
      '<div class="t">'+escapeHtml(nomeTraduzido)+'</div><span class="pc-sub" style="margin-left:auto;margin-right:8px">'+(b.clauses||[]).length+'</span>'+BIB_CHEVR_SVG+'</div>';
    }).join('');
    document.getElementById('infoTitle').textContent=titulo;
    document.getElementById('infoBody').innerHTML='<div class="plist">'+(rows||('<p style="font-size:13px;color:var(--neutral);padding:8px 2px">'+t('library.empty')+'</p>'))+'</div>';
  }
  function abrirSelecaoClausulasDoBloco(idx, nomeBloco){
    bibSelClausBlockIdx=idx; bibSelClausSet=new Set(); bibSelClausTitulo=nomeBloco;
    renderSelecaoClausulas();
  }
  function renderSelecaoClausulas(){
    const clauses=(bibSelClausDetail.blocks[bibSelClausBlockIdx].clauses)||[];
    const rows=clauses.map((c,i)=>{
      const on=bibSelClausSet.has(i);
      const prev=(c.text||'').slice(0,150)+((c.text||'').length>150?'…':'');
      return '<div class="pick-check'+(on?' on':'')+'" onclick="toggleSelClaus('+i+')">'+
        '<div class="pc-box'+(on?' on':'')+'">'+BIB_CHECK_SVG+'</div>'+
        '<div class="pc-main"><div class="pc-sub" style="white-space:normal">'+escapeHtml(prev)+'</div></div></div>';
    }).join('');
    const n=bibSelClausSet.size;
    document.getElementById('infoTitle').textContent=bibSelClausTitulo;
    document.getElementById('infoBody').innerHTML='<div class="pick-list">'+(rows||('<p class="u-label-nd u-p-8-2">'+t('library.empty')+'</p>'))+'</div>'+
      '<button class="btn primary u-w-full u-mt-10"'+(n?'':' disabled')+' onclick="confirmarImportClausulas()">'+BIB_ICON_ARROW+t('library.import')+(n?' ('+n+')':'')+'</button>';
    const ctx=bibSelClausContratoCtx;
    window.__infoBackHandler = ctx ? (()=>abrirSelecaoBlocoParaClausulas(ctx.rawId, ctx.lang, ctx.titulo)) : null;
    document.getElementById('infoBackBtn').style.display = ctx ? 'flex' : 'none';
  }
  function toggleSelClaus(i){ if(bibSelClausSet.has(i))bibSelClausSet.delete(i); else bibSelClausSet.add(i); renderSelecaoClausulas(); }
  function confirmarImportClausulas(){
    if(!bibSelClausSet.size) return;
    const clauses=(bibSelClausDetail.blocks[bibSelClausBlockIdx].clauses)||[];
    const textos=[...bibSelClausSet].sort((a,b)=>a-b).map(i=>clauses[i].text);
    appendClausulasAoBloco(bibClauseTargetBid, textos);
    voltaBuilderAposSelecao(bibClauseTargetBid);
  }
  function appendClausulasAoBloco(bid, textos){
    const job=getBuilderJob(); const b=job.contract.blocks.find(x=>x.id===bid);
    if(!b || !textos.length) return;
    const fv=getBuilderFieldValues();
    if(b.tpl==null) b.tpl = b.customText||'';
    b.tpl = (b.tpl ? b.tpl+'\n\n' : '') + textos.join('\n\n');
    b.customText = LegalLibrary.resolveClauseText(b.tpl, fv);
    if(builderContext){ marcarContratoAlterado(job); saveJobsData(); }
    renderBuilder();
    const prev=document.getElementById('bprev-'+bid); if(prev) prev.classList.remove('collapsed');
    showToast(textos.length+' '+t('library.clausesImportedToast'));
  }
  function abrirCriarNovoBloco(){
    openInfo(t('library.blocksCreateNew'),
      '<div class="field"><input id="novobloco-nome" placeholder="'+t('library.blockNamePlaceholder')+'" autocomplete="off"></div>'+
      '<div class="field"><textarea id="novobloco-texto" rows="5" placeholder="'+t('library.blockTextPlaceholder')+'"></textarea></div>'+
      '<button class="btn primary u-w-full u-mt-10" onclick="salvarNovoBlocoManual()">'+t('action.save')+'</button>',
      abrirBibliotecaBlocos
    );
  }
  function salvarNovoBlocoManual(){
    const nome=(document.getElementById('novobloco-nome').value||'').trim();
    const texto=(document.getElementById('novobloco-texto').value||'').trim();
    if(!nome){ showToast(t('library.blockNameRequired')); return; }
    const job=getBuilderJob();
    job.contract.blocks.push({id:genId(), key:null, name:nome, customText:texto, on:true});
    renderBuilder();
    closeInfo();
    showToast(t('toast.blockAddedPrefix')+nome+t('toast.blockAddedSuffix'));
  }

  function iconWrap(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">'+d+'</svg>'; }
  /* ícone Iconify como máscara CSS — mesma técnica do .nav-ico/.chip-ic-mask
     (herda currentColor, logo acompanha estado ativo/inativo). Usado em todo
     o lado onde a lista de ícones escolhida substitui um SVG inline. */
  function iconMask(url, tam){
    tam=tam||18;
    return '<span class="nav-ico" style="width:'+tam+'px;height:'+tam+'px;display:inline-block;'+
      'mask-image:url('+url+');-webkit-mask-image:url('+url+')"></span>';
  }
  /* linha de meta-informação do cabeçalho do Projeto (cliente/data/hora) —
     mesmo tamanho, espessura e opacidade entre si (todos via iconWrap). */
  const ICON_PERSON_SM=iconWrap('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>');
  const ICON_CAL_SM=iconMask('https://api.iconify.design/material-symbols:calendar-month-sharp.svg');
  const ICON_DOC=iconWrap('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>');
  const ICON_BRIEF=iconWrap('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>');
  const ICON_CLOCK=iconMask('https://api.iconify.design/material-symbols:clock-loader-20.svg');
  const ICON_MONEY=iconMask('https://api.iconify.design/ri:money-dollar-circle-fill.svg');
  const ICON_BELL=iconWrap('<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 8v4l3 2"/>');
  const ICON_HIST=iconWrap('<path d="M3 3v18h18M7 14l4-4 3 3 5-6"/>');
  function badge(cls, icon){ return '<div class="sec-icon '+cls+'">'+icon+'</div>'; }
  const BADGE_DOC=badge('c-contrato', ICON_DOC);
  const BADGE_BRIEF=badge('c-briefing', ICON_BRIEF);
  const BADGE_CLOCK=badge('c-cronograma', ICON_CLOCK);
  const BADGE_MONEY=badge('c-pagamentos', ICON_MONEY);
  const BADGE_BELL=badge('c-lembretes', ICON_BELL);
  const BADGE_HIST=badge('c-historico', ICON_HIST);
  const ICON_TEAM=iconWrap('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
  const BADGE_TEAM=badge('c-entrega', ICON_TEAM);
  /* Alarme (Lembretes) e checklist (Listas) — distintos do sino da secção
     Tarefas (BADGE_BELL) pra não ler como o mesmo conceito. */
  const ICON_ALARM=iconWrap('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="m5 3-2.5 2.5"/><path d="m19 3 2.5 2.5"/>');
  const BADGE_ALARM=badge('c-lembretes', ICON_ALARM);
  const ICON_CHECKLIST=iconWrap('<rect x="3" y="4" width="7" height="7" rx="1.3"/><path d="m4.5 7.5 1.2 1.2L8.5 6"/><path d="M13 5h8M13 11h8M3 16h18M3 20h18"/>');
  const BADGE_CHECKLIST=badge('c-historico', ICON_CHECKLIST);
  const ICON_GRIP='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>';
  const ICON_PIN='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.6 2 4 5.6 4 10c0 6.2 7 11.4 7.5 11.8a.8.8 0 0 0 1 0C13 21.4 20 16.2 20 10c0-4.4-3.6-8-8-8Z"/><circle cx="12" cy="10" r="2.7" fill="#fff"/></svg>';
  const BADGE_PIN=badge('c-contrato', ICON_PIN);
  /* Mapa minimalista (CartoDB Positron/Dark Matter — tons de cinza, sem
     cores vivas), via Leaflet carregado por CDN. Substitui o antigo iframe
     do embed.html do OpenStreetMap, que trazia sempre o "Report a problem" /
     "Make a donation" / "OpenStreetMap terms" — chrome técnico da API que
     não faz sentido dentro do produto. A atribuição legal (obrigatória)
     fica, mas reduzida a um texto discreto no canto do mapa. */
  const ICON_NAV=iconWrap('<path d="m3 11 18-8-8 18-2-8-8-2Z"/>');
  /* mesma estrutura de todos os cards da página do Projeto: cabeçalho →
     divisória → conteúdo → divisória → rodapé. */
  function mapCardHtml(job){
    const local=job.local;
    if(!local) return '';
    const enderecoBusca=job.localCompleto||local;
    const rotaUrl=linkRotaInteligente(job);
    const mapId='mapa-card-'+Math.random().toString(36).slice(2,9);
    const temGeo = job.geo && job.geo.lat!=null;
    return '<div class="map-card">'+
      '<div class="map-card-head">'+BADGE_PIN+'<div class="sec-title">'+t('portal.location')+'</div></div>'+
      '<div class="map-card-hr"></div>'+
      (temGeo
        ? '<div class="map-leaflet" id="'+mapId+'" data-lat="'+job.geo.lat+'" data-lon="'+job.geo.lon+'"></div>'
        : '<div class="map-visual"><div class="map-pin">'+ICON_PIN+'</div></div>')+
      '<div class="map-card-hr"></div>'+
      '<div class="map-info"><div class="map-addr">'+escapeHtml(enderecoBusca)+'</div>'+
      '<a class="map-link" href="'+rotaUrl+'" target="_blank" rel="noopener">'+ICON_NAV+'<span>'+t('portal.openRoute')+'</span></a></div>'+
    '</div>';
  }
  /* Leaflet só é carregado (CSS+JS via CDN) na primeira vez que um card com mapa
     realmente aparece no ecrã — antes carregava sempre no <head>, mesmo em sessões
     que nunca abrem um trabalho com localização definida. */
  let _leafletLoading=null;
  function carregarLeaflet(){
    if(typeof L!=='undefined') return Promise.resolve();
    if(_leafletLoading) return _leafletLoading;
    _leafletLoading=new Promise((resolve,reject)=>{
      const link=document.createElement('link');
      link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const s=document.createElement('script');
      s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload=resolve;
      s.onerror=()=>{ _leafletLoading=null; reject(new Error('leaflet load failed')); };
      document.head.appendChild(s);
    });
    return _leafletLoading;
  }
  /* Chamar depois de inserir HTML com mapCardHtml() no DOM (mesmo padrão de
     setTimeout(inicializarCanvasAssinatura,30) já usado no resto do app). */
  function inicializarMapasCard(){
    const pendentes=document.querySelectorAll('.map-leaflet:not([data-init])');
    if(!pendentes.length) return;
    if(typeof L==='undefined'){ carregarLeaflet().then(inicializarMapasCard).catch(()=>{}); return; }
    pendentes.forEach(el=>{
      el.setAttribute('data-init','1');
      const lat=parseFloat(el.dataset.lat), lon=parseFloat(el.dataset.lon);
      if(isNaN(lat)||isNaN(lon)) return;
      const escuro=document.documentElement.getAttribute('data-theme')==='dark';
      const map=L.map(el, {zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, touchZoom:false, attributionControl:true});
      map.setView([lat,lon], 15);
      L.marker([lat,lon]).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/'+(escuro?'dark_all':'light_all')+'/{z}/{x}/{y}{r}.png', {
        maxZoom:19, attribution:'© OpenStreetMap, © CARTO'
      }).addTo(map);
      map.attributionControl.setPrefix(false);
    });
  }

  /* 3 estados reais do contrato — cada um com o tom próprio da paleta do
     app (cinza/âmbar/verde, nunca amarelo forte): rascunho/vazio = pendente
     (cinza), enviado = em análise (âmbar, aguardando o cliente), assinado
     = verde. */
  function contractStatusTagHtml(job){
    const st=job.contract.status;
    if(st==='assinado') return '<span class="sig-tag green">'+statusEmoji('done')+' '+t('contract.tagSigned')+'</span>';
    if(st==='enviado') return '<span class="sig-tag amber">'+statusEmoji('progress')+' '+t('contract.tagReview')+'</span>';
    return '<span class="sig-tag gray">'+statusEmoji('pending')+' '+t('contract.tagPending')+'</span>';
  }
