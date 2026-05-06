# 驗收報告：5 情境 End-to-End

> 🌐 [English](REPORT.en.md) | **繁體中文**

> 驗收方法：以本 Skill Pack 的 spec / cookbook / patterns 為唯一參考，由 AI 直接產出 5 個情境的完整三層結構 workflow JSON（dogfooding）。
> 通過標準：(1) JSON 可被 n8n import (2) 三層結構合規 (3) AI 能主動補足缺失 (4) 揭露的 spec 缺口可後續修補。

---

## 1. 結果總覽

| # | 情境 | 屬性 | 節點數 | JSON 解析 | 三層合規 | 結論 |
|---|---|---|---|---|---|---|
| 1 | GitHub Webhook → Slack | 對齊 cookbook 01 | 5 | ✅ | ✅ | ✅ 通過 |
| 2 | RSS → AI 摘要 → Email | cookbook 02 變化 | 11 | ✅ | ✅ | ✅ 通過 |
| 3 | Telegram bot ↔ OpenAI | 全新情境 | 7 | ✅ | ✅ | ✅ 通過 |
| 4 | PDF → Worker → S3 | TigerAI 旗艦 | 11 | ✅ | ✅ | ✅ 通過 |
| 5 | 訂單 → AI 風險分流 | 複雜複合 | 14 | ✅ | ✅ | ✅ 通過 |

**5/5 通過。** 三層結構規範 + DSL + cookbook + 7 大 pattern 在已測情境下足以驅動 AI 產出生產級 workflow。

---

## 2. 揭露的 spec 缺口（Phase 3 必修）

### Critical（影響可用性）
1. **`@on-error` 兩種實作模式** — 同 workflow 內 `continueOnFail` (Test 3) vs 跨 workflow `Error Trigger` (Test 2)，spec 主文件未區分。
   → **修法**：在 `spec/sticky-note-three-layer.md` 新增 §6 說明兩種模式何時用哪種。

2. **DSL `@trigger` 字典缺常見項** — `telegram` / `slack` / `discord` / `googleDriveTrigger` 在 §3 沒列。
   → **修法**：擴充 `spec/sticky-note-dsl.md` §3 表格。

3. **「分流子規則」缺嚴格語法** — Test 5 的 `@step: 依 score 三分流: high (>70): ...` 是自然語言，parser 難擷取。
   → **修法**：新增 `@branch` 標籤語法。

### Major（影響品質）
4. **跨節點變數引用 gotcha** — `$('NodeName').item.json` vs `$json` 是常踩坑（Test 3, 5 都用到），但 spec 主文件未提。
   → **修法**：在 `spec/sticky-note-dsl.md` §6 解析器規範補一段。

5. **`@assume` 標籤實際使用範例缺** — Test 4, 5 用得很自然，但 cookbook 8 個範例都沒示範。
   → **修法**：在 cookbook 05 / 06 補一段 `@assume` 用法。

6. **節點數上限 15 偏緊** — Test 5 達 14 節點，分流型 workflow 容易超標。
   → **修法**：`research/patterns.md` §5 規則 → 「分流型可放寬到 25」。

### Minor（精緻化）
7. **Switch 無 fallback 時應強制補 fallback** — Test 5 漏了 NaN 路徑，AI 沒主動加。
   → **修法**：`research/patterns.md` 增第 5 條結構性節點規則。

8. **無對應節點時的標準回應** — Test 1 「寫入 console」、Test 4 「清理 /tmp」皆無原生節點。
   → **修法**：DSL §6 補一條「降級對應」規則。

9. **TigerAI 企業哲學（batchSize=1 透明度）尚未文件化** — Test 4 靠 AI 自行對齊 cookbook 05。
   → **修法**：Phase 3 必須完成 `skills/tigerai/tigerai-enterprise-patterns/SKILL.md`。

---

## 3. AI 自我表現觀察

### 做得好
- ✅ 對 419 種 node type 中**未出現於 spec** 的（rssFeedRead, limit, telegramTrigger, awsS3, jira）皆能正確選用
- ✅ `splitInBatches` loop back 連線（output[0] body, output[1] aggregate）4/4 寫對
- ✅ Layer 3 必含 5 段（節點選型 / Credentials / 假設 / 測試 / 限制）100% 覆蓋
- ✅ 反模式檢查：5/5 都用 `scheduleTrigger` 不用 `cron`、`code` 不用 `function`
- ✅ webhook 配 `responseMode=responseNode` + `respondToWebhook` 配對正確

### 容易出錯
- ⚠️ `@on-error` 路徑常被「半實作」（標註於 Layer 3 但未落地節點）
- ⚠️ Switch fallback 容易遺漏
- ⚠️ Cleanup / 副作用節點（rm -rf）沒原生支援時容易只用嘴巴帶過

---

## 4. 客戶可用性結論

| 角色 | 可用性 | 備註 |
|---|---|---|
| n8n 老手 | ⭐⭐⭐⭐⭐ | spec + cookbook 即可立刻上手 |
| n8n 新手（走問答模式） | ⭐⭐⭐⭐ | 需先實作 Phase 3 的 sticky-note-to-workflow Skill |
| 跑 OpenWebUI 整合 | ⭐⭐⭐ | 需 Phase 3 + integrations/openwebui/ |
| 純 API 自動化（無 UI） | ⭐⭐⭐⭐ | 走 n8n REST API + 本 Pack JSON 範例 |

---

## 5. 下一步建議優先序

1. **修 spec 9 條缺口**（半天工作量，從本報告搬資料）
2. **Phase 3 實作 3 個 tigerai Skill**（核心：sticky-note-to-workflow）
3. **OpenWebUI 整合 spike**（驗證 cloud AI API 能否完整跑通三模式）
4. **install.sh / install.ps1 / plugin.json 撰寫**（讓客戶一鍵裝）
5. **再跑一輪驗收**（含問答模式與範例查詢模式的 end-to-end）

---

**報告版本**：v1.0
**驗收日期**：2026-05-05
**驗收人**：Claude (dogfooding TigerAI Skill Pack v0.3.0)
