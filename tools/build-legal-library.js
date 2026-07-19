#!/usr/bin/env node
/*
 * Compilador da Legal Library — lê os Markdown oficiais (fonte de verdade)
 * e gera JSON estruturado, consumido em runtime pelo LegalLibrary (index.html).
 *
 * Uso:
 *   node tools/build-legal-library.js <caminho-para-"Legal Library"> [--publish]
 *
 * Sem --publish: escreve só em legal-library/dist/ (staging, não afeta o app rodando).
 * Com --publish: também copia dist/ para legal-library/ (o que o app de fato busca).
 *
 * O parser é defensivo: nunca lança exceção por causa de um arquivo com
 * formatação fora do padrão — em vez disso, registra um aviso em
 * dist/warnings.json e segue com o que conseguiu extrair.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const PUBLISH = process.argv.includes('--publish');
if (!SRC) {
  console.error('Uso: node tools/build-legal-library.js <caminho-para-"Legal Library"> [--publish]');
  process.exit(1);
}

const REPO_ROOT = path.resolve(__dirname, '..');
const DIST = path.join(REPO_ROOT, 'legal-library', 'dist');
const ACTIVE = path.join(REPO_ROOT, 'legal-library');

const warnings = [];
function warn(file, msg) { warnings.push({ file, msg }); }

function titleCase(s) {
  return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// ---------- 1. Blueprint (hierarquia + metadados de blocos) ----------
function parseBlueprintFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const markets = [];
  let curMarket = null, curCategory = null, curSubcategory = null, curContractType = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(/^## Market: (.+)$/))) {
      curMarket = { name: m[1].trim(), categories: [] };
      markets.push(curMarket);
      curCategory = curSubcategory = curContractType = null;
    } else if ((m = line.match(/^### Category: (.+)$/))) {
      if (!curMarket) { warn(file, 'Category fora de Market na linha ' + (i + 1)); continue; }
      curCategory = { name: m[1].trim(), subcategories: [] };
      curMarket.categories.push(curCategory);
      curSubcategory = curContractType = null;
    } else if ((m = line.match(/^#### Subcategory: (.+)$/))) {
      if (!curCategory) { warn(file, 'Subcategory fora de Category na linha ' + (i + 1)); continue; }
      curSubcategory = { name: m[1].trim(), contractTypes: [] };
      curCategory.subcategories.push(curSubcategory);
      curContractType = null;
    } else if ((m = line.match(/^#### Contract Type: (.+)$/))) {
      if (!curSubcategory) { warn(file, 'Contract Type fora de Subcategory na linha ' + (i + 1)); continue; }
      curContractType = {
        name: m[1].trim(), slug: slugify(m[1].trim()),
        purpose: null, useCases: [], requiredBlocks: [], optionalBlocks: [], conditionalBlocks: [],
        blocks: []
      };
      curSubcategory.contractTypes.push(curContractType);
    } else if (curContractType && (m = line.match(/^- \*\*Purpose:\*\* (.+)$/))) {
      curContractType.purpose = m[1].trim();
    } else if (curContractType && (m = line.match(/^- \*\*Typical Use Cases:\*\* (.+)$/))) {
      curContractType.useCases = m[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (curContractType && (m = line.match(/^- \*\*Required Blocks:\*\* (.+)$/))) {
      curContractType.requiredBlocks = m[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (curContractType && (m = line.match(/^- \*\*Optional Blocks:\*\* (.+)$/))) {
      curContractType.optionalBlocks = m[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (curContractType && (m = line.match(/^- \*\*Conditional Blocks:\*\* (.+)$/))) {
      curContractType.conditionalBlocks = m[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (curContractType && (m = line.match(/^\*\*Block Name:\*\* (.+)$/))) {
      const block = { name: m[1].trim(), purpose: null, status: null, dependencies: [], incompatibleBlocks: [], dynamicFields: [] };
      curContractType.blocks.push(block);
      const cur = block;
      // consome as linhas seguintes de metadata do bloco até a próxima linha em branco/separador
      let j = i + 1;
      for (; j < lines.length; j++) {
        const l = lines[j];
        let mm;
        if ((mm = l.match(/^- Purpose: (.+)$/))) cur.purpose = mm[1].trim();
        else if ((mm = l.match(/^- Status: (.+)$/))) cur.status = mm[1].trim();
        else if ((mm = l.match(/^- Dependencies: (.+)$/))) cur.dependencies = mm[1] === 'None' ? [] : mm[1].split(',').map(s => s.trim());
        else if ((mm = l.match(/^- Incompatible Blocks: (.+)$/))) cur.incompatibleBlocks = mm[1] === 'None' ? [] : mm[1].split(',').map(s => s.trim());
        else if ((mm = l.match(/^- Dynamic Fields: (.+)$/))) cur.dynamicFields = mm[1] === 'None' ? [] : [...mm[1].matchAll(/\[([A-Z0-9_]+)\]/g)].map(x => x[1]);
        else if (l.match(/^\*\*Block Name:\*\*/) || l.match(/^---/) || l.match(/^### /) || l.match(/^#### /)) break;
      }
      i = j - 1;
    }
  }
  return markets;
}

