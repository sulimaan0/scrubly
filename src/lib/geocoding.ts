// UK Postcode geocoding using postcodes.io (free, no API key required)

interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
}

export async function geocodePostcode(postcode: string): Promise<PostcodeResult | null> {
  try {
    const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 200 && data.result) {
      return {
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if a job is within a cleaner's radius
export function isWithinRadius(
  cleanerLat: number,
  cleanerLon: number,
  jobLat: number,
  jobLon: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(cleanerLat, cleanerLon, jobLat, jobLon);
  return distance <= radiusMiles;
}
