module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ fallback: true, reason: 'AI_NOT_CONFIGURED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const language = body.language === 'en' ? 'en' : 'ar';
    const text = String(body.text || '').trim();
    const field = body.field && typeof body.field === 'object' ? body.field : {};
    const currentData = body.currentData && typeof body.currentData === 'object' ? body.currentData : {};
    if (!text || !field.id) return res.status(400).json({ error: 'INVALID_INPUT' });

    const safeField = {
      id: String(field.id || ''),
      label: String(field.label || ''),
      labelEn: String(field.labelEn || ''),
      type: String(field.type || 'text'),
      required: !!field.required,
      options: Array.isArray(field.options) ? field.options.map(String) : []
    };

    const prompt = `You normalize one employee answer for one field in an internal HR form.
Do not answer policy questions and do not invent values.

Field:
${JSON.stringify(safeField)}

Current already-known form data:
${JSON.stringify(currentData)}

Employee reply:
${JSON.stringify(text)}

Rules:
1. Return only a value that is explicitly stated or safely implied by the employee reply.
2. For a select field, normalizedValue must exactly equal one supplied option. Understand colloquial Arabic and synonyms.
3. For a date field, normalize to YYYY-MM-DD only when the date is clear. Resolve ordinary Arabic month names and relative expressions only when unambiguous from the current date. If unclear, understood=false.
4. For time, normalize to HH:MM 24-hour format when clear.
5. For number, return digits only (decimal allowed).
6. If the user says "نفس الرقم" / "same number" for mobile and currentData.vacationContact exists, use that existing value.
7. If the reply means "no", "none", "I don't know", or "skip" for an optional field, set skip=true and normalizedValue="".
8. For required fields, do not accept skip. Set understood=false and ask a very short retry question.
9. Do not infer nationality, phone, employee name, dates, or another person's name unless the reply states it.
10. Reply language for retryQuestion: ${language === 'en' ? 'English' : 'Arabic'}.

Return JSON only:
{
  "understood": true,
  "skip": false,
  "normalizedValue": "",
  "displayValue": "",
  "retryQuestion": null
}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.02, responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) return res.status(502).json({ fallback: true, reason: 'AI_PROVIDER_ERROR' });

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim() || '{}');
    const skip = !!parsed.skip && !safeField.required;
    let value = skip ? '' : String(parsed.normalizedValue ?? '').slice(0, 1000);
    let understood = !!parsed.understood;

    if (safeField.type === 'select' && understood && !skip && !safeField.options.includes(value)) understood = false;
    if (safeField.required && !value) understood = false;

    return res.status(200).json({
      understood,
      skip,
      normalizedValue: understood ? value : '',
      displayValue: understood ? String(parsed.displayValue || value).slice(0, 1000) : '',
      retryQuestion: understood ? null : String(parsed.retryQuestion || (language === 'en' ? 'Please clarify this value.' : 'وضح لي هذه المعلومة بشكل أدق.')).slice(0, 500)
    });
  } catch (error) {
    return res.status(500).json({ fallback: true, reason: 'FORM_ASSIST_EXCEPTION' });
  }
};
