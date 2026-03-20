import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  preprocessAsset,
  batchPreprocessAssets,
  preprocessAllAssets,
} from "@/lib/services/document-preprocessor";

export const maxDuration = 300; // 5分钟，适合批量处理

/**
 * POST /api/knowledge/preprocess
 *
 * 批量预处理文档素材
 *
 * Body:
 * - action: "single" | "batch" | "all"
 * - assetId?: string (for single)
 * - assetIds?: string[] (for batch)
 * - generateSummary?: boolean (default: true)
 * - enhanceChunks?: boolean (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    const {
      action,
      assetId,
      assetIds,
      generateSummary = true,
      enhanceChunks = false,
    } = body as {
      action: "single" | "batch" | "all";
      assetId?: string;
      assetIds?: string[];
      generateSummary?: boolean;
      enhanceChunks?: boolean;
    };

    const options = { generateSummary, enhanceChunks };

    switch (action) {
      case "single": {
        if (!assetId) {
          return NextResponse.json(
            { error: "缺少 assetId 参数" },
            { status: 400 }
          );
        }

        const result = await preprocessAsset(assetId, tenantId, options);

        return NextResponse.json({
          ok: result.success,
          ...result,
        });
      }

      case "batch": {
        if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
          return NextResponse.json(
            { error: "缺少 assetIds 参数" },
            { status: 400 }
          );
        }

        if (assetIds.length > 50) {
          return NextResponse.json(
            { error: "单次最多处理 50 个素材" },
            { status: 400 }
          );
        }

        const result = await batchPreprocessAssets(assetIds, tenantId, options);

        return NextResponse.json({
          ok: true,
          ...result,
        });
      }

      case "all": {
        const result = await preprocessAllAssets(tenantId);

        return NextResponse.json({
          ok: true,
          ...result,
        });
      }

      default:
        return NextResponse.json(
          { error: "无效的 action 参数，支持: single, batch, all" },
          { status: 400 }
        );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[preprocess] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}