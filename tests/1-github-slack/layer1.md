# Layer 1（使用者貼進 n8n 畫布的 sticky note 內容）

```markdown
## 需求：GitHub Issue 通知到 Slack

@trigger: webhook POST /github-issue
@input: GitHub Issue webhook payload (title, html_url, user.login)
@step: 取出 title / url / 作者
@step: 組成訊息 "🐛 新 Issue: {title} by {作者} → {url}"
@output: slack channel #dev-issues
@on-error: 寫入 console（暫時不通知）
```
