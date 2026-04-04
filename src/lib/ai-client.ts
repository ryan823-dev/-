/**
 * AI 客户端 - DashScope (通义千问) OpenAI 兼容模式
 *
 * 使用 curl + 流式模式(stream:true) 调用 DashScope API。
 * 原因：
 *   1. Node.js https 模块在此 Windows 环境下 30s+ 请求会 ECONNRESET
 *   2. curl 使用 Windows Schannel 不受此限制
 *   3. 流式模式保持数据持续传输，避免空闲连接被中间设备重置
 *
 * 重要：使用异步 spawn（非 spawnSync）避免阻塞 Node.js 事件循环，
 * 否则 Next.js server action 长时间无法处理心跳/keep-alive 会导致连接中断。
 */

import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  /** curl max-time in seconds (default 300) */
  timeout?: number;
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
 * 解析 SSE (Server-Sent Events) 流式响应，拼接为完整内容
 */
function parseSSEResponse(
  sseText: string,
  fallbackModel: string
): ChatCompletionResponse {
  let fullContent = "";
  let model = fallbackModel;
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  for (const line of sseText.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") continue;

    try {
      const parsed = JSON.parse(data);
      if (parsed.model) model = parsed.model;
      if (parsed.usage) {
        usage = {
          promptTokens: parsed.usage.prompt_tokens || 0,
          completionTokens: parsed.usage.completion_tokens || 0,
          totalTokens: parsed.usage.total_tokens || 0,
        };
      }
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.content) fullContent += delta.content;
    } catch {
      /* skip malformed chunks */
    }
  }

  return { content: fullContent, model, usage };
}

/**
 * 异步执行 curl 命令，返回 stdout/stderr
 */
function execCurl(args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("curl", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGTERM");
        reject(new Error(`curl timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
          stderr: Buffer.concat(stderrChunks).toString("utf-8"),
          exitCode: code ?? 1,
        });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(new Error(`curl spawn error: ${err.message}`));
      }
    });
  });
}

/**
 * 调用 DashScope AI 模型
 * 使用异步 curl + stream:true 绕过 Node.js TLS 和空闲连接超时问题
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
    timeout = 300,
  } = options;

  const requestBody = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    stream: true,
  });

  const ts = Date.now();
  const tmpFile = join(tmpdir(), `dashscope-${ts}-${Math.random().toString(36).slice(2, 8)}.json`);
  writeFileSync(tmpFile, requestBody, "utf-8");

  console.log(
    `[chatCompletion] curl+stream (async), model=${model}, maxTokens=${maxTokens}, bodySize=${requestBody.length}`
  );

  try {
    const result = await execCurl([
      "-s", "-S",
      "--max-time", String(timeout),
      "-X", "POST",
      DASHSCOPE_BASE_URL,
      "-H", "Content-Type: application/json",
      "-H", `Authorization: Bearer ${apiKey}`,
      "--data-binary", `@${tmpFile}`,
    ], (timeout + 10) * 1000);

    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();

    if (result.exitCode !== 0) {
      throw new Error(
        `curl failed (exit ${result.exitCode}): ${stderr || "unknown"}`
      );
    }

    if (!stdout) {
      throw new Error(`curl returned empty response. stderr: ${stderr}`);
    }

    // 解析 SSE 流式响应
    const response = parseSSEResponse(stdout, model);

    if (!response.content) {
      // 可能是非流式错误响应
      try {
        const errorData = JSON.parse(stdout);
        if (errorData.error) {
          throw new Error(`DashScope error: ${JSON.stringify(errorData.error)}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("DashScope")) throw e;
      }
      throw new Error("DashScope returned empty content");
    }

    console.log(
      `[chatCompletion] done: ${response.content.length} chars, model=${response.model}, ${Date.now() - ts}ms`
    );

    return response;
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

/**
 * OpenAI-compatible client interface for server actions
 */
export const aiClient = {
  chat: {
    completions: {
      create: async (params: {
        model?: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
      }) => {
        const response = await chatCompletion(
          params.messages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          })),
          {
            model: params.model,
            temperature: params.temperature,
            maxTokens: params.max_tokens,
          }
        );
        return {
          choices: [{ message: { content: response.content } }],
          model: response.model,
          usage: {
            prompt_tokens: response.usage.promptTokens,
            completion_tokens: response.usage.completionTokens,
            total_tokens: response.usage.totalTokens,
          },
        };
      },
    },
  },
};

