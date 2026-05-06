# Test 5 自評

| 檢查項 | 結果 |
|---|---|
| JSON 可解析 | ✅ |
| 三層結構 | ✅ |
| 14 個節點 / 限 15 | ✅ 邊界但未觸發拆 sub-workflow |
| Switch 三規則 + numeric | ✅ |
| LLM jsonOutput=true 強制結構化 | ✅ |
| webhook payload 跨節點引用 | ✅ 用 `$('Webhook /order').item.json.body` |
| 三路收斂 → 單一 respondToWebhook | ✅ Merge append |
| @assume 寫入 Layer 3 | ✅ |
| Postgres schema 寫進前提假設 | ✅ 含 SQL |
| 反模式檢查 | ✅ |

## 發現的 spec 缺口
1. **`@step` 內含「子規則」**（如 `high (>70): Jira + Slack`）— 目前 DSL 只用自然語言；嚴格 parser 會難以擷取。**建議**：DSL §2.3 補一個「分流子規則」標準語法，例如：
   ```
   @branch: high when score > 70
     - jira project=FRAUD
     - slack #fraud-alert
   ```
2. **節點數逼近 15 上限**——對複雜業務情境（≥3 路分流），15 節點限制偏緊。spec 應允許「分流型 workflow」放寬到 25。
3. **「Switch fallback」缺漏** — 使用者沒寫 NaN/null 路徑，AI 也沒主動加。spec 應規定「switch 無明示 fallback 時，AI 必須加一條 fallback 並寫進 Layer 3」。

## 結論
✅ **通過**（複雜情境）。揭示 DSL 在「分流子規則」與「fallback 強制」兩處需強化。
