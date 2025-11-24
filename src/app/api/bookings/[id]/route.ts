import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, cleanerId } = body;

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
    if (session.user.role === "CUSTOMER" && existingBooking.customerId !== session.user.id) {
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
