# 04 — 常見問題 FAQ

> 🌐 [English](04-FAQ.en.md) | **繁體中文**

> 跑不通？先在這裡查。每題都有「症狀 → 原因 → 解法」。

---

## 安裝 / 設定

### Q1：跑 `install.sh` 報錯，找不到 `~/.claude/skills/`

**症狀**：腳本說目錄不存在。
**原因**：你還沒安裝 Claude Code，或 Claude Code 從未跑過。
**解法**：先跑一次 Claude Code（`claude` 指令），它會建好 `~/.claude/`，再回頭跑 install.sh。

### Q2：n8n 跑不起來

**症狀**：`http://localhost:5678` 打不開。
**解法**：
1. 確認 Docker 在跑：`docker ps`
2. 確認 n8n container 健康：`docker logs n8n --tail 30`
3. 重啟：`docker restart n8n`
4. 仍不行 → 看你的 docker-compose 設定或 [n8n 官方 docs](https://docs.n8n.io/)

### Q3：n8n API 怎麼拿 API key？

**解法**：
1. 開 n8n web UI
2. 左下角頭像 → Settings → API
3. 「Create」→ 取個名字 → 複製 token
4. 設環境變數：`export N8N_API_KEY=<token>` / `export N8N_API_URL=https://your-n8n.example.com`

---

## 寫便利貼

### Q4：便利貼要寫多詳細？

**簡答**：跟你跟同事講話一樣就好。AI 會猜不到的地方會回問你。

**好範例**：
> 每天早上 9 點抓銷售資料寄日報給老闆。失敗就在 Slack #ops 通知。

**太簡單，AI 會問你細節**：
> 抓資料寄報表

**沒必要這麼長**：
> 系統需求文件 v1.0：本流程於 UTC+8 時區每日 09:00 執行 ETL...

### Q5：一定要寫中文嗎？英文可以嗎？

**解法**：都行，AI 兩種都認。也可中英混用。但同一張便利貼建議用同一種語言，避免歧義。

### Q6：可以一張便利貼寫多個流程嗎？

**不建議**。一張便利貼 = 一個 workflow。如果有兩個流程，建兩個 workflow 各貼一張。

### Q7：什麼時候該用「進階 DSL 寫法」？

**解法**：99% 情況用自然語言版就好。只有以下三種情境用 DSL：
1. 企業合規：規格需要嚴謹、可審計
2. 大量重複：自動產生很多類似 workflow，DSL 對 script 友善
3. 自然語言版被 AI 誤解，你想 100% 控制 → 寫 DSL 防誤譯

---

## AI 產 workflow

### Q8：AI 產出的 JSON import 到 n8n 失敗

**症狀**：n8n 顯示「import failed」或 `null value in column "id"`。
**原因**：產 JSON 時可能漏了 n8n 必填欄位（頂層 id / webhook 的 webhookId）。
**解法**：對 AI 說「請依本 Skill Pack §Step 4.1 補頂層 id 與 webhookId 重產」。
（Skill Pack v0.9.0 起已自動處理；若仍漏，是 AI 沒讀到該規則）

### Q9：webhook 怎麼 curl 不通？404

**症狀**：`{"code":404,"message":"The requested webhook ... is not registered."}`
**原因**：workflow 還沒 activate，或 path 寫錯。
**解法**：
1. 在 n8n UI 開 workflow → 右上角 Active toggle 開啟
2. 點 Webhook 節點看實際的 webhook URL（複製貼到 curl）
3. 再試一次

### Q10：activate 失敗 — 「Missing required credential」

**症狀**：API 回 `Cannot publish workflow: Missing required credential: slackApi`
**原因**：節點要 credential reference，但 stub credential 不夠（n8n 在 activate 時檢查 ref 存在）。
**解法**（兩擇一）：
- A. 在 n8n UI 為該節點建一個真實 credential（即使 token 是假的，先讓 ref 存在），就能 activate。
- B. 對 AI 說「請補 stub credentials reference 讓 workflow 能 activate」，AI 會依 SKILL §Step 4.2 加上。

### Q11：activate 失敗 — 「Unauthorized: invalid token specified」

**症狀**：Telegram bot trigger 那種 trigger 連線型節點。
**原因**：Telegram trigger 在 activate 時會撥真實 Telegram API 驗證 bot token。Stub 無法通過。
**解法**：到 [BotFather](https://t.me/botfather) 申請真實 bot token → n8n 建 Telegram credential → 用真實 ID。**這是必須的，沒有 workaround**。

### Q12：webhook path 衝突

**症狀**：`There is a conflict with one of the webhooks`
**原因**：同 n8n 實例不能有 2 個 active workflow 用同一個 `webhook + path`。
**解法**：把 path 改成獨一無二（例如 `/order` → `/order-myteam-2026`）。AI 產 v0.9.0+ 會自動加 workflow tag 避免衝突。

### Q13：執行時失敗 — 「Credential with ID "stub-XXX" does not exist」

**症狀**：activate 過了，但 curl 觸發時 execution 是 error。
**原因**：stub credential 只能過 activate 檢查，**真要執行必須換成真實 credential**。
**解法**：在 n8n UI 為該節點選一個真實的 credential（先建好），重新觸發測試。

---

## 三種使用方式

### Q14：哪一種模式最適合我？

| 你的情況 | 用哪一種 |
|---|---|
| 我已經知道我要做什麼，想最快 | Cookbook 照抄（看 [02-USAGE-MODES.md](02-USAGE-MODES.md) 模式 1）|
| 我完全不知道怎麼描述 | 問答模式（對 AI 說「啟用問答模式」）|
| 我有概念但想看別人怎麼做 | 範例查詢（對 AI 說「找跟 X 相關的範例」）|

### Q15：可以混用嗎？

**可以**。常見組合：
- 範例查詢 → 找到相近範例 → 用問答模式補差異 → AI 產出
- 問答模式收到一半發現有現成範例 → 切換到範例查詢

---

## 三層結構

### Q16：能不能不要 Layer 3 那張藍色便利貼，太佔空間

**不行**。Layer 3 是必須的，原因：
- 列出你需要設哪些 credential（不寫你會忘）
- 標註資安風險（譬如 webhook 沒驗 secret）
- 寫測試案例

如果嫌長，可以把藍色便利貼縮小（拖角落），但**不能刪**。

### Q17：我手動改了 Layer 1（黃色便利貼），要重新產嗎

**對**。改完 Layer 1 後對 AI 說「請依新的 Layer 1 重新產」，AI 會替換 Layer 2 + Layer 3，**保留你的 Layer 1**。

### Q18：可以對 Layer 2 直接改節點嗎

**可以**。但 Layer 1 與實作會脫鉤。建議改完後在 Layer 1 補一行註明「人工調整：XXX」。

---

## 企業 / 進階

### Q19：可以管多個 n8n 實例嗎（dev / staging / prod）

**目前不在 Pack 內建**，但你可以靠環境變數切換 `N8N_API_URL`。產 workflow 時對 AI 說「先 import 到 dev，測過再 import prod」。未來 v1.x 會加多環境管理。

### Q20：客戶資料含 PII，AI 可以處理嗎

**可以但有規則**：
1. 便利貼**不要寫實際 PII**（不寫真實電話 / 身分證 / Email）
2. 用佔位符（如「客戶 email」「電話」）AI 會產對應節點
3. 真資料只在 n8n 執行階段才出現
4. 啟動 `tigerai-enterprise-patterns` Skill（對 AI 說「企業級模式」），會強制加資安提醒到 Layer 3

### Q21：如何同步 Skill Pack 升級

**解法**：
1. `git pull` 最新 Skill Pack
2. 重跑 `install.sh` 覆蓋舊 skills
3. 對 AI 說「重新讀取 Skill Pack」（或重啟 Claude Code）
4. 看 [CHANGELOG.md](CHANGELOG.md) 確認版本變化

---

## 都不是這些問題？

把錯誤訊息 + 你做的步驟貼給 AI，說：

> 「我跟著 [檔名] 在做 [步驟]，遇到 [錯誤]，幫我診斷」

AI 會引導你解決。極少數真的卡住，可在 [GitHub Issue](https://github.com/) 回報（如本 Pack 已開源）或聯絡 TigerAI 支援。
