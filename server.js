import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || "v26.0";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

if (!VERIFY_TOKEN || !PAGE_ID || !PAGE_ACCESS_TOKEN || !process.env.OPENAI_API_KEY) {
  console.warn("Warning: one or more required environment variables are missing.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple health check
app.get("/", (_req, res) => {
  res.status(200).send("ICW AI Agent is running.");
});

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Messenger webhook
app.post("/webhook", (req, res) => {
  // Acknowledge Meta immediately.
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== "page" || !Array.isArray(body.entry)) return;

  // Process without blocking the webhook response.
  void processWebhook(body).catch((err) => {
    console.error("Webhook processing error:", err);
  });
});

async function processWebhook(body) {
  for (const entry of body.entry) {
    const messaging = entry.messaging || [];

    for (const event of messaging) {
      // Ignore delivery/read events and our own outgoing echoes.
      if (event.message?.is_echo) continue;

      const senderId = event.sender?.id;
      const text = event.message?.text;

      if (!senderId || !text) continue;

      try {
        const aiReply = await generateReply(text);
        await sendMessengerMessage(senderId, aiReply);
      } catch (err) {
        console.error("Message handling error:", err);
      }
    }
  }
}

async function generateReply(userText) {
  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions:
      "You are the customer-support AI assistant for an organization using the ICW AI Agent. " +
      "Reply in the same language as the customer. Be polite, concise, helpful, and natural. " +
      "If you do not know an answer, say so instead of inventing facts. " +
      "Do not claim to have completed an order, refund, payment, or other action unless the system actually did it.",
    input: userText
  });

  return (response.output_text || "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।").slice(0, 1900);
}

async function sendMessengerMessage(recipientId, text) {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PAGE_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PAGE_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta Send API ${response.status}: ${errorText}`);
  }
}

app.listen(PORT, () => {
  console.log(`ICW AI Agent listening on port ${PORT}`);
});
