import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || !email) {
      return NextResponse.json(
        { error: "Code and email are required" },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await db.verification.findFirst({
      where: {
        identifier: email,
        value: code,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      // Delete expired verification
      await db.verification.delete({
        where: { id: verification.id },
      });
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("[VERIFY] User found:", { id: user.id, email: user.email, role: user.role });

    // Update user to verified
    await db.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // Delete the used verification code
    await db.verification.delete({
      where: { id: verification.id },
    });

    console.log("[VERIFY] Email verified successfully for:", email, "with role:", user.role);

    // Create a session for the user manually
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    console.log("[VERIFY] Session created for user:", user.id);

    // Set the session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-better-auth.session_token' : 'better-auth.session_token';

    const response = NextResponse.json({
      success: true,
      user: {
        role: user.role,
        email: user.email,
      }
    });

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("[VERIFY] Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
