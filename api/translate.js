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

  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    return response.status(500).json({ error: 'Groq API key not configured on server' });
  }

  const MODEL = "llama-3.1-8b-instant";
  const URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const systemPrompt = `Você é um tradutor sênior especializado em adaptacão de tons corporativos. 
Sua missão é TRANSFORMAR frases informais em versões profissionais, seguindo estritamente as regras de estilo fornecidas.
Não apenas repita o que o usuário disse; mude o vocabulário, a estrutura e a formalidade conforme solicitado.`;

    console.log(`Iniciando chamada Groq API (Modelo: ${MODEL})...`);
    const groqResponse = await fetch(URL, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      const errorMsg = errorData.error?.message || 'Error from Groq API';
      console.error('Erro na SDK Groq:', JSON.stringify(errorData));
      return response.status(groqResponse.status).json({ 
        error: errorMsg,
        details: errorData 
      });
    }

    const data = await groqResponse.json();
    console.log('Sucesso na resposta da Groq API');
    const resultText = data.choices?.[0]?.message?.content || "";

    return response.status(200).json({ text: resultText });
  } catch (error) {
    console.error('Erro Crítico no Servidor:', error.message);
    return response.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
