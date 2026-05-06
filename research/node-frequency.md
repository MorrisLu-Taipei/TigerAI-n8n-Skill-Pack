# Node Frequency 統計（Phase 1）

> 🌐 [English](node-frequency.en.md) | **繁體中文**

> 來源：`reference-workflows/` 的 2,061 個 workflow，0 個解析失敗。
> 由 `_scan.js` 自動產生，原始資料見 `_summary.json` / `workflow-index.json`。
> **解讀方式**：「N」= 出現此 node 的 workflow 數量（不是節點實例數）。

---

## 1. 總覽指標

| 指標 | 值 |
|---|---|
| 總 workflow 數 | 2,061 |
| 廠商/分類資料夾 | 188 |
| 獨立 node type 數 | **419** |
| 含 stickyNote 的 workflow | **1,327 (64%)** |
| 不含 stickyNote 的 workflow | 734 (36%) |
| 平均 stickyNote 數（有 sticky 的 workflow）| **5.3 張** |
| 含錯誤處理的 workflow | 251 (**僅 12%**) ⚠️ |

### 關鍵啟示
- ✅ **64% workflow 已用 stickyNote 註解**——我們的三層結構有強烈先例。
- ✅ 平均一個 workflow 5+ 張 sticky note——使用者習慣多區塊註解，**Layer 1 / 3 各允許多張**符合慣例。
- ⚠️ **只有 12% 寫錯誤處理**——這是 AI 必須補強的弱點。Layer 3 的「已知限制」段必須提醒。

---

## 2. Workflow 規模分布

| 桶 | 節點數 | 數量 | 比例 |
|---|---|---|---|
| tiny | ≤ 3 | 192 | 9% |
| small | 4–7 | 507 | 25% |
| medium | 8–15 | 612 | 30% |
| large | 16–30 | 534 | 26% |
| xlarge | 31+ | 216 | 10% |

> **設計含意**：54% 落在 small/medium。AI 預設應產 ≤15 節點；超過時主動建議拆 sub-workflow。

---

## 3. Trigger 類型排行

| Trigger | 出現 workflow 數 | 比例 |
|---|---|---|
| `manualTrigger` | 927 | 45% |
| `webhook` | 313 | 15% |
| `scheduleTrigger` | 311 | 15% |
| `executeWorkflowTrigger` | 180 | 9% |
| `formTrigger` | 114 | 6% |
| `cron`（舊版）| 108 | 5% |
| `emailReadImap` | 28 | 1% |
| `errorTrigger` | 18 | <1% |

> **設計含意**：
> - 公開語料偏 demo/模板（manualTrigger 過半）。
> - 真實生產 workflow 以 webhook + schedule 為主（合計 30%）。
> - `cron`（舊）與 `scheduleTrigger`（新）並存——AI 一律推 `scheduleTrigger`。

---

## 4. Top 30 最常用 Node Types

| 排名 | Node Type | Workflow 出現數 | 角色 |
|---|---|---|---|
| 1 | stickyNote | 1,327 | 註解 |
| 2 | stopAndError | 1,083 | 主動拋錯 |
| 3 | set | 1,069 | 設欄位/組訊息 |
| 4 | noOp | 937 | 占位/收斂分支 |
| 5 | manualTrigger | 927 | 手動觸發 |
| 6 | httpRequest | 895 | API 呼叫 |
| 7 | if | 660 | 二分條件 |
| 8 | code | 516 | 自訂 JS/Py |
| 9 | merge | 340 | 多輸入合併 |
| 10 | webhook | 313 | HTTP trigger |
| 11 | scheduleTrigger | 311 | 排程 |
| 12 | splitOut | 295 | 拆陣列 |
| 13 | googleSheets | 281 | 試算表 |
| 14 | switch | 234 | 多分支 |
| 15 | splitInBatches | 224 | 批次迴圈 |
| 16 | filter | 195 | 過濾 |
| 17 | executeWorkflowTrigger | 180 | sub-workflow 入口 |
| 18 | telegram | 176 | 通訊 |
| 19 | aggregate | 173 | 彙總 |
| 20 | gmail | 168 | Email |
| 21 | googleDrive | 165 | 雲端檔案 |
| 22 | respondToWebhook | 161 | webhook 回應 |
| 23 | wait | 149 | 限速/延遲 |
| 24 | slack | 140 | 通訊 |
| 25 | function | 125 | (舊 code) |
| 26 | extractFromFile | 118 | 讀檔 |
| 27 | formTrigger | 114 | 表單 |
| 28 | airtable | 113 | 雲端 DB |
| 29 | cron | 108 | (舊排程) |
| 30 | telegramTrigger | 94 | Telegram trigger |

> **設計含意**：DSL 標籤對應表（`sticky-note-dsl.md` §4）優先級已正確涵蓋 Top 20。

---

## 5. AI 必須記住的「Boring 但必備」節點

頻率高但容易被新手忽略：

| Node | 用途 | AI 何時要主動加 |
|---|---|---|
| `set` | 整形資料 | 跨節點欄位轉換時 |
| `noOp` | 分支收斂 | if/switch 後想合流時 |
| `stopAndError` | 主動拋錯 | 驗證失敗時 |
| `merge` | 多輸入合併 | 平行分支結束 |
| `splitOut` | 陣列拆單筆 | 上游回 array、下游要逐筆 |
| `aggregate` | 收集 batch 結果 | splitInBatches 後要回合 |
| `respondToWebhook` | webhook 回應 | webhook trigger 必配 |

---

## 6. 過時節點（AI 應避免）

| 節點 | 替代 |
|---|---|
| `n8n-nodes-base.cron` | `n8n-nodes-base.scheduleTrigger` |
| `n8n-nodes-base.function` | `n8n-nodes-base.code` |
| `n8n-nodes-base.functionItem` | `n8n-nodes-base.code` |

> 雖然語料中 `cron` (108) / `function` (125) 仍有出現，AI 產出時一律使用新版。
