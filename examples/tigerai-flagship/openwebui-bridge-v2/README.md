# openwebui-bridge-v2 — 部署說明

> 🌐 [English](README.en.md) | **繁體中文**

## 部署步驟

### 1. 設定 n8n credential

在 n8n UI → Credentials → New：
- Type: Header Auth
- Name: `openwebuiSharedSecret`
- Header name: `X-API-Key`
- Header value: 自行產生強隨機字串（如 `openssl rand -hex 32`）

### 2. Import workflow.json

匯入後 webhook URL 會在 Webhook 節點顯示。建議走 HTTPS 與固定 host（如 `https://n8n.your.com/webhook/openwebui-bridge`）。

### 3. 設定 OpenWebUI Function

在 OpenWebUI 後台 → Tools → 新增：

```python
import os, requests

def n8n_bridge(message: str, user_id: str = "anonymous", session_id: str = ""):
    """呼叫 n8n 自動化 bridge"""
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

OpenWebUI 環境變數：
- `N8N_BRIDGE_URL`：n8n 的 webhook URL
- `N8N_BRIDGE_SECRET`：與 n8n credential 同值

### 4. 對話測試

在 OpenWebUI 對話中說「啟用 n8n bridge: hello」應收到 n8n 回應。

## 整合本 Skill Pack 三模式

進階：在 OpenWebUI system prompt 載入 `02-USAGE-MODES.md` + 對 `n8n_bridge` 暴露：
- 使用者說「啟用問答模式」→ OpenWebUI 自己跑問答（因為 Skill 已載入）
- 使用者說「找範例」→ OpenWebUI 自己找（因 example-finder Skill 已載入）
- 使用者說「產 workflow」→ AI 產 JSON → 透過 `n8n_bridge` 推到 n8n

詳見根目錄 `TODO.md` 的「OpenWebUI 整合」項。
