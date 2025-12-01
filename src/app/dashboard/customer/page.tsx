"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MapPin, Calendar, Clock, X, Home, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

const formatServiceType = (type: string) => {
  const labels: Record<string, string> = {
    STANDARD: "Standard Clean",
    DEEP: "Deep Clean",
    MOVE_IN_OUT: "Move In/Out Clean",
    OFFICE: "Office Clean",
  };
  return labels[type] || type.replace(/_/g, " ");
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

interface Booking {
  id: string;
  status: string;
  paymentStatus: string;
  serviceType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  instructions?: string;
  address: string;
  city: string;
  postcode: string;
  date: string;
  timeSlot: string;
  price: number;
  cleaner?: { name: string; email: string };
}

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [successBannerVisible, setSuccessBannerVisible] = useState(showSuccess);

  useEffect(() => {
    console.log("[DASHBOARD] Component mounted");
    console.log("[DASHBOARD] Session state:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      isPending
    });
    console.log("[DASHBOARD] Show success:", showSuccess);
  }, []);

  useEffect(() => {
    console.log("[DASHBOARD] Session updated:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      isPending
    });

    // Middleware handles auth redirects, so just fetch data when session is ready
    if (session) {
      console.log("[DASHBOARD] Fetching bookings");
      fetch("/api/bookings")
        .then((res) => {
          console.log("[DASHBOARD] Bookings API response status:", res.status);
          return res.json();
        })
        .then(data => {
          console.log("[DASHBOARD] Bookings received:", data?.length || 0);
          setBookings(data);
        })
        .catch(err => {
          console.error("[DASHBOARD] Error fetching bookings:", err);
        });
    }
  }, [session, isPending]);

  // Auto-hide success banner after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setSuccessBannerVisible(false);
        // Clean up URL
        router.replace("/dashboard/customer", { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingBooking(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        // Refresh bookings
        const updatedBookings = await fetch("/api/bookings").then((r) => r.json());
        setBookings(updatedBookings);
        setSelectedBooking(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to cancel booking");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking");
    } finally {
      setCancellingBooking(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "ACCEPTED": case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date() && b.status !== "COMPLETED");
  const pastBookings = bookings.filter(b => new Date(b.date) < new Date() || b.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <Navbar />

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Success Banner */}
        {successBannerVisible && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Booking confirmed!</h3>
              <p className="text-sm text-green-700 mt-1">
                Your payment was successful and your booking has been confirmed. We'll notify you when a cleaner accepts your job.
              </p>
            </div>
            <button
              onClick={() => setSuccessBannerVisible(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your bookings</h1>
            <p className="text-lg text-muted-foreground">Welcome back, {session?.user?.name}</p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/booking">
              <Plus className="h-5 w-5 mr-2" />
              New booking
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="p-8 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">{bookings.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Total bookings</div>
          </div>
          <div className="p-8 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">{upcomingBookings.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Upcoming</div>
          </div>
          <div className="p-8 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">{pastBookings.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming</h2>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/50 bg-white">
              <p className="text-lg text-muted-foreground mb-6">No upcoming bookings</p>
              <Button asChild variant="outline" size="lg">
                <Link href="/booking">Book a clean</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-8 rounded-2xl border border-border/40 bg-white hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{formatServiceType(booking.serviceType)}</h3>
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${statusColor(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                        {booking.paymentStatus === "PAID" && (
                          <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-green-100 text-green-700">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{booking.city} {booking.postcode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{formatDate(new Date(booking.date))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{booking.timeSlot}</span>
                        </div>
                      </div>
                      {booking.cleaner && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Cleaner: </span>
                          <span className="font-semibold">{booking.cleaner.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent sm:text-right">{formatPrice(booking.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Past bookings</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-6 rounded-2xl bg-white border border-border/40 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div>
                    <div className="text-base font-bold mb-1">{formatServiceType(booking.serviceType)}</div>
                    <div className="text-sm text-muted-foreground font-medium">{formatDate(new Date(booking.date))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold mb-1">{formatPrice(booking.price)}</div>
                    <div className={`text-xs font-semibold ${booking.status === "COMPLETED" ? "text-green-600" : "text-muted-foreground"}`}>
                      {formatStatus(booking.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 border-b border-border/40 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-muted-foreground hover:text-foreground p-2 -mr-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Service Info */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">{formatServiceType(selectedBooking.serviceType)}</h3>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${statusColor(selectedBooking.status)}`}>
                      {formatStatus(selectedBooking.status)}
                    </span>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{formatPrice(selectedBooking.price)}</div>
                </div>

                {/* Details Grid */}
                <div className="space-y-6 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Date & Time</div>
                      <div className="text-muted-foreground">{formatDate(new Date(selectedBooking.date))} · {selectedBooking.timeSlot}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-muted-foreground">{selectedBooking.address}</div>
                      <div className="text-muted-foreground">{selectedBooking.city}, {selectedBooking.postcode}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Property</div>
                      <div className="text-muted-foreground">
                        {selectedBooking.bedrooms} bedroom · {selectedBooking.bathrooms} bathroom · {selectedBooking.propertyType?.toLowerCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Payment</div>
                      <div className="text-muted-foreground">
                        {selectedBooking.paymentStatus === "PAID" ? "Paid" : "Pending"}
                      </div>
                    </div>
                  </div>

                  {selectedBooking.extras && selectedBooking.extras.length > 0 && (
                    <div className="pt-2">
                      <div className="font-medium mb-2">Extras</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.extras.map((extra) => (
                          <span key={extra} className="text-xs px-2.5 py-1 rounded-full bg-secondary capitalize">
                            {extra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBooking.instructions && (
                    <div className="pt-2">
                      <div className="font-medium mb-2">Special Instructions</div>
                      <div className="text-muted-foreground">{selectedBooking.instructions}</div>
                    </div>
                  )}

                  {selectedBooking.cleaner && (
                    <div className="pt-2 border-t">
                      <div className="font-medium mb-1 pt-4">Assigned Cleaner</div>
                      <div className="text-muted-foreground">{selectedBooking.cleaner.name}</div>
                      <div className="text-muted-foreground text-xs">{selectedBooking.cleaner.email}</div>
                    </div>
                  )}
                </div>

                {/* Cancel Button */}
                {selectedBooking.status !== "CANCELLED" &&
                 selectedBooking.status !== "COMPLETED" &&
                 selectedBooking.status !== "IN_PROGRESS" && (
                  <div className="border-t border-border/40 pt-6">
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={cancellingBooking}
                    >
                      {cancellingBooking ? "Cancelling..." : "Cancel Booking"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
}
