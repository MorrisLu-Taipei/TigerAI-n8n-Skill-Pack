# Sticky Note 三層結構規範 v1.0

> 🌐 [English](sticky-note-three-layer.en.md) | **繁體中文**

> **適用對象**：使用本 Skill Pack 的終端使用者、AI Agent、整合工程師
> **核心約束**：每一個由 AI 產生的 n8n workflow 必須符合本規範的三層結構

---

## 1. 三層結構總覽

每個 workflow 在 n8n 畫布上由**三條垂直軌道（lanes）**構成，以 `position.y` 區分：

```
┌────────────────────────────────────────────────────────────────┐
│  Layer 1 — USER INTENT (上方)            y ≈   -300 ~  -50    │
│  使用者親手寫下的 sticky notes           顏色：黃色 (color=4)  │
│  AI 視為「需求規格」，不得修改                                │
├────────────────────────────────────────────────────────────────┤
│  Layer 2 — WORKFLOW NODES (中間)         y ≈     0  ~  500    │
│  AI 產生的真實 nodes 與 connections                           │
│  所有 Trigger / Logic / Action / Output 節點皆在此            │
├────────────────────────────────────────────────────────────────┤
│  Layer 3 — AI COMMENTARY (下方)          y ≈   600  ~  900    │
│  AI 回寫的 sticky notes                  顏色：藍色 (color=5) │
│  紀錄：節點選型理由、credential 需求、測試建議、限制          │
└────────────────────────────────────────────────────────────────┘
```

### 為什麼三層？
- **可審查**：人類審閱者可一眼分辨「需求 vs 實作 vs AI 註記」。
- **可追溯**：當 workflow 出問題時，能比對「使用者原意」與「AI 詮釋」是否一致。
- **可迭代**：使用者只需更新 Layer 1，重跑 AI 即可重生 Layer 2/3，Layer 1 永遠是 source of truth。

---

## 2. Layer 1 — USER INTENT（使用者寫）

### 2.1 技術定義
- Node type：`n8n-nodes-base.stickyNote`
- `parameters.color = 4`（黃色）
- `position.y` 介於 `-300` 至 `-50`
- **AI 看到 color=4 即知道這是使用者輸入，禁止修改或移動**

### 2.2 內容規範（DSL，詳見 `sticky-note-dsl.md`）

每張 Layer 1 sticky note 必須包含至少 1 個 DSL 區塊。最小可解析範例：

```markdown
## 流程意圖
@flow: 收訂單 → 驗證 → 通知

@trigger: webhook POST /order
@step: 驗證 amount > 0
@step: 寫入 Google Sheet
@step: 發 Slack 通知 #ops
@on-error: 寄信給 admin@example.com
```

### 2.3 多張 sticky note 的順序
- 多張 Layer 1 sticky note 依 `position.x`（由左至右）依序解讀。
- AI 視為單一連續需求文件。

---

## 3. Layer 2 — WORKFLOW NODES（AI 寫）

### 3.1 規範
- 所有非 sticky-note 節點皆屬此層。
- `position.y` 介於 `0` 至 `500`。
- 每個節點的 `notes` 欄位**必填**：用一句話說明此節點對應 Layer 1 的哪個 `@step` 或 `@trigger`。
- `connections` 必須完整、無孤立節點。

### 3.2 對應規則
| Layer 1 DSL | Layer 2 推論 |
|---|---|
| `@trigger: webhook ...` | `n8n-nodes-base.webhook` |
| `@trigger: schedule ...` | `n8n-nodes-base.scheduleTrigger` |
| `@trigger: form ...` | `n8n-nodes-base.formTrigger` |
| `@step: 驗證 X` | `n8n-nodes-base.if` 或 `code` 節點 |
| `@step: 寫入 Google Sheet` | `n8n-nodes-base.googleSheets` |
| `@step: 發 Slack ...` | `n8n-nodes-base.slack` |
| `@step: 呼叫 API ...` | `n8n-nodes-base.httpRequest` |
| `@step: AI 分類 ...` | `@n8n/n8n-nodes-langchain.agent` 或 OpenAI 節點 |
| `@on-error: ...` | Error Trigger workflow 或節點層級 `continueOnFail` |

> 完整對應表見 `sticky-note-dsl.md` 第 4 章。

---

## 4. Layer 3 — AI COMMENTARY（AI 寫）

### 4.1 技術定義
- Node type：`n8n-nodes-base.stickyNote`
- `parameters.color = 5`（藍色）
- `position.y` 介於 `600` 至 `900`
- 每個 workflow **至少一張**，建議按 Layer 2 區段對齊位置擺放多張

### 4.2 必含內容（Markdown 模板）

