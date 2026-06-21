const MAPBOX_BASE = "https://api.mapbox.com";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

function getToken(): string | null {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? null;
}

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

async function searchMapbox(query: string): Promise<GeoResult[]> {
  const token = getToken();
  if (!token) return [];
  const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5&types=place,address,poi,locality,neighborhood`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features ?? []).map((f: Record<string, unknown>) => ({
    lat: (f.center as number[])[1]!,
    lng: (f.center as number[])[0]!,
    displayName: f.place_name as string,
    shortName: shortenName(f.place_name as string),
    placeId: f.id as string,
  }));
}

async function searchNominatim(query: string): Promise<GeoResult[]> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
  const res = await fetch(url, { headers: { "User-Agent": "MeetMidway/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((item: Record<string, string>) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
    shortName: shortenName(item.display_name),
    placeId: item.place_id.toString(),
  }));
}

export async function searchLocation(query: string): Promise<GeoResult[]> {
  try {
    const token = getToken();
    return token ? await searchMapbox(query) : await searchNominatim(query);
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const token = getToken();
    if (token) {
      const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const name = data.features?.[0]?.place_name as string | undefined;
        if (name) return shortenName(name);
      }
    }
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "MeetMidway/1.0" } });
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    return shortenName(data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
