import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMobileSession } from "@/lib/mobile-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Try mobile token first
  let session = await getMobileSession(req);

  // Fall back to cookie-based session
  if (!session) {
    const webSession = await auth.api.getSession({ headers: await headers() });
    if (webSession) {
      session = { user: webSession.user } as any;
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, cleanerId } = body;

  // Get the current user's role from the database
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the existing booking first
  const existingBooking = await db.booking.findUnique({
    where: { id },
    include: { cleaner: true },
  });

  if (!existingBooking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorization check for cancellations
  if (status === "CANCELLED") {
    // Customers can only cancel their own bookings
    if (currentUser.role === "CUSTOMER" && existingBooking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't cancel already cancelled or completed bookings
    if (existingBooking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
    }
    if (existingBooking.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel a completed booking" }, { status: 400 });
    }
  }

  const booking = await db.booking.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(cleanerId !== undefined && { cleanerId }),
    },
  });

  // Send notifications
  if (status === "ACCEPTED" && cleanerId) {
    const cleaner = await db.user.findUnique({ where: { id: cleanerId } });
    await db.notification.create({
      data: {
        userId: booking.customerId,
        title: "Booking Accepted",
        message: (cleaner?.name || "A cleaner") + " has accepted your booking",
        type: "BOOKING_ACCEPTED",
        data: { bookingId: id },
      },
    });
  }

  if (status === "CANCELLED") {
    // Notify the customer
    await db.notification.create({
      data: {
        userId: booking.customerId,
        title: "Booking Cancelled",
        message: "Your booking has been cancelled",
        type: "BOOKING_CANCELLED",
        data: { bookingId: id },
      },
    });

    // Notify the cleaner if one was assigned
    if (existingBooking.cleanerId) {
      await db.notification.create({
        data: {
          userId: existingBooking.cleanerId,
          title: "Booking Cancelled",
          message: "A booking has been cancelled",
          type: "BOOKING_CANCELLED",
          data: { bookingId: id },
        },
      });
    }
  }

  return NextResponse.json(booking);
}
