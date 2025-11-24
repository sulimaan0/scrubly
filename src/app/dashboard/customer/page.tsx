"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Calendar, Clock, X, Home, CreditCard } from "lucide-react";
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

export default function CustomerDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetch("/api/bookings")
        .then((res) => res.json())
        .then(setBookings);
    }
  }, [session, isPending, router]);

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
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold">Your bookings</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name}</p>
          </div>
          <Button asChild>
            <Link href="/booking">
              <Plus className="h-4 w-4 mr-2" />
              New booking
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{bookings.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total bookings</div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{upcomingBookings.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Upcoming</div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{pastBookings.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Completed</div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed">
              <p className="text-muted-foreground mb-4">No upcoming bookings</p>
              <Button asChild variant="outline">
                <Link href="/booking">Book a clean</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold">{formatServiceType(booking.serviceType)}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                        {booking.paymentStatus === "PAID" && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {booking.city} {booking.postcode}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(new Date(booking.date))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {booking.timeSlot}
                        </div>
                      </div>
                      {booking.cleaner && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Cleaner: </span>
                          <span className="font-medium">{booking.cleaner.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-semibold">{formatPrice(booking.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Past bookings</h2>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div>
                    <div className="text-sm font-medium">{formatServiceType(booking.serviceType)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(new Date(booking.date))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatPrice(booking.price)}</div>
                    <div className={`text-xs mt-1 ${booking.status === "COMPLETED" ? "text-green-600" : "text-muted-foreground"}`}>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Booking Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Service Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{formatServiceType(selectedBooking.serviceType)}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(selectedBooking.status)}`}>
                      {formatStatus(selectedBooking.status)}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold">{formatPrice(selectedBooking.price)}</div>
                </div>

                {/* Details Grid */}
                <div className="space-y-4 text-sm">
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
                  <div className="px-6 pb-6">
                    <Button
                      variant="destructive"
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
