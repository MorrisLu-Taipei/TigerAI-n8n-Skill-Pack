---
name: sticky-note-to-workflow
description: Core skill that converts a Layer 1 Sticky Note (DSL-formatted user requirement) into a complete three-layer n8n workflow JSON — Layer 1 preserved, Layer 2 nodes generated, Layer 3 AI commentary auto-written. Use when the user pastes a sticky note draft, references an existing workflow ID containing user sticky notes, or asks to "generate the workflow" / "build it" / "產 workflow" / "幫我寫 workflow" after providing a DSL spec. This is the central executor — it orchestrates the n8n-mcp tools, validates output, and emits a JSON ready for n8n import.
---

# sticky-note-to-workflow — 核心 Skill

> 🌐 [English](SKILL.en.md) | **繁體中文**

## 1. 觸發條件

**精確觸發詞**：
- 「產 workflow」/「建 workflow」/「幫我寫 workflow」
- 「generate the workflow」/「build it」/「create」
- 使用者貼出含 `@trigger:` `@step:` 的 sticky note 草稿

**隱式觸發**：
- 問答模式（`tigerai-qa-mode`）收完 5 階段，使用者確認 Layer 1 → 自動接力進本 Skill
- 範例查詢模式（`tigerai-example-finder`）使用者選 A（拿範例改）→ 自動接力

---

## 2. 輸入合約

接收以下任一形式：

| 形式 | 來源 |
|---|---|
| 純文字 Layer 1（含 DSL 標籤） | 對話內貼上 |
| n8n workflow ID + 已存在的 Layer 1 sticky note | n8n REST API 讀取（透過 `n8n-api-bridge` Skill） |
| 結構化 JSON `{ layer1: "..." }` | 程式呼叫 |

---

## 3. 七步產出流程

### Step 0：判斷輸入是「自然語言」還是「DSL」（v0.10.0 必做）

使用者寫的便利貼有兩種風格，AI 必須先判斷：

| 訊號 | 判斷 |
|---|---|
| 含 `@trigger:` / `@step:` / `@branch:` 等標籤 | DSL → 直接進 Step 1 |
| 純自然語言（中文 / 英文 / 混雜） | 先做 **Step 0.1 NL→DSL 翻譯** 再進 Step 1 |
| 兩者混雜 | 視為自然語言處理（更寬鬆） |

#### Step 0.1：自然語言 → DSL 內部翻譯

LLM 把使用者描述映射到 `@`-tagged 結構（**不展示給使用者**，純內部）：

| 自然語言訊號 | 映射 |
|---|---|
| 「每天早上 9 點」/「每週一」 | `@trigger: schedule cron "..."` |
| 「有人 call webhook」/「外部系統送資料」 | `@trigger: webhook POST /...` |
| 「我要一個表單給人填」 | `@trigger: form` + `@form-fields:` |
| 「Telegram bot 收訊息」 | `@trigger: telegram` |
| 第 1, 2, 3 點 / 步驟 / 然後 | 多個 `@step:` |
| 「分成 X / Y / Z」 | 多個 `@branch:` |
| 「失敗就 ...」 | `@on-error:` |
| 「假設 ...」/「⚠️ ...」 | `@assume:` |
| 「寄到」/「通知」/「回應」 | `@output:` |

**翻譯後 AI 必複述「我理解的需求是 ...」並請使用者確認**（避免誤譯）。
複述語言用使用者原語言（不講 DSL）。

### Step 1：解析 DSL
- 套 `spec/sticky-note-dsl.md` §6 解析器規範
- Tokenize → 抽 `@trigger` / `@step` / `@branch` / `@output` / `@on-error` / `@assume` / `@form-fields` / `@credential` / `@retry` / `@batch`
- **失敗條件**：缺 `@trigger` 或 `@step` → 若是自然語言路徑來的、回 Step 0.1 重譯（標警告給使用者）；若是 DSL 路徑、直接拒絕並要求補齊

### Step 2：選骨架
- 比對 `research/patterns.md` §2 七大 Pattern (A–G)
- 命中度高者優先；多個命中時取最簡單的
- 同時記錄「為何選 X 不選 Y」→ 寫入 Layer 3「節點選型」段

