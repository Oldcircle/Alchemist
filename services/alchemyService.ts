
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AlchemyResponse, Language, ModelConfig } from "../types";

// --- PROMPT ENGINEERING ---

const alchemySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    emoji: { type: Type.STRING, description: "A single emoji representing the result." },
    name: { type: Type.STRING, description: "The short name of the new element (1-2 words)." },
    description: { type: Type.STRING, description: "A very short, witty description." },
    isLogical: { type: Type.BOOLEAN, description: "True if logical, False if nonsense." },
    flavorText: { type: Type.STRING, description: "Short sentence explaining the combination." },
  },
  required: ["emoji", "name", "description", "isLogical", "flavorText"],
};

const getSystemPrompt = (lang: Language) => {
  const langInstruction = lang === 'zh' 
    ? "Provide the 'name', 'description', and 'flavorText' in Simplified Chinese (Zh-CN)." 
    : "Provide the 'name', 'description', and 'flavorText' in English.";

  return `
    You are the engine for an 'Infinite Alchemy' game.
    Your goal is to creatively determine what new element two inputs create.
    
    Rules:
    1. Be creative but logical. e.g., Fire + Water = Steam.
    2. If abstract, use metaphors. Love + Time = Marriage.
    3. If absolute nonsense, set isLogical: false.
    4. 'emoji': SINGLE Unicode character.
    5. 'name': Short (1-2 words).
    6. ${langInstruction}
    
    IMPORTANT: You must return ONLY valid JSON.
  `;
};

// --- GOOGLE GEMINI STRATEGY ---

const generateWithGemini = async (elementA: string, elementB: string, config: ModelConfig, lang: Language): Promise<AlchemyResponse> => {
  if (!config.apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  const prompt = `Combine: "${elementA}" + "${elementB}". Return JSON.`;

  const response = await ai.models.generateContent({
    model: config.modelName || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: getSystemPrompt(lang),
      responseMimeType: "application/json",
      responseSchema: alchemySchema,
      temperature: 0.7,
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text) as AlchemyResponse;
};

// --- OPENAI COMPATIBLE STRATEGY (OpenAI, DeepSeek, Ollama, etc.) ---

const generateWithOpenAI = async (elementA: string, elementB: string, config: ModelConfig, lang: Language): Promise<AlchemyResponse> => {
  const baseUrl = config.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const apiKey = config.apiKey || ''; // Ollama might not need a key
  
  const prompt = `Combine these two elements: "${elementA}" and "${elementB}".
  
  ${getSystemPrompt(lang)}
  
  Return the result in this exact JSON structure:
  {
    "emoji": "🔥",
    "name": "Fire",
    "description": "Hot stuff",
    "isLogical": true,
    "flavorText": "It burns."
  }
  `;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        { role: 'system', content: "You are a JSON-speaking alchemy engine." },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }, // Many providers support this now
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) throw new Error("Empty response from provider");
  
  try {
    return JSON.parse(content) as AlchemyResponse;
  } catch (e) {
    // Sometimes models wrap json in markdown code blocks
    const cleanJson = content.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanJson);
  }
};

// --- MAIN FACTORY ---

export const combineElements = async (
  elementA: string,
  elementB: string,
  config: ModelConfig,
  language: Language = 'en'
): Promise<AlchemyResponse> => {
  try {
    if (config.provider === 'google') {
      return await generateWithGemini(elementA, elementB, config, language);
    } else {
      // Default to OpenAI compatible for DeepSeek, OpenAI, Ollama, etc.
      // Anthropic would need a separate adapter if calling directly from browser due to CORS,
      // but if the user provides a proxy URL, this works.
      return await generateWithOpenAI(elementA, elementB, config, language);
    }
  } catch (error) {
    console.error("Alchemy failed:", error);
    
    const isZh = language === 'zh';
    return {
      emoji: "🌫️",
      name: isZh ? "连接失败" : "Connection Lost",
      description: isZh ? "请检查你的模型配置。" : "Check your model settings.",
      isLogical: false,
      flavorText: isZh ? `错误: ${error instanceof Error ? error.message : 'Unknown'}` : `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
};
