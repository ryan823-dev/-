/**
 * Humanize raw error messages for end-user display.
 * Maps technical/auth errors to friendly Chinese messages.
 */

const ERROR_MAP: Record<string, string> = {
  'Unauthorized': '会话已过期，请重新登录后再试',
  'Forbidden': '您没有权限执行此操作',
  'Not Found': '请求的资源不存在',
  'Internal Server Error': '服务暂时不可用，请稍后重试',
  'Failed to fetch': '网络连接失败，请检查网络后重试',
  'Network Error': '网络连接失败，请检查网络后重试',
};

export function formatError(err: unknown, fallback = '操作失败，请稍后重试'): string {
  const msg = err instanceof Error ? err.message : String(err || fallback);
  return ERROR_MAP[msg] || msg;
}
