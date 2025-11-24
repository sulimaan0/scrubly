"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, Check, X, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  cleanerId: string | null;
  customer: { name: string; email: string };
}

export default function CleanerDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "my-jobs">("available");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetch("/api/bookings?role=cleaner")
        .then((res) => res.json())
        .then(setBookings);
    }
  }, [session, isPending, router]);

  const refreshBookings = () => {
    fetch("/api/bookings?role=cleaner")
      .then((res) => res.json())
      .then(setBookings);
  };

  const handleAcceptJob = async (bookingId: string) => {
    await fetch("/api/bookings/" + bookingId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED", cleanerId: session?.user?.id }),
    });
    refreshBookings();
  };

  const handleForfeitJob = async (bookingId: string) => {
    await fetch("/api/bookings/" + bookingId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING", cleanerId: null }),
    });
    refreshBookings();
  };

  const handleCompleteJob = async (bookingId: string) => {
    await fetch("/api/bookings/" + bookingId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    refreshBookings();
  };

  const canForfeit = (bookingDate: string) => {
    const jobDate = new Date(bookingDate);
    const now = new Date();
    const hoursUntilJob = (jobDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilJob > 24;
  };

  const availableJobs = bookings.filter((b) => b.status === "PENDING" && !b.cleanerId);
  const myJobs = bookings.filter((b) => b.cleanerId === session?.user?.id);
  const completedJobs = myJobs.filter(b => b.status === "COMPLETED");
  const activeJobs = myJobs.filter(b => b.status === "ACCEPTED" || b.status === "IN_PROGRESS");
  const totalEarnings = completedJobs.reduce((sum, b) => sum + b.price, 0);

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{availableJobs.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Available</div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{activeJobs.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Active</div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{completedJobs.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Completed</div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50">
            <div className="text-3xl font-semibold">{formatPrice(totalEarnings)}</div>
            <div className="text-sm text-muted-foreground mt-1">Earnings</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("available")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "available"
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            Available ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("my-jobs")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "my-jobs"
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            My jobs ({myJobs.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "available" && (
          <div>
            {availableJobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed">
                <p className="text-muted-foreground">No available jobs at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">{formatServiceType(booking.serviceType)}</h3>
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
                        <div className="text-xs">
                          <span className="text-muted-foreground">Customer: </span>
                          <span>{booking.customer.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold mb-3">{formatPrice(booking.price)}</div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" onClick={(e) => e.stopPropagation()}>
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Accept this job?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You're committing to complete this {formatServiceType(booking.serviceType).toLowerCase()} on {formatDate(new Date(booking.date))} at {booking.timeSlot}.
                                You can only forfeit more than 24 hours before the scheduled time.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAcceptJob(booking.id)}>
                                Accept job
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-jobs" && (
          <div>
            {myJobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed">
                <p className="text-muted-foreground">You haven't accepted any jobs yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold">{formatServiceType(booking.serviceType)}</h3>
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            booking.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {formatStatus(booking.status)}
                          </span>
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
                        <div className="text-xs">
                          <span className="text-muted-foreground">Customer: </span>
                          <span>{booking.customer.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold mb-3">{formatPrice(booking.price)}</div>
                        {booking.status === "ACCEPTED" && (
                          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" onClick={() => handleCompleteJob(booking.id)}>
                              Mark complete
                            </Button>
                            {canForfeit(booking.date) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    <X className="h-4 w-4 mr-2" />
                                    Forfeit
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Forfeit this job?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This job will become available for other cleaners to accept.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleForfeitJob(booking.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Forfeit job
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Cannot forfeit within 24h
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Job Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Service Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{formatServiceType(selectedBooking.serviceType)}</h3>
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium",
                      selectedBooking.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : selectedBooking.status === "PENDING"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    )}>
                      {formatStatus(selectedBooking.status)}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold">{formatPrice(selectedBooking.price)}</div>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border">
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                      `${selectedBooking.address}, ${selectedBooking.city}, ${selectedBooking.postcode}`
                    )}`}
                  />
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
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Customer</div>
                      <div className="text-muted-foreground">{selectedBooking.customer.name}</div>
                      <div className="text-muted-foreground text-xs">{selectedBooking.customer.email}</div>
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
                </div>

                {/* Actions */}
                {selectedBooking.status === "PENDING" && !selectedBooking.cleanerId && (
                  <div className="pt-4 border-t">
                    <Button className="w-full" onClick={() => {
                      handleAcceptJob(selectedBooking.id);
                      setSelectedBooking(null);
                    }}>
                      <Check className="h-4 w-4 mr-2" />
                      Accept this job
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
