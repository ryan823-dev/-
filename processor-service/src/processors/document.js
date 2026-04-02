import pdfParse from 'pdf-parse';

/**
 * 文本分块配置
 */
const CHUNK_SIZE = 1000; // 每块字符数
const CHUNK_OVERLAP = 200; // 重叠字符数

/**
 * 处理文档文件 (PDF, Word, TXT)
 * @param {Buffer} fileBuffer 文件内容
 * @param {string} mimeType MIME 类型
 * @returns {object} { text, chunks }
 */
export async function processDocument(fileBuffer, mimeType) {
  let text = '';

  if (mimeType === 'application/pdf') {
    text = await extractPdfText(fileBuffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    text = await extractWordText(fileBuffer);
  } else if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
    text = fileBuffer.toString('utf-8');
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    text = await extractPPTText(fileBuffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/spreadsheet'
  ) {
    text = await extractExcelText(fileBuffer);
  } else {
    // 尝试作为文本处理
    try {
      text = fileBuffer.toString('utf-8');
    } catch {
      throw new Error(`Unsupported document type: ${mimeType}`);
    }
  }

  // 清理文本
  text = cleanText(text);

  if (!text || text.length < 10) {
    throw new Error('文本提取失败或内容过少');
  }

  // 分块
  const chunks = splitTextIntoChunks(text);

  return { text, chunks };
}

/**
 * 从 PDF 提取文本
 * @param {Buffer} buffer PDF 文件内容
 * @returns {string} 提取的文本
 */
async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer, {
      max: 0, // 不限制页数
    });
    return data.text;
  } catch (error) {
    throw new Error(`PDF 解析失败: ${error.message}`);
  }
}

/**
 * 从 Word 文档提取文本
 * @param {Buffer} buffer Word 文件内容
 * @returns {string} 提取的文本
 */
async function extractWordText(buffer) {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Word 解析失败: ${error.message}`);
  }
}

/**
 * 从 PPT 文档提取文本
 * @param {Buffer} buffer PPT 文件内容
 * @returns {string} 提取的文本
 */
async function extractPPTText(buffer) {
  try {
    const pptxParser = (await import('node-pptx-parser')).default;
    const result = await pptxParser.parse(buffer);
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    throw new Error(`PPT 解析失败: ${error.message}`);
  }
}

/**
 * 从 Excel 文档提取文本
 * @param {Buffer} buffer Excel 文件内容
 * @returns {string} 提取的文本
 */
async function extractExcelText(buffer) {
  try {
    const xlsx = (await import('xlsx')).default;
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const texts = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        texts.push(`[${sheetName}]\n${csv}`);
      }
    }
    return texts.join('\n\n');
  } catch (error) {
    throw new Error(`Excel 解析失败: ${error.message}`);
  }
}

/**
 * 清理文本
 * @param {string} text 原始文本
 * @returns {string} 清理后的文本
 */
function cleanText(text) {
  // 移除多余空白
  text = text.replace(/\s+/g, ' ');
  // 移除特殊控制字符
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // 移除连续空行
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * 文本分块
 * @param {string} text 原始文本
 * @returns {Array} 分块数组
 */
function splitTextIntoChunks(text) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    // 如果不是最后一块，尝试在句子边界分割
    if (end < text.length) {
      // 查找最近的句子结束位置
      const searchStart = end - CHUNK_OVERLAP;
      const searchEnd = end + CHUNK_OVERLAP;
      const searchRange = text.slice(searchStart, searchEnd);

      // 优先在段落边界分割
      const paragraphBreak = searchRange.lastIndexOf('\n\n');
      if (paragraphBreak !== -1) {
        end = searchStart + paragraphBreak + 2;
      } else {
        // 其次在句子边界分割
        const sentenceEnds = ['。', '！', '？', '.', '!', '?', '；', ';'];
        for (const endChar of sentenceEnds) {
          const pos = searchRange.lastIndexOf(endChar);
          if (pos !== -1 && pos > CHUNK_OVERLAP / 2) {
            end = searchStart + pos + 1;
            break;
          }
        }
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText.length > 0) {
      chunks.push({
        content: chunkText,
        charStart: start,
        charEnd: end,
        tokenCount: estimateTokens(chunkText),
      });
    }

    // 下一块起始位置考虑重叠
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = end;
  }

  return chunks;
}

/**
 * 估算 token 数量
 * @param {string} text 文本
 * @returns {number} token 估算值
 */
function estimateTokens(text) {
  // 中文约 1.5 字符/token，英文约 4 字符/token
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

/**
 * 从 PPT/PPTX 提取文本
 * @param {Buffer} buffer PPT 文件内容
 * @returns {string} 提取的文本
 */
async function extractPPTText(buffer) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    // 创建临时文件
    const tempFile = path.join(os.tmpdir(), `pptx-${Date.now()}.pptx`);
    fs.writeFileSync(tempFile, buffer);
    
    // 使用 node-pptx-parser 解析
    const pptx = await pptxParser.parse(tempFile);
    
    // 清理临时文件
    fs.unlinkSync(tempFile);
    
    // 提取所有幻灯片的文本和备注
    const texts = pptx.slides.map(slide => {
      const slideText = slide.rawText || '';
      const notesText = slide.notes || '';
      return [slideText, notesText].filter(t => t && t.trim().length > 0).join('\n');
    }).filter(text => text && text.trim().length > 0);
    
    return texts.join('\n\n');
  } catch (error) {
    throw new Error(`PPT 解析失败：${error.message}`);
  }
}

/**
 * 从 Excel/XLSX 提取文本
 * @param {Buffer} buffer Excel 文件内容
 * @returns {string} 提取的文本
 */
async function extractExcelText(buffer) {
  try {
    // 读取工作簿
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    const texts = [];
    
    // 遍历所有工作表
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      // 转换为 JSON 数组
      const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // 将每行转换为文本
      const sheetText = json
        .map(row => {
          if (Array.isArray(row)) {
            return row.join(' ');
          }
          return '';
        })
        .filter(line => line && line.trim().length > 0)
        .join('\n');
      
      texts.push(`[工作表：${sheetName}]\n${sheetText}`);
    }
    
    return texts.join('\n\n');
  } catch (error) {
    throw new Error(`Excel 解析失败：${error.message}`);
  }
}