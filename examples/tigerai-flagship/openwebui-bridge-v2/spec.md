# SDD：openwebui-bridge-v2

> 🌐 [English](spec.en.md) | **繁體中文**

## 1. Purpose

**Business objective**：讓 OpenWebUI 的對話可以呼叫 n8n workflow（反向也行），達成「Web 介面 ↔ AI ↔ 自動化」三方串接。

**為何旗艦**：
- 體現 Pillar 3（Skill-Driven Development）：本 Skill Pack 對接 OpenWebUI 的標準範本
- 體現 Pillar 4（安全）：含 API key 認證與 payload 驗證

---

## 2. Trigger & Inputs

**Trigger**：`n8n-nodes-base.webhook`（OpenWebUI 端 function 呼叫此 endpoint）

**Input schema**：
```json
{
  "user_message": "<string>",
  "user_id": "<string>",
  "session_id": "<string>",
  "metadata": { ... }
}
```

**Authentication**：Header `X-API-Key: <openwebui-shared-secret>`

---

## 3. Business Logic

```
[Webhook]
   ↓
[Validate API Key]   → Code 節點檢查 header
   ↓
[Process Logic]      → 業務邏輯（範例 v2 含路由：根據 user_message 派 workflow）
   ↓
[Format Response]    → 整理成 OpenWebUI 期望格式
   ↓
[Respond]            → respondToWebhook 回 JSON
```

**業務邏輯部分為使用者客製化**——bridge 本身只負責通訊。

---

## 4. Outputs

OpenWebUI function 預期格式：

```json
{
  "status": "ok",
  "result": "<text or structured>",
  "actions": [...]
}
```

---

## 5. Errors & Recovery

| 失敗 | 處置 |
|---|---|
| API Key 不符 | 回 401 |
| Payload schema 不符 | 回 400 + 錯誤欄位列表 |
| 後端 workflow 失敗 | 回 500 + 簡化錯誤訊息（不洩漏內部） |
| 超時（>30s）| OpenWebUI function 應有 timeout 設定，n8n 端 webhook 預設不限 |

---

## 6. Test Scenarios

1. **Auth golden**：對 endpoint 帶正確 X-API-Key + 合法 payload → 回 200 + JSON
2. **Auth fail**：不帶 X-API-Key → 401
3. **Schema fail**：缺 user_message → 400
4. **OpenWebUI 整合**：在 OpenWebUI 建 function 對接此 endpoint，對話中觸發 → 應收回應

---

## 7. Deployment Pre-requisites

- n8n 暴露 webhook URL（建議走 HTTPS + reverse proxy）
- 在 n8n credentials 建 `openwebuiSharedSecret` (Header Auth)
- OpenWebUI 端建立 Function 對接此 webhook：
  ```python
  # OpenWebUI tool（Python，pseudo）
  def call_n8n_bridge(message: str, user_id: str, session_id: str) -> dict:
      r = requests.post(
          "https://n8n.example.com/webhook/openwebui-bridge",
          headers={"X-API-Key": OPENWEBUI_SHARED_SECRET},
          json={"user_message": message, "user_id": user_id, "session_id": session_id}
      )
      return r.json()
  ```

---

## 8. 與本 Skill Pack 的整合潛力

OpenWebUI 端 Function 可在 system prompt 載入本 Skill Pack 規範：
- 使用者對話 → OpenWebUI Function 解析 → 呼叫此 bridge → bridge 路由到對應 n8n workflow
- 使用者用三種模式（cookbook / 問答 / 範例查詢）— 全程在 OpenWebUI 進行
- 對應 `02-USAGE-MODES.md` 的 OpenWebUI 整合情境

詳見 TODO.md「OpenWebUI 整合」未來工作項。
