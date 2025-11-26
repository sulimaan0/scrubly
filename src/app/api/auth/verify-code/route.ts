import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Update user to verified
    await db.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // Delete the used verification code
    await db.verification.delete({
      where: { id: verification.id },
    });

    console.log("[VERIFY] Email verified successfully for:", email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VERIFY] Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
