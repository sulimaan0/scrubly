import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  console.log("[DEBUG] Debug endpoint called");

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  const debugInfo = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
      betterAuthUrl: process.env.BETTER_AUTH_URL,
      hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      hasVercelUrl: !!process.env.VERCEL_URL,
      vercelUrl: process.env.VERCEL_URL,
    },
    session: {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    },
    cookies: {
      raw: requestHeaders.get('cookie'),
      hasBetterAuthCookie: requestHeaders.get('cookie')?.includes('better-auth'),
    },
    request: {
      origin: req.headers.get('origin'),
      host: req.headers.get('host'),
      referer: req.headers.get('referer'),
    }
  };

  console.log("[DEBUG] Debug info:", JSON.stringify(debugInfo, null, 2));

  return NextResponse.json(debugInfo);
}
