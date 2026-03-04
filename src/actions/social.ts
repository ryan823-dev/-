"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateMultiPlatformContent } from "@/lib/services/openai.service";
import * as facebookService from "@/lib/services/facebook.service";
import * as twitterService from "@/lib/services/twitter.service";
import { formatPublishError } from "@/lib/utils/social.utils";
import { requireDecider } from "@/lib/permissions";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ==================== READ ====================

export async function getSocialPosts() {
  if (isDemoMode) return [];
  const session = await getSession();
  return db.socialPost.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    include: { versions: true, author: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getSocialPost(id: string) {
  if (isDemoMode) return null;
  const session = await getSession();
  return db.socialPost.findFirst({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    include: { versions: true, author: true },
  });
}

export async function getSocialAccounts() {
  if (isDemoMode) {
    return [
      {
        id: "demo-fb",
        platform: "facebook",
        accountName: "Demo Facebook Page",
        accountId: "demo-fb-id",
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: { pageName: "Demo Page", pageCategory: "Business" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo-tw",
        platform: "x",
        accountName: "@demo_account",
        accountId: "demo-tw-id",
        isActive: true,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        metadata: { username: "demo_account", name: "Demo User" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
  const session = await getSession();
  return db.socialAccount.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
  });
}

// ==================== AI CONTENT GENERATION ====================

export async function generateAIContent(params: {
  topic: string;
  context?: string;
  tone: string;
  platforms: string[];
  language: string;
}): Promise<Record<string, string>> {
  return generateMultiPlatformContent({
    topic: params.topic,
    context: params.context,
    tone: params.tone,
    platforms: params.platforms,
    language: params.language,
  });
}

// ==================== CREATE / UPDATE / DELETE ====================

export async function createSocialPost(data: {
  title?: string;
  status?: string;
  scheduledAt?: Date;
  autoEngage?: boolean;
  versions: { platform: string; content: string }[];
}) {
  if (isDemoMode) {
    return { id: `demo_post_${Date.now()}`, ...data };
  }

  const session = await getSession();

  const post = await db.socialPost.create({
    data: {
      tenantId: session.user.tenantId,
      authorId: session.user.id,
      title: data.title,
      status: data.status || "draft",
      scheduledAt: data.scheduledAt,
      autoEngage: data.autoEngage || false,
      versions: {
        create: data.versions.map((v) => ({
          platform: v.platform,
          content: v.content,
        })),
      },
    },
    include: { versions: true },
  });

  revalidatePath("/zh-CN/social");
  return post;
}

export async function updateSocialPost(
  postId: string,
  data: {
    title?: string;
    scheduledAt?: Date | null;
    autoEngage?: boolean;
    versions?: { platform: string; content: string }[];
  }
) {
  if (isDemoMode) return { id: postId, ...data };

  const session = await getSession();

  // Verify ownership
  const existing = await db.socialPost.findFirst({
    where: { id: postId, tenantId: session.user.tenantId, deletedAt: null },
  });
  if (!existing) throw new Error("Post not found");
  if (existing.status === "published") throw new Error("Cannot edit published posts");

  const post = await db.socialPost.update({
    where: { id: postId },
    data: {
      title: data.title,
      scheduledAt: data.scheduledAt,
      autoEngage: data.autoEngage,
    },
  });

  // Replace versions if provided
  if (data.versions) {
    await db.postVersion.deleteMany({ where: { postId } });
    await db.postVersion.createMany({
      data: data.versions.map((v) => ({
        postId,
        platform: v.platform,
        content: v.content,
      })),
    });
  }

  revalidatePath("/zh-CN/social");
  return post;
}

export async function deleteSocialPost(postId: string) {
  if (isDemoMode) return;

  const session = await getSession();
  const roleCheck = requireDecider(session);
  if (!roleCheck.authorized) {
    throw new Error(roleCheck.error);
  }

  await db.socialPost.update({
    where: { id: postId, tenantId: session.user.tenantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/zh-CN/social");
}

// ==================== PUBLISH ====================

export async function publishSocialPost(postId: string): Promise<{
  success: boolean;
  results: { platform: string; success: boolean; error?: string; postId?: string }[];
}> {
  if (isDemoMode) {
    return {
      success: true,
      results: [
        { platform: "facebook", success: true, postId: `demo_fb_${Date.now()}` },
        { platform: "x", success: true, postId: `demo_tw_${Date.now()}` },
      ],
    };
  }

  const session = await getSession();
  const roleCheck = requireDecider(session);
  if (!roleCheck.authorized) {
    throw new Error(roleCheck.error);
  }

  const post = await db.socialPost.findFirst({
    where: { id: postId, tenantId: session.user.tenantId, deletedAt: null },
    include: { versions: true },
  });

  if (!post) throw new Error("Post not found");

  const results: { platform: string; success: boolean; error?: string; postId?: string }[] = [];

  for (const version of post.versions) {
    if (version.platformPostId) {
      results.push({ platform: version.platform, success: true, postId: version.platformPostId });
      continue;
    }

    // Find active account for this platform
    const account = await db.socialAccount.findFirst({
      where: {
        tenantId: session.user.tenantId,
        platform: version.platform,
        isActive: true,
      },
    });

    if (!account) {
      await db.postVersion.update({
        where: { id: version.id },
        data: {
          error: `No connected ${version.platform} account`,
          publishAttempts: { increment: 1 },
        },
      });
      results.push({
        platform: version.platform,
        success: false,
        error: `No connected ${version.platform} account`,
      });
      continue;
    }

    try {
      let platformPostId: string;

      if (version.platform === "facebook") {
        // Refresh token if needed
        const refreshed = await facebookService.refreshTokenIfNeeded(account);
        if (refreshed) {
          await db.socialAccount.update({
            where: { id: account.id },
            data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
          });
          account.accessToken = refreshed.accessToken;
        }

        const metadata = account.metadata as Record<string, string>;
        const result = await facebookService.publishToPage({
          pageAccessToken: account.accessToken!,
          pageId: metadata.pageId || account.accountId,
          message: version.content,
        });
        platformPostId = result.postId;
      } else if (version.platform === "x") {
        // Refresh token if needed
        const refreshed = await twitterService.refreshTokenIfNeeded(account);
        if (refreshed) {
          await db.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              expiresAt: refreshed.expiresAt,
            },
          });
          account.accessToken = refreshed.accessToken;
        }

        const result = await twitterService.publishTweet({
          accessToken: account.accessToken!,
          text: version.content,
        });
        platformPostId = result.tweetId;
      } else {
        throw new Error(`Unsupported platform: ${version.platform}`);
      }

      await db.postVersion.update({
        where: { id: version.id },
        data: {
          platformPostId,
          publishedAt: new Date(),
          error: null,
          publishAttempts: { increment: 1 },
        },
      });

      results.push({ platform: version.platform, success: true, postId: platformPostId });
    } catch (err) {
      const errorMsg = formatPublishError(err);
      await db.postVersion.update({
        where: { id: version.id },
        data: {
          error: errorMsg,
          publishAttempts: { increment: 1 },
        },
      });
      results.push({ platform: version.platform, success: false, error: errorMsg });
    }
  }

  // Update post status
  const allSuccess = results.every((r) => r.success);
  const anySuccess = results.some((r) => r.success);

  await db.socialPost.update({
    where: { id: postId },
    data: {
      status: allSuccess ? "published" : anySuccess ? "published" : "failed",
      publishedAt: anySuccess ? new Date() : undefined,
    },
  });

  revalidatePath("/zh-CN/social");

  return { success: allSuccess, results };
}

export async function scheduleSocialPost(postId: string, scheduledAt: Date) {
  if (isDemoMode) return;

  const session = await getSession();

  await db.socialPost.update({
    where: { id: postId, tenantId: session.user.tenantId },
    data: { status: "scheduled", scheduledAt },
  });

  revalidatePath("/zh-CN/social");
}

export async function retryFailedPublish(postId: string) {
  if (isDemoMode) {
    return { success: true, results: [] };
  }

  const session = await getSession();

  // Reset failed versions so they can be retried
  const post = await db.socialPost.findFirst({
    where: { id: postId, tenantId: session.user.tenantId },
    include: { versions: { where: { platformPostId: null } } },
  });

  if (!post) throw new Error("Post not found");

  // Clear errors on failed versions
  for (const v of post.versions) {
    await db.postVersion.update({
      where: { id: v.id },
      data: { error: null },
    });
  }

  // Re-attempt publish
  return publishSocialPost(postId);
}

// ==================== ACCOUNT MANAGEMENT ====================

export async function disconnectSocialAccount(accountId: string) {
  if (isDemoMode) return;

  const session = await getSession();

  await db.socialAccount.update({
    where: { id: accountId, tenantId: session.user.tenantId },
    data: { isActive: false, accessToken: null, refreshToken: null },
  });

  revalidatePath("/zh-CN/social/accounts");
}
