
import { AiProvider, ModelConfig } from "../types";

export const PROVIDERS: { label: string; value: AiProvider; defaultBaseUrl?: string; defaultModel: string }[] = [
  { 
    label: 'Google Gemini', 
    value: 'google', 
    defaultModel: 'gemini-2.5-flash' 
  },
  { 
    label: 'OpenAI (GPT)', 
    value: 'openai', 
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini' 
  },
  { 
    label: 'DeepSeek', 
    value: 'deepseek', 
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat' 
  },
  { 
    label: 'Anthropic (Claude)', 
    value: 'anthropic', 
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20240620' 
  },
  { 
    label: 'Ollama (Local)', 
    value: 'ollama', 
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3' 
  },
  { 
    label: 'Other (OpenAI Compatible)', 
    value: 'other', 
    defaultBaseUrl: '',
    defaultModel: '' 
  }
];

export const DEFAULT_CONFIG: ModelConfig = {
  id: 'default',
  name: 'Default (Gemini)',
  provider: 'google',
  modelName: 'gemini-2.5-flash',
  apiKey: process.env.API_KEY || ''
};
