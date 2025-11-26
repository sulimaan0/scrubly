import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Get user profile
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        savedAddress: true,
        savedCity: true,
        savedPostcode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { savedAddress, savedCity, savedPostcode } = await req.json();

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        savedAddress,
        savedCity,
        savedPostcode,
      },
      select: {
        id: true,
        name: true,
        email: true,
        savedAddress: true,
        savedCity: true,
        savedPostcode: true,
      },
    });

    console.log("[PROFILE API] Profile updated for user:", user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE API] Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
