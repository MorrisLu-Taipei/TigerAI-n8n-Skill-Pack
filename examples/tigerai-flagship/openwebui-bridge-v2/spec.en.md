# SDD: openwebui-bridge-v2

> 🌐 **English** | [繁體中文](spec.md)

## 1. Purpose

**Business objective**: enable OpenWebUI conversations to call n8n workflows (and vice versa), achieving "Web UI ↔ AI ↔ Automation" three-way integration.

**Why flagship**:
- Embodies Pillar 3 (Skill-Driven Development): the canonical template for this Skill Pack to integrate with OpenWebUI
- Embodies Pillar 4 (Security): includes API key auth and payload validation

---

## 2. Trigger & Inputs

**Trigger**: `n8n-nodes-base.webhook` (called by OpenWebUI Function)

**Input schema**:
```json
{
  "user_message": "<string>",
  "user_id": "<string>",
  "session_id": "<string>",
  "metadata": { ... }
}
```

**Authentication**: header `X-API-Key: <openwebui-shared-secret>`

---

## 3. Business Logic

```
[Webhook]
   ↓
[Validate API Key]   → Code node checks header
   ↓
[Process Logic]      → business logic (v2 has routing: dispatch by user_message)
   ↓
[Format Response]    → shape into OpenWebUI expected format
   ↓
[Respond]            → respondToWebhook returns JSON
```

**The business-logic part is user-customized** — the bridge itself is just transport.

---

## 4. Outputs

OpenWebUI Function expected format:

```json
{
  "status": "ok",
  "result": "<text or structured>",
  "actions": [...]
}
```

---

## 5. Errors & Recovery

| Failure | Handling |
|---|---|
| API key mismatch | Return 401 |
| Payload schema invalid | Return 400 + field list |
| Backend workflow fails | Return 500 + simplified error (don't leak internals) |
| Timeout (>30s) | OpenWebUI Function should configure timeout; n8n webhook unbounded by default |

---

## 6. Test Scenarios

1. **Auth golden**: POST with correct X-API-Key + valid payload → 200 + JSON
2. **Auth fail**: missing X-API-Key → 401
3. **Schema fail**: missing user_message → 400
4. **OpenWebUI integration**: build a Function in OpenWebUI calling this endpoint; trigger via chat → expect response

---

## 7. Deployment Pre-requisites

- n8n exposes the webhook URL (recommended: HTTPS + reverse proxy)
- In n8n credentials, create `openwebuiSharedSecret` (Header Auth)
- In OpenWebUI, create a Function calling this webhook:
  ```python
  # OpenWebUI tool (Python, pseudo)
  def call_n8n_bridge(message: str, user_id: str, session_id: str) -> dict:
      r = requests.post(
          "https://n8n.example.com/webhook/openwebui-bridge",
          headers={"X-API-Key": OPENWEBUI_SHARED_SECRET},
          json={"user_message": message, "user_id": user_id, "session_id": session_id}
      )
      return r.json()
  ```

---

## 8. Integration potential with this Skill Pack

OpenWebUI Function can load this Skill Pack spec into its system prompt:
- User chat → OpenWebUI Function parses → calls this bridge → bridge routes to corresponding n8n workflow
- User can use all three modes (cookbook / Q&A / example finder) entirely within OpenWebUI
- Maps to OpenWebUI integration scenarios in `02-USAGE-MODES.en.md`

See TODO.md "OpenWebUI Integration" for future work items.
