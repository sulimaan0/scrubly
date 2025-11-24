import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { geocodePostcode } from "@/lib/geocoding";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, postcode } = await req.json();

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { role },
  });

  if (role === "CLEANER") {
    let locationData: { postcode?: string; latitude?: number; longitude?: number } = {};

    if (postcode) {
      const geocoded = await geocodePostcode(postcode);
      if (geocoded) {
        locationData = {
          postcode: geocoded.postcode,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        };
      }
    }

    await db.cleanerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...locationData,
      },
      update: locationData,
    });
  }

  return NextResponse.json(user);
}
