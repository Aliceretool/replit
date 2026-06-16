const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
  placeId: string;
}

function shortenName(displayName: string): string {
  const parts = displayName.split(", ");
  if (parts.length <= 2) return displayName;
  return parts.slice(0, 3).join(", ");
}

export async function searchLocation(query: string): Promise<GeoResult[]> {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MeetMidway/1.0 (mobile app)" },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: Record<string, string>) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      shortName: shortenName(item.display_name),
      placeId: item.place_id.toString(),
    }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MeetMidway/1.0 (mobile app)" },
    });
    if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await response.json();
    return shortenName(data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
