# openwebui-bridge-v2 — Deployment

> 🌐 **English** | [繁體中文](README.md)

## Deployment steps

### 1. Set up n8n credential

In n8n UI → Credentials → New:
- Type: Header Auth
- Name: `openwebuiSharedSecret`
- Header name: `X-API-Key`
- Header value: generate strong random (e.g. `openssl rand -hex 32`)

### 2. Import workflow.json

After import, the webhook URL appears on the Webhook node. Recommended: HTTPS + fixed host (e.g. `https://n8n.your.com/webhook/openwebui-bridge`).

### 3. Set up OpenWebUI Function

In OpenWebUI admin → Tools → Add:

```python
import os, requests

def n8n_bridge(message: str, user_id: str = "anonymous", session_id: str = ""):
    """Call n8n automation bridge"""
    url = os.environ.get("N8N_BRIDGE_URL", "")
    secret = os.environ.get("N8N_BRIDGE_SECRET", "")
    r = requests.post(
        url,
        headers={"X-API-Key": secret, "Content-Type": "application/json"},
        json={"user_message": message, "user_id": user_id, "session_id": session_id},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()
```

OpenWebUI env vars:
- `N8N_BRIDGE_URL`: n8n webhook URL
- `N8N_BRIDGE_SECRET`: same value as the n8n credential

### 4. Conversation test

In OpenWebUI chat: "enable n8n bridge: hello" → should get an n8n response.

## Integrating with this Skill Pack's three modes

Advanced: load `02-USAGE-MODES.en.md` into OpenWebUI system prompt + expose `n8n_bridge`:
- User says "enable Q&A mode" → OpenWebUI runs Q&A internally (Skill loaded)
- User says "find examples" → OpenWebUI uses example-finder Skill
- User says "build the workflow" → AI generates JSON → push to n8n via `n8n_bridge`

See "OpenWebUI Integration" in root `TODO.md` for status.
