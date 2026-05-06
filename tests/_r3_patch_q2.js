const fs = require('fs');
const crypto = require('crypto');
const src = process.argv[2];
const dst = process.argv[3];
const newId = process.argv[4];
const webhookId = process.argv[5];

const w = JSON.parse(fs.readFileSync(src, 'utf8'));
const n = w.nodes.find(x => x.id === 'node-webhook');
const oldName = n.name;
n.name = 'WebhookOrder';
n.webhookId = webhookId;

// Rebuild connections: rename key
const newConns = {};
for (const k of Object.keys(w.connections)) {
  if (k === oldName) newConns['WebhookOrder'] = w.connections[k];
  else newConns[k] = w.connections[k];
}
w.connections = newConns;

w.id = newId;
w.name = 'Q2-FIXED-WebhookOrder';
fs.writeFileSync(dst, JSON.stringify(w, null, 2));
console.log('patched', dst, 'newId=', newId, 'webhookId=', webhookId);
