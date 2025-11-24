import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      status,
      paymentStatus,
      address,
      city,
      postcode,
      date,
      timeSlot,
      price,
      serviceType,
      propertyType,
      bedrooms,
      bathrooms,
      extras,
      instructions,
      cleanerId,
    } = body;

    const booking = await db.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(address && { address }),
        ...(city && { city }),
        ...(postcode && { postcode }),
        ...(date && { date: new Date(date) }),
        ...(timeSlot && { timeSlot }),
        ...(price !== undefined && { price }),
        ...(serviceType && { serviceType }),
        ...(propertyType && { propertyType }),
        ...(bedrooms !== undefined && { bedrooms }),
        ...(bathrooms !== undefined && { bathrooms }),
        ...(extras && { extras }),
        ...(instructions !== undefined && { instructions }),
        ...(cleanerId !== undefined && { cleanerId: cleanerId || null }),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
