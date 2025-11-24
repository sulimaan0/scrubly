import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { geocodePostcode } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    console.error("No session found in create-payment-intent");
    return NextResponse.json(
      { error: "Please sign in to continue with your booking" },
      { status: 401 }
    );
  }

  console.log("Session found:", { userId: session.user.id, email: session.user.email });

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

  // Geocode the postcode
  const geocoded = await geocodePostcode(postcode);

  // Create booking with pending payment status
  const booking = await db.booking.create({
    data: {
      customerId: session.user.id,
      postcode,
      address,
      city,
      latitude: geocoded?.latitude,
      longitude: geocoded?.longitude,
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

  // Create Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(price * 100),
    currency: "gbp",
    metadata: {
      bookingId: booking.id,
    },
    description: `${serviceType.replace("_", " ")} Cleaning - ${address}, ${city} ${postcode}`,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    bookingId: booking.id,
  });
}
