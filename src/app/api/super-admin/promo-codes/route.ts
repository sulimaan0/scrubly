import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to check super admin
async function checkSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== "SUPER_ADMIN") return null;
  return session;
}

// GET - List all promo codes
export async function GET() {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const promoCodes = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(promoCodes);
}

// POST - Create promo code
export async function POST(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { code, discountType, discountValue, maxUses, minOrderAmount, expiresAt } = body;

  // Validate
  if (!code || !discountType || !discountValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if code exists
  const existing = await db.promoCode.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
  }

  const promoCode = await db.promoCode.create({
    data: {
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxUses: maxUses || null,
      minOrderAmount: minOrderAmount || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(promoCode);
}

// DELETE - Delete promo code
export async function DELETE(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing promo code ID" }, { status: 400 });
  }

  await db.promoCode.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// PATCH - Update promo code
export async function PATCH(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing promo code ID" }, { status: 400 });
  }

  const promoCode = await db.promoCode.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(promoCode);
}
