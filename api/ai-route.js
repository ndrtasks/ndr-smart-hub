module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ fallback: true, reason: 'AI_NOT_CONFIGURED' });

  const serviceMonths = (joiningDate, asOf = new Date()) => {
    if (!joiningDate) return null;
    const start = new Date(`${joiningDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || asOf < start) return null;
    let months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
    if (asOf.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
  };

  const eligibilityFor = (eligibility, joiningDate) => {
    if (!eligibility || eligibility.type !== 'SERVICE_MONTHS') return null;
    const months = serviceMonths(joiningDate);
    if (months === null) return { eligible: false, reason: 'MISSING_JOIN_DATE', serviceMonths: null, availableMonths: [] };
    const minimum = Number(eligibility.minimumMonths || 0);
    if (months < minimum) return { eligible: false, reason: 'MIN_SERVICE', serviceMonths: months, minimumMonths: minimum, availableMonths: [] };
    const tier = (eligibility.tiers || []).find(t => months >= Number(t.min || 0) && (t.max === null || t.max === undefined || months <= Number(t.max)));
    return { eligible: !!tier, reason: tier ? null : 'NO_TIER', serviceMonths: months, minimumMonths: minimum, availableMonths: tier?.months || [] };
  };

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
        eligibility: f.eligibility && typeof f.eligibility === 'object' ? {
          type: String(f.eligibility.type || ''),
          minimumMonths: Number(f.eligibility.minimumMonths || 0),
          tiers: Array.isArray(f.eligibility.tiers) ? f.eligibility.tiers.map(t => ({
            min: Number(t.min || 0),
            max: t.max === null || t.max === undefined ? null : Number(t.max),
            months: Array.isArray(t.months) ? t.months.map(String) : []
          })) : []
        } : null,
        fields: Array.isArray(f.fields) ? f.fields.slice(0, 40).map(field => ({
          id: String(field.id || ''),
          label: String(field.label || ''),
          labelEn: String(field.labelEn || ''),
          type: String(field.type || 'text'),
          required: !!field.required,
          options: Array.isArray(field.options) ? field.options.map(String) : [],
          dynamicOptions: String(field.dynamicOptions || ''),
          auto: String(field.auto || ''),
          calculated: String(field.calculated || ''),
          ask: field.ask !== false
        })) : []
      })) : []
    }));

    const eligibilityContext = safeSources.flatMap(s => s.relatedForms.map(f => ({
      formCode: f.code,
      check: eligibilityFor(f.eligibility, employeeProfile.joiningDate)
    }))).filter(x => x.check);

    const prompt = `You are the internal employee knowledge assistant for NDR Smart Hub.
You understand the employee's intent and answer ONLY from internal sources. AI interprets language, but eligibility and financial rules are deterministic and must never be guessed.

MANDATORY GROUNDING RULES:
1. Use ONLY the supplied internal sources. Never invent a policy, entitlement, approval path, form, requirement, duration, benefit, or field value.
2. If the answer is absent, say it is not available in the current uploaded sources.
3. Recommend only a form explicitly listed under the selected source.
4. A form can be prepared only when indexed=true AND any computed eligibility check says eligible=true.
5. If computed eligibility says eligible=false, explain that the employee is currently not eligible and DO NOT return PREPARE_FORM.
6. If computed eligibility lists availableMonths, never suggest any month option outside that list.
7. Never ask the employee for profile information already supplied in Employee profile context.
8. Never ask the employee for a value that is marked auto or calculated in the selected form schema.
9. Never claim submission, approval, signature, or sending.
10. If a source is temporary-pilot, mention this briefly.
11. Understand Saudi/Gulf colloquial Arabic, formal Arabic, English and mixed language by meaning, not exact words.

INTENT RULES:
- QUESTION: user is asking how/what/why and does not explicitly ask to create or prepare the form, OR eligibility blocks preparation.
- PREPARE_FORM: user explicitly wants to apply/request/prepare/fill/create and the exact form is indexed and eligible.
- "كيف أقدم إجازة؟" => QUESTION.
- "أبي أقدم إجازة" => PREPARE_FORM when the form is available.
- If they provide dates/details in the same message, extract them into prefill when the exact indexed form has matching fields.
- For short leave explicitly described as less than 7 days, use HR-F-20 when it exists in the source. Do not silently substitute HR-F-12.
- If the recommended form is not indexed, explain the procedure but return QUESTION and empty prefill.
- Ask one clarification question only when the correct source/form genuinely cannot be determined.

PREFILL RULES:
- Extract only values explicitly present in the user's message or safely derivable from it.
- Never fabricate dates, phone numbers, nationality, alternate employee, balances, approvals, entitlement, or financial values.
- Dates should be YYYY-MM-DD when confidently resolvable.
- Map only to field ids supplied in the selected indexed form.
- Do not put auto/calculated profile fields into prefill because the client fills/calculates them deterministically.

Reply in ${language === 'en' ? 'English' : 'Arabic'}.

Current date: ${new Date().toISOString().slice(0,10)}
Employee profile context:
${JSON.stringify(employeeProfile)}

Deterministic eligibility results calculated by the system:
${JSON.stringify(eligibilityContext)}

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
        generationConfig: { temperature: 0.02, responseMimeType: 'application/json' }
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
    const selectedEligibility = eligibilityFor(selectedForm?.eligibility, employeeProfile.joiningDate);
    let intent = parsed.intent === 'PREPARE_FORM' ? 'PREPARE_FORM' : 'QUESTION';
    if (!selectedForm?.indexed || selectedEligibility?.eligible === false) intent = 'QUESTION';

    const allowedFieldIds = new Set((selectedForm?.fields || []).filter(f => !f.auto && !f.calculated).map(f => f.id));
    const prefill = {};
    if (parsed.prefill && typeof parsed.prefill === 'object' && !Array.isArray(parsed.prefill)) {
      for (const [key, value] of Object.entries(parsed.prefill)) {
        if (!allowedFieldIds.has(key) || value === null || value === undefined || String(value).trim() === '') continue;
        if (key === 'requestedMonths' && selectedEligibility?.availableMonths?.length && !selectedEligibility.availableMonths.includes(String(value))) continue;
        prefill[key] = String(value).slice(0, 500);
      }
    }

    const answer = parsed.answer ? String(parsed.answer).slice(0, 5000) : '';
    const clarificationQuestion = parsed.clarificationQuestion ? String(parsed.clarificationQuestion).slice(0, 500) : null;
    if (!answer && !clarificationQuestion) return res.status(200).json({ fallback: true, reason: 'LOW_CONFIDENCE' });

    return res.status(200).json({ answer, sourceIds, recommendedFormCode, intent, prefill, clarificationQuestion, eligibility: selectedEligibility });
  } catch (error) {
    return res.status(500).json({ fallback: true, reason: 'KNOWLEDGE_ASSISTANT_EXCEPTION' });
  }
};
