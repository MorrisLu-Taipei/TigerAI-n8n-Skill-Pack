// Phase 1 scanner: walk reference-workflows/, extract structured stats.
// Output: workflow-index.json (per-file) + console summary used to write node-frequency.md / patterns.md
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'reference-workflows');
const OUT_INDEX = path.resolve(__dirname, 'workflow-index.json');

const TRIGGER_TYPES = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.cron',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.formTrigger',
  'n8n-nodes-base.errorTrigger',
  'n8n-nodes-base.emailReadImap',
  'n8n-nodes-base.executeWorkflowTrigger',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const index = [];
const nodeCount = new Map();
const triggerCount = new Map();
const vendorCount = new Map();
const coOccur = new Map(); // "a||b" -> count, sorted pair
const sizeBuckets = { tiny: 0, small: 0, medium: 0, large: 0, xlarge: 0 };
const stickyStats = { withSticky: 0, withoutSticky: 0, totalStickies: 0 };
const errorStats = { withErrorHandling: 0 };

let parseFail = 0;

for (const f of files) {
  let raw, wf;
  try {
    raw = fs.readFileSync(f, 'utf8');
    wf = JSON.parse(raw);
  } catch (e) {
    parseFail++;
    continue;
  }

  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const vendor = rel.split('/')[0];
  vendorCount.set(vendor, (vendorCount.get(vendor) || 0) + 1);

  const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];
  const types = nodes.map(n => n.type || '');
  const uniq = [...new Set(types)];
  const triggers = uniq.filter(t => TRIGGER_TYPES.has(t));
  let stickies = 0;
  let hasErr = false;
  for (const n of nodes) {
    const t = n.type || '';
    if (t === 'n8n-nodes-base.stickyNote') stickies++;
    if (t === 'n8n-nodes-base.errorTrigger') hasErr = true;
    if (n.continueOnFail === true) hasErr = true;
    if (n.onError) hasErr = true;
  }

  for (const t of uniq) nodeCount.set(t, (nodeCount.get(t) || 0) + 1);
  for (const tr of triggers) triggerCount.set(tr, (triggerCount.get(tr) || 0) + 1);

  const nonSticky = uniq.filter(t => t && t !== 'n8n-nodes-base.stickyNote');
  for (let i = 0; i < nonSticky.length; i++) {
    for (let j = i + 1; j < nonSticky.length; j++) {
      const pair = [nonSticky[i], nonSticky[j]].sort().join('||');
      coOccur.set(pair, (coOccur.get(pair) || 0) + 1);
    }
  }

  const size = nodes.length;
  if (size <= 3) sizeBuckets.tiny++;
  else if (size <= 7) sizeBuckets.small++;
  else if (size <= 15) sizeBuckets.medium++;
  else if (size <= 30) sizeBuckets.large++;
  else sizeBuckets.xlarge++;

  if (stickies > 0) { stickyStats.withSticky++; stickyStats.totalStickies += stickies; }
  else stickyStats.withoutSticky++;
  if (hasErr) errorStats.withErrorHandling++;

  index.push({
    file: rel,
    vendor,
    name: wf.name || null,
    nodeCount: nodes.length,
    stickies,
    triggers,
    nodeTypes: uniq,
    hasErrorHandling: hasErr,
    sizeBucket: size <= 3 ? 'tiny' : size <= 7 ? 'small' : size <= 15 ? 'medium' : size <= 30 ? 'large' : 'xlarge',
  });
}

fs.writeFileSync(OUT_INDEX, JSON.stringify({
  meta: {
    generated: new Date().toISOString(),
    totalFiles: files.length,
    parsedOk: files.length - parseFail,
    parseFail,
  },
  workflows: index,
}, null, 0));

const top = (m, n = 30) => [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, n);

const summary = {
  totalFiles: files.length,
  parseFail,
  vendorTotal: vendorCount.size,
  uniqueNodeTypes: nodeCount.size,
  sizeBuckets,
  stickyStats,
  errorStats,
  topNodes: top(nodeCount, 30),
  topTriggers: top(triggerCount, 20),
  topVendors: top(vendorCount, 20),
  topCoOccur: top(coOccur, 30),
};

fs.writeFileSync(path.resolve(__dirname, '_summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