### Step 3：解析節點
- 對每個 `@step`：
  1. 套 DSL §4 詞彙對應表抽節點 type
  2. 若不在表內 → 查 `research/node-frequency.md` Top 30 + AI 知識庫
  3. 仍找不到 → 走 DSL §6.2「降級對應」
- 對 `@trigger`：套 DSL §3 字典（v1.1 含 telegram/slack/discord/googleDrive 等）
- 對 `@branch`：產 `switch` 節點 + 多輸出，缺 fallback 必補

### Step 4：產 nodes 陣列
- 每節點欄位：
  ```json
  {
    "id": "<unique>",
    "name": "<ASCII-only-PascalCase>",
    "type": "<typeFromMapping>",
    "typeVersion": <最新穩定版>,
    "position": [x, y],
    "parameters": { ... },
    "notes": "<對應 Layer 1 的 @step 文字>"
  }
  ```
- `position.y` 嚴守三層分區：Layer 1 sticky < 0、Layer 2 nodes ∈ [0, 500]、Layer 3 sticky > 600
- `position.x` 依執行順序遞增 220–260px / 節點

### Step 4.2：Activate 友善設計（v0.9.0 R3 驗證強制）

n8n 有兩級 credential 驗證：activate 時只查 ref 存在；execute 時查真實 DB。為了讓 workflow 能即時 activate（即使使用者尚未配 credential），AI 必須對**非連線型 action node** 自動補 stub credentials：

```json
"credentials": {
  "<credName>": { "id": "stub-<random8>", "name": "STUB-<credName>" }
}
```

**Action node 對應 credential**：
| node type | credential 名 |
|---|---|
| `n8n-nodes-base.slack` | `slackApi` |
| `n8n-nodes-base.gmail` | `gmailOAuth2` |
| `n8n-nodes-base.googleSheets` | `googleSheetsOAuth2Api` |
| `n8n-nodes-base.postgres` | `postgres` |
| `n8n-nodes-base.jira` | `jiraSoftwareCloudApi` |
| `n8n-nodes-base.awsS3` | `aws` |
| `@n8n/n8n-nodes-langchain.openAi` | `openAiApi` |
| `n8n-nodes-base.telegram`（action）| `telegramApi` |

**連線型 trigger（不能用 stub）**：
- `telegramTrigger`、`emailReadImap`、`slackTrigger`、`discordTrigger` 等
- AI 必須在 Layer 3 用 ⚠️ 紅字提示「activate 前需在 n8n 建真實 credential」
- Stub 會直接讓 activate 失敗（n8n 撥真實 API 驗證 token）

### Step 4.3：避免 webhook path 衝突（v0.9.0 規則）

同一 n8n 實例不能有 2 個 active workflow 共用 `webhook + path`。AI 在生成 webhook 節點時：
- 若 Layer 1 寫 `@trigger: webhook POST /order` → 預設用 path `order-<workflow-tag>`
- workflow-tag 從 workflow name 推（如 `Order-Risk-Routing` → `risk` 或 `order-risk`）
- Layer 3 列出最終 path 並提醒「同實例不可重複」

### Step 4.1：n8n 真實匯入必需欄位（R3 驗收強制）

n8n CLI `import:workflow` 與 REST API 對 JSON 有額外要求，AI 必須產出：

| 位置 | 欄位 | 規則 | R3 驗證錯誤訊息 |
|---|---|---|---|
| 頂層 workflow | `id` | 16 字元 nanoid（[A-Za-z0-9]）| `null value in column "id" of relation "workflow_entity"` |
| webhook trigger node | `webhookId` | UUID v4 | webhook URL 退化使用 node name → URL 不可用 |
| webhook trigger node | `name` | **ASCII only / 無空格 / 無 `/`** | 含 `/` 或中文時 webhook URL 變 `<workflowId>/<encoded-name>/<path>` 無法呼叫 |

