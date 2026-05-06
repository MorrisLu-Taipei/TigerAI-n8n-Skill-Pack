# Cookbook 04 — AI 分類 → 條件分支

> 🌐 [English](04-ai-classify-route.en.md) | **繁體中文**

## 使用情境
收進來的訊息 / Email / 工單，先讓 LLM 分類，再依分類走不同處理路徑。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

```text
客服 Email 進來時（透過 webhook 傳給我），
讓 AI 看一下是哪一類問題，分成：技術 / 帳務 / 其他。

接著依類別處理：
  - 技術問題 → 在 Jira 的 TECH 專案開 ticket
  - 帳務問題 → 轉寄到 billing@example.com
  - 其他 → 在 Slack #cs-general 通知值班同事

如果 AI 分類失敗，也在 #cs-general 通知一聲。
```

**【English】**

```text
When a customer email arrives (via webhook),
ask AI which type of issue it is, classified as: Tech / Billing / Other.

Then process by category:
  - Tech → open a Jira ticket in the TECH project
  - Billing → forward to billing@example.com
  - Other → notify the on-duty colleague in Slack #cs-general

If AI classification fails, also notify in #cs-general.
```

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：客服 Email AI 分流

@trigger: webhook POST /inbound-email
@input: { from, subject, body }
@step: AI 分類 (gpt-4o-mini) → 一個字: "技術" / "帳務" / "其他"
@step: 依分類分流
  - 技術 → 開 Jira ticket project=TECH
  - 帳務 → 寄 Email 到 billing@example.com
  - 其他 → Slack #cs-general 通知值班
@on-error: slack #cs-general "AI 分類失敗: {error}"
```

</details>

---

## 預期 Layer 2

```
[Webhook]
   ↓
[OpenAI: classify]   ← system prompt 限定回單字
   ↓
[Switch: by classification]
   ├─ "技術"  → [Jira: create issue]
   ├─ "帳務"  → [Gmail: send to billing]
   └─ "其他"  → [Slack: #cs-general]
```

| 節點 | type | 關鍵參數 |
|---|---|---|
| Webhook | `n8n-nodes-base.webhook` | path=`inbound-email`, POST |
| OpenAI | `@n8n/n8n-nodes-langchain.openAi` | model=`gpt-4o-mini`, system="你是分類器，只回三選一：技術 / 帳務 / 其他", user=`={{ $json.body.subject }}\n\n{{ $json.body.body }}` |
| Switch | `n8n-nodes-base.switch` | rules: contains "技術" / "帳務" / fallback |
| Jira | `n8n-nodes-base.jira` | project=TECH, summary=`={{ $('Webhook').item.json.body.subject }}` |
| Gmail | `n8n-nodes-base.gmail` | to=`billing@example.com` |
| Slack | `n8n-nodes-base.slack` | channel=`#cs-general` |

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — 客服 Email AI 分流

**節點選型**
- `openAi`（langchain 套件）：用 chat 模式 + 嚴格 system prompt 限制輸出
- `switch`（v3）：3 路分流比 if 串聯清晰
- 跨節點引用上游資料用 `$('Webhook').item.json` 而非 `$json`，避免被 OpenAI 節點覆蓋

**所需 Credentials**
- [ ] OpenAI API key
- [ ] Jira OAuth2 / API token
- [ ] Gmail OAuth2
- [ ] Slack OAuth2

**前提假設**
- LLM 100% 回單字（已用 system prompt 約束，但仍可能 hallucinate）
- Jira project key 為 TECH 且 bot 有建立 issue 權限

**測試建議**
1. 三類各送一筆，驗證分流正確
2. 故意送語意模糊的 → 應走 fallback ("其他")
3. 把 OpenAI key 改錯，驗證 @on-error 路徑

**已知限制**
- LLM 偶爾回非單字（如 "技術問題"），Switch 用 contains 模式可緩解但非完美
- 未實作 confidence score；未來可改用 function calling 強制 JSON 輸出
- OpenAI 計費：每封 ~50 token，月 1 萬封約 $0.50

**對應使用者需求**
- @trigger → Webhook
- @step (AI 分類) → OpenAI
- @step (分流) → Switch + 三個下游節點
- @on-error → Error workflow → Slack
```
