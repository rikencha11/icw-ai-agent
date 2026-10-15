# ICW AI Agent — Messenger MVP

এই প্রজেক্ট Facebook Page Messenger → Webhook → OpenAI → Messenger reply-এর একটি ছোট MVP।

## Environment variables

Render/hosting platform-এ এগুলো Secret/Environment Variable হিসেবে দিন:

- `META_VERIFY_TOKEN` — নিজের তৈরি একটি secret text
- `META_PAGE_ID` — আপনার Facebook Page ID
- `META_PAGE_ACCESS_TOKEN` — Meta থেকে পাওয়া Page access token
- `META_GRAPH_VERSION` — `v26.0`
- `OPENAI_API_KEY` — OpenAI API key
- `OPENAI_MODEL` — `gpt-6-luna`

## Webhook URL

Deploy হওয়ার পরে:

`https://YOUR-DOMAIN/webhook`

Meta-তে:
- Callback URL = এই URL
- Verify Token = একই `META_VERIFY_TOKEN`

তারপর Page messaging webhook subscription করুন।

## নিরাপত্তা

কোনো token/key chat, screenshot, GitHub public repo বা code-এর মধ্যে প্রকাশ করবেন না।
