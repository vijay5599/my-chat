const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // High-performance latest stable model

export const AURA_BOT_ID = '00000000-0000-0000-0000-000000000000'

export async function askGemini(prompt: string, systemPrompt?: string, isJson: boolean = false) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  // Helper to call the API with a specific model
  const callApi = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        ...(isJson ? { response_mime_type: "application/json" } : {})
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error, status: response.status };
    }

    const data = await response.json();
    return { data };
  };

  try {
    // 1. Try Primary Model (Gemini 2.5)
    let result = await callApi(GEMINI_MODEL);

    // 2. Fallback if Primary is Busy (503) or Overloaded
    if (result.error && (result.status === 503 || result.status === 429)) {
      console.warn(`Gemini 2.5 busy, falling back to 2.0...`);
      result = await callApi('gemini-2.0-flash');
    }

    if (result.error) {
      console.error('Gemini API Error:', result.error);
      throw new Error(result.error.error?.message || 'Failed to call Gemini API');
    }

    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw error;
  }
}
