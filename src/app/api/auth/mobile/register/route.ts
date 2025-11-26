import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geocodePostcode } from "@/lib/geocoding";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, postcode } = await req.json();

    console.log("[MOBILE-REGISTER] Registration attempt:", { email, role });

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!role || !["CUSTOMER", "CLEANER"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required (CUSTOMER or CLEANER)" },
        { status: 400 }
      );
    }

    if (role === "CLEANER" && !postcode) {
      return NextResponse.json(
        { error: "Postcode is required for cleaners" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create user
    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        emailVerified: true, // Auto-verify for mobile users
      },
    });

    console.log("[MOBILE-REGISTER] User created:", user.id);

    // Create cleaner profile if needed
    if (role === "CLEANER" && postcode) {
      const geocoded = await geocodePostcode(postcode);

      if (!geocoded) {
        // Rollback user creation if geocoding fails
        await db.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          { error: "Invalid postcode. Please check and try again." },
          { status: 400 }
        );
      }

      await db.cleanerProfile.create({
        data: {
          userId: user.id,
          postcode: geocoded.postcode,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        },
      });

      console.log("[MOBILE-REGISTER] Cleaner profile created");
    }

    // Create session token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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

    console.log("[MOBILE-REGISTER] Session created");

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
    console.error("[MOBILE-REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
