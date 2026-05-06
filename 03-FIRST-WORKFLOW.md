# 03 — 跟我做：15 分鐘做出你的第一個 Workflow

> 🌐 [English](03-FIRST-WORKFLOW.en.md) | **繁體中文**

> 這份是手把手教學。讀完照做，你會在 n8n 看到 AI 幫你產出的完整 workflow，含節點、連線、和下方 AI 寫的說明便利貼。
>
> 前提：已完成 [01-INSTALL.md](01-INSTALL.md)，n8n 與 Skill Pack 都已就位。

---

## 你會做什麼

把使用情境「**GitHub 有新 Issue 時通知 Slack**」從零跑到完成。

成品長這樣：

```
┌─ 上方黃色便利貼：你寫的需求 ──────────────────┐
│ GitHub 有新 Issue 時，立刻通知 Slack 的         │
│ #dev-issues 頻道。訊息要含 issue 標題、開啟者、 │
│ 連結。Slack 暫時不通就略過不補。                │
└───────────────────────────────────────────────┘
   ↓
┌─ 中間：AI 自動產的節點 ─────────────────────┐
│ Webhook → Set 組訊息 → Slack 發送           │
└─────────────────────────────────────────────┘
   ↓
┌─ 下方藍色便利貼：AI 回寫的說明 ──────────────┐
│ • 節點選型理由                                │
│ • 你需要設定哪些 credential                   │
│ • 假設與已知限制                              │
│ • 怎麼測試                                    │
└───────────────────────────────────────────────┘
```

---

## Step 1：開啟 n8n，建立空 workflow

1. 打開 n8n（通常在 `http://localhost:5678` 或你公司部署的位置）
2. 左上「Workflows → + New」建空 workflow
3. 名稱隨便取，例如「我的第一個 AI workflow」

---

## Step 2：在畫布貼一張便利貼（這就是你的需求）

1. 工具列找 **Sticky Note** 拖到畫布**上方**
2. 顏色選 **黃色**（這是 Layer 1：使用者需求）
3. 把以下文字**整段貼進去**：

```text
GitHub 有新 Issue 時，立刻通知 Slack 的 #dev-issues 頻道。
訊息要包含 issue 標題、開啟者、連結，前面加個 🐛 emoji。
萬一 Slack 暫時不通，就略過不用補通知。
```

> 💡 注意：這段是純中文自然語言。你不用學任何語法。
>
> 也可以參考 [`cookbook/01-webhook-to-slack.md`](cookbook/01-webhook-to-slack.md) 的「🌱 自然語言版」直接複製。

---

## Step 3：呼叫 AI 產 workflow

選擇你環境的方式之一：

### 方式 A — 在 Claude Code 裡（最直接）

對 Claude 說：

> 我在 n8n 開了一個空 workflow，上面只有一張黃色便利貼寫了需求。
> 請幫我把中間的 nodes 跟下方的說明便利貼產出來。

Claude 會：
1. 讀你的便利貼（透過 n8n REST API，需先設好 `N8N_API_URL` / `N8N_API_KEY`）
2. 自動觸發 `sticky-note-to-workflow` Skill
3. 產出 workflow JSON 並寫回你的 n8n

### 方式 B — 把便利貼內容貼到 ChatGPT / Claude.ai 對話

說：

> 我要做一個 n8n workflow，需求如下：[貼便利貼內容]
> 請按 TigerAI Skill Pack 的三層結構，產出可以 import 到 n8n 的 JSON。

AI 會直接回 JSON。複製到 n8n 的「Workflows → Import from File」貼上即可。

### 方式 C — OpenWebUI 整合（如已部署）

直接在對話視窗講，OpenWebUI Function 會呼叫 n8n API 把產出寫回。

---

## Step 4：驗收三層結構

回到 n8n 畫布，你應該看到：

| 位置 | 顏色 | 內容 |
|---|---|---|
| 上方 | 🟡 黃 | 你寫的需求（**沒被改過**）|
| 中間 | — | 三個節點：Webhook → Set → Slack |
| 下方 | 🔵 藍 | AI 寫的說明：節點選型 / 需要哪些 credential / 假設 / 測試方法 |

---

## Step 5：補 credential 才能真的執行

AI 產的 workflow **結構完整但 credential 是 stub**。要真的能跑：

1. 點 Slack 節點 → Credentials → 「Create New」
2. 依 n8n 提示完成 Slack OAuth2 授權
3. 把 stub credential 換成你建好的真實 credential

> 💡 為什麼 AI 不直接幫你建 credential？因為要保護你的 token / 帳號。AI 只負責產結構，秘密由你自己管。

---

## Step 6：實際觸發測試

在你的終端機跑：

```bash
curl -X POST http://localhost:5678/webhook/github-issue \
  -H "Content-Type: application/json" \
  -d '{"title":"我的第一個測試","html_url":"http://example.com/i/1","user":{"login":"me"}}'
```

預期：
- 回應 `{"message":"Workflow was started"}` 200 OK
- Slack #dev-issues 收到訊息：`🐛 新 Issue: 我的第一個測試 by me → http://example.com/i/1`

---

## 不會用 webhook trigger？另外兩種試法

| 你的需求類型 | 改參考哪個 cookbook | 怎麼測 |
|---|---|---|
| 定時跑（每天 / 每週） | [02-schedule-report](cookbook/02-schedule-report.md) | 在 n8n 點「Execute Workflow」手動觸發 |
| 表單收資料 | [03-form-to-database](cookbook/03-form-to-database.md) | 點 Form Trigger 節點看 form URL，瀏覽器打開填資料 |

---

## 完成了！下一步往哪走

| 想做什麼 | 看哪份 |
|---|---|
| 看更多範例 | [`cookbook/00-INDEX.md`](cookbook/00-INDEX.md) — 共 8 個 |
| 不知道我的需求要怎麼描述 | [`02-USAGE-MODES.md`](02-USAGE-MODES.md) → 「問答模式」 |
| 想看別人怎麼做類似的 | [`02-USAGE-MODES.md`](02-USAGE-MODES.md) → 「範例查詢模式」 |
| 遇到問題 | [`04-FAQ.md`](04-FAQ.md) |
| 工程師想看技術規範 | [`spec/`](spec/) 資料夾 |

---

## 卡關了？

對 Claude / ChatGPT 說：

> 「我在跟著 03-FIRST-WORKFLOW.md 跑，卡在 Step N 的 〈描述問題〉」

AI 會接手診斷。也可看 [04-FAQ.md](04-FAQ.md) 的常見問題。
