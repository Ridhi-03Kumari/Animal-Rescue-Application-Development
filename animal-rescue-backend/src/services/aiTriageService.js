/**
 * AI Urgency Triage Service
 * Uses Google Gemini API with a strict 5-second timeout and rule-based fallback.
 * Strictly adheres to safety guardrails:
 * - Urgency: LOW, MEDIUM, HIGH
 * - Safe waiting guidance for citizens
 * - NEVER diagnoses diseases, recommends medicine, or predicts survival.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TIMEOUT_MS = 5000;

/**
 * Heuristic rule-based fallback when Gemini API is unavailable or times out (>5s)
 */
function getRuleBasedFallback(animalType, description) {
  const text = (description || '').toLowerCase();
  let urgency = 'MEDIUM';

  const highUrgencyWords = [
    'bleed',
    'blood',
    'unconscious',
    'severe',
    'badly injured',
    'not breathing',
    'accident',
    'hit by car',
    'fracture',
    'broken bone',
    'mangled',
    'paralyzed',
    'seizure',
  ];

  const lowUrgencyWords = [
    'minor',
    'small cut',
    'slight limp',
    'walking fine',
    'active',
    'alert',
    'scratch',
  ];

  if (highUrgencyWords.some((word) => text.includes(word))) {
    urgency = 'HIGH';
  } else if (lowUrgencyWords.some((word) => text.includes(word))) {
    urgency = 'LOW';
  }

  const guidanceMap = {
    HIGH: 'Keep a safe distance. Do not move the animal unless in immediate road danger. A trained responder is being contacted immediately.',
    MEDIUM: 'Keep the animal in sight from a safe distance. Avoid crowding or sudden loud noises while a responder is alerted.',
    LOW: 'Keep the animal in a safe, shaded area if possible. Avoid feeding or handling until a rescuer arrives.',
  };

  return {
    urgency,
    guidance: guidanceMap[urgency],
    isFallback: true,
    manualOverrideAllowed: true,
  };
}

/**
 * Assess urgency and safety guidance using Gemini API with 5-second timeout
 */
async function assessUrgency({ animalType = 'animal', description = '', photoUrl = '' }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return getRuleBasedFallback(animalType, description);
  }

  const systemInstruction = `You are an emergency triage assistant for animal rescues in India.
Your job is to assess the emergency urgency level based on the citizen's report and give safe, non-medical citizen guidance while waiting for the rescuer.

STRICT SAFETY RULES:
1. Urgency MUST be strictly one of: "LOW", "MEDIUM", "HIGH".
2. You MUST NOT diagnose diseases or conditions.
3. You MUST NOT recommend or suggest any medicines, drugs, or medical treatments.
4. You MUST NOT predict recovery or survival chances.
5. Provide 1 to 2 short sentences of safe guidance for the citizen (e.g., keep distance, do not move unless in active traffic, keep area shaded, avoid handling).

Format your response strictly as valid JSON with no markdown formatting:
{"urgency": "LOW" | "MEDIUM" | "HIGH", "guidance": "string"}`;

  const userPrompt = `Animal Type: ${animalType}
Description: ${description || 'No description provided'}
${photoUrl ? `Photo URL: ${photoUrl}` : ''}

Assess urgency and provide short safe guidance.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[GEMINI API] Request failed with status ${response.status}. Using fallback.`);
      return getRuleBasedFallback(animalType, description);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return getRuleBasedFallback(animalType, description);
    }

    // Parse JSON output
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const validUrgencies = ['LOW', 'MEDIUM', 'HIGH'];
    const urgency = validUrgencies.includes((parsed.urgency || '').toUpperCase())
      ? parsed.urgency.toUpperCase()
      : 'MEDIUM';

    return {
      urgency,
      guidance: parsed.guidance || 'Keep the animal in a safe location while waiting for rescue support.',
      isFallback: false,
      manualOverrideAllowed: true,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[GEMINI API] Request timed out (>5000ms). Using MEDIUM fallback.`);
    } else {
      console.warn(`[GEMINI API] Error during triage:`, err.message);
    }
    return getRuleBasedFallback(animalType, description);
  }
}

module.exports = {
  assessUrgency,
  getRuleBasedFallback,
};
