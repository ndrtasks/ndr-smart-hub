module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ fallback: true, reason: 'AI_NOT_CONFIGURED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || '').trim();
    const language = body.language === 'en' ? 'en' : 'ar';
    const sources = Array.isArray(body.sources) ? body.sources.slice(0, 30) : [];
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    if (!text || !sources.length) return res.status(400).json({ error: 'INVALID_INPUT' });

    const safeSources = sources.map(s => ({
      id: String(s.id || ''),
      title: String(s.title || ''),
      titleEn: String(s.titleEn || ''),
      code: String(s.code || ''),
      revision: String(s.revision || ''),
      status: String(s.status || ''),
      summaryAr: String(s.summaryAr || ''),
      summaryEn: String(s.summaryEn || ''),
      sourceTextAr: Array.isArray(s.sourceTextAr) ? s.sourceTextAr.slice(0, 30).map(String) : [],
      relatedForms: Array.isArray(s.relatedForms) ? s.relatedForms.slice(0, 15).map(f => ({
        code: String(f.code || ''), title: String(f.title || ''), titleEn: String(f.titleEn || ''), indexed: !!f.indexed, noteAr: String(f.noteAr || ''), noteEn: String(f.noteEn || '')
      })) : []
    }));

    const prompt = `You are the internal employee knowledge assistant for NDR Smart Hub.
Your task is to answer ONLY from the supplied internal source records.

Mandatory rules:
1. Never use general internet knowledge or invent a policy, entitlement, approval, form, requirement, duration, or employee benefit.
2. If the available sources do not contain the answer, clearly say that the information is not available in the current uploaded sources.
3. Cite the source by returning its exact source id. Prefer the most directly relevant source.
4. When a source is marked temporary-pilot, state briefly that it is a temporary pilot source and may be replaced by a newer approved version.
5. When the question is about how to perform an HR action, explain the steps in simple practical language based on the source text.
6. Recommend a related form only when that exact form is listed in the selected source.
7. If several forms are possible and the user's wording is ambiguous, ask ONE clarification question instead of guessing.
8. Do not claim that the platform submitted, approved, signed, or sent anything.
9. Reply in ${language === 'en' ? 'English' : 'Arabic'}.

Recent conversation:
${JSON.stringify(messages)}

Available internal sources:
${JSON.stringify(safeSources)}

Employee question:
${JSON.stringify(text)}

Return JSON ONLY with this shape:
{
  "answer": "grounded answer",
  "sourceIds": ["exact source id"],
  "recommendedFormCode": "exact related form code or null",
  "clarificationQuestion": "one question or null"
}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.05, responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) return res.status(502).json({ fallback: true, reason: 'AI_PROVIDER_ERROR' });

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim() || '{}');
    const allowedIds = new Set(safeSources.map(s => s.id));
    const sourceIds = Array.isArray(parsed.sourceIds) ? parsed.sourceIds.filter(id => allowedIds.has(id)).slice(0, 5) : [];
    const allowedForms = new Set(safeSources.flatMap(s => s.relatedForms.map(f => f.code)));
    const recommendedFormCode = allowedForms.has(parsed.recommendedFormCode) ? parsed.recommendedFormCode : null;
    const answer = parsed.answer ? String(parsed.answer).slice(0, 5000) : '';
    const clarificationQuestion = parsed.clarificationQuestion ? String(parsed.clarificationQuestion).slice(0, 500) : null;

    if (!answer && !clarificationQuestion) return res.status(200).json({ fallback: true, reason: 'LOW_CONFIDENCE' });
    return res.status(200).json({ answer, sourceIds, recommendedFormCode, clarificationQuestion });
  } catch (error) {
    return res.status(500).json({ fallback: true, reason: 'KNOWLEDGE_ASSISTANT_EXCEPTION' });
  }
};