**生成程式碼**：
```js
function newWorkflowId() {
  const a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s=''; for (let i=0;i<16;i++) s+=a[Math.floor(Math.random()*a.length)];
  return s;
}
function newWebhookId() { return crypto.randomUUID(); }
function safeWebhookNodeName(s) { return s.replace(/[^A-Za-z0-9]/g, ''); }
```

**Layer 3 必註明**：
- 「`webhookId` 已自動產生為 `<uuid>`，webhook URL 為 `https://<n8n>/webhook/<configured-path>`」
- 若節點名被改寫，列出對照（給人類維運者好查）

### Step 5：產 connections
- 主鏈線性：trigger → step1 → step2 → ... → output
- `if` / `switch`：依輸出 index 連接各分支
- `splitInBatches`：output[0]→loop body、output[1]→aggregate
- 多分支結尾：必接 `merge` (mode=append) → 單一 output
- 結構性節點自動加：if 後 noOp、splitInBatches 後 aggregate、webhook 配 respondToWebhook

### Step 6：產 Layer 3 sticky note
- 強制含 5 段（依 `spec/sticky-note-three-layer.md` §4.2 模板）：
  1. 節點選型（含為何不選 alternatives）
  2. 所需 Credentials（清單格式 `- [ ] xxx`）
  3. 前提假設（含 `@assume` 內容）
  4. 測試建議（≥ 2 case：golden + error）
  5. 已知限制
  6. 對應使用者需求（@trigger / @step / @output / @on-error 一一對應）
- 套用反模式檢查（patterns.md §3）— 若觸發任一條，加入「已知限制」

### Step 7：驗證
- 透過 `n8n-api-bridge` Skill 把 JSON PUT 回 n8n（n8n 會做內建 schema 驗證）
- 422 → 依錯誤訊息 AI 自修 → 重新 PUT
- 仍失敗 → 回報使用者並列出問題

---

## 4. 與企業級分支整合

當輸入觸發 `tigerai-enterprise-patterns`（如包含 PDF/MP3/敏感資料），Step 4 套用其規則：

- 重邏輯改成 `httpRequest` 呼叫 worker（不寫 code）
- loop 強制 `batchSize=1`
- Layer 3 多加「資安風險」/「資料留存」段
- 建議使用者建 SDD `specification.md`

---

## 5. 輸出格式

回傳一個 JSON 物件：

```json
{
  "success": true,
  "workflow": { "name": "...", "nodes": [...], "connections": {...}, "settings": {...} },
  "metadata": {
    "skeleton_pattern": "B",
    "node_count": 11,
    "layer3_warnings": ["缺 @on-error 已建議使用模式 B"],
    "downgraded_actions": [],
    "validation": "passed"
  }
}
```

呼叫端可：
- 透過 `n8n-api-bridge` Skill 把 `workflow` PUT 回 n8n
- 直接給使用者下載 import

---

## 6. 失敗模式與處置

| 失敗 | 處置 |
|---|---|
| 缺 @trigger | 拒絕，提示使用者補；或建議啟動問答模式 |
| 動作完全無對應節點 | 列出歧義，要求澄清；不靜默替代 |
| validation 連二次失敗 | 標 `success=false`，回報具體錯誤 + 局部 JSON |
| 節點數超 25（分流型）/ 15（單線型） | 標 warning，建議拆 sub-workflow，仍產出 |

---

## 7. 對話準則

- **產出前先複述意圖**：「我理解的需求是：〈一句話〉。如無誤即開始產出。」
- **產出後直接秀 JSON**，不長篇解釋（解釋已在 Layer 3）
- **同時提示**：「workflow 已含三層結構。Layer 3 列出了 N 個 credential 與 M 個假設請確認。」
- **不騙**：缺什麼就說缺什麼；不確定就標「已知限制」

---

## 8. 與其他 Skill 鏈接

```
tigerai-qa-mode (5 階段問答)  ─┐
tigerai-example-finder (找參考) ─┼─→  sticky-note-to-workflow (本 Skill)
直接貼 Layer 1                  ─┘            │
                                              ▼
                              n8n REST API PUT (含 schema 驗證)
                                              ▼
                              n8n-api-bridge (寫回 n8n)
                                              ▼
                              使用者在 n8n 畫布看三層成品
```
