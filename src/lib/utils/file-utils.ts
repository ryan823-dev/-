import {
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Presentation,
} from "lucide-react";
import type { FileCategory } from "@/types/assets";
import type { LucideIcon } from "lucide-react";

// ==================== MIME 类型映射 ====================

const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/3gpp",
  "video/mpeg",
];

const AUDIO_MIMES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/x-m4a",
];

const DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
  "text/html",
  "text/csv",
  "application/rtf",
];

const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".rtf",
  ".csv",
  ".html",
  ".htm",
];

// ==================== 文件类别检测 ====================

/**
 * 根据 MIME 类型和扩展名检测文件类别
 */
export function detectFileCategory(mimeType: string, extension: string): FileCategory {
  const mime = mimeType.toLowerCase();
  const ext = extension.toLowerCase().startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

  // 图片
  if (IMAGE_MIMES.includes(mime) || mime.startsWith("image/")) {
    return "image";
  }

  // 视频
  if (VIDEO_MIMES.includes(mime) || mime.startsWith("video/")) {
    return "video";
  }

  // 音频
  if (AUDIO_MIMES.includes(mime) || mime.startsWith("audio/")) {
    return "audio";
  }

  // 文档
  if (DOCUMENT_MIMES.includes(mime) || DOCUMENT_EXTENSIONS.includes(ext)) {
    return "document";
  }

  return "other";
}

// ==================== 文件大小格式化 ====================

/**
 * 格式化文件大小为可读字符串
 */
export function formatFileSize(bytes: number | bigint): string {
  const size = typeof bytes === "bigint" ? Number(bytes) : bytes;

  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(size) / Math.log(k));

  return `${parseFloat((size / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

// ==================== 文件类别标签 ====================

const CATEGORY_LABELS: Record<FileCategory, string> = {
  video: "视频",
  image: "图片",
  document: "文档",
  audio: "音频",
  other: "其他",
};

const CATEGORY_LABELS_EN: Record<FileCategory, string> = {
  video: "Video",
  image: "Image",
  document: "Document",
  audio: "Audio",
  other: "Other",
};

/**
 * 获取文件类别的中文标签
 */
export function getFileCategoryLabel(category: FileCategory, locale: string = "zh-CN"): string {
  return locale === "en" ? CATEGORY_LABELS_EN[category] : CATEGORY_LABELS[category];
}

// ==================== 文件类别图标 ====================

// 直接导出图标映射表，供组件直接使用
export const CATEGORY_ICONS: Record<FileCategory, LucideIcon> = {
  video: FileVideo,
  image: FileImage,
  document: FileText,
  audio: FileAudio,
  other: File,
};

// 扩展名图标映射
const EXTENSION_ICONS: Record<string, LucideIcon> = {
  // 表格
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ods: FileSpreadsheet,
  // 演示文稿
  ppt: Presentation,
  pptx: Presentation,
  odp: Presentation,
  // 代码
  js: FileCode,
  ts: FileCode,
  jsx: FileCode,
  tsx: FileCode,
  html: FileCode,
  css: FileCode,
  json: FileCode,
  xml: FileCode,
  py: FileCode,
  java: FileCode,
  go: FileCode,
  rs: FileCode,
  // 压缩包
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  bz2: FileArchive,
};

/**
 * 获取文件类别对应的 Lucide 图标组件
 */
export function getFileCategoryIcon(category: FileCategory): LucideIcon {
  return CATEGORY_ICONS[category];
}

/**
 * 根据扩展名获取更具体的图标
 */
export function getFileExtensionIcon(extension: string): LucideIcon {
  const ext = extension.toLowerCase().replace(".", "");
  return EXTENSION_ICONS[ext] || FileText;
}

// ==================== 文件类别颜色 ====================

const CATEGORY_COLORS: Record<FileCategory, string> = {
  video: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  image: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  document: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  audio: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * 获取文件类别对应的 Tailwind 颜色类
 */
export function getFileCategoryColor(category: FileCategory): string {
  return CATEGORY_COLORS[category];
}

// ==================== 预览支持检测 ====================

const PREVIEWABLE_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const PREVIEWABLE_VIDEO_MIMES = ["video/mp4", "video/webm", "video/ogg"];
const PREVIEWABLE_AUDIO_MIMES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];

/**
 * 检查文件是否可以内联预览
 */
export function isPreviewable(fileCategory: FileCategory, mimeType: string): boolean {
  const mime = mimeType.toLowerCase();

  switch (fileCategory) {
    case "image":
      return PREVIEWABLE_IMAGE_MIMES.includes(mime);
    case "video":
      return PREVIEWABLE_VIDEO_MIMES.includes(mime);
    case "audio":
      return PREVIEWABLE_AUDIO_MIMES.includes(mime);
    case "document":
      // PDF 可以用 iframe 预览
      return mime === "application/pdf";
    default:
      return false;
  }
}

// ==================== 文件名处理 ====================

/**
 * 截断文件名，保留扩展名
 */
export function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) return fileName;

  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) {
    return fileName.slice(0, maxLength - 3) + "...";
  }

  const name = fileName.slice(0, lastDot);
  const ext = fileName.slice(lastDot);

  const availableLength = maxLength - ext.length - 3; // 3 for "..."
  if (availableLength <= 0) {
    return fileName.slice(0, maxLength - 3) + "...";
  }

  return name.slice(0, availableLength) + "..." + ext;
}

/**
 * 提取文件扩展名（带点）
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * 获取不带扩展名的文件名
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) {
    return fileName;
  }
  return fileName.slice(0, lastDot);
}
