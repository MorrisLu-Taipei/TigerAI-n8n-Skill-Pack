// Patch T5 webhook path + Q1 documentId via n8n REST API PUT (versionId-aware).
// Usage: node _r3_v09_api_patch.js <workflowId> <patch.json>
// where patch.json contains the n8n workflow with full nodes/connections.

const fs = require('fs');
const path = require('path');
const http = require('http');

const API_KEY = process.env.N8N_API_KEY;
const HOST = 'localhost';
const PORT = 5678;

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: HOST, port: PORT, path: urlPath, method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function patchWorkflow(id, mutator) {
  const get = await api('GET', `/api/v1/workflows/${id}`);
  if (get.status !== 200) throw new Error(`GET fail: ${get.status} ${get.body.slice(0,200)}`);
  const w = JSON.parse(get.body);
  mutator(w);
  const put = await api('PUT', `/api/v1/workflows/${id}`, {
    name: w.name, nodes: w.nodes, connections: w.connections, settings: w.settings || {},
  });
  return put;
}

async function activate(id) {
  return await api('POST', `/api/v1/workflows/${id}/activate`);
}

(async () => {
  const cases = [
    { id: 'WUV6o13IuKIWT3vH', name: 'T5', mutate: w => {
        const wh = w.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        wh.parameters.path = 'order-t5-final';
    }},
    { id: 'FVpbu20UF20Ynvga', name: 'Q1', mutate: w => {
        const sh = w.nodes.find(n => n.type === 'n8n-nodes-base.googleSheets');
        sh.parameters.documentId = { __rl: true, mode: 'id', value: '1AbCdEfGhIjKlMnOpQrStUvWxYzAaBbCcDdEeFfGg' };
        sh.parameters.sheetName = { __rl: true, mode: 'list', value: 'gid=0', cachedResultName: '繳費紀錄' };
    }},
  ];

  for (const c of cases) {
    try {
      const r = await patchWorkflow(c.id, c.mutate);
      console.log(c.name, 'PUT', r.status, r.body.slice(0, 80));
      const a = await activate(c.id);
      const ok = /"active":true/.test(a.body);
      console.log(c.name, 'activate', a.status, ok ? '✅' : '❌', a.body.slice(0, 250));
    } catch (e) { console.log(c.name, 'ERR', e.message); }
  }
})();
