const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Load FAQ knowledge base
let FAQ = [];
let FAQ_EMBEDS = null; // lazy-initialized when OPENAI key is present
try {
  const faqPath = path.join(__dirname, '..', 'data', 'faq.json');
  FAQ = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
} catch (e) {
  console.warn('FAQ knowledge base not found or invalid.');
}

function similarityScore(query, text) {
  const a = String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const b = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((t) => { if (setB.has(t)) inter++; });
  const denom = Math.max(setA.size, setB.size) || 1;
  return inter / denom;
}

async function answerFromFAQ(userMessage) {
  let best = { score: 0, item: null };
  for (const item of FAQ) {
    const score = Math.max(
      similarityScore(userMessage, item.q),
      similarityScore(userMessage, item.a)
    );
    if (score > best.score) best = { score, item };
  }
  if (best.item && best.score > 0.1) {
    return best.item.a;
  }
  return "I didn't find an exact answer. For account help, try the OTP login option on the login page or visit the Orders and Vendor sections for more details.";
}

// --- Embeddings utilities for better retrieval ---
function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function norm(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1; }
function cosineSim(a, b) { return dot(a, b) / (norm(a) * norm(b)); }

async function embedText(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(()=> '');
    console.warn('Embedding error:', res.status, body);
    return null;
  }
  const data = await res.json();
  return data?.data?.[0]?.embedding || null;
}

async function ensureFaqEmbeddings() {
  if (FAQ_EMBEDS || !process.env.OPENAI_API_KEY) return;
  try {
    // Precompute embeddings for FAQ items
    const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    const apiKey = process.env.OPENAI_API_KEY;
    const inputs = FAQ.map((x) => `${x.q}\n${x.a}`);
    // Batch into one request if reasonable
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: inputs, model })
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      console.warn('FAQ embedding precompute failed:', res.status, body);
      return;
    }
    const data = await res.json();
    const vectors = data?.data?.map((d) => d.embedding) || [];
    FAQ_EMBEDS = vectors;
  } catch (e) {
    console.warn('FAQ embedding setup error:', e?.message || e);
  }
}

async function topKFAQ(userMessage, k = 3) {
  // Use embeddings if available; otherwise use token-overlap similarity
  if (FAQ_EMBEDS && process.env.OPENAI_API_KEY) {
    const q = await embedText(userMessage || '');
    if (!q) return [];
    const scored = FAQ_EMBEDS.map((v, i) => ({ i, score: cosineSim(q, v) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(({ i, score }) => ({ ...FAQ[i], _score: score }));
  }
  // Fallback: simple similarity
  const scored = FAQ.map((item, i) => ({
    i,
    score: Math.max(
      similarityScore(userMessage, item.q),
      similarityScore(userMessage, item.a)
    )
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ i, score }) => ({ ...FAQ[i], _score: score }));
}

async function answerWithAI(messages, faqSnippets) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null; // No provider configured

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = Number(process.env.AI_TEMPERATURE || 0.3);
  const brandVoice = `
You are Campus Mart's professional support assistant.
- Tone: concise, friendly, and solution-focused.
- Always ask a clarifying question if the user's goal is ambiguous.
- Prefer short steps with clear actions.
- Reference app areas by name: Login, Orders, Vendors, Marketplace.
- If you don’t know, say so and suggest the closest action.
- Never invent policies or data. Avoid hallucinations.
`;

  const contextBlock = (faqSnippets || []).map((s, idx) => `
${idx + 1}. Q: ${s.q}\nA: ${s.a}`).join('\n');

  const system = {
    role: 'system',
    content: `${brandVoice}\n\nGrounding snippets (use only if relevant):\n${contextBlock || 'None'}`
  };

  const payload = {
    model,
    temperature,
    messages: [system, ...messages.slice(-12)] // keep recent context manageable
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    console.error('AI provider error:', res.status, text);
    return null;
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  return content || null;
}

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { messages } = req.body || {};
    const lastUserMsg = Array.isArray(messages)
      ? [...messages].reverse().find(m => m.role === 'user')?.content
      : (req.body?.message || '');

    // Prepare retrieval context
    await ensureFaqEmbeddings();
    const topFaq = await topKFAQ(lastUserMsg || '', 3);

    // Try AI provider first if configured
    let reply = await answerWithAI(
      messages || [{ role: 'user', content: String(lastUserMsg || '') }],
      topFaq
    );
    if (!reply) {
      // Fallback to FAQ matching with best candidate
      if (topFaq && topFaq.length && (topFaq[0]._score || 0) > 0.1) {
        reply = topFaq[0].a;
      } else {
        reply = await answerFromFAQ(lastUserMsg || '');
      }
    }
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error?.message || error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

module.exports = router;