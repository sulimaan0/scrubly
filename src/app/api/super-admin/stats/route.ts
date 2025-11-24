import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get all stats
  const [
    totalUsers,
    totalCustomers,
    totalCleaners,
    totalBookings,
    completedBookings,
    pendingBookings,
    totalRevenue,
    activePromoCodes,
    recentBookings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CLEANER" } }),
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { price: true },
    }),
    db.promoCode.count({ where: { isActive: true } }),
    db.booking.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        cleaner: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Get monthly revenue for chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyBookings = await db.booking.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
      paymentStatus: "PAID",
    },
    select: {
      price: true,
      createdAt: true,
    },
  });

  // Group by month
  const revenueByMonth: Record<string, number> = {};
  monthlyBookings.forEach((booking) => {
    const month = booking.createdAt.toISOString().slice(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + booking.price;
  });

  // Advanced analytics
  const [
    bookingsByServiceType,
    bookingsByStatus,
    bookingsByPaymentStatus,
    topCleaners,
    userGrowth,
    avgBookingValue,
    bookingsByDay,
  ] = await Promise.all([
    // Bookings by service type
    db.booking.groupBy({
      by: ["serviceType"],
      _count: true,
    }),
    // Bookings by status
    db.booking.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Bookings by payment status
    db.booking.groupBy({
      by: ["paymentStatus"],
      _count: true,
    }),
    // Top cleaners
    db.user.findMany({
      where: { role: "CLEANER" },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { acceptedJobs: true } },
        acceptedJobs: {
          where: { status: "COMPLETED" },
          select: { price: true },
        },
      },
      orderBy: { acceptedJobs: { _count: "desc" } },
      take: 10,
    }),
    // User growth by month
    db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, role: true },
    }),
    // Average booking value
    db.booking.aggregate({
      where: { paymentStatus: "PAID" },
      _avg: { price: true },
    }),
    // Bookings by day of week
    db.booking.findMany({
      select: { date: true },
    }),
  ]);

  // Process user growth by month
  const userGrowthByMonth: Record<string, { customers: number; cleaners: number }> = {};
  userGrowth.forEach((user) => {
    const month = user.createdAt.toISOString().slice(0, 7);
    if (!userGrowthByMonth[month]) {
      userGrowthByMonth[month] = { customers: 0, cleaners: 0 };
    }
    if (user.role === "CUSTOMER") {
      userGrowthByMonth[month].customers++;
    } else if (user.role === "CLEANER") {
      userGrowthByMonth[month].cleaners++;
    }
  });

  // Process bookings by day of week
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bookingsByDayOfWeek: Record<string, number> = {};
  dayNames.forEach(day => bookingsByDayOfWeek[day] = 0);
  bookingsByDay.forEach((booking) => {
    const day = dayNames[new Date(booking.date).getDay()];
    bookingsByDayOfWeek[day]++;
  });

  // Process top cleaners with earnings
  const topCleanersWithEarnings = topCleaners.map((cleaner) => ({
    id: cleaner.id,
    name: cleaner.name,
    email: cleaner.email,
    totalJobs: cleaner._count.acceptedJobs,
    totalEarnings: cleaner.acceptedJobs.reduce((sum, job) => sum + job.price, 0),
  }));

  return NextResponse.json({
    overview: {
      totalUsers,
      totalCustomers,
      totalCleaners,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue: totalRevenue._sum.price || 0,
      activePromoCodes,
    },
    revenueByMonth,
    recentBookings,
    analytics: {
      bookingsByServiceType: bookingsByServiceType.map(b => ({
        type: b.serviceType,
        count: b._count,
      })),
      bookingsByStatus: bookingsByStatus.map(b => ({
        status: b.status,
        count: b._count,
      })),
      bookingsByPaymentStatus: bookingsByPaymentStatus.map(b => ({
        status: b.paymentStatus,
        count: b._count,
      })),
      topCleaners: topCleanersWithEarnings,
      userGrowthByMonth,
      avgBookingValue: avgBookingValue._avg.price || 0,
      bookingsByDayOfWeek,
    },
  });
}
