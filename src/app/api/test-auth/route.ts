import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Force this route to use Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function GET() {
  console.log("[TEST-AUTH] Test endpoint called");

  try {
    const testInfo = {
      authConfigured: !!auth,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "SET" : "NOT SET",
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "NOT SET",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
        VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
      },
      authMethods: {
        hasSignIn: typeof auth.api.signInEmail === 'function',
        hasGetSession: typeof auth.api.getSession === 'function',
      }
    };

    console.log("[TEST-AUTH]", JSON.stringify(testInfo, null, 2));

    return NextResponse.json(testInfo);
  } catch (error) {
    console.error("[TEST-AUTH] Error:", error);
    return NextResponse.json({
      error: "Test failed",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
