"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  MapPin,
  Clock,
  User,
  Briefcase,
  Star,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Booking {
  id: string;
  status: string;
  postcode: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  serviceType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  instructions?: string;
  date: string;
  timeSlot: string;
  price: number;
  paymentStatus: string;
  customer?: { name: string; email: string };
  cleaner?: { name: string; email: string };
}

interface CleanerProfile {
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMiles: number;
  verified: boolean;
  rating: number;
  totalJobs: number;
  hourlyRate: number;
  experience: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  bookings: Booking[];
  acceptedJobs: Booking[];
  cleanerProfile: CleanerProfile | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, [params.id]);

  useEffect(() => {
    if (!mapRef.current || !user || mapInstanceRef.current) return;

    const bookings = user.role === "CLEANER" ? user.acceptedJobs : user.bookings;
    const locationsWithCoords = bookings.filter(
      (b) => b.latitude && b.longitude
    );

    if (locationsWithCoords.length === 0) return;

    // Fix leaflet marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Calculate center
    const lats = locationsWithCoords.map((b) => b.latitude!);
    const lngs = locationsWithCoords.map((b) => b.longitude!);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    const map = L.map(mapRef.current).setView([centerLat, centerLng], 10);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Add cleaner's coverage area if applicable
    if (user.role === "CLEANER" && user.cleanerProfile?.latitude && user.cleanerProfile?.longitude) {
      L.circle([user.cleanerProfile.latitude, user.cleanerProfile.longitude], {
        radius: user.cleanerProfile.radiusMiles * 1609.34,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "4 4",
      }).addTo(map);
    }

    // Add booking markers
    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        PENDING: "#f59e0b",
        ACCEPTED: "#3b82f6",
        IN_PROGRESS: "#8b5cf6",
        COMPLETED: "#22c55e",
        CANCELLED: "#ef4444",
      };
      return colors[status] || "#6b7280";
    };

    locationsWithCoords.forEach((booking) => {
      const color = getStatusColor(booking.status);

      const icon = L.divIcon({
        className: "booking-marker",
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transform: translate(-50%, -50%);
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      L.marker([booking.latitude!, booking.longitude!], { icon })
        .bindPopup(`
          <div style="font-size: 13px;">
            <strong>${booking.address}</strong><br/>
            <span style="color: #666;">${booking.city} ${booking.postcode}</span><br/>
            <span style="
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              color: white;
              background: ${color};
              margin-top: 4px;
            ">${booking.status}</span>
          </div>
        `)
        .addTo(map);
    });

    // Fit bounds
    if (locationsWithCoords.length > 1) {
      const bounds = L.latLngBounds(
        locationsWithCoords.map((b) => [b.latitude!, b.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [user]);

  const loadUser = async () => {
    try {
      const res = await fetch(`/api/super-admin/users/${params.id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setError("Failed to load user");
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      address: booking.address,
      city: booking.city,
      postcode: booking.postcode,
      date: booking.date.split("T")[0],
      timeSlot: booking.timeSlot,
      price: booking.price,
      serviceType: booking.serviceType,
      propertyType: booking.propertyType,
      bedrooms: booking.bedrooms,
      bathrooms: booking.bathrooms,
      instructions: booking.instructions || "",
    });
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/bookings/${editingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        // Reload user data to get updated booking
        await loadUser();
        setEditingBooking(null);
      }
    } catch (err) {
      console.error("Failed to save booking:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatServiceType = (type: string) => {
    const labels: Record<string, string> = {
      STANDARD: "Standard Clean",
      DEEP: "Deep Clean",
      MOVE_IN_OUT: "Move In/Out",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-red-500">{error || "User not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const bookings = user.role === "CLEANER" ? user.acceptedJobs : user.bookings;
  const hasLocations = bookings.some((b) => b.latitude && b.longitude);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        {/* User Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                user.role === "CLEANER"
                  ? "bg-blue-100 text-blue-700"
                  : user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : user.role === "SUPER_ADMIN"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              )}
            >
              {user.role}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Joined {formatDate(new Date(user.createdAt))}
          </p>
        </div>

        {/* Cleaner Profile Info */}
        {user.role === "CLEANER" && user.cleanerProfile && (
          <div className="mb-8 p-6 rounded-2xl bg-secondary/50">
            <h2 className="font-semibold mb-4">Cleaner Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{user.cleanerProfile.postcode || "Not set"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Radius</div>
                <div className="font-medium">{user.cleanerProfile.radiusMiles} miles</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rating</div>
                <div className="font-medium flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {user.cleanerProfile.rating.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Jobs</div>
                <div className="font-medium">{user.cleanerProfile.totalJobs}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Hourly Rate</div>
                <div className="font-medium">{formatPrice(user.cleanerProfile.hourlyRate)}/hr</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Experience</div>
                <div className="font-medium">{user.cleanerProfile.experience} years</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className={cn(
                  "font-medium",
                  user.cleanerProfile.verified ? "text-green-600" : "text-yellow-600"
                )}>
                  {user.cleanerProfile.verified ? "Verified" : "Pending Verification"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        {hasLocations && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4">
              {user.role === "CLEANER" ? "Job Locations" : "Booking Locations"}
            </h2>
            <div
              ref={mapRef}
              className="h-[300px] rounded-xl overflow-hidden border"
            />
          </div>
        )}

        {/* Bookings List */}
        <div>
          <h2 className="font-semibold mb-4">
            {user.role === "CLEANER" ? `Jobs (${bookings.length})` : `Bookings (${bookings.length})`}
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed">
              <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-xl border hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        {formatServiceType(booking.serviceType)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.bedrooms} bed · {booking.bathrooms} bath · {booking.propertyType.toLowerCase()}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBooking(booking)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(booking.price)}</div>
                        <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs",
                          booking.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {formatStatus(booking.status)}
                      </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>{booking.address}</div>
                        <div className="text-muted-foreground">
                          {booking.city} {booking.postcode}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>{formatDate(new Date(booking.date))}</div>
                        <div className="text-muted-foreground">{booking.timeSlot}</div>
                      </div>
                    </div>
                  </div>

                  {(booking.customer || booking.cleaner) && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      {booking.customer && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Customer:</span>
                          <span>{booking.customer.name}</span>
                        </div>
                      )}
                      {booking.cleaner && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Cleaner:</span>
                          <span>{booking.cleaner.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.extras.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-1">
                        {booking.extras.map((extra) => (
                          <span
                            key={extra}
                            className="px-2 py-0.5 bg-secondary rounded text-xs capitalize"
                          >
                            {extra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Edit Booking</h2>
              <button onClick={() => setEditingBooking(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Payment Status</Label>
                  <Select
                    value={editForm.paymentStatus}
                    onValueChange={(v) => setEditForm({ ...editForm, paymentStatus: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Type & Property */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Service Type</Label>
                  <Select
                    value={editForm.serviceType}
                    onValueChange={(v) => setEditForm({ ...editForm, serviceType: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard Clean</SelectItem>
                      <SelectItem value="DEEP">Deep Clean</SelectItem>
                      <SelectItem value="MOVE_IN_OUT">Move In/Out</SelectItem>
                      <SelectItem value="OFFICE">Office Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Property Type</Label>
                  <Select
                    value={editForm.propertyType}
                    onValueChange={(v) => setEditForm({ ...editForm, propertyType: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APARTMENT">Apartment</SelectItem>
                      <SelectItem value="HOUSE">House</SelectItem>
                      <SelectItem value="STUDIO">Studio</SelectItem>
                      <SelectItem value="OFFICE">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Bedrooms</Label>
                  <Select
                    value={String(editForm.bedrooms)}
                    onValueChange={(v) => setEditForm({ ...editForm, bedrooms: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Bathrooms</Label>
                  <Select
                    value={String(editForm.bathrooms)}
                    onValueChange={(v) => setEditForm({ ...editForm, bathrooms: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Price (£)</Label>
                  <Input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm">Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* City & Postcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">City</Label>
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Postcode</Label>
                  <Input
                    value={editForm.postcode}
                    onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Time Slot</Label>
                  <Select
                    value={editForm.timeSlot}
                    onValueChange={(v) => setEditForm({ ...editForm, timeSlot: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00-10:00">8:00 – 10:00 AM</SelectItem>
                      <SelectItem value="10:00-12:00">10:00 AM – 12:00 PM</SelectItem>
                      <SelectItem value="12:00-14:00">12:00 – 2:00 PM</SelectItem>
                      <SelectItem value="14:00-16:00">2:00 – 4:00 PM</SelectItem>
                      <SelectItem value="16:00-18:00">4:00 – 6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label className="text-sm">Special Instructions</Label>
                <textarea
                  value={editForm.instructions || ""}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Any special requirements..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingBooking(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBooking} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
