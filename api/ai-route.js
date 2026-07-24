module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ fallback: true, reason: 'AI_NOT_CONFIGURED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || '').trim();
    const language = body.language === 'en' ? 'en' : 'ar';
    const sources = Array.isArray(body.sources) ? body.sources.slice(0, 30) : [];
    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const employeeProfile = body.employeeProfile && typeof body.employeeProfile === 'object' ? body.employeeProfile : {};
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
        code: String(f.code || ''),
        title: String(f.title || ''),
        titleEn: String(f.titleEn || ''),
        indexed: !!f.indexed,
        noteAr: String(f.noteAr || ''),
        noteEn: String(f.noteEn || ''),
        fields: Array.isArray(f.fields) ? f.fields.slice(0, 40).map(field => ({
          id: String(field.id || ''),
          label: String(field.label || ''),
          labelEn: String(field.labelEn || ''),
          type: String(field.type || 'text'),
          required: !!field.required,
          options: Array.isArray(field.options) ? field.options.map(String) : [],
          ask: field.ask !== false
        })) : []
      })) : []
    }));

    const prompt = `You are the internal employee knowledge assistant for NDR Smart Hub.
You are not just a search router. You understand the employee's intent, answer from internal sources, and when appropriate help prepare an indexed form.

MANDATORY GROUNDING RULES:
1. Use ONLY the supplied internal sources. Never invent a policy, entitlement, approval path, form, requirement, duration, benefit, or field value.
2. If the answer is absent, say it is not available in the current uploaded sources.
3. Recommend only a form explicitly listed under the selected source.
4. A form can be prepared only when indexed=true.
5. Never claim submission, approval, signature, or sending.
6. If a source is temporary-pilot, mention this briefly.
7. Understand Saudi/Gulf colloquial Arabic, formal Arabic, English and mixed language by meaning, not exact words.

INTENT RULES:
- QUESTION: user is asking how/what/why and does not explicitly ask to create or prepare the form.
- PREPARE_FORM: user explicitly wants to apply, request, prepare, fill, create, or says an equivalent action such as "ابي اقدم", "جهز لي", "عبي لي", "ابغى ارفع طلب".
- If the employee says "كيف أقدم إجازة؟" => QUESTION.
- If the employee says "أبي أقدم إجازة" => PREPARE_FORM.
- If they provide dates/details in the same message, extract them into prefill when the exact indexed form has matching fields.
- For a short leave explicitly described as less than 7 days, use HR-F-20 when it exists in the source. Do not silently substitute HR-F-12.
- If the recommended form is not indexed, still explain the procedure but action must be QUESTION and prefill must be {}.
- Ask one clarification question only when the correct source/form genuinely cannot be determined.

PREFILL RULES:
- Extract only values explicitly present in the user's message or safely derivable from them.
- Never fabricate dates, phone numbers, nationality, alternate employee, balances, approvals, or entitlement.
- Dates should be returned as YYYY-MM-DD only when you can confidently resolve them from the current conversation. Otherwise omit them.
- Map only to field ids supplied in the selected indexed form.
- Employee profile is reference context; do not repeat it in prefill because the client auto-fills profile fields itself.

Reply in ${language === 'en' ? 'English' : 'Arabic'}.

Employee profile context:
${JSON.stringify(employeeProfile)}

Recent conversation:
${JSON.stringify(messages)}

Available internal sources and form schemas:
${JSON.stringify(safeSources)}

Current employee message:
${JSON.stringify(text)}

Return JSON ONLY:
{
  "answer": "brief grounded answer",
  "sourceIds": ["exact source id"],
  "recommendedFormCode": "exact related form code or null",
  "intent": "QUESTION or PREPARE_FORM",
  "prefill": {},
  "clarificationQuestion": "one question or null"
}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.03, responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) return res.status(502).json({ fallback: true, reason: 'AI_PROVIDER_ERROR' });

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim() || '{}');

    const allowedIds = new Set(safeSources.map(s => s.id));
    const sourceIds = Array.isArray(parsed.sourceIds) ? parsed.sourceIds.filter(id => allowedIds.has(id)).slice(0, 5) : [];
    const forms = safeSources.flatMap(s => s.relatedForms);
    const allowedForms = new Set(forms.map(f => f.code));
    const recommendedFormCode = allowedForms.has(parsed.recommendedFormCode) ? parsed.recommendedFormCode : null;
    const selectedForm = forms.find(f => f.code === recommendedFormCode) || null;
    let intent = parsed.intent === 'PREPARE_FORM' ? 'PREPARE_FORM' : 'QUESTION';
    if (!selectedForm?.indexed) intent = 'QUESTION';

    const allowedFieldIds = new Set((selectedForm?.fields || []).map(f => f.id));
    const prefill = {};
    if (parsed.prefill && typeof parsed.prefill === 'object' && !Array.isArray(parsed.prefill)) {
      for (const [key, value] of Object.entries(parsed.prefill)) {
        if (allowedFieldIds.has(key) && value !== null && value !== undefined && String(value).trim() !== '') prefill[key] = String(value).slice(0, 500);
      }
    }

    const answer = parsed.answer ? String(parsed.answer).slice(0, 5000) : '';
    const clarificationQuestion = parsed.clarificationQuestion ? String(parsed.clarificationQuestion).slice(0, 500) : null;
    if (!answer && !clarificationQuestion) return res.status(200).json({ fallback: true, reason: 'LOW_CONFIDENCE' });

    return res.status(200).json({ answer, sourceIds, recommendedFormCode, intent, prefill, clarificationQuestion });
  } catch (error) {
    return res.status(500).json({ fallback: true, reason: 'KNOWLEDGE_ASSISTANT_EXCEPTION' });
  }
};
