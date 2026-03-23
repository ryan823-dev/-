"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  FileVideo,
  FileImage,
  FileText,
  FileAudio,
  File,
  FileSpreadsheet,
  Presentation,
  FileCode,
  FileArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileCategory } from "@/types/assets";

interface AssetThumbnailProps {
  storageKey: string;
  fileCategory: FileCategory;
  mimeType: string;
  title: string;
  thumbnailUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-full w-full",
};

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

// 直接定义图标组件映射 - 在组件外部定义，避免渲染期间创建
const CATEGORY_ICONS_MAP: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  video: FileVideo,
  image: FileImage,
  document: FileText,
  audio: FileAudio,
  other: File,
};

// 扩展名图标映射
const EXTENSION_ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  "7z": FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  bz2: FileArchive,
};

export function AssetThumbnail({
  fileCategory,
  mimeType: _mimeType,
  title,
  thumbnailUrl,
  size = "md",
  className,
}: AssetThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 可以显示缩略图的类型
  const canShowThumbnail =
    thumbnailUrl && (fileCategory === "image" || fileCategory === "video") && !imageError;

  // 直接从映射表获取图标组件
  const Icon = CATEGORY_ICONS_MAP[fileCategory];
  const iconSize = iconSizes[size];

  if (canShowThumbnail) {
    return (
      <div
        className={cn(
          "relative bg-muted rounded overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className={cn(
            "object-cover transition-opacity",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
          unoptimized // OSS URL 不需要 Next.js 优化
        />
        {/* 视频播放图标 */}
        {fileCategory === "video" && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="p-1.5 rounded-full bg-white/90">
              <Play className="h-4 w-4 text-gray-900 fill-gray-900" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 显示图标占位
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted rounded",
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSize, "text-muted-foreground")} />
    </div>
  );
}

interface AssetThumbnailPlaceholderProps {
  extension: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AssetThumbnailPlaceholder({
  extension,
  size = "md",
  className,
}: AssetThumbnailPlaceholderProps) {
  const ext = extension.toLowerCase().replace(".", "");
  const Icon = EXTENSION_ICONS_MAP[ext] || FileText;
  const iconSize = iconSizes[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted rounded",
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSize, "text-muted-foreground")} />
    </div>
  );
}