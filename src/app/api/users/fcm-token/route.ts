import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  // Try mobile token first
  let session = await getMobileSession(req);

  // Fall back to cookie-based session
  if (!session) {
    const webSession = await auth.api.getSession({ headers: await headers() });
    if (webSession) {
      session = { user: webSession.user } as any;
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "FCM token is required" },
        { status: 400 }
      );
    }

    console.log("[FCM-TOKEN] Storing FCM token for user:", session.user.id);

    // Store FCM token for this user
    await db.user.update({
      where: { id: session.user.id },
      data: { fcmToken: token },
    });

    console.log("[FCM-TOKEN] FCM token stored successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FCM-TOKEN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
