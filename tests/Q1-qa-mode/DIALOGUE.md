# Test Q1：問答模式 End-to-End 對話腳本

## 情境設定
**使用者**：小型補習班老闆 Tina，沒寫過程式，想自動化「每天提醒哪些學員要繳學費」。
**輸入**：「我有一張 Google Sheet 記錄每個學員下次繳費日，我想每天早上收到提醒。」

---

## 對話實錄（模擬完整 5 階段）

### 起始（隱式觸發問答模式）

> **Tina**：我想做一個自動提醒，但我不會寫 sticky note。

> **AI**：好，我帶你一步步寫。我會分 5 個階段問你問題，每階段一兩題，全部問完幫你整理成需求草稿。隨時想跳出說一聲就好。
>
> **【階段 1：觸發】**
>
> Q1：這個流程**什麼時候**要執行？
> - A. 收到外部系統的請求
> - B. **固定時間執行**（每天 / 每週 / 每小時）
> - C. 我手動點 Run
> - D. 使用者填表單

---

### 階段 1：觸發

> **Tina**：B，每天早上 9 點

> **AI**：✅ 紀錄 `@trigger: schedule cron "0 9 * * *"`
>
> **【階段 2：輸入資料】**
>
> Q2：每天 9 點觸發時，要從哪裡拿資料？
> - 你說有 Google Sheet 對嗎？我先預設從 Google Sheet 讀
> - Sheet 名稱、檔名、欄位（哪一欄是繳費日、哪一欄是學員姓名 / 電話）能告訴我嗎？

> **Tina**：檔案叫「補習班學員」，分頁叫「繳費紀錄」，A 欄姓名、B 欄手機、C 欄下次繳費日

> **AI**：✅ 紀錄
> ```
> @input: Google Sheet "補習班學員" / 分頁 "繳費紀錄"
>   - A: 姓名 (string)
>   - B: 手機 (string)
>   - C: 下次繳費日 (date YYYY-MM-DD)
> ```

---

### 階段 3：步驟（循環提問）

> **AI**：**【階段 3：步驟】**
>
> 拿到全部學員後，第 1 步要做什麼？

> **Tina**：找出 7 天內要繳費的人

> **AI**：✅ 紀錄 `@step: 過濾 下次繳費日 ≤ 今天+7 天`
>
> 然後呢？

> **Tina**：把這些人列成清單

> **AI**：「列成清單」我幫你解讀成「彙總成單一訊息」可以嗎？例如：
> ```
> 📋 本週繳費提醒
> - 王小明 0912-xxx-xxx，到期 5/8
> - 李小華 0987-xxx-xxx，到期 5/10
> ```
> 對嗎？

> **Tina**：對

> **AI**：✅ 紀錄 `@step: 彙總成單一訊息（每行一人，含姓名/電話/日期）`
>
> 還有下一步嗎？

> **Tina**：沒有了

---

### 階段 4：輸出

> **AI**：**【階段 4：輸出】**
>
> Q4：訊息要送到哪裡？
> - A. **Slack**
> - B. **Email**
> - C. LINE Notify
> - D. 都不用，我直接回 webhook 看

> **Tina**：B，寄到我自己的 Email

> **AI**：請給我你的 Email 與想要的主旨。

> **Tina**：tina@cram.com，主旨「本週繳費提醒」

> **AI**：✅ 紀錄 `@output: gmail to tina@cram.com, subject "本週繳費提醒 - {today}"`

---

### 階段 5：錯誤處理

> **AI**：**【階段 5：錯誤】**
>
> Q5：執行失敗時怎麼辦？
> - A. 忽略
> - B. **通知我**
> - C. 自動重試
> - D. 不確定，用預設（通知 + 重試 3 次）

> **Tina**：D 就好

> **AI**：✅ 紀錄 `@on-error: 通知 tina@cram.com + retry 3`

---

### 結束：產出 Layer 1 草稿並請使用者確認

> **AI**：好，我整理好了，請你看一下：
>
> ```markdown
> ## 【AI 整理的需求草稿】請確認
>
> @flow: 每天早上自動提醒一週內要繳費的學員
> @trigger: schedule cron "0 9 * * *"
> @input: Google Sheet "補習班學員" / 分頁 "繳費紀錄"
>   - A: 姓名 (string)
>   - B: 手機 (string)
>   - C: 下次繳費日 (date)
> @step: 讀取整張分頁
> @step: 過濾 下次繳費日 <= 今天+7 天
> @step: 彙總成單一訊息（每行：姓名/電話/日期）
> @output: gmail to tina@cram.com, subject "本週繳費提醒 - {today}"
> @on-error: gmail to tina@cram.com + retry 3
> ```
>
> ✅ 確認 → 我立刻產出完整 workflow（中間 nodes + 下方 AI 說明）
> ✏️ 要修改哪一行？

> **Tina**：確認

---

### 接力 → sticky-note-to-workflow Skill

> **AI**：（呼叫 `sticky-note-to-workflow` Skill，七步產出流程）
>
> Workflow 已產出，見 [output-workflow.json](output-workflow.json)。
>
> 三層結構：Layer 1（你的需求）保留在上方黃色 sticky note；中間是 9 個 nodes；下方藍色 sticky 我列了 3 個 credential 需求（Google Sheet OAuth / Gmail OAuth）與 2 個假設請確認。
>
> 想試跑 → 請給我你的 n8n 實例 URL，我用 `n8n-api-bridge` 幫你部署。
