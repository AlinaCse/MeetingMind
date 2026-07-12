const { GoogleGenerativeAI } = require('@google/generative-ai');
const fallback = { decisions: [], actionItems: [], unresolved: [], nextMeeting: null };

/** Extracts structured meeting information from notes using Gemini, with retries. */
async function analyseNotes(rawNotes) {
  const prompt = `
You are a professional meeting assistant.
Carefully read the following meeting notes.

Meeting Notes: ${rawNotes}

Extract and return ONLY valid JSON with no markdown, no backticks, no explanation.

{
  "decisions": ["list of decisions made"],
  "actionItems": [{ "task": "what needs to be done", "owner": "person responsible", "ownerEmail": "email if mentioned or null", "deadline": "YYYY-MM-DD or null" }],
  "unresolved": ["unresolved questions"],
  "nextMeeting": "YYYY-MM-DD or null"
}

Rules:
- Only extract what is explicitly mentioned
- If no deadline mentioned write null
- If no owner mentioned write Unassigned
- If no email mentioned write null
- Return ONLY the JSON object
`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
      const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = client.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const response = await model.generateContent(prompt);
      const cleaned = response.response.text().replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed.decisions) || !Array.isArray(parsed.actionItems) || !Array.isArray(parsed.unresolved) || !Object.prototype.hasOwnProperty.call(parsed, 'nextMeeting')) throw new Error('Invalid AI response structure');
      return parsed;
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error.message);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return fallback;
}

module.exports = { analyseNotes };
