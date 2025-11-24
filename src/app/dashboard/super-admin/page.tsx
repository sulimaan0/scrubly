"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  DollarSign,
  Tag,
  Trash2,
  Plus,
  X,
  Shield,
  MapPin,
  Clock,
  BarChart3,
  TrendingUp,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";

const CoverageMap = dynamic(
  () => import("@/components/coverage-map").then((mod) => mod.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] rounded-2xl bg-secondary/50 flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
);

interface Stats {
  overview: {
    totalUsers: number;
    totalCustomers: number;
    totalCleaners: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    activePromoCodes: number;
  };
  revenueByMonth: Record<string, number>;
  recentBookings: Array<{
    id: string;
    status: string;
    serviceType: string;
    price: number;
    date: string;
    city: string;
    postcode: string;
    customer: { name: string; email: string };
    cleaner?: { name: string; email: string };
  }>;
  analytics?: {
    bookingsByServiceType: Array<{ type: string; count: number }>;
    bookingsByStatus: Array<{ status: string; count: number }>;
    bookingsByPaymentStatus: Array<{ status: string; count: number }>;
    topCleaners: Array<{ id: string; name: string; email: string; totalJobs: number; totalEarnings: number }>;
    userGrowthByMonth: Record<string, { customers: number; cleaners: number }>;
    avgBookingValue: number;
    bookingsByDayOfWeek: Record<string, number>;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { bookings: number; acceptedJobs: number };
}

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
}

const formatServiceType = (type: string) => {
  const labels: Record<string, string> = {
    STANDARD: "Standard Clean",
    DEEP: "Deep Clean",
    MOVE_IN_OUT: "Move In/Out Clean",
    OFFICE: "Office Clean",
  };
  return labels[type] || type;
};

