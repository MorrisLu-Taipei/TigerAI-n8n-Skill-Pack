# Test Q2：範例查詢模式 End-to-End 對話腳本

## 情境設定
**使用者**：電商小型賣家 Mark，模糊需求「訂單來了通知 LINE」。
- LINE Notify（台灣常見）n8n 沒有原生節點，需走 `httpRequest`
- 使用者沒指定訂單來源（WooCommerce / Shopify / 自家 webhook）

---

## 對話實錄

### 觸發

> **Mark**：找一下「訂單來了就通知 LINE」這種 workflow 有沒有現成的

> **AI**：（隱式觸發 example-finder Skill）
>
> 收到。我幫你從 8 個精選 cookbook + 2,061 個公開語料找最像的。
>
> **解析關鍵字**：`訂單`（order）、`通知`（notification）、`LINE`
>
> 先說一下：**LINE Notify n8n 沒原生節點**，但可以用 HTTP 節點呼叫 LINE Notify API 或 LINE Messaging API；或先用同類通訊（Slack / Telegram / Mattermost）的範例作骨架，最後一步把節點換成 HTTP。
>
> 找到 3 個最近的範例：

---

### 範例 1（cookbook，最相近）

> **AI**：
>
> ### 範例 1：[cookbook/01-webhook-to-slack.md](../../cookbook/01-webhook-to-slack.md) ⭐ 結構最相近
>
> **這個 workflow 在做什麼**
> 收 GitHub Issue webhook → 組訊息 → 通知 Slack。雖然主題是 GitHub，但**結構就是「webhook 接事件 + 組訊息 + 推通知」**，跟你的需求 100% 對齊。
>
> **怎麼運作**
> 1. Webhook trigger（POST 接 payload）
> 2. Set 節點組訊息文字
> 3. Slack 節點發送
>
> **跟你的需求對比**
> - ✅ 相同：webhook 接事件、組訊息、推通知
> - ⚠️ 差異：你要 LINE 不是 Slack；你的 webhook 來源是訂單系統不是 GitHub
>
> **直接用？要改？**
> 建議：拿來改，把 Slack 節點換成 HTTP Request 呼叫 LINE Notify API 即可，10 分鐘可完成。

---

### 範例 2（語料：真實 WooCommerce 訂單）

> **AI**：
>
> ### 範例 2：[reference-workflows/Telegramtool/1575_Telegramtool_Woocommercetool_Automate_Webhook.json](../../reference-workflows/Telegramtool/1575_Telegramtool_Woocommercetool_Automate_Webhook.json)
>
> **這個 workflow 在做什麼**
> WooCommerce 新訂單 webhook → 整理成訊息 → 推 Telegram。**這是與你最像的真實情境**——訂單來源是電商平台、通知到 IM。
>
> **怎麼運作**
> 1. WooCommerce trigger（接訂單 webhook）
> 2. 整理欄位（訂單號、客戶、金額）
> 3. Telegram 節點發送
>
> **跟你的需求對比**
> - ✅ 相同：訂單來源 → IM 通知；payload 是真實訂單結構
> - ⚠️ 差異：用 Telegram 不是 LINE；用 WooCommerce trigger 不是泛用 webhook
>
> **直接用？要改？**
> 建議：如果你**也用 WooCommerce**，這個改 2 處（Telegram → HTTP LINE Notify）就能上。

---

### 範例 3（語料：Mattermost 通訊變化）

> **AI**：
>
> ### 範例 3：[reference-workflows/Mattermost/0294_Mattermost_Woocommerce_Create_Triggered.json](../../reference-workflows/Mattermost/0294_Mattermost_Woocommerce_Create_Triggered.json)
>
> **這個 workflow 在做什麼**
> WooCommerce 訂單 → Mattermost 通知（與範例 2 同骨架不同 IM）。
>
> **跟你的需求對比**
> - ✅ 相同：訂單 → IM
> - ⚠️ 差異：Mattermost / WooCommerce trigger / 不是 LINE
>
> **直接用？要改？**
> 建議：跟範例 2 二選一，依你訂單來源決定。**結構價值與範例 2 重複**，只看你比較喜歡哪個樣板。

---

### 結尾選項

> **AI**：要怎麼進行？
>
> A. **直接拿範例 1 來改** → 我用 cookbook 01 為骨架，把 Slack 換成 HTTP→LINE Notify
> B. **拿範例 2 來改** → 如果你用 WooCommerce
> C. **都不夠像，從頭設計** → 切換到問答模式
> D. **看更多範例**

> **Mark**：A，但我訂單來源是自家後端，不是 WooCommerce

> **AI**：好。我幫你產出 Layer 1 草稿（基於 cookbook 01 + LINE 改造）：
>
> ```markdown
> ## 自家訂單 → LINE Notify
>
> @trigger: webhook POST /order
> @input: { order_id, customer_name, amount, items[] }
> @step: 組訊息 "🛒 新訂單 #{order_id} {customer_name} 共 ${amount}"
> @output: LINE Notify (httpRequest POST https://notify-api.line.me/api/notify, Header "Authorization: Bearer <token>")
> @on-error: continueOnFail (LINE 暫時性失敗不阻斷)
>
> @assume: 已有 LINE Notify access token
> @assume: token 已在 n8n credentials 設為 "Header Auth: lineNotify"
> ```
>
> ✅ 確認 → 接力產 workflow JSON
> ✏️ 改哪裡？

> **Mark**：確認，產 workflow

---

### 接力 → sticky-note-to-workflow

> **AI**：（呼叫 sticky-note-to-workflow Skill）
>
> Workflow 已產出，見 [output-workflow.json](output-workflow.json)。
>
> 重點變化：
> - 沒有 Slack / Telegram 節點，改用 `httpRequest` 打 LINE Notify API
> - 用 Header Auth credential 帶 token，不寫死
> - Layer 3 提醒：LINE Notify 預期 2026 年將停用，建議提早規劃改 LINE Messaging API
