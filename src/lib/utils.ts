import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export const SERVICE_PRICES = {
  STANDARD: { base: 50, perBedroom: 15, perBathroom: 10 },
  DEEP: { base: 100, perBedroom: 25, perBathroom: 20 },
  MOVE_IN_OUT: { base: 150, perBedroom: 30, perBathroom: 25 },
  OFFICE: { base: 80, perDesk: 5, perMeetingRoom: 15, perRestroom: 12 },
};

export const EXTRAS_PRICES: Record<string, number> = {
  oven: 25,
  fridge: 20,
  windows: 30,
  laundry: 15,
  ironing: 20,
  cabinets: 25,
};

export const OFFICE_EXTRAS_PRICES: Record<string, number> = {
  "deep-carpet-clean": 40,
  "window-cleaning": 35,
  "kitchen-deep-clean": 30,
  "sanitization": 25,
  "floor-polish": 35,
};

export function calculatePrice(
  serviceType: keyof typeof SERVICE_PRICES,
  bedrooms: number,
  bathrooms: number,
  extras: string[],
  officeParams?: { desks?: number; meetingRooms?: number; restrooms?: number }
) {
  const service = SERVICE_PRICES[serviceType];
  let total = service.base;

  if (serviceType === "OFFICE" && officeParams) {
    total += (officeParams.desks || 0) * (service as any).perDesk;
    total += (officeParams.meetingRooms || 0) * (service as any).perMeetingRoom;
    total += (officeParams.restrooms || 0) * (service as any).perRestroom;
  } else {
    total += (service as any).perBedroom * bedrooms + (service as any).perBathroom * bathrooms;
  }

  extras.forEach((extra) => {
    total += EXTRAS_PRICES[extra] || OFFICE_EXTRAS_PRICES[extra] || 0;
  });
  return total;
}
