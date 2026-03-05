"use server";

/**
 * 获客雷达流水线状态 Server Actions
 */

import { auth } from '@/lib/auth';
import { getRadarPipelineStatus as getPipelineStatus } from '@/lib/radar/pipeline';

export async function getRadarPipelineStatus() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized');
  }

  return getPipelineStatus(session.user.tenantId);
}
