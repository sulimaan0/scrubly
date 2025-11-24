import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata!;

    // Update existing booking with payment info
    const booking = await db.booking.update({
      where: { id: metadata.bookingId },
      data: {
        paymentStatus: "PAID",
        stripePaymentId: session.payment_intent as string,
      },
    });

    await db.notification.create({
      data: {
        userId: booking.customerId,
        title: "Payment Confirmed",
        message: "Your booking has been paid and is awaiting a cleaner",
        type: "BOOKING_CREATED",
        data: { bookingId: booking.id },
      },
    });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    if (metadata?.bookingId) {
      const booking = await db.booking.update({
        where: { id: metadata.bookingId },
        data: {
          paymentStatus: "PAID",
          stripePaymentId: paymentIntent.id,
        },
      });

      await db.notification.create({
        data: {
          userId: booking.customerId,
          title: "Payment Confirmed",
          message: "Your booking has been paid and is awaiting a cleaner",
          type: "BOOKING_CREATED",
          data: { bookingId: booking.id },
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
