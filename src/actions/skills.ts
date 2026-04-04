"use server";

import { auth } from "@/lib/auth";
import { executeSkill as runSkill, executeSkillChain } from "@/lib/skills/runner";
import { getSkill, listSkills, ensureSkillsRegistered, SKILL_NAMES } from "@/lib/skills/registry";
import type { SkillRequest, SkillResponse, SkillEngine } from "@/lib/skills/types";

// ==================== Session Helper ====================

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ==================== Main Actions ====================

/**
 * 执行单个 Skill
 */
export async function executeSkill(
  skillName: string,
  request: SkillRequest
): Promise<SkillResponse> {
  const session = await getSession();
  
  return runSkill(skillName, request, {
    tenantId: session.user.tenantId,
    userId: session.user.id,
  });
}

/**
 * 执行 Skill 链（串行）
 */
export async function executeSkills(
  skillNames: string[],
  initialRequest: SkillRequest
): Promise<SkillResponse[]> {
  const session = await getSession();
  
  return executeSkillChain(skillNames, initialRequest, {
    tenantId: session.user.tenantId,
    userId: session.user.id,
  });
}

// ==================== Query Actions ====================

/**
 * 获取可用 Skills 列表
 */
export async function getAvailableSkills(engine?: SkillEngine): Promise<Array<{
  name: string;
  displayName: string;
  engine: SkillEngine;
  outputEntityType: string;
  suggestedNextSkills: string[];
}>> {
  await getSession(); // 认证
  await ensureSkillsRegistered();
  
  const skills = listSkills(engine);
  
  return skills.map(s => ({
    name: s.name,
    displayName: s.displayName,
    engine: s.engine,
    outputEntityType: s.outputEntityType,
    suggestedNextSkills: s.suggestedNextSkills,
  }));
}

/**
 * 获取单个 Skill 信息
 */
export async function getSkillInfo(skillName: string): Promise<{
  name: string;
  displayName: string;
  engine: SkillEngine;
  outputEntityType: string;
  suggestedNextSkills: string[];
} | null> {
  await getSession();
  await ensureSkillsRegistered();
  
  const skill = getSkill(skillName);
  if (!skill) return null;
  
  return {
    name: skill.name,
    displayName: skill.displayName,
    engine: skill.engine,
    outputEntityType: skill.outputEntityType,
    suggestedNextSkills: skill.suggestedNextSkills,
  };
}

// ==================== Streaming Actions ====================

interface StreamingOptions {
  onChunk?: (content: string) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 执行单个 Skill (流式模式)
 * 实时接收 AI 生成的内容片段
 */
export async function executeSkillStream(
  skillName: string,
  request: SkillRequest,
  options: StreamingOptions
): Promise<void> {
  const session = await getSession();
  
  const response = await fetch(`/api/ai/skills/${skillName}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Stream failed');
  }
  
  if (!response.body) {
    throw new Error('No response body');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // 处理 SSE 事件
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            
            if (event.type === 'chunk' && event.content) {
              options.onChunk?.(event.content);
            } else if (event.type === 'done') {
              options.onDone?.(event.content || '');
            } else if (event.type === 'error') {
              options.onError?.(new Error(event.error || 'Stream error'));
            }
          } catch {
            // 跳过解析失败的行
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
