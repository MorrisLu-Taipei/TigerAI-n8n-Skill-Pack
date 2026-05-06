---
name: tigerai-example-finder
description: Searches the reference-workflows/ corpus (2,061 real n8n workflows) and cookbook/ (8 curated patterns) to find the 3-5 closest examples to the user's described intent, then explains how each one works in plain language and how it differs from the user's need. Use when the user says "範例查詢模式", "找範例", "show me examples", "有沒有人做過", "類似的 workflow", or vaguely describes a goal and wants to see prior art before committing to a design.
---

# TigerAI Example Finder — 範例查詢模式

> 🌐 [English](SKILL.en.md) | **繁體中文**

## 1. 觸發條件

**精確觸發詞**：
- 「範例查詢模式」 / 「Example mode」
- 「找範例」 / 「找類似的」 / 「有沒有現成的」 / 「有沒有人做過 X」
- 「show me examples for ...」 / 「any reference for ...」

**隱式觸發**：
使用者描述含「不知道怎麼做」、「想參考」、「先看看」等詞，AI 主動建議：
> 「要不要我先幫你找幾個類似的範例參考？」

---

## 2. 搜尋來源（依優先順序）

| 來源 | 數量 | 角色 | 搜尋方式 |
|---|---|---|---|
| `cookbook/` | 8 | TigerAI 精選範例（含三層說明） | 讀 INDEX 標題 + 適用情境 |
| `examples/tigerai-flagship/` | 待 Phase 3 | TigerAI 旗艦企業級 | 讀 SDD spec |
| `reference-workflows/` | 2,061 | 公開語料（原始 JSON） | 用 `research/workflow-index.json` 索引（Phase 1 後） + 檔名解析 |

**檔名解析規則**（無索引時的 fallback）：
公開語料命名 `<id>_<Vendor>_<Action>_<Trigger>.json`，可 grep 關鍵字：
- 使用者說「Slack 通知」→ grep `Slack` 在檔名 + sticky note content
- 使用者說「定時抓資料」→ grep `Scheduled` trigger

---

## 3. 搜尋與排序流程

### 3.1 抽關鍵字
從使用者描述抽 1–3 個核心概念：
> 「我要每天早上把客戶清單寄給業務」
> → 關鍵字：`schedule`、`customer`、`email`

### 3.2 三層搜尋
1. 先 cookbook（高品質、有完整三層說明） → 命中即首推
2. 再 examples（企業級） → 對企業客戶優先
3. 最後 reference-workflows（量大、品質參差）

### 3.3 排序

**核心原則：結構價值優先於主題相似**

使用者常以「業務主題」描述需求（如「訂單通知 LINE」），但 workflow 的可重用性來自**骨架**（webhook + set + 通知），非業務主題。AI 排序時須先看骨架。

**排序公式**（高分優先）：
1. **骨架命中度**（最重要）：使用者描述的 trigger / step 數 / 分流 是否與範例骨架對齊？
   - trigger 同（webhook / schedule / form …）：+10
   - 主節點類型同（http+set / merge / splitInBatches）：+5 / 個
2. **來源權重**：cookbook ×3 / flagship ×2.5 / reference ×1
3. **主題詞命中**（次要）：業務領域字眼匹配 +2 / 個（防止主題權重壓過骨架）
4. **時效性扣分**：範例使用已過時節點（cron / function）-3
5. 命中關鍵字數量加分（每個 +1）

**範例：使用者「訂單通知 LINE」**

| 候選 | 主題符合 | 骨架符合 | 來源權重 | 總分 | 排名 |
|---|---|---|---|---|---|
| cookbook/01 GitHub→Slack | ❌（GitHub vs 訂單）| ✅✅（webhook+set+通知 完美對齊）| ×3 | **高** | 1 |
| reference/Telegramtool/1575_Woocommerce | ✅（訂單）| ✅（同骨架）| ×1 | 中 | 2 |
| reference/Mattermost/0294_Woocommerce | ✅ | ✅ | ×1 | 中 | 3 |

