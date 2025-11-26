import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { isWithinRadius } from "@/lib/geocoding";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  let bookings;
  if (role === "cleaner") {
    // Get cleaner's profile for location filtering
    const cleanerProfile = await db.cleanerProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Get cleaner's own accepted jobs
    const myJobs = await db.booking.findMany({
      where: { cleanerId: session.user.id },
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get available jobs (pending with no cleaner, payment completed)
    let availableJobs = await db.booking.findMany({
      where: {
        status: "PENDING",
        cleanerId: null,
      },
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Filter by radius only if cleaner has location set
    if (cleanerProfile?.latitude && cleanerProfile?.longitude) {
      availableJobs = availableJobs.filter((job) => {
        if (!job.latitude || !job.longitude) return true; // Show jobs without location
        return isWithinRadius(
          cleanerProfile.latitude!,
          cleanerProfile.longitude!,
          job.latitude,
          job.longitude,
          cleanerProfile.radiusMiles
        );
      });
    }
    // If cleaner has no location, show all available jobs

    bookings = [...myJobs, ...availableJobs];
  } else {
    bookings = await db.booking.findMany({
      where: { customerId: session.user.id },
      include: { cleaner: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const {
    postcode,
    serviceType,
    propertyType,
    bedrooms,
    bathrooms,
    extras,
    address,
    city,
    date,
    timeSlot,
    instructions,
    price,
  } = body;

  // Create booking with pending payment status
  const booking = await db.booking.create({
    data: {
      customerId: session.user.id,
      postcode,
      address,
      city,
      serviceType,
      propertyType,
      bedrooms,
      bathrooms,
      extras,
      instructions: instructions || null,
      date: new Date(date),
      timeSlot,
      duration: 120,
      price,
      paymentStatus: "PENDING",
    },
  });

  // Create Stripe checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: serviceType.replace("_", " ") + " Cleaning",
            description: address + ", " + city + " " + postcode,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: process.env.BETTER_AUTH_URL + "/dashboard/customer?success=true",
    cancel_url: process.env.BETTER_AUTH_URL + "/booking?cancelled=true",
    metadata: {
      bookingId: booking.id,
    },
  });

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}
