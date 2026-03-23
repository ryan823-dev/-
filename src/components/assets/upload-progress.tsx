"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileVideo,
  FileImage,
  FileText,
  FileAudio,
  File,
} from "lucide-react";
import { formatFileSize, detectFileCategory, getFileExtension } from "@/lib/utils/file-utils";
import { cn } from "@/lib/utils";
import type { UploadProgress as UploadProgressType, FileCategory } from "@/types/assets";

interface UploadProgressProps {
  upload: UploadProgressType;
  onCancel?: () => void;
}

// 直接定义图标组件映射 - 在组件外部定义，避免渲染期间创建
const CATEGORY_ICONS_MAP: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  video: FileVideo,
  image: FileImage,
  document: FileText,
  audio: FileAudio,
  other: File,
};

export function UploadProgress({ upload, onCancel }: UploadProgressProps) {
  const extension = getFileExtension(upload.fileName);
  const fileCategory = detectFileCategory("", extension);
  const Icon = CATEGORY_ICONS_MAP[fileCategory];

  const statusColors = {
    pending: "text-muted-foreground",
    uploading: "text-blue-600",
    confirming: "text-blue-600",
    completed: "text-green-600",
    failed: "text-red-600",
  };

  const progressColors = {
    pending: "bg-muted",
    uploading: "bg-blue-600",
    confirming: "bg-blue-600",
    completed: "bg-green-600",
    failed: "bg-red-600",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        <Icon className={cn("h-8 w-8", statusColors[upload.status])} />
      </div>

      {/* 文件信息和进度 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate" title={upload.fileName}>
            {upload.fileName}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatFileSize(upload.fileSize)}
          </span>
        </div>

        {/* 进度条 */}
        <Progress
          value={upload.progress}
          className="h-1.5"
          indicatorClassName={progressColors[upload.status]}
        />

        {/* 状态信息 */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            {upload.status === "uploading" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                <span className="text-xs text-blue-600">上传中 {upload.progress}%</span>
              </>
            )}
            {upload.status === "confirming" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                <span className="text-xs text-blue-600">确认中...</span>
              </>
            )}
            {upload.status === "completed" && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">上传完成</span>
              </>
            )}
            {upload.status === "failed" && (
              <>
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600" title={upload.error}>
                  {upload.error || "上传失败"}
                </span>
              </>
            )}
            {upload.status === "pending" && (
              <span className="text-xs text-muted-foreground">等待中...</span>
            )}
          </div>

          {/* 取消按钮 */}
          {(upload.status === "pending" || upload.status === "uploading") && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadProgressListProps {
  uploads: UploadProgressType[];
  onCancel?: (assetId: string) => void;
}

export function UploadProgressList({ uploads, onCancel }: UploadProgressListProps) {
  if (uploads.length === 0) return null;

  const completedCount = uploads.filter((u) => u.status === "completed").length;
  const failedCount = uploads.filter((u) => u.status === "failed").length;
  const totalCount = uploads.length;

  return (
    <div className="space-y-3">
      {/* 汇总状态 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          上传进度: {completedCount}/{totalCount}
        </span>
        {failedCount > 0 && (
          <span className="text-red-600">{failedCount} 个失败</span>
        )}
      </div>

      {/* 上传项列表 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {uploads.map((upload) => (
          <UploadProgress
            key={upload.assetId}
            upload={upload}
            onCancel={onCancel ? () => onCancel(upload.assetId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}