/**
 * 文本提取工具
 *
 * 从不同格式的文件中提取纯文本内容。
 * 被 knowledge.ts 和 assets.ts 的处理逻辑共同调用。
 * 扫描件 PDF（无文字层）自动走 DashScope qwen-long OCR 通道。
 *
 * 增强版本：
 * - 使用 markitdown 作为 Office 文档首选解析器（更好的表格/图表支持）
 * - officeparser 作为回退方案
 */

import { generatePresignedGetUrl } from "@/lib/oss";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Office 格式 MIME 类型
const OFFICE_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-powerpoint", // ppt
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",   // docx
  "application/msword",            // doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",         // xlsx
  "application/vnd.ms-excel",      // xls
]);

// PPT 格式（markitdown 特别擅长）
const PPT_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);

// ==================== DashScope OCR ====================

/**
 * 上传文件到 DashScope Files API，返回 file_id
 */
async function uploadToDashScope(buffer: Buffer, filename: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY not configured");

  const formData = new FormData();
  // Convert Buffer to Uint8Array to avoid SharedArrayBuffer type issues
  const uint8 = new Uint8Array(buffer);
  formData.append(
    "file",
    new Blob([uint8], { type: "application/pdf" }),
    filename
  );
  formData.append("purpose", "file-extract");

  const res = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/files",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    }
  );

  const data = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !data.id) {
    throw new Error(
      `DashScope file upload failed: ${data.error?.message ?? res.statusText}`
    );
  }
  return data.id;
}

/**
 * 使用 qwen-long 对上传的文件进行 OCR / 文本提取
 */
async function extractWithQwenLong(fileId: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY not configured");

  const res = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-long",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "system", content: `fileid://${fileId}` },
          {
            role: "user",
            content:
              "请提取这个文档中的所有文字内容，保留原始结构，只输出文字内容，不要添加任何解释或说明。",
          },
        ],
        max_tokens: 8000,
      }),
    }
  );

  const data = (await res.json()) as {
    choices?: Array<{ message: { content: string } }>;
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    throw new Error(
      `qwen-long OCR failed: ${data.error?.message ?? res.statusText}`
    );
  }

  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * 扫描件 PDF OCR：上传 → qwen-long 提取
 */
async function ocrScannedPdf(buffer: Buffer): Promise<string> {
  const fileId = await uploadToDashScope(buffer, "document.pdf");
  const text = await extractWithQwenLong(fileId);
  return text;
}

// ==================== MarkItDown 解析器 ====================

/**
 * 使用 markitdown 提取文档内容（更好的表格/图表支持）
 */
async function extractWithMarkitdown(filePath: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MarkItDown } = require("markitdown");
    const converter = new MarkItDown();
    const result = await converter.convert(filePath);
    return result.textContent || "";
  } catch (error) {
    console.warn("[text-extract] markitdown error:", error);
    return "";
  }
}

/**
 * 使用 officeparser 提取文档内容（回退方案）
 */
async function extractWithOfficeParser(filePath: string): Promise<string> {
  try {
    const { parseOffice } = (await import("officeparser")) as unknown as {
      parseOffice: (
        file: string,
        config?: Record<string, unknown>
      ) => Promise<{ toText?: () => string } | string>;
    };
    const result = await parseOffice(filePath, {
      outputErrorToConsole: false,
      newlineDelimiter: "\n",
      ignoreNotes: false,
    });
    return typeof result === "string"
      ? result
      : typeof (result as { toText?: () => string }).toText === "function"
      ? (result as { toText: () => string }).toText()
      : String(result);
  } catch (error) {
    console.warn("[text-extract] officeparser error:", error);
    return "";
  }
}

// ==================== 主函数 ====================

/**
 * 从 OSS 存储的文件中提取文本
 */
export async function extractTextFromAsset(
  storageKey: string,
  mimeType: string
): Promise<string> {
  // 生成临时下载 URL
  const url = await generatePresignedGetUrl(storageKey, 600);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  // 纯文本类文件直接读取
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "text/markdown"
  ) {
    return await response.text();
  }

  // PDF
  if (mimeType === "application/pdf") {
    const buffer = Buffer.from(await response.arrayBuffer());

    // 先用 pdf-parse 尝试提取文字层
    let pdfText = "";
    try {
      const pdfModule = (await import("pdf-parse")) as unknown as {
        default?: (buffer: Buffer) => Promise<{ text: string }>;
      };
      const pdfParse =
        pdfModule.default ||
        (pdfModule as unknown as (
          buffer: Buffer
        ) => Promise<{ text: string }>);
      const data = await pdfParse(buffer);
      pdfText = data.text?.trim() ?? "";
    } catch (error) {
      console.warn("[text-extract] pdf-parse error:", error);
    }

    // 文字层内容充足 → 直接返回
    if (pdfText.length >= 50) {
      return pdfText;
    }

    // 文字层内容过少（扫描件）→ 走 qwen-long OCR
    console.log(
      `[text-extract] PDF text too short (${pdfText.length} chars), trying qwen-long OCR...`
    );
    try {
      const ocrText = await ocrScannedPdf(buffer);
      if (ocrText && ocrText.length >= 20) {
        return ocrText;
      }
    } catch (ocrError) {
      console.warn("[text-extract] qwen-long OCR failed:", ocrError);
    }

    return `[扫描件PDF: OCR提取失败，请使用含文字层的PDF]`;
  }

  // Office 格式：PPTX / PPT / DOCX / DOC / XLSX / XLS
  if (OFFICE_MIME_TYPES.has(mimeType)) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = mimeType.includes("presentation") ? "pptx"
      : mimeType.includes("spreadsheet") ? "xlsx"
      : mimeType.includes("word") || mimeType === "application/msword" ? "docx"
      : "office";
    const tmpFile = join(tmpdir(), `office_${randomUUID()}.${ext}`);

    try {
      writeFileSync(tmpFile, buffer);
      let text = "";

      // 首选：markitdown（对表格、PPT 布局支持更好）
      text = await extractWithMarkitdown(tmpFile);

      // 如果 markitdown 结果不理想，尝试 officeparser 回退
      if (!text || text.trim().length < 20) {
        console.log("[text-extract] markitdown result insufficient, trying officeparser fallback...");
        text = await extractWithOfficeParser(tmpFile);
      }

      if (!text || text.trim().length < 5) {
        return `[Office文件: 文本内容为空或过少]`;
      }
      return text;
    } catch (error) {
      console.warn("[text-extract] Office parsing failed:", error);
      return `[Office文件: 文本提取失败]`;
    } finally {
      // 清理临时文件
      try {
        if (existsSync(tmpFile)) {
          unlinkSync(tmpFile);
        }
      } catch {
        /* ignore */
      }
    }
  }

  // 其他格式暂不支持
  return `[${mimeType}: 暂不支持文本提取]`;
}

// ==================== 结构化数据提取 ====================

/**
 * 提取提示词模板
 */
const EXTRACTION_PROMPTS = {
  // 项目案例提取
  projectCases: `从文档中提取所有项目案例信息，输出JSON数组格式：
[
  {
    "projectName": "项目名称",
    "client": "客户名称",
    "location": "项目地点",
    "industry": "所属行业",
    "description": "项目简述",
    "value": "项目价值/成果",
    "technologies": ["使用的技术/产品"]
  }
]
只输出JSON数组，不要其他文字。如果没有找到项目案例，返回空数组 []。`,

  // 产品信息提取
  products: `从文档中提取所有产品信息，输出JSON数组格式：
[
  {
    "name": "产品名称",
    "category": "产品类别",
    "description": "产品描述",
    "features": ["特性1", "特性2"],
    "specifications": "技术规格",
    "applications": ["应用场景1", "应用场景2"]
  }
]
只输出JSON数组，不要其他文字。如果没有找到产品信息，返回空数组 []。`,

  // 客户证言/评价提取
  testimonials: `从文档中提取所有客户证言或评价，输出JSON数组格式：
[
  {
    "client": "客户名称",
    "content": "证言内容",
    "source": "来源/职位"
  }
]
只输出JSON数组，不要其他文字。如果没有找到，返回空数组 []。`,

  // 数据指标提取
  metrics: `从文档中提取所有数据指标，输出JSON数组格式：
[
  {
    "metric": "指标名称",
    "value": "数值",
    "unit": "单位",
    "context": "上下文说明"
  }
]
只输出JSON数组，不要其他文字。如果没有找到，返回空数组 []。`,

  // 通用证据提取
  evidence: `从文档中提取可以作为企业能力证明的证据，输出JSON数组格式：
[
  {
    "type": "证据类型（如：项目案例|技术专利|认证资质|客户评价|数据指标）",
    "title": "证据标题",
    "content": "证据内容摘要",
    "source": "原文出处"
  }
]
只输出JSON数组，不要其他文字。如果没有找到，返回空数组 []。`,
};

export type ExtractionType = keyof typeof EXTRACTION_PROMPTS;

/**
 * 从文档中提取结构化数据
 * 使用 DashScope qwen-plus 进行智能提取
 */
export async function extractStructuredData(
  text: string,
  extractionType: ExtractionType,
  customPrompt?: string
): Promise<unknown[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY not configured");
  }

  const prompt = customPrompt || EXTRACTION_PROMPTS[extractionType];

  // 限制输入长度
  const truncatedText = text.length > 80000
    ? text.slice(0, 80000) + "\n...(内容已截断)"
    : text;

  const response = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: "你是一个专业的文档信息提取助手，擅长从企业文档中提取结构化信息。" },
          { role: "user", content: `${prompt}\n\n## 文档内容\n${truncatedText}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope API error: ${errorText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || "";

  // 去除可能的 markdown 代码块包裹
  content = content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(content);
  } catch {
    console.warn("[extractStructuredData] Failed to parse JSON:", content.slice(0, 200));
    return [];
  }
}

/**
 * 从 OSS 文件提取结构化数据（一站式接口）
 */
export async function extractStructuredDataFromAsset(
  storageKey: string,
  mimeType: string,
  extractionType: ExtractionType,
  customPrompt?: string
): Promise<unknown[]> {
  // 先提取文本
  const text = await extractTextFromAsset(storageKey, mimeType);

  if (!text || text.startsWith("[")) {
    // 如果是错误提示或空内容
    return [];
  }

  // 再进行结构化提取
  return extractStructuredData(text, extractionType, customPrompt);
}
