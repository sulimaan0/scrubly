import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { VerificationEmail } from "@/emails/verification-email";
import { db } from "@/lib/db";

// Generate a 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing verification codes for this email
    await db.verification.deleteMany({
      where: { identifier: email },
    });

    // Store the verification code
    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: code,
        expiresAt,
      },
    });

    // Send the verification email
    const emailContent = VerificationEmail({
      name: user.name,
      code,
    });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log("[VERIFY] Verification code sent to:", email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VERIFY] Error sending verification code:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
