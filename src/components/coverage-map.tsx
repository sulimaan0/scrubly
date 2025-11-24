"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Cleaner {
  id: string;
  name: string;
  email: string;
  postcode: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  verified: boolean;
  totalJobs: number;
}

interface Booking {
  id: string;
  latitude: number;
  longitude: number;
  postcode: string;
  city: string;
  status: string;
  serviceType: string;
  date: string;
  customerName: string;
}

interface MapData {
  cleaners: Cleaner[];
  bookings: Booking[];
}

export function CoverageMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapData || mapInstanceRef.current) return;

    // Fix leaflet marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Create map centered on UK
    const map = L.map(mapRef.current).setView([54.5, -2.5], 6);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add cleaner coverage areas and markers
    mapData.cleaners.forEach((cleaner) => {
      const radiusMeters = cleaner.radiusMiles * 1609.34;

      // Subtle coverage circle
      L.circle([cleaner.latitude, cleaner.longitude], {
        radius: radiusMeters,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        weight: 1,
        dashArray: "4 4",
      }).addTo(map);

      // Cleaner marker with postcode label
      const postcodeDistrict = cleaner.postcode?.split(" ")[0] || "?";

      const cleanerIcon = L.divIcon({
        className: "cleaner-marker",
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
          ">
            <div style="
              background: #3b82f6;
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
              white-space: nowrap;
            ">${postcodeDistrict}</div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #3b82f6;
            "></div>
          </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 40],
      });

      L.marker([cleaner.latitude, cleaner.longitude], { icon: cleanerIcon })
        .bindPopup(`
          <div style="font-size: 14px; min-width: 160px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${cleaner.name}</div>
            <div style="
              background: #f1f5f9;
              padding: 8px;
              border-radius: 6px;
              margin-bottom: 8px;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #3b82f6;">${cleaner.postcode}</div>
              <div style="font-size: 11px; color: #64748b;">${cleaner.radiusMiles} mile radius</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #64748b;">Jobs completed</span>
              <span style="font-weight: 500;">${cleaner.totalJobs}</span>
            </div>
            ${cleaner.verified ? `
              <div style="
                margin-top: 8px;
                padding: 4px 8px;
                background: #dcfce7;
                color: #166534;
                border-radius: 4px;
                font-size: 11px;
                text-align: center;
              ">✓ Verified Cleaner</div>
            ` : ''}
          </div>
        `)
        .addTo(map);
    });

    // Add job markers
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

    const formatServiceType = (type: string) => {
      const labels: Record<string, string> = {
        STANDARD: "Standard",
        DEEP: "Deep Clean",
        MOVE_IN_OUT: "Move In/Out",
        OFFICE: "Office",
      };
      return labels[type] || type;
    };

    mapData.bookings.forEach((booking) => {
      const color = getStatusColor(booking.status);
      const postcodeDistrict = booking.postcode?.split(" ")[0] || "";

      const icon = L.divIcon({
        className: "job-marker",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            transform: translate(-50%, -50%);
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: ${color};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([booking.latitude, booking.longitude], { icon })
        .bindPopup(`
          <div style="font-size: 14px; min-width: 180px;">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            ">
              <span style="font-weight: 600;">${formatServiceType(booking.serviceType)}</span>
              <span style="
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                color: white;
                background: ${color};
              ">${booking.status}</span>
            </div>
            <div style="
              background: #f8fafc;
              padding: 8px;
              border-radius: 6px;
              margin-bottom: 8px;
            ">
              <div style="font-weight: 500; font-size: 13px;">${postcodeDistrict}</div>
              <div style="font-size: 11px; color: #64748b;">${booking.city}</div>
            </div>
            <div style="font-size: 12px; color: #64748b;">
              <div>${booking.customerName}</div>
              <div>${new Date(booking.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short"
              })}</div>
            </div>
          </div>
        `)
        .addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapData]);

  const loadMapData = async () => {
    try {
      const res = await fetch("/api/super-admin/map-data", {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Failed to load: ${res.status} ${text}`);
        return;
      }

      const data = await res.json();
      setMapData(data);
    } catch (err) {
      setError("Network error loading map data");
      console.error("Failed to load map data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[500px] rounded-2xl bg-secondary/50 flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[500px] rounded-2xl bg-secondary/50 flex items-center justify-center">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="p-4 rounded-xl bg-secondary/30 border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Cleaners</div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded bg-blue-500 text-white text-xs font-semibold">SW1</div>
              <span>Postcode area</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Job Status</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-2">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Summary</div>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-semibold">{mapData?.cleaners.length || 0}</div>
                <div className="text-xs text-muted-foreground">Cleaners</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{mapData?.bookings.length || 0}</div>
                <div className="text-xs text-muted-foreground">Jobs</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {mapData?.bookings.filter(b => b.status === "PENDING").length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="h-[500px] rounded-2xl overflow-hidden border"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
