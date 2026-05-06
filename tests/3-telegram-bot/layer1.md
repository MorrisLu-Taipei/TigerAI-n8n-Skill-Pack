# Layer 1

```markdown
## 需求：Telegram AI 助手 bot

@trigger: telegram bot 收到訊息
@input: { message.text, message.chat.id, message.from.first_name }
@step: 用 OpenAI gpt-4o-mini 產生回覆（system: 你是友善的中文助理，2 句內回答）
@step: 回傳到原 Telegram 對話 (chat_id)
@on-error: telegram 回 "抱歉，我暫時無法回應，請稍後再試"
```
