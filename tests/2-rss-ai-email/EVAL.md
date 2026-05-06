# Test 2 自評

| 檢查項 | 結果 |
|---|---|
| JSON 可解析 | ✅ |
| 三層結構 | ✅ |
| RSS 節點選型（spec 未列） | ✅ AI 從常識補上 `rssFeedRead` |
| 多步驟 chain（10 節點） | ✅ |
| splitInBatches 回路（loop back）| ✅ output[0] 進 loop body, output[1] 給 aggregate |
| @on-error 處理 | ⚠️ 標註於 Layer 3「需另建 Error Trigger workflow」 |
| 反模式檢查 | ✅ 用 scheduleTrigger 不用 cron |
| 節點數 11 / 限 15 | ✅ 未觸發拆 sub-workflow 建議 |

## 發現的 spec 缺口
1. **`@on-error` 對應 Error Trigger 是「另一個 workflow」**——使用者寫 `@on-error: slack ...` 直覺以為在同 workflow 內，但 n8n 的 Error Trigger 本質是獨立 workflow。**spec 應補強這個「跨 workflow 路徑」的說明**。
2. **DSL 沒有 `@batch` / `@limit` 標籤**，只能由 `@step: 只留前 10 篇` 自然語言推論。可運作但不嚴謹。
3. **node-frequency.md Top 30 沒列 `rssFeedRead`/`limit`**，但 AI 仍能推論。表示 spec + 常識足夠，但完整覆蓋還需擴充字典。

## 結論
✅ **通過**。需補 spec 文件第 4.6 段「Error Trigger 是另一個 workflow」說明。
