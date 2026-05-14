// api/translate.js
// Vercel Serverless Function para tradução segura usando Gemini API

export default async function handler(request, response) {
  // Habilita CORS para permitir chamadas do frontend
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return response.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  const MODEL = "gemini-1.5-flash";
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    console.log('Iniciando chamada Gemini API...');
    const geminiResponse = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Erro na SDK Gemini:', JSON.stringify(errorData));
      return response.status(geminiResponse.status).json({ 
        error: 'Error from Gemini API',
        details: errorData 
      });
    }

    const data = await geminiResponse.json();
    console.log('Sucesso na resposta da Gemini API');
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return response.status(200).json({ text: resultText });
  } catch (error) {
    console.error('Erro Crítico no Servidor:', error.message);
    return response.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
