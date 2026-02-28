import { getProviderConfig } from './config';

interface GenerateOptions {
  responseSchema?: object;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface GenerateResult {
  content: string;
  parsed?: any;
}

export async function generateAIContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const config = getProviderConfig();

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider '${process.env.AI_PROVIDER || 'dashscope'}'. Check your .env file.`);
  }

  const messages: { role: string; content: string }[] = [];

  // Build system message
  if (options.systemPrompt || options.responseSchema) {
    let systemContent = options.systemPrompt || '';
    if (options.responseSchema) {
      const schemaInstruction = `\n\nYou MUST return a valid JSON object matching exactly this JSON Schema:\n${JSON.stringify(options.responseSchema, null, 2)}\n\nReturn ONLY the JSON object, no markdown fences, no explanation.`;
      systemContent = systemContent ? systemContent + schemaInstruction : schemaInstruction;
    }
    messages.push({ role: 'system', content: systemContent });
  }

  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };

  if (options.responseSchema) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetchWithRetry(config, body);
  const content = response.choices?.[0]?.message?.content || '';

  if (options.responseSchema) {
    try {
      const parsed = JSON.parse(cleanJsonResponse(content));
      return { content, parsed };
    } catch {
      // Retry once with a stricter prompt
      const retryMessages = [
        ...messages,
        { role: 'assistant', content },
        { role: 'user', content: 'The previous response was not valid JSON. Please return ONLY a valid JSON object matching the schema. No markdown, no explanation.' }
      ];
      const retryBody = { ...body, messages: retryMessages };
      const retryResponse = await fetchWithRetry(config, retryBody);
      const retryContent = retryResponse.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(cleanJsonResponse(retryContent));
        return { content: retryContent, parsed };
      } catch (e) {
        throw new Error(`AI returned invalid JSON after retry. Raw response: ${retryContent.substring(0, 200)}`);
      }
    }
  }

  return { content };
}

function cleanJsonResponse(text: string): string {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return cleaned.trim();
}

async function fetchWithRetry(
  config: ReturnType<typeof getProviderConfig>,
  body: any,
  retries = 1
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...(config.headers || {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI provider returned ${res.status}: ${errBody.substring(0, 300)}`);
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('AI request failed');
}
