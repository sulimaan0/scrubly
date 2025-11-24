import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all cleaner profiles (even without location for now)
    const cleaners = await db.cleanerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get all bookings
    const bookings = await db.booking.findMany({
      select: {
        id: true,
        latitude: true,
        longitude: true,
        postcode: true,
        city: true,
        status: true,
        serviceType: true,
        date: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 100,
    });

    // Filter to only those with coordinates
    const cleanersWithLocation = cleaners.filter(
      (c) => c.latitude != null && c.longitude != null
    );

    const bookingsWithLocation = bookings.filter(
      (b) => b.latitude != null && b.longitude != null
    );

    return NextResponse.json({
      cleaners: cleanersWithLocation.map((c) => ({
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        postcode: c.postcode,
        latitude: c.latitude,
        longitude: c.longitude,
        radiusMiles: c.radiusMiles,
        verified: c.verified,
        totalJobs: c.totalJobs,
      })),
      bookings: bookingsWithLocation.map((b) => ({
        id: b.id,
        latitude: b.latitude,
        longitude: b.longitude,
        postcode: b.postcode,
        city: b.city,
        status: b.status,
        serviceType: b.serviceType,
        date: b.date,
        customerName: b.customer.name,
      })),
    });
  } catch (error) {
    console.error("Map data API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