// ==================== Streaming Support ====================

interface StreamingChunk {
  type: 'chunk' | 'done' | 'error' | 'usage';
  content?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * 实时流式响应 - 边接收边发送
 * 使用 curl --no-buffer 实现真正的实时流
 */
export function createStreamingResponse(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Response {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DASHSCOPE_API_KEY is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    model = "qwen-plus",
    temperature = 0.3,
    maxTokens = 4096,
    topP = 0.8,
    timeout = 300,
  } = options;

  // 构建实时流
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let buffer = "";

      const sendEvent = (data: StreamingChunk) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller 可能已关闭
        }
      };

      // 构建请求体
      const requestBody = JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: true,
      });

      const ts = Date.now();
      const tmpFile = join(tmpdir(), `dashscope-realtime-${ts}-${Math.random().toString(36).slice(2, 8)}.json`);
      writeFileSync(tmpFile, requestBody, "utf-8");

      console.log(`[realtime streaming] curl+stream, model=${model}, maxTokens=${maxTokens}`);

      // 使用 --no-buffer 实现实时流
      const proc = spawn("curl", [
        "-s", "-S",
        "-N",  // --no-buffer: 禁用缓冲，实时输出
        "--max-time", String(timeout),
        "-X", "POST",
        DASHSCOPE_BASE_URL,
        "-H", "Content-Type: application/json",
        "-H", `Authorization: Bearer ${apiKey}`,
        "--data-binary", `@${tmpFile}`,
      ], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let fullContent = "";
      let finalModel = model;
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let settled = false;

      // 处理 stdout 数据流 - 边接收边发送
      proc.stdout.on("data", (chunk: Buffer) => {
        if (settled) return;
        buffer += chunk.toString("utf-8");

        // 处理完整的 SSE 行
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留不完整的行

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.model) finalModel = parsed.model;
            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens || 0,
                completionTokens: parsed.usage.completion_tokens || 0,
                totalTokens: parsed.usage.total_tokens || 0,
              };
            }
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              // 实时发送给客户端
              sendEvent({ type: 'chunk', content: delta.content });
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      });

      // 处理错误
      proc.stderr.on("data", (chunk: Buffer) => {
        console.error("[realtime streaming] stderr:", chunk.toString());
      });

      // 处理完成
      proc.on("close", (code) => {
        if (settled) return;
        settled = true;

        // 清理临时文件
        try { unlinkSync(tmpFile); } catch { /* ignore */ }

        if (code !== 0) {
          sendEvent({ type: 'error', error: `curl exited with code ${code}` });
        } else {
          sendEvent({ type: 'done', content: fullContent, model: finalModel });
          sendEvent({ type: 'usage', usage });
        }

        console.log(`[realtime streaming] done: ${fullContent.length} chars, ${Date.now() - ts}ms`);

        try {
          controller.close();
        } catch {
          // controller 可能已关闭
        }
      });

      proc.on("error", (err) => {
        if (settled) return;
        settled = true;
        console.error("[realtime streaming] spawn error:", err);
        sendEvent({ type: 'error', error: err.message });
        try { unlinkSync(tmpFile); } catch { /* ignore */ }
        try { controller.close(); } catch { /* ignore */ }
      });

      // 设置超时保护
      setTimeout(() => {
        if (!settled) {
          settled = true;
          proc.kill("SIGTERM");
          sendEvent({ type: 'error', error: 'Request timeout' });
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
          try { controller.close(); } catch { /* ignore */ }
        }
      }, (timeout + 30) * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // 禁用 Nginx 缓冲
    },
  });
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

  let jsonStr = response.content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let analysis: Record<string, unknown>;
  try {
    analysis = JSON.parse(jsonStr);
  } catch (error) {
    console.error("[parseAIResponse] JSON parse error:", error);
    throw new Error("AI 返回的分析结果格式异常，请重试");
  }

  return {
    analysis,
    model: response.model,
    usage: response.usage,
  };
}
