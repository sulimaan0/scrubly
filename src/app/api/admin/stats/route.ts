import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalCleaners, totalBookings, revenueResult, recentBookings] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CLEANER" } }),
    db.booking.count(),
    db.booking.aggregate({
      _sum: { price: true },
      where: { paymentStatus: "PAID" },
    }),
    db.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        cleaner: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalCleaners,
    totalBookings,
    revenue: revenueResult._sum.price || 0,
    recentBookings,
  });
}