> 🎯 **關鍵教訓**：cookbook 01 雖主題不對，但骨架最相似且品質高；排第一比「主題相同但散落各處的 reference」更有助於使用者。

取 Top 3–5 呈現。**呈現時必說明排名理由**（避免使用者誤會）：

> 「範例 1 主題不同（GitHub）但**結構就是你的需求**——webhook 接事件、組訊息、推通知。從這個改最快。」

---

## 4. 呈現格式

對每個命中的範例，AI 用以下模板說明（**白話**，不丟程式碼）：

```markdown
### 範例 N：<檔名或 cookbook 名稱>

**這個 workflow 在做什麼**
<用一句話講清楚業務目的>

**怎麼運作的**
1. 觸發：<webhook / schedule / form>
2. 主要步驟：<3-5 步白話流程>
3. 輸出：<去哪>

**用了哪些關鍵節點（為什麼選它）**
- `<node-type>`：<為何用這個而不是 alternatives>

**跟你的需求對比**
- ✅ 相同：<列出一致處>
- ⚠️ 差異：<列出不同處，指出你需要改什麼>

**直接用？要改？**
建議：<直接套用 / 改 N 處 / 不適合，看下一個>
```

呈現完所有範例後，AI 結尾問：

```
要怎麼進行？
A. 直接拿範例 N 來改 → 我幫你改成你的版本
B. 範例都不夠像 → 啟用「問答模式」從頭設計
C. 給我看更多範例（提供更精確的關鍵字）
```

---

## 5. 範例：完整對話演示

> **使用者**：找一下定時把資料庫資料整理成報表寄出去的 workflow

> **AI**（內部解析）：關鍵字 = `schedule`、`database`、`report`、`email`

> **AI 回應**：
> 找到 3 個相關範例：
>
> ### 範例 1：cookbook/02-schedule-report.md ⭐ 最相近
> **這個 workflow 在做什麼**：每日 08:00 從 API 撈昨日銷售資料，產 HTML 報表寄給業務團隊。
> **怎麼運作的**：
> 1. Schedule 觸發 (cron `0 8 * * *`)
> 2. HTTP 抓 sales API → Code 統計 Top3 → Set 套 HTML 模板
> 3. 寄到 sales@example.com
>
> **跟你的需求對比**：
> - ✅ 相同：定時、產報表、寄 Email
> - ⚠️ 差異：你的資料來源是 DB 不是 API → 把 HTTP 換成 `postgres` 節點即可
>
> **建議**：直接拿來改，5 分鐘可完成
>
> ### 範例 2：reference-workflows/.../1430_Aggregate_Schedule_Send_Scheduled.json
> ... (同模板)
>
> ### 範例 3：...
>
> 要怎麼進行？A / B / C？

---

## 6. 進入下一步

| 使用者選 | AI 動作 |
|---|---|
| A（拿範例改）| 進 `sticky-note-to-workflow`，把範例的 Layer 1 帶入並協助修改 |
| B（從頭設計）| 切換到 `tigerai-qa-mode` 5 階段問答 |
| C（更多範例）| 重新搜尋並呈現第 6–10 名 |
| 不選 / 模糊 | AI 主動推 A（最常見選擇）|

---

## 7. 對話準則

1. **永遠白話**：避免講 `n8n-nodes-base.xxx` 這種 type 名，用「Slack 節點」「資料庫節點」即可
2. **務必對比**：每個範例都要說「跟你的差異」，不要只貼說明
3. **不超過 5 個**：再多會疲勞；找不到就說找不到，建議改用問答模式
4. **不假裝懂**：找不到就誠實說「沒有近似範例，建議直接設計」
5. **語料防呆**：reference-workflows 中可能有外語/古早寫法，AI 該過濾或標註

---

## 8. 與其他 Skill 的關係

- **與 `tigerai-qa-mode`**：互補。範例不夠 → 切問答模式
- **與 `cookbook/`**：第一搜尋來源
- **與 `sticky-note-to-workflow`**：使用者選定範例後接力產出