const formatStatus = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "promos" | "bookings" | "analytics" | "map">("overview");
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newPromo, setNewPromo] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxUses: "",
    minOrderAmount: "",
    expiresAt: "",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      loadData();
    }
  }, [session, isPending, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, promosRes] = await Promise.all([
        fetch("/api/super-admin/stats"),
        fetch("/api/super-admin/users"),
        fetch("/api/super-admin/promo-codes"),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setError("Access denied. Super admin privileges required.");
        setLoading(false);
        return;
      }

      if (!statsRes.ok || !usersRes.ok || !promosRes.ok) {
        setError("Failed to load data from server");
        setLoading(false);
        return;
      }

      const [statsData, usersData, promosData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        promosRes.json(),
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPromoCodes(Array.isArray(promosData) ? promosData : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await fetch(`/api/super-admin/users?id=${userId}`, { method: "DELETE" });
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleCreatePromo = async () => {
    const res = await fetch("/api/super-admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newPromo,
        discountValue: parseFloat(newPromo.discountValue),
        maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
        minOrderAmount: newPromo.minOrderAmount ? parseFloat(newPromo.minOrderAmount) : null,
      }),
    });

    if (res.ok) {
      const promo = await res.json();
      setPromoCodes([promo, ...promoCodes]);
      setShowCreatePromo(false);
      setNewPromo({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maxUses: "",
        minOrderAmount: "",
        expiresAt: "",
      });
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    await fetch(`/api/super-admin/promo-codes?id=${promoId}`, { method: "DELETE" });
    setPromoCodes(promoCodes.filter(p => p.id !== promoId));
  };

  const handleTogglePromo = async (promoId: string, isActive: boolean) => {
    await fetch("/api/super-admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promoId, isActive: !isActive }),
    });
    setPromoCodes(promoCodes.map(p =>
      p.id === promoId ? { ...p, isActive: !isActive } : p
    ));
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromo({ ...newPromo, code });
  };

  const filteredUsers = userFilter === "all"
    ? users
    : users.filter(u => u.role === userFilter);

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-semibold">Super Admin</h1>
          </div>
          <p className="text-muted-foreground">Full system control and management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "map", label: "Coverage Map" },
            { id: "analytics", label: "Analytics" },
            { id: "users", label: "Users" },
            { id: "promos", label: "Promo Codes" },
            { id: "bookings", label: "All Bookings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats?.overview && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-secondary/50">
                <Users className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold">{stats.overview.totalUsers ?? 0}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50">
                <Calendar className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold">{stats.overview.totalBookings ?? 0}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50">
                <DollarSign className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold">{formatPrice(stats.overview.totalRevenue ?? 0)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50">
                <Tag className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold">{stats.overview.activePromoCodes ?? 0}</div>
                <div className="text-sm text-muted-foreground">Active Promos</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border">
                <div className="text-xl font-semibold">{stats.overview.totalCustomers ?? 0}</div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </div>
              <div className="p-4 rounded-xl border">
                <div className="text-xl font-semibold">{stats.overview.totalCleaners ?? 0}</div>
                <div className="text-sm text-muted-foreground">Cleaners</div>
              </div>
              <div className="p-4 rounded-xl border">
                <div className="text-xl font-semibold">{stats.overview.completedBookings ?? 0}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="p-4 rounded-xl border">
                <div className="text-xl font-semibold">{stats.overview.pendingBookings ?? 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === "map" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Coverage Map</h2>
              <p className="text-muted-foreground text-sm">
                View cleaner coverage areas and job locations across the UK
              </p>
            </div>
            <CoverageMap />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && stats?.analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-600 mb-2" />
                <div className="text-2xl font-semibold">{formatPrice(stats.analytics.avgBookingValue)}</div>
                <div className="text-sm text-blue-600">Avg Booking Value</div>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <BarChart3 className="h-5 w-5 text-green-600 mb-2" />
                <div className="text-2xl font-semibold">{stats.overview?.completedBookings ?? 0}</div>
                <div className="text-sm text-green-600">Completed Jobs</div>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <Award className="h-5 w-5 text-purple-600 mb-2" />
                <div className="text-2xl font-semibold">{stats.analytics.topCleaners.length}</div>
                <div className="text-sm text-purple-600">Active Cleaners</div>
              </div>
            </div>

            {/* Revenue by Month */}
            {Object.keys(stats.revenueByMonth).length > 0 && (
              <div className="p-6 rounded-2xl border">
                <h3 className="font-semibold mb-4">Revenue by Month</h3>
                <div className="space-y-3">
                  {Object.entries(stats.revenueByMonth)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, revenue]) => {
                      const maxRevenue = Math.max(...Object.values(stats.revenueByMonth));
                      const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={month}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{new Date(month + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                            <span className="font-medium">{formatPrice(revenue)}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-foreground rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Bookings by Service Type */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border">
                <h3 className="font-semibold mb-4">Bookings by Service Type</h3>
                <div className="space-y-3">
                  {stats.analytics.bookingsByServiceType.map((item) => {
                    const total = stats.analytics!.bookingsByServiceType.reduce((sum, i) => sum + i.count, 0);
                    const percentage = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{formatServiceType(item.type)}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl border">
                <h3 className="font-semibold mb-4">Bookings by Status</h3>
                <div className="space-y-3">
                  {stats.analytics.bookingsByStatus.map((item) => {
                    const total = stats.analytics!.bookingsByStatus.reduce((sum, i) => sum + i.count, 0);
                    const percentage = total > 0 ? (item.count / total) * 100 : 0;
                    const colors: Record<string, string> = {
                      COMPLETED: "bg-green-500",
                      ACCEPTED: "bg-blue-500",
                      PENDING: "bg-yellow-500",
                      CANCELLED: "bg-red-500",
                      IN_PROGRESS: "bg-purple-500",
                    };
                    return (
                      <div key={item.status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{formatStatus(item.status)}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[item.status] || "bg-gray-500"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bookings by Day of Week */}
            <div className="p-6 rounded-2xl border">
              <h3 className="font-semibold mb-4">Busiest Days</h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(stats.analytics.bookingsByDayOfWeek).map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(stats.analytics!.bookingsByDayOfWeek));
                  const intensity = maxCount > 0 ? count / maxCount : 0;
                  return (
                    <div key={day} className="text-center">
                      <div
                        className="h-16 rounded-lg mb-2 flex items-end justify-center"
                        style={{
                          backgroundColor: `rgba(0, 0, 0, ${0.05 + intensity * 0.15})`,
                        }}
                      >
                        <span className="text-xs font-medium pb-1">{count}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{day.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Cleaners */}
            {stats.analytics.topCleaners.length > 0 && (
              <div className="p-6 rounded-2xl border">
                <h3 className="font-semibold mb-4">Top Cleaners</h3>
                <div className="space-y-3">
                  {stats.analytics.topCleaners.map((cleaner, index) => (
                    <div key={cleaner.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{cleaner.name}</div>
                          <div className="text-xs text-muted-foreground">{cleaner.totalJobs} jobs</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatPrice(cleaner.totalEarnings)}</div>
                        <div className="text-xs text-muted-foreground">earned</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="p-6 rounded-2xl border">
              <h3 className="font-semibold mb-4">Payment Status Breakdown</h3>
              <div className="flex gap-4 flex-wrap">
                {stats.analytics.bookingsByPaymentStatus.map((item) => {
                  const colors: Record<string, string> = {
                    PAID: "bg-green-100 text-green-700 border-green-200",
                    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    REFUNDED: "bg-blue-100 text-blue-700 border-blue-200",
                    FAILED: "bg-red-100 text-red-700 border-red-200",
                  };
                  return (
                    <div
                      key={item.status}
                      className={cn("px-4 py-3 rounded-xl border", colors[item.status] || "bg-gray-100")}
                    >
                      <div className="text-2xl font-semibold">{item.count}</div>
                      <div className="text-sm">{item.status}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="CUSTOMER">Customers</SelectItem>
                  <SelectItem value="CLEANER">Cleaners</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {filteredUsers.length} users
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl border hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/super-admin/users/${user.id}`)}
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        user.role === "CLEANER" ? "bg-blue-100 text-blue-700" :
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                        user.role === "SUPER_ADMIN" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {user.role}
                      </span>
                      {user.role === "CUSTOMER" && (
                        <span className="text-xs text-muted-foreground">
                          {user._count.bookings} bookings
                        </span>
                      )}
                      {user.role === "CLEANER" && (
                        <span className="text-xs text-muted-foreground">
                          {user._count.acceptedJobs} jobs
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Joined {formatDate(new Date(user.createdAt))}
                    </span>
                    {user.role !== "SUPER_ADMIN" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.name} and all their data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === "promos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Promo Codes</h2>
              <Button onClick={() => setShowCreatePromo(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </div>

            {promoCodes.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed">
                <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No promo codes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promoCodes.map((promo) => (
                  <div key={promo.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    !promo.isActive && "opacity-50"
                  )}>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold">{promo.code}</code>
                        {!promo.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {promo.discountType === "PERCENTAGE"
                          ? `${promo.discountValue}% off`
                          : `${formatPrice(promo.discountValue)} off`
                        }
                        {promo.minOrderAmount && ` · Min ${formatPrice(promo.minOrderAmount)}`}
                        {promo.maxUses && ` · ${promo.usedCount}/${promo.maxUses} uses`}
                        {promo.expiresAt && ` · Expires ${formatDate(new Date(promo.expiresAt))}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePromo(promo.id, promo.isActive)}
                      >
                        {promo.isActive ? "Disable" : "Enable"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete promo code?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the promo code "{promo.code}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePromo(promo.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Promo Modal */}
            {showCreatePromo && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Create Promo Code</h2>
                    <button onClick={() => setShowCreatePromo(false)}>
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Code</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newPromo.code}
                          onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                          placeholder="SUMMER20"
                        />
                        <Button variant="outline" onClick={generateRandomCode}>
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Discount Type</Label>
                        <Select
                          value={newPromo.discountType}
                          onValueChange={(v) => setNewPromo({ ...newPromo, discountType: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">
                          {newPromo.discountType === "PERCENTAGE" ? "Percentage (%)" : "Amount (£)"}
                        </Label>
                        <Input
                          type="number"
                          value={newPromo.discountValue}
                          onChange={(e) => setNewPromo({ ...newPromo, discountValue: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Max Uses (optional)</Label>
                        <Input
                          type="number"
                          value={newPromo.maxUses}
                          onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Min Order (optional)</Label>
                        <Input
                          type="number"
                          value={newPromo.minOrderAmount}
                          onChange={(e) => setNewPromo({ ...newPromo, minOrderAmount: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Expires At (optional)</Label>
                      <Input
                        type="date"
                        value={newPromo.expiresAt}
                        onChange={(e) => setNewPromo({ ...newPromo, expiresAt: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreatePromo}
                      disabled={!newPromo.code || !newPromo.discountValue}
                    >
                      Create Promo Code
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Bookings Tab */}
        {activeTab === "bookings" && stats?.recentBookings && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 rounded-xl border">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatServiceType(booking.serviceType)}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        booking.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        booking.status === "PENDING" ? "bg-gray-100 text-gray-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {formatStatus(booking.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.city} {booking.postcode}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(new Date(booking.date))}
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Customer: </span>
                      <span>{booking.customer.name}</span>
                      {booking.cleaner && (
                        <>
                          <span className="text-muted-foreground"> · Cleaner: </span>
                          <span>{booking.cleaner.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{formatPrice(booking.price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
