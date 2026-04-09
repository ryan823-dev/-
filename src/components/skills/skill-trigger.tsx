"use client";

import { useState } from 'react';
import { Sparkles, Loader2, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { executeSkill } from '@/actions/skills';
import type { SkillRequest, SkillResponse } from '@/lib/skills/types';
import type { EntityType } from '@/types/artifact';

// ==================== Types ====================

interface SkillTriggerProps {
  skillName: string;
  displayName: string;
  description?: string;
  entityType: EntityType;
  entityId: string;
  input: Record<string, unknown>;
  evidenceIds?: string[];
  useCompanyProfile?: boolean;
  onSuccess?: (result: SkillResponse) => void;
  onError?: (error: Error) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

// ==================== Component ====================

export function SkillTrigger({
  skillName,
  displayName,
  description,
  entityType,
  entityId,
  input,
  evidenceIds,
  useCompanyProfile = true,
  onSuccess,
  onError,
  variant = 'outline',
  size = 'sm',
  className,
  disabled,
}: SkillTriggerProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<SkillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);

    try {
      const request: SkillRequest = {
        entityType,
        entityId,
        input,
        mode: 'generate',
        evidenceIds,
        useCompanyProfile,
      };

      const response = await executeSkill(skillName, request);
      setResult(response);
      setShowResult(true);
      onSuccess?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Skill 执行失败';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExecute}
        disabled={disabled || isExecuting}
        className={className}
      >
        {isExecuting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {displayName}
      </Button>

      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {displayName} 执行完成
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          {result && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* 置信度 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">置信度：</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {/* 待确认问题 */}
              {result.openQuestions.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    待确认问题 ({result.openQuestions.length})
                  </p>
                  <ul className="space-y-1">
                    {result.openQuestions.map((q, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 缺少证据 */}
              {result.missingProof.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    缺少证据 ({result.missingProof.length})
                  </p>
                  <ul className="space-y-1">
                    {result.missingProof.map((p, i) => (
                      <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 引用证据 */}
              {result.references.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-emerald-800 mb-2">
                    引用证据 ({result.references.length})
                  </p>
                  <ul className="space-y-1">
                    {result.references.map((ref, i) => (
                      <li key={i} className="text-xs text-emerald-700">
                        [{i + 1}] {ref.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 推荐后续 Skill */}
              {result.suggestedNextSkills.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    推荐后续步骤
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedNextSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-100 text-xs text-slate-600 rounded flex items-center gap-1"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 自动创建的任务 */}
              {result.taskIds.length > 0 && (
                <p className="text-xs text-slate-500">
                  已自动创建 {result.taskIds.length} 个任务
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
