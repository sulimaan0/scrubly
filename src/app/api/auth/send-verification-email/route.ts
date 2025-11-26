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

    // Generate a new verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the token in the database
    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: user.email,
        value: token,
        expiresAt,
      },
    });

    // Create verification URL
    const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseURL}/api/auth/verify-email?token=${token}&identifier=${encodeURIComponent(user.email)}`;

    // Send the verification email
    const emailContent = VerificationEmail({
      name: user.name,
      verificationUrl,
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
