import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { VerificationEmail } from "@/emails/verification-email";
import { geocodePostcode } from "@/lib/geocoding";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, postcode } = await req.json();

    console.log("[REGISTER API] Registration request:", { email, role });

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("[REGISTER API] User already exists");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role
    const user = await db.user.create({
      data: {
        id: createId(),
        name,
        email,
        password: hashedPassword,
        role: role || "CUSTOMER",
        emailVerified: false,
      },
    });

    console.log("[REGISTER API] User created:", { userId: user.id, role: user.role });

    // If cleaner role, create cleaner profile
    if (role === "CLEANER" && postcode) {
      let locationData: { postcode?: string; latitude?: number; longitude?: number } = {};

      const geocoded = await geocodePostcode(postcode);
      if (geocoded) {
        locationData = {
          postcode: geocoded.postcode,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        };
      }

      await db.cleanerProfile.create({
        data: {
          userId: user.id,
          ...locationData,
        },
      });

      console.log("[REGISTER API] Cleaner profile created");
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing verification codes for this email
    await db.verification.deleteMany({
      where: { identifier: email },
    });

    // Store verification code
    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: verificationCode,
        expiresAt,
      },
    });

    console.log("[REGISTER API] Verification code generated");

    // Send verification email
    try {
      const emailContent = VerificationEmail({
        name: user.name,
        code: verificationCode,
      });

      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      console.log("[REGISTER API] Verification email sent");
    } catch (emailError) {
      console.error("[REGISTER API] Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email for verification code.",
    });
  } catch (error) {
    console.error("[REGISTER API] Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
