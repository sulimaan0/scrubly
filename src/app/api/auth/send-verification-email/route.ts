import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { VerificationEmail } from "@/emails/verification-email";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing verification codes for this email
    await db.verification.deleteMany({
      where: { identifier: user.email },
    });

    // Store the verification code
    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: user.email,
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
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log("[VERIFY] Verification email resent to:", user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VERIFY] Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
