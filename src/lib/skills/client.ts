import type { SkillRequest } from '@/lib/skills/types';

interface StreamingOptions {
  onChunk?: (content: string) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 执行单个 Skill (流式模式)
 * 实时接收 AI 生成的内容片段
 * 这是客户端专用的 API 调用，避免 Server Action 无法处理 ReadableStream 的问题
 */
export async function executeSkillStream(
  skillName: string,
  request: SkillRequest,
  options: StreamingOptions
): Promise<void> {
  // 注意：在客户端调用时，fetch 使用相对路径是安全的
  const response = await fetch(`/api/ai/skills/${skillName}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
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
  } catch (error) {
    console.error('[SkillStream] Reader error:', error);
    options.onError?.(error instanceof Error ? error : new Error('读取流失败'));
  } finally {
    reader.releaseLock();
  }
}