// ---------- 2. Contracts (blocos REQUIRED/OPTIONAL/CONDITIONAL + cláusulas) ----------
// Frontmatter YAML simples (só chave: valor e chave: [a, b, c] de um nível —
// os 61 arquivos não usam nada mais aninhado que isso, então não vale a pena
// puxar uma lib de YAML só por causa disto).
function parseSimpleFrontmatter(lines) {
  if (lines[0] !== '---') return { data: {}, endLine: -1 };
  const data = {};
  let i = 1;
  for (; i < lines.length && lines[i] !== '---'; i++) {
    const m = lines[i].match(/^([a-z_]+):\s*(.*)$/i);
    if (!m) continue;
    const key = m[1], raw = m[2].trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      data[key] = raw;
    }
  }
  return { data, endLine: i };
}

function parseContractFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const meta = { market: null, category: null, subcategory: null, contractType: null, status: null, version: null, tags: [] };

  const fm = parseSimpleFrontmatter(lines);
  if (fm.data.market) meta.market = titleCase(fm.data.market);
  if (fm.data.category) meta.category = titleCase(fm.data.category);
  if (fm.data.subcategory) meta.subcategory = titleCase(fm.data.subcategory);
  if (fm.data.contract_type) meta.contractType = fm.data.contract_type;
  if (fm.data.status) meta.status = fm.data.status;
  if (fm.data.version) meta.version = fm.data.version;
  if (fm.data.tags) meta.tags = fm.data.tags;

  // Header em prosa ("Market: X" ou "Market: X | Category: Y | Subcategory: Z")
  // — busca em todo o cabeçalho (até o primeiro "### BLOCK:"), não só nas
  // primeiras linhas, porque quando há frontmatter o cabeçalho em prosa vem
  // mais abaixo. Só preenche o que o frontmatter ainda não deu.
  const firstBlockLine = lines.findIndex(l => l.startsWith('### BLOCK:'));
  const headerLines = lines.slice(0, firstBlockLine > 0 ? firstBlockLine : 30);
  for (const line of headerLines) {
    let m;
    if (!meta.market && (m = line.match(/^Market:\s*([^|\n]+)/))) meta.market = m[1].trim();
    if (!meta.category && (m = line.match(/Category:\s*([^|\n]+)/))) meta.category = m[1].trim();
    if (!meta.subcategory && (m = line.match(/Subcategory:\s*([^|\n]+)/))) meta.subcategory = m[1].trim();
    if (!meta.contractType && (m = line.match(/^Contract Type:\s*(.+)$/))) meta.contractType = m[1].trim();
    if (!meta.status && (m = line.match(/^Status:\s*(.+)$/))) meta.status = m[1].trim();
  }
  if (!meta.contractType) {
    // fallback: título H1 costuma ser "NOME — OFFICIAL CLAUSE LIBRARY"
    const h1 = lines.find(l => l.startsWith('# '));
    if (h1) meta.contractType = h1.replace(/^# /, '').replace(/—.*/, '').trim();
    else warn(file, 'Não encontrei Contract Type nem título H1');
  }

  const blocks = [];
  let curBlock = null, curClause = null;
  const dynamicFieldsSeen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(/^### BLOCK: (.+?) — (REQUIRED|OPTIONAL|CONDITIONAL)/))) {
      curBlock = { name: m[1].trim(), status: m[2], clauses: [], dynamicFields: [] };
      blocks.push(curBlock);
      curClause = null;
    } else if (curBlock && (m = line.match(/^\*\*([a-z0-9_]+\.[a-z0-9_.]+)\*\*/))) {
      curClause = { id: m[1], version: null, text: '' };
      curBlock.clauses.push(curClause);
    } else if (curClause && curClause.version === null && (m = line.match(/^v(\d+\.\d+\.\d+)\s*$/))) {
      curClause.version = m[1];
    } else if (curBlock && (m = line.match(/^Dynamic Fields:\s*(.+)$/))) {
      const fields = [...m[1].matchAll(/\[([A-Z0-9_]+)\]/g)].map(x => x[1]);
      curBlock.dynamicFields = fields;
      fields.forEach(f => dynamicFieldsSeen.add(f));
    } else if (curClause && line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
      curClause.text += (curClause.text ? ' ' : '') + line.trim();
    }
  }

  if (!blocks.length) warn(file, 'Nenhum bloco "### BLOCK:" encontrado — arquivo pode estar fora do padrão');
  blocks.forEach(b => {
    b.clauses.forEach(c => {
      const inline = [...c.text.matchAll(/\[([A-Z0-9_]+)\]/g)].map(x => x[1]);
      inline.forEach(f => dynamicFieldsSeen.add(f));
    });
  });

  return { meta, blocks, dynamicFields: [...dynamicFieldsSeen], slug: slugify(meta.contractType || path.basename(file, '.md')) };
}

// ---------- 2b. Cruzamento com o Blueprint (Purpose/Typical Use Cases) ----------
// O Blueprint declara Purpose/Typical Use Cases por Contract Type, mas os
// arquivos de Contracts não repetem esse texto — só o nome do contrato.
// Cruza por nome normalizado (ignora maiúsculas/pontuação/parênteses, ex.:
// "Non-Disclosure Agreement (NDA)" casa com "Non-Disclosure Agreement").
function normalizeContractName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildBlueprintIndex(blueprint) {
  const byName = new Map();
  blueprint.forEach(market => market.categories.forEach(cat => cat.subcategories.forEach(sub => sub.contractTypes.forEach(ct => {
    byName.set(normalizeContractName(ct.name), ct);
  }))));
  return byName;
}

// ---------- 3. Registro de Dynamic Fields (heurística de tipo) ----------
function inferFieldType(name) {
  if (/_DATE$/.test(name)) return 'date';
  if (/_VALUE$|_PRICE$|_AMOUNT$/.test(name)) return 'currency';
  if (/_PERIOD$|_DAYS$|_NOTICE/.test(name)) return 'duration';
  if (/_RATE$|_PERCENT/.test(name)) return 'number';
  return 'text';
}

function buildDynamicFieldsRegistry(contracts) {
  const registry = {};
  contracts.forEach(c => {
    c.blocks.forEach(b => {
      b.dynamicFields.forEach(f => {
        if (!registry[f]) registry[f] = { name: f, inferredType: inferFieldType(f), occurrences: 0, contractTypes: new Set() };
        registry[f].occurrences++;
        registry[f].contractTypes.add(c.slug);
      });
    });
  });
  return Object.values(registry).map(r => ({ ...r, contractTypes: [...r.contractTypes], typeSource: 'inferred_needs_review' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- main ----------
function main() {
  const blueprintDir = path.join(SRC, 'Blueprint');
  const contractsDir = path.join(SRC, 'Contracts');
  const pldsFile = fs.readdirSync(path.join(SRC, 'Standarts')).find(f => /PLDS/.test(f));

  const blueprintFiles = fs.readdirSync(blueprintDir).filter(f => f.endsWith('.md')).sort();
  let blueprint = [];
  blueprintFiles.forEach(f => { blueprint = blueprint.concat(parseBlueprintFile(path.join(blueprintDir, f))); });

  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.md')).sort();
  const contracts = contractFiles.map(f => {
    try { return parseContractFile(path.join(contractsDir, f)); }
    catch (e) { warn(f, 'Falhou ao processar: ' + e.message); return null; }
  }).filter(Boolean);

  const dynamicFields = buildDynamicFieldsRegistry(contracts);
  const blueprintIndex = buildBlueprintIndex(blueprint);

  fs.mkdirSync(path.join(DIST, 'contracts'), { recursive: true });

  const index = {
    contractTypes: contracts.map(c => {
      const bp = blueprintIndex.get(normalizeContractName(c.meta.contractType));
      if (!bp) warn(c.slug, 'Sem correspondência no Blueprint por nome — desc/tags ficam vazios');
      // prévia real do contrato: primeira cláusula do primeiro bloco
      // obrigatório (normalmente "Identification"), truncada — não é texto
      // fabricado, é a própria cláusula Master English do arquivo oficial.
      const firstBlock = c.blocks.find(b => b.status === 'REQUIRED' && b.clauses.length) || c.blocks.find(b => b.clauses.length);
      const firstClause = firstBlock && firstBlock.clauses[0];
      const previewText = firstClause ? firstClause.text.slice(0, 300) : null;
      return {
        id: c.slug,
        slug: c.slug,
        title: c.meta.contractType,
        market: c.meta.market,
        category: c.meta.category,
        subcategory: c.meta.subcategory,
        status: c.meta.status,
        desc: bp ? bp.purpose : null,
        tags: bp ? bp.useCases : [],
        previewText,
        blocks: c.blocks.map(b => ({ name: b.name, status: b.status })),
        requiredBlockCount: c.blocks.filter(b => b.status === 'REQUIRED').length,
        optionalBlockCount: c.blocks.filter(b => b.status === 'OPTIONAL').length,
        conditionalBlockCount: c.blocks.filter(b => b.status === 'CONDITIONAL').length,
        clauseCount: c.blocks.reduce((n, b) => n + b.clauses.length, 0)
      };
    })
  };

  contracts.forEach(c => {
    fs.writeFileSync(path.join(DIST, 'contracts', c.slug + '.json'), JSON.stringify(c, null, 2));
  });
  fs.writeFileSync(path.join(DIST, 'index.json'), JSON.stringify(index, null, 2));
  fs.writeFileSync(path.join(DIST, 'blueprint.json'), JSON.stringify({ markets: blueprint }, null, 2));
  fs.writeFileSync(path.join(DIST, 'dynamic-fields.json'), JSON.stringify({ fields: dynamicFields }, null, 2));
  fs.writeFileSync(path.join(DIST, 'warnings.json'), JSON.stringify({ warnings }, null, 2));

  const manifest = {
    schemaVersion: '1.0.0',
    pldsFile: pldsFile || null,
    generatedAt: new Date().toISOString(),
    contractTypeCount: contracts.length,
    totalClauseCount: index.contractTypes.reduce((n, c) => n + c.clauseCount, 0),
    totalDynamicFields: dynamicFields.length,
    warningCount: warnings.length,
    published: false
  };
  fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Compilado:', contracts.length, 'tipos de contrato,', manifest.totalClauseCount, 'cláusulas,', dynamicFields.length, 'dynamic fields,', warnings.length, 'avisos.');
  if (warnings.length) {
    console.log('Avisos:');
    warnings.forEach(w => console.log('  -', w.file, ':', w.msg));
  }

  if (PUBLISH) {
    fs.mkdirSync(path.join(ACTIVE, 'contracts'), { recursive: true });
    ['index.json', 'blueprint.json', 'dynamic-fields.json', 'warnings.json'].forEach(f => {
      fs.copyFileSync(path.join(DIST, f), path.join(ACTIVE, f));
    });
    contracts.forEach(c => fs.copyFileSync(path.join(DIST, 'contracts', c.slug + '.json'), path.join(ACTIVE, 'contracts', c.slug + '.json')));
    fs.writeFileSync(path.join(ACTIVE, 'manifest.json'), JSON.stringify({ ...manifest, published: true }, null, 2));
    console.log('Publicado em legal-library/ (o app já vai servir este conteúdo).');
  }
}

main();
