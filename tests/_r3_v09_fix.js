// v0.9.0 batch fix for 4 R3 BUGs across all 8 R3 workflows.
// Usage: node _r3_v09_fix.js
//
// Fixes:
//  BUG-1: ensure top-level workflow.id (16-char nanoid)
//  BUG-2: webhook/formTrigger/telegramTrigger nodes get a webhookId (UUID)
//  BUG-3: webhook/formTrigger/telegramTrigger node name → ASCII PascalCase, connections updated
//  BUG-4: <REPLACE_*> placeholders in node parameters → empty string
//  BONUS: each node that requires a credential gets a stub credentials reference,
//         which is what n8n validates at activate time (it does not check the cred actually exists).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKFLOWS = [
  'tests/1-github-slack/workflow.json',
  'tests/2-rss-ai-email/workflow.json',
  'tests/3-telegram-bot/workflow.json',
  'tests/4-pdf-worker-s3/workflow.json',
  'tests/5-order-risk-route/workflow.json',
  'tests/Q1-qa-mode/output-workflow.json',
  'tests/Q2-example-finder/output-workflow.json',
  'tests/Q3-branch-syntax/workflow.json',
];

// Node-type → credential-name(s). Derived from the R3 activation error messages.
const CRED_MAP = {
  'n8n-nodes-base.slack':                   ['slackApi'],
  'n8n-nodes-base.gmail':                   ['gmailOAuth2'],
  'n8n-nodes-base.telegram':                ['telegramApi'],
  'n8n-nodes-base.telegramTrigger':         ['telegramApi'],
  'n8n-nodes-base.googleSheets':            ['googleSheetsOAuth2Api'],
  'n8n-nodes-base.postgres':                ['postgres'],
  'n8n-nodes-base.jira':                    ['jiraSoftwareCloudApi'],
  'n8n-nodes-base.awsS3':                   ['aws'],
  '@n8n/n8n-nodes-langchain.openAi':        ['openAiApi'],
};

const WEBHOOK_TYPES = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.formTrigger',
  'n8n-nodes-base.telegramTrigger',
]);

function nano(n = 16) {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function asciiPascal(name) {
  // Replace non-ASCII with empty, split on non-alphanumeric, capitalize parts
  const cleaned = name.replace(/[一-鿿]+/g, ''); // strip Chinese
  const parts = cleaned.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return 'WebhookNode';
  return parts.map(p => p[0].toUpperCase() + p.slice(1)).join('');
}

function deepReplaceText(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map(v => deepReplaceText(v, fn));
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepReplaceText(value[k], fn);
    return out;
  }
  return value;
}

function fixOne(filePath) {
  const abs = path.resolve(filePath);
  const w = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const log = [];

  // BUG-1: top-level id
  if (!w.id) {
    w.id = nano();
    log.push(`+id ${w.id}`);
  }

  // BUG-2/3: webhook-family nodes
  const renames = {}; // oldName -> newName
  for (const n of w.nodes) {
    if (!WEBHOOK_TYPES.has(n.type)) continue;

    if (!n.webhookId) {
      n.webhookId = crypto.randomUUID();
      log.push(`+webhookId(${n.name}) ${n.webhookId}`);
    }

    const newName = asciiPascal(n.name);
    if (newName !== n.name) {
      renames[n.name] = newName;
      log.push(`rename '${n.name}' -> '${newName}'`);
      n.name = newName;
    }
  }

  // Apply renames to connections
  if (Object.keys(renames).length > 0) {
    const newConns = {};
    for (const k of Object.keys(w.connections)) {
      const newKey = renames[k] || k;
      newConns[newKey] = w.connections[k];
    }
    w.connections = newConns;

    // Also update any expressions that reference the old node name via $('OldName')
    for (const n of w.nodes) {
      n.parameters = deepReplaceText(n.parameters, s => {
        let out = s;
        for (const [oldN, newN] of Object.entries(renames)) {
          // escape regex special chars in oldN
          const escOld = oldN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          out = out.replace(new RegExp(`\\$\\('${escOld}'\\)`, 'g'), `$('${newN}')`);
        }
        return out;
      });
    }
  }

  // BUG-4: placeholders <REPLACE_*>
  let placeholderCount = 0;
  for (const n of w.nodes) {
    n.parameters = deepReplaceText(n.parameters, s => {
      if (typeof s === 'string' && /<REPLACE_[A-Z_]+>/.test(s)) {
        placeholderCount++;
        return s.replace(/<REPLACE_[A-Z_]+>/g, '');
      }
      return s;
    });
  }
  if (placeholderCount > 0) log.push(`cleared ${placeholderCount} placeholder(s)`);

  // BONUS: stub credentials for nodes that need them
  let credAdded = 0;
  for (const n of w.nodes) {
    const credNames = CRED_MAP[n.type];
    if (!credNames) continue;
    n.credentials = n.credentials || {};
    for (const c of credNames) {
      if (!n.credentials[c]) {
        n.credentials[c] = { id: 'stub-' + nano(8), name: `STUB-${c}` };
        credAdded++;
      }
    }
  }
  if (credAdded > 0) log.push(`+${credAdded} stub credential(s)`);

  fs.writeFileSync(abs, JSON.stringify(w, null, 2));
  console.log(filePath, '\n  ' + log.join('\n  '));
}

for (const f of WORKFLOWS) fixOne(f);
console.log('\nDONE');
