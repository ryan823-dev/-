import { NextResponse } from "next/server";

// Self-registration is disabled. Accounts are provisioned by platform operations.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
  return NextResponse.json(
    { error: "自助注册已关闭，请联系工作人员获取使用资格。" },
    { status: 403 }
  );
}
