export type AIProvider = 'dashscope' | 'openrouter';

export interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

export function getProviderConfig(): ProviderConfig {
  const provider = (process.env.AI_PROVIDER || 'dashscope').trim() as AIProvider;
  const modelOverride = process.env.AI_MODEL?.trim();

  switch (provider) {
    case 'dashscope':
      return {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
        model: modelOverride || 'qwen-plus',
      };

    case 'openrouter':
      return {
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        model: modelOverride || 'anthropic/claude-3-haiku-20240307',
        headers: {
          'HTTP-Referer': 'https://vertax.top',
          'X-Title': 'VertaX',
        },
      };

    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use 'dashscope' or 'openrouter'.`);
  }
}
