// ============================================================
// translator.js
// Gera 2 opções de tradução usando Gemini 1.5 Flash (gratuito).
// ⚠️ Substitua GEMINI_API_KEY pela sua chave em:
// https://aistudio.google.com/app/apikey
// ============================================================

// A API Key e a URL agora ficam no servidor (Vercel) para maior segurança.
const API_ENDPOINT = "/api/translate";

const STYLE_CONFIGS = {
  ti: {
    emoji: "🖥️",
    nome: "Portal de Chamados (TI)",
    instrucao: `Sua tarefa é TRANSFORMAR o texto informal em uma descrição técnica polida para um portal de suporte corporativo.
Regras:
- Use termos como "suporte para interpretação de configurações", "desbloqueio de fluxo de trabalho" e "alinhamento de processos técnicos".
- Transforme erros de usuário em "necessidades de suporte consultivo" ou "ajustes de configuração assistida".
- O tom deve ser profissional, neutro e focado em produtividade.
- Evite formatos de formulário; escreva uma frase ou parágrafo fluído.
- Gere EXATAMENTE 2 versões diferentes separadas por [OPCAO_1] e [OPCAO_2]`
  },
  linkedin: {
    emoji: "💼",
    nome: "LinkedIn Motivacional",
    instrucao: `Sua tarefa é TRANSFORMAR o texto informal em uma postagem narrativa e inspiradora do LinkedIn.
Regras:
- Escreva um parágrafo que emocione e gere engajamento.
- Use a "jornada do erro" como uma ponte para o sucesso e aprendizado.
- Use alguns emojis e termine com uma pergunta reflexiva.
- Gere EXATAMENTE 2 versões diferentes separadas por [OPCAO_1] e [OPCAO_2]`
  },
  juridico: {
    emoji: "⚖️",
    nome: "Juridiquês",
    instrucao: `Sua tarefa é REESCREVER o texto informal em linguagem jurídica formal e parágrafos densos.
Regras:
- Evite listas. Use conectivos sofisticados como "conseguinte", "imperioso salientar", "no que tange".
- Use expressões latinas apenas quando natural no texto jurídico.
- O resultado deve parecer um trecho de um parecer ou petição.
- Gere EXATAMENTE 2 versões diferentes separadas por [OPCAO_1] e [OPCAO_2]`
  },
  corporativo: {
    emoji: "🏢",
    nome: "Corporativo Padrão",
    instrucao: `Sua tarefa é REESCREVER o texto informal em jargão executivo de alto nível.
Regras:
- Use frases polidas que suavizem o problema original usando "business talk".
- Termos: "compliance", "core business", "framework", "deliverables", "stakeholders".
- O tom deve ser diplomático e estratégico.
- Gere EXATAMENTE 2 versões diferentes separadas por [OPCAO_1] e [OPCAO_2]`
  }
};

// Respostas de fallback locais (quando API não está configurada)
const FALLBACKS = {
  ti: [
    `[OPCAO_1]
**Descrição do incidente:** Foi identificada indisponibilidade parcial do processo em questão no ambiente de produção.
**Impacto:** Médio — afeta a continuidade operacional e pode comprometer o SLA vigente.
**Ação solicitada:** Solicito abertura de chamado P2 para análise de causa raiz e implementação de plano de contenção imediato.`,
    `[OPCAO_2]
**Descrição do incidente:** O cenário reportado indica falha no fluxo operacional padrão, com impacto mensurável na disponibilidade do serviço.
**Impacto:** Alto — requer escalonamento para equipe de N2 com monitoramento contínuo.
**Ação solicitada:** Abertura de incidente crítico para investigação técnica e elaboração de RCA (Root Cause Analysis) em até 24h.`
  ],
  linkedin: [
    `[OPCAO_1]
Estou muito feliz em compartilhar que esta situação foi, sem dúvida, o maior aprendizado da minha jornada profissional! 🚀
Cada desafio é uma oportunidade disfarçada, e hoje posso dizer que cresci imensamente. Resiliência não se aprende em livros — ela se constrói nas trincheiras! 💡
Obrigado a todos que fazem parte desta jornada incrível. Juntos, somos mais fortes! 🙌
O que você faria nessa situação? Comenta abaixo! ✨ #Crescimento #Aprendizado #Networking`,
    `[OPCAO_2]
Estou muito feliz em compartilhar uma reflexão poderosa que esta experiência me trouxe! ✨
Às vezes o universo nos coloca em situações desafiadoras justamente para nos preparar para o próximo nível. E eu estou PRONTO! 🚀
Networking, resiliência e propósito: essa é a fórmula do sucesso. Quem concorda? 💼💡
Marca aquele amigo que precisa ouvir isso hoje! #Liderança #Desenvolvimento #JornadaProfissional`
  ],
  juridico: [
    `[OPCAO_1]
Ad cautelam, importa salientar que a situação ora descrita, hodiernamente verificada, enseja a devida análise quanto à conformidade dos atos praticados. Pacta sunt servanda — as obrigações assumidas pelas partes devem ser cumpridas na exata extensão do acordado. Outrossim, destarte, faz-se mister a adoção das medidas cabíveis para a regularização da presente situação, sob pena de responsabilização nas esferas cível e administrativa.`,
    `[OPCAO_2]
Doravante, e para todos os fins de direito, consigna-se que a matéria em apreço demanda exame aprofundado à luz dos princípios gerais do direito e da legislação vigente. Mutatis mutandis, aplicam-se ao caso os dispositivos legais pertinentes, sendo imperioso que os envolvidos zelem pelo cumprimento estrito de suas obrigações contratuais, ad cautelam, evitando a configuração de responsabilidade solidária.`
  ],
  corporativo: [
    `[OPCAO_1]
Precisamos alinhar os stakeholders chave quanto a este entregável e garantir que nosso roadmap reflita as prioridades estratégicas do board. Sugiro um follow-up para mapear as sinergias existentes e otimizar nossos KPIs de forma sustentável e escalável.`,
    `[OPCAO_2]
Do ponto de vista do alinhamento estratégico, este cenário nos convida a revisitar nossa metodologia ágil e identificar as oportunidades de synergy entre as áreas envolvidas. Proponho um workshop multidisciplinar para co-criar soluções e garantir que os entregáveis estejam em conformidade com nossos objetivos de negócio.`
  ]
};

/**
 * Chama a Gemini 1.5 Flash e parseia as 2 opções de resposta.
 */
async function callGemini(prompt) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erro na API: ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}

/**
 * Parseia o texto retornado pela API nas 2 opções.
 * @param {string} rawText
 * @returns {string[]} Array com 2 strings.
 */
function parseOptions(rawText) {
  // Remove marcadores e divide em 2 opções
  const cleaned = rawText
    .replace(/\[OPCAO_1\]/gi, "|||SPLIT|||")
    .replace(/\[OPCAO_2\]/gi, "")
    .trim();

  const parts = cleaned.split("|||SPLIT|||").map(s => s.trim()).filter(Boolean);

  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], parts[0]];
  return ["Não foi possível gerar uma resposta.", "Tente novamente."];
}

/**
 * Ponto de entrada principal: traduz o texto para o estilo escolhido.
 * Gera 2 opções de resposta.
 * @param {string} inputText - Frase original do usuário.
 * @param {string} style - "ti" | "linkedin" | "juridico" | "corporativo"
 * @returns {Promise<{opcao1: string, opcao2: string, styleName: string, emoji: string}>}
 */
export async function translate(inputText, style) {
  const config = STYLE_CONFIGS[style];
  if (!config) throw new Error(`Estilo desconhecido: ${style}`);

  const { emoji, nome, instrucao } = config;

  // O fallback agora é ativado se a tradução falhar ou em desenvolvimento offline.
  // Você pode forçar o fallback aqui se desejar testar sem a API.
  const isDemoMode = false; 

  if (isDemoMode) {
    console.warn("⚠️ Modo demonstração ativo. Usando respostas de exemplo.");
    const fb = FALLBACKS[style];
    return {
      opcao1: fb[0].replace("[OPCAO_1]", "").trim() + `\n\n_[Exemplo — configure sua Gemini API key no Vercel para ativar a IA real]_`,
      opcao2: fb[1].replace("[OPCAO_2]", "").trim() + `\n\n_[Exemplo — configure sua Gemini API key no Vercel para ativar a IA real]_`,
      styleName: nome,
      emoji
    };
  }

  const prompt = `${instrucao}

Texto do usuário para traduzir:
"${inputText}"

Lembre-se: gere EXATAMENTE 2 versões separadas por [OPCAO_1] e [OPCAO_2].`;

  try {
    const rawText = await callGemini(prompt);
    const [opcao1, opcao2] = parseOptions(rawText);
    return { opcao1, opcao2, styleName: nome, emoji };
  } catch (err) {
    console.error("Erro ao chamar Gemini:", err);
    // Agora não usamos mais o fallback, relançamos o erro para o app.js tratar
    throw err;
  }
}

export { STYLE_CONFIGS };
