"use server";

/**
 * 知识引擎流水线状态 Server Actions
 */

import { auth } from '@/lib/auth';
import { getKnowledgePipelineStatus as getPipelineStatus } from '@/lib/knowledge/pipeline';

export async function getKnowledgePipelineStatus() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized');
  }

  return getPipelineStatus(session.user.tenantId);
}
