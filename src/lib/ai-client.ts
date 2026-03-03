/**
 * AI 客户端 - DashScope (通义千问) OpenAI 兼容模式
 *
 * 使用 OpenAI 兼容的 API 格式调用 DashScope
 * 支持 qwen-max / qwen-plus / deepseek 等模型
 */

const DASHSCOPE_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 调用 DashScope AI 模型
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not configured");
  }

  const {
    model = "qwen-plus",
    temperature = 0.3,
    maxTokens = 4096,
    topP = 0.8,
  } = options;

  const response = await fetch(DASHSCOPE_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DashScope API error (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("DashScope API returned empty response");
  }

  return {
    content: data.choices[0].message.content,
    model: data.model || model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

// ==================== 企业能力画像分析 Prompt ====================

const COMPANY_PROFILE_SYSTEM_PROMPT = `你是一个专业的B2B企业分析师，擅长从企业资料中提炼企业能力画像。

你的任务是分析用户提供的企业资料（可能包括公司介绍、产品资料、技术文档等），提炼出结构化的企业能力画像。

请严格按照以下 JSON 格式输出，不要添加任何额外文字：

{
  "companyName": "企业名称",
  "companyIntro": "一段话概括企业定位和核心业务（100-200字）",
  "coreProducts": [
    { "name": "产品/服务名称", "description": "简要描述", "highlights": ["亮点1", "亮点2"] }
  ],
  "techAdvantages": [
    { "title": "技术优势标题", "description": "具体说明" }
  ],
  "scenarios": [
    { "industry": "适用行业", "scenario": "具体应用场景", "value": "为客户带来的价值" }
  ],
  "differentiators": [
    { "point": "差异化要点", "description": "相比竞品的优势说明" }
  ],
  "targetIndustries": ["目标行业1", "目标行业2"],
  "targetRegions": ["目标地区1", "目标地区2"],
  "buyerPersonas": [
    { "role": "决策者角色", "title": "典型职位", "concerns": ["关注点1", "关注点2"] }
  ],
  "painPoints": [
    { "pain": "客户痛点", "howWeHelp": "我们如何解决" }
  ],
  "buyingTriggers": ["购买触发因素1", "购买触发因素2"]
}

注意：
- 如果某个字段从资料中无法确定，使用空数组 []
- 每个类别尽量提炼 3-5 条核心要点
- 目标客户画像(ICP)要基于企业产品特性进行合理推断
- 所有内容使用中文
- 只输出 JSON，不要有任何其他文字`;

/**
 * 分析企业资料，生成能力画像
 */
export async function analyzeCompanyProfile(
  materialTexts: string[]
): Promise<{
  analysis: Record<string, unknown>;
  model: string;
  usage: ChatCompletionResponse["usage"];
}> {
  const combinedText = materialTexts.join("\n\n---\n\n");

  // 截取最多 60000 字符（留空间给 prompt）
  const truncatedText =
    combinedText.length > 60000
      ? combinedText.slice(0, 60000) + "\n...(内容已截断)"
      : combinedText;

  const response = await chatCompletion(
    [
      { role: "system", content: COMPANY_PROFILE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `请分析以下企业资料，提炼企业能力画像：\n\n${truncatedText}`,
      },
    ],
    {
      model: "qwen-plus",
      temperature: 0.2,
      maxTokens: 4096,
    }
  );

  // 提取 JSON
  let jsonStr = response.content.trim();
  // 去除可能的 markdown code block 包裹
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let analysis: Record<string, unknown>;
  try {
    analysis = JSON.parse(jsonStr);
  } catch {
    throw new Error("AI 返回的分析结果格式异常，请重试");
  }

  return {
    analysis,
    model: response.model,
    usage: response.usage,
  };
}