```markdown
### 🤖 AI 實作說明 — <對應 Layer 1 區塊名稱>

**節點選型**
- `<node-type>`：選用原因（為何不選 alternatives）

**所需 Credentials**
- [ ] <credential-name>：<說明此 credential 在哪個節點使用>

**前提假設**
- 假設 1：<例如：Google Sheet 的 columns 已存在>
- 假設 2：<例如：Slack channel #ops 已建立並授權給 bot>

**測試建議**
1. <最小可驗證測試案例>
2. <錯誤路徑測試案例>

**已知限制**
- <例如：未實作 rate-limit retry，若 API 超量會直接失敗>

**對應使用者需求**
- 對應 Layer 1: `@trigger: ...` / `@step: ...`
```

### 4.3 為何強制？
- 使用者可在不看程式碼的情況下，理解 AI 做了什麼決策。
- 後續維運者（不一定是 AI）有交接文件。
- 出事時可區分「AI 誤解需求」vs「需求本身有缺陷」。

---

## 5. 顏色語意總表

| color 值 | 用途 | 誰可寫 |
|---|---|---|
| 4 (黃) | Layer 1 — 使用者需求 | 使用者 |
| 5 (藍) | Layer 3 — AI 說明 | AI |
| 7 (綠) | （保留）人類維運者後續補充 | 人類維運者 |
| 6 (紅) | （保留）標示已知 BUG / 待辦 | 任何人 |
| 1–3 | 不使用，避免歧義 | — |

---

## 6. `@on-error` 兩種實作模式

n8n 有兩種錯誤處理機制。AI 必須依 Layer 1 描述選對：

### 模式 A：節點層級 `continueOnFail`（同一 workflow 內）
- **適用**：單一節點失敗不應中斷，後續分支自行處理（如 Test 3 Telegram bot）
- **實作**：在會失敗的節點設 `"continueOnFail": true`，後接 `if` 判斷 `$json.error` 分流
- **限制**：只處理該節點失敗，不能 catch 整 workflow 例外

### 模式 B：Error Trigger workflow（跨 workflow）
- **適用**：整 workflow 任何節點失敗都要通報（如 Test 2 排程任務）
- **實作**：另建一個 workflow，trigger 使用 `n8n-nodes-base.errorTrigger`，在「Settings → Error Workflow」綁定到主 workflow
- **限制**：是獨立 workflow，無法在同一 JSON 內表達；AI 必須在 Layer 3「已知限制」明示「請另建 Error Trigger workflow」

### AI 選擇規則
| Layer 1 描述 | 用模式 |
|---|---|
| 「失敗時 fallback 回某動作」「失敗回預設值」 | A |
| 「失敗時通知 oncall」「整個流程失敗就警示」 | B |
| 「失敗時重試 N 次」 | 節點 retry config（與 A 結合） |
| 模糊（只寫 `@on-error: slack ...`）| A 嘗試；無對應失敗節點則改 B 並標註 |

---

## 7. 違反規範的處置

AI 在解析 workflow 時，若遇到下列情境**必須拒絕生成並回報**：

1. 找不到任何 color=4 的 sticky note → 「沒有需求輸入」
2. Layer 1 DSL 解析失敗（無任何 `@trigger`）→ 「需求格式不正確」
3. 同一 workflow 內已存在 color=5 的 sticky note → 「workflow 已被 AI 處理過，是否要覆寫？」（需使用者確認）

---

## 8. JSON 片段範例

### Layer 1（使用者寫）
```json
{
  "id": "sticky-user-1",
  "name": "使用者需求",
  "type": "n8n-nodes-base.stickyNote",
  "typeVersion": 1,
  "position": [0, -200],
  "parameters": {
    "color": 4,
    "width": 400,
    "height": 200,
    "content": "## 流程意圖\n@trigger: webhook POST /order\n@step: 驗證 amount > 0\n@step: 寫入 Google Sheet"
  }
}
```

### Layer 3（AI 回寫）
```json
{
  "id": "sticky-ai-1",
  "name": "AI 實作說明",
  "type": "n8n-nodes-base.stickyNote",
  "typeVersion": 1,
  "position": [0, 700],
  "parameters": {
    "color": 5,
    "width": 400,
    "height": 280,
    "content": "### 🤖 AI 實作說明\n\n**節點選型**\n- `webhook`：對應 @trigger\n- `if`：驗證 amount\n- `googleSheets`：append 模式\n\n**所需 Credentials**\n- [ ] Google Sheets OAuth2\n\n**測試建議**\n1. POST 合法 amount → 應寫入\n2. POST amount=-1 → 應被 if 擋下"
  }
}
```

---

**版本**：v1.0
**狀態**：規範鎖定，後續 cookbook、DSL、Skill 皆以本檔為準。
