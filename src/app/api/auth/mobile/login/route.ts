import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("[MOBILE-LOGIN] Login attempt for:", email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log("[MOBILE-LOGIN] User not found:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      console.log("[MOBILE-LOGIN] User has no password (OAuth user?):", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("[MOBILE-LOGIN] Invalid password for:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create or get existing session
    // Delete old sessions for this user first
    await db.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(), // Delete expired sessions
        },
      },
    });

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Generate a random token and id
    const token = Buffer.from(
      `${user.id}:${Date.now()}:${Math.random().toString(36)}`
    ).toString("base64");

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const session = await db.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log("[MOBILE-LOGIN] Session created for:", email);

    // Return token and user data
    return NextResponse.json({
      accessToken: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[MOBILE-LOGIN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
