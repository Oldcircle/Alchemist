
export type Language = 'en' | 'zh';

export type AiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'ollama' | 'other';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  modelName: string;
}

export interface ElementItem {
  id: string;
  emoji: string;
  name: string;
  description?: string;
  isNew?: boolean; // For animation purposes
  discoveredAt?: number;
  flavorText?: string;
  parents?: string[]; // IDs of the two elements that created this
}

export interface CombinationResult {
  success: boolean;
  element?: ElementItem;
  message?: string; // Flavor text for the combination
}

export interface AlchemyResponse {
  emoji: string;
  name: string;
  description: string;
  isLogical: boolean;
  flavorText: string;
}

export enum GameState {
  IDLE = 'IDLE',
  BREWING = 'BREWING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}