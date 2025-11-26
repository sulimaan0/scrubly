import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromHeader } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  try {
    const token = getTokenFromHeader(req);

    console.log("[MOBILE-LOGOUT] Logout request");

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    // Find the session
    const session = await db.session.findUnique({
      where: { token },
    });

    if (!session) {
      // Session doesn't exist, but that's okay for logout
      console.log("[MOBILE-LOGOUT] Session not found (already logged out)");
      return NextResponse.json({ success: true, message: "Already logged out" });
    }

    // Delete the session
    await db.session.delete({
      where: { token },
    });

    console.log("[MOBILE-LOGOUT] Session deleted");

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("[MOBILE-LOGOUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
