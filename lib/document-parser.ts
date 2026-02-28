/**
 * Multi-Format Document Parser
 * Extracts text content from various document formats for AI processing.
 * Supports: PDF, DOCX, XLSX, CSV, ZIP, HTML, TXT, MD, JSON, XML
 */

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';

export interface ParseResult {
  success: boolean;
  text: string;
  format: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    sheetNames?: string[];
    archiveFiles?: string[];
    error?: string;
  };
}

/**
 * Parse document buffer and extract text content
 */
export async function parseDocument(buffer: Buffer, filename: string): Promise<ParseResult> {
  const ext = getExtension(filename);
  
  try {
    switch (ext) {
      case '.pdf':
        return await parsePDF(buffer);
      case '.docx':
      case '.doc':
        return await parseDocx(buffer);
      case '.xlsx':
      case '.xls':
        return await parseExcel(buffer);
      case '.csv':
        return parseCSV(buffer);
      case '.txt':
      case '.md':
        return parsePlainText(buffer, ext);
      case '.html':
      case '.htm':
        return parseHTML(buffer);
      case '.xml':
        return parseXML(buffer);
      case '.json':
        return parseJSON(buffer);
      case '.zip':
        return await parseZip(buffer);
      case '.pptx':
      case '.ppt':
        return await parsePPTX(buffer);
      default:
        return {
          success: false,
          text: '',
          format: ext,
          metadata: { error: `Unsupported format: ${ext}` }
        };
    }
  } catch (error: any) {
    return {
      success: false,
      text: '',
      format: ext,
      metadata: { error: error.message || 'Parse failed' }
    };
  }
}

function getExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : '';
}

/**
 * PDF Parser using pdf-parse
 */
async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  // Use dynamic import with type workaround for pdf-parse
  const pdfParseModule = await import('pdf-parse') as any;
  const pdfParse = pdfParseModule.default ?? pdfParseModule;
  const data = await pdfParse(buffer);
  return {
    success: true,
    text: data.text.trim(),
    format: '.pdf',
    metadata: {
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).length
    }
  };
}

/**
 * DOCX Parser using mammoth
 */
async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    success: true,
    text: result.value.trim(),
    format: '.docx',
    metadata: {
      wordCount: result.value.split(/\s+/).length
    }
  };
}

/**
 * Excel Parser using xlsx
 */
function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const texts: string[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    texts.push(`=== Sheet: ${sheetName} ===\n${csv}`);
  }
  
  return {
    success: true,
    text: texts.join('\n\n'),
    format: '.xlsx',
    metadata: {
      sheetNames: workbook.SheetNames
    }
  };
}

/**
 * CSV Parser (simple text extraction)
 */
function parseCSV(buffer: Buffer): ParseResult {
  const text = buffer.toString('utf-8');
  return {
    success: true,
    text: text.trim(),
    format: '.csv',
    metadata: {
      wordCount: text.split(/\s+/).length
    }
  };
}

/**
 * Plain Text Parser
 */
function parsePlainText(buffer: Buffer, ext: string): ParseResult {
  const text = buffer.toString('utf-8');
  return {
    success: true,
    text: text.trim(),
    format: ext,
    metadata: {
      wordCount: text.split(/\s+/).length
    }
  };
}

/**
 * HTML Parser using cheerio
 */
function parseHTML(buffer: Buffer): ParseResult {
  const html = buffer.toString('utf-8');
  const $ = cheerio.load(html);
  
  // Remove script and style tags
  $('script, style, nav, footer, header').remove();
  
  // Extract main content
  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    success: true,
    text,
    format: '.html',
    metadata: {
      wordCount: text.split(/\s+/).length
    }
  };
}

/**
 * XML Parser - extract text content
 */
function parseXML(buffer: Buffer): ParseResult {
  const xml = buffer.toString('utf-8');
  const $ = cheerio.load(xml, { xmlMode: true });
  
  const text = $.root().text()
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    success: true,
    text,
    format: '.xml',
    metadata: {
      wordCount: text.split(/\s+/).length
    }
  };
}

/**
 * JSON Parser - stringify with readable format
 */
function parseJSON(buffer: Buffer): ParseResult {
  const json = buffer.toString('utf-8');
  let parsed: any;
  
  try {
    parsed = JSON.parse(json);
  } catch {
    // If invalid JSON, return raw text
    return {
      success: true,
      text: json.trim(),
      format: '.json',
      metadata: { error: 'Invalid JSON, returned raw text' }
    };
  }
  
  // Convert JSON to readable text
  const text = jsonToReadableText(parsed);
  
  return {
    success: true,
    text,
    format: '.json',
    metadata: {
      wordCount: text.split(/\s+/).length
    }
  };
}

function jsonToReadableText(obj: any, prefix = ''): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return String(obj);
  
  const lines: string[] = [];
  
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      if (typeof item === 'object') {
        lines.push(`${prefix}[${i + 1}]:`);
        lines.push(jsonToReadableText(item, prefix + '  '));
      } else {
        lines.push(`${prefix}- ${item}`);
      }
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        lines.push(`${prefix}${key}:`);
        lines.push(jsonToReadableText(value, prefix + '  '));
      } else {
        lines.push(`${prefix}${key}: ${value}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * ZIP Archive Parser - extract text from contained files
 */
async function parseZip(buffer: Buffer): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];
  const archiveFiles: string[] = [];
  
  // Supported text extensions in archive
  const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm'];
  
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    
    archiveFiles.push(relativePath);
    const ext = getExtension(relativePath);
    
    // Only extract text-based files from archive
    if (textExtensions.includes(ext)) {
      try {
        const content = await file.async('string');
        texts.push(`=== ${relativePath} ===\n${content.trim()}`);
      } catch {
        // Skip binary files
      }
    }
  }
  
  return {
    success: true,
    text: texts.length > 0 ? texts.join('\n\n') : `Archive contains ${archiveFiles.length} files (no text content extracted)`,
    format: '.zip',
    metadata: {
      archiveFiles
    }
  };
}

/**
 * PPTX Parser - extract text from slides
 * PPTX is a ZIP archive containing XML files
 */
async function parsePPTX(buffer: Buffer): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];
  let slideCount = 0;
  
  // PPTX slides are in ppt/slides/slide*.xml
  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  
  for (const slidePath of slideFiles) {
    try {
      const slideXml = await zip.files[slidePath].async('string');
      const $ = cheerio.load(slideXml, { xmlMode: true });
      
      // Extract text from <a:t> tags (PowerPoint text elements)
      const slideTexts: string[] = [];
      $('a\\:t, t').each((_, el) => {
        const text = $(el).text().trim();
        if (text) slideTexts.push(text);
      });
      
      if (slideTexts.length > 0) {
        slideCount++;
        texts.push(`=== Slide ${slideCount} ===\n${slideTexts.join('\n')}`);
      }
    } catch {
      // Skip problematic slides
    }
  }
  
  return {
    success: true,
    text: texts.length > 0 ? texts.join('\n\n') : 'No text content found in presentation',
    format: '.pptx',
    metadata: {
      pageCount: slideCount,
      wordCount: texts.join(' ').split(/\s+/).length
    }
  };
}

/**
 * Get supported formats list
 */
export function getSupportedFormats(): string[] {
  return [
    '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv',
    '.txt', '.md', '.html', '.htm', '.xml', '.json',
    '.zip', '.pptx', '.ppt'
  ];
}
