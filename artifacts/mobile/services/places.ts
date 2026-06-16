export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cuisine?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  amenity: string;
}

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `[out:json][timeout:20];
(
  node["amenity"~"^(restaurant|cafe|bar|pub|bistro|food_court|fast_food)$"]["name"](around:${radiusMeters},${lat},${lng});
  way["amenity"~"^(restaurant|cafe|bar|pub|bistro|food_court|fast_food)$"]["name"](around:${radiusMeters},${lat},${lng});
);
out center 40;`;
}

export async function findRestaurantsNear(lat: number, lng: number, radiusMeters = 1500): Promise<Place[]> {
  try {
    const query = buildOverpassQuery(lat, lng, radiusMeters);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!response.ok) throw new Error("Overpass request failed");
    const data = await response.json();

    return (data.elements as Record<string, unknown>[])
      .filter((el) => {
        const tags = el.tags as Record<string, string> | undefined;
        return tags?.name;
      })
      .map((el) => {
        const tags = el.tags as Record<string, string>;
        const elLat = (el.lat as number | undefined) ?? (el.center as Record<string, number> | undefined)?.lat;
        const elLng = (el.lon as number | undefined) ?? (el.center as Record<string, number> | undefined)?.lon;
        return {
          id: String(el.id),
          name: tags.name,
          lat: elLat!,
          lng: elLng!,
          cuisine: tags.cuisine?.replace(/_/g, " ").replace(/;/g, ", "),
          phone: tags.phone,
          website: tags.website,
          openingHours: tags.opening_hours,
          amenity: tags.amenity ?? "restaurant",
        };
      })
      .filter((p) => p.lat != null && p.lng != null);
  } catch {
    return [];
  }
}
