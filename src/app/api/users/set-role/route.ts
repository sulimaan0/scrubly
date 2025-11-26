import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geocodePostcode } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  try {
    const { email, role, postcode } = await req.json();

    console.log("[SET ROLE API] Setting role for:", email, "to:", role);

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user role
    await db.user.update({
      where: { email },
      data: { role },
    });

    console.log("[SET ROLE API] Role updated successfully");

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

      console.log("[SET ROLE API] Cleaner profile created");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SET ROLE API] Error:", error);
    return NextResponse.json(
      { error: "Failed to set role" },
      { status: 500 }
    );
  }
}
