module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ fallback: true, reason: 'AI_NOT_CONFIGURED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || '').trim();
    const language = body.language === 'en' ? 'en' : 'ar';
    const services = Array.isArray(body.services) ? body.services.slice(0, 80) : [];
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    if (!text || !services.length) return res.status(400).json({ error: 'INVALID_INPUT' });

    const catalog = services.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      nameEn: s.nameEn,
      description: s.description,
      descriptionEn: s.descriptionEn,
      aliases: [...(s.aliases || []), ...(s.aliasesEn || [])].slice(0, 30)
    }));

    const prompt = `You are the intent router for an internal employee services platform called NDR Smart Hub.
Your ONLY task is to identify the best service from the supplied catalog or ask ONE clarification question when the intent is genuinely ambiguous.

Critical routing rules:
1. Understand meaning, Saudi/Gulf colloquial Arabic, Modern Standard Arabic, English, and mixed Arabic/English. Do not rely on exact keywords.
2. Time/context matters. A planned future departure, appointment, stepping out, or asking permission BEFORE leaving maps to Short Permission when that service exists. Examples: "بطلع شوي", "بخرج بدري", "عندي موعد وبمشي", "I need to step out today".
3. An attendance event that ALREADY happened maps to Attendance Memo when that service exists. Examples: "طلعت بدري أمس", "تأخرت", "نسيت بصمة الخروج", "I forgot to clock out", "I left early yesterday".
4. Attendance Memo is NOT a substitute for Short Permission.
5. Never invent a service, policy, entitlement, form number, or workflow. Choose only a service id from the supplied catalog.
6. If two services are materially plausible, ask one short clarification question instead of guessing.
7. Extract only safe obvious prefill values from the user's wording (for example attendance case type or missed punch type). Do not invent dates/times not explicitly stated.
8. Reply in ${language === 'en' ? 'English' : 'Arabic'}.

Recent conversation:
${JSON.stringify(messages)}

Service catalog:
${JSON.stringify(catalog)}

Current user message:
${JSON.stringify(text)}

Return JSON ONLY with this exact shape:
{
  "serviceId": "catalog id or null",
  "confidence": 0.0,
  "clarificationQuestion": "question or null",
  "reply": "brief explanation",
  "prefill": {}
}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) return res.status(502).json({ fallback: true, reason: 'AI_PROVIDER_ERROR' });
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned || '{}');
    const allowed = new Set(services.map(s => s.id));
    const serviceId = allowed.has(parsed.serviceId) ? parsed.serviceId : null;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)));
    const clarificationQuestion = parsed.clarificationQuestion ? String(parsed.clarificationQuestion).slice(0, 500) : null;
    const reply = parsed.reply ? String(parsed.reply).slice(0, 1200) : '';
    const prefill = parsed.prefill && typeof parsed.prefill === 'object' && !Array.isArray(parsed.prefill) ? parsed.prefill : {};

    if (!serviceId && !clarificationQuestion) return res.status(200).json({ fallback: true, reason: 'LOW_CONFIDENCE' });
    return res.status(200).json({ serviceId, confidence, clarificationQuestion, reply, prefill });
  } catch (error) {
    return res.status(500).json({ fallback: true, reason: 'ROUTER_EXCEPTION' });
  }
};
