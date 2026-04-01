import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateState, getAuthUrl } from "@/lib/services/youtube.service";

export async function GET(req: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const origin = new URL(req.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (isDemoMode) {
    return NextResponse.redirect(
      new URL("/customer/social/accounts?error=demo_mode", appUrl)
    );
  }

  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/customer/social/accounts?error=not_configured", appUrl)
    );
  }

  const state = generateState();

  const cookieStore = await cookies();
  cookieStore.set("yt_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = getAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
