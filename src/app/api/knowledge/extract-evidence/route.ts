import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  extractEvidenceFromAsset,
  batchExtractAndSaveEvidence,
  extractEvidenceFromAllAssets,
  AutoEvidenceType,
} from "@/lib/services/evidence-extractor";

export const maxDuration = 60;

/**
 * POST /api/knowledge/extract-evidence
 *
 * 从素材中自动提取证据
 *
 * Body:
 * - action: "single" | "batch" | "all"
 * - assetIds?: string[] (for batch)
 * - assetId?: string (for single)
 * - types?: AutoEvidenceType[] (可选，默认全部类型)
 * - overwrite?: boolean (是否覆盖已有证据)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const body = await request.json();

    const { action, assetId, assetIds, types, overwrite } = body as {
      action: "single" | "batch" | "all";
      assetId?: string;
      assetIds?: string[];
      types?: AutoEvidenceType[];
      overwrite?: boolean;
    };

    // 验证提取类型
    const validTypes: AutoEvidenceType[] = [
      "case_study",
      "statistic",
      "testimonial",
      "certification",
      "claim",
    ];
    const extractionTypes = types?.filter((t) => validTypes.includes(t)) || undefined;

    switch (action) {
      case "single": {
        if (!assetId) {
          return NextResponse.json(
            { error: "缺少 assetId 参数" },
            { status: 400 }
          );
        }

        const result = await extractEvidenceFromAsset(
          assetId,
          tenantId,
          userId,
          extractionTypes
        );

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

        if (assetIds.length > 20) {
          return NextResponse.json(
            { error: "单次最多处理 20 个素材" },
            { status: 400 }
          );
        }

        const result = await batchExtractAndSaveEvidence(
          assetIds,
          tenantId,
          userId,
          extractionTypes,
          { overwrite }
        );

        return NextResponse.json({
          ok: true,
          ...result,
        });
      }

      case "all": {
        const result = await extractEvidenceFromAllAssets(
          tenantId,
          userId,
          extractionTypes
        );

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
    console.error("[extract-evidence] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}