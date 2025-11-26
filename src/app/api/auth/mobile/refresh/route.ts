import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    console.log("[MOBILE-REFRESH] Token refresh request");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find and validate existing session
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      console.log("[MOBILE-REFRESH] Session not found");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    if (new Date(session.expiresAt) < new Date()) {
      console.log("[MOBILE-REFRESH] Session expired");
      // Delete expired session
      await db.session.delete({ where: { id: session.id } });
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }

    // Extend session expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

    const updatedSession = await db.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    console.log("[MOBILE-REFRESH] Session refreshed for user:", session.user.email);

    return NextResponse.json({
      accessToken: updatedSession.token,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
      },
      expiresAt: updatedSession.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[MOBILE-REFRESH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
