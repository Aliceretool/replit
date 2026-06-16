export interface PersonLocation {
  id: string;
  name: string;
  from: { lat: number; lng: number; address: string };
  to?: { lat: number; lng: number; address: string };
}

export interface PersonScore {
  personId: string;
  personName: string;
  travelTimeMins: number;
  detourMins: number;
}

export interface ScoredPlace {
  placeId: string;
  scores: PersonScore[];
  fairnessScore: number;
  totalTravelMins: number;
  maxTravelMins: number;
  maxDetourMins: number;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roadKm(straightKm: number): number {
  return straightKm * 1.35;
}

function drivingMins(straightKm: number): number {
  return (roadKm(straightKm) / 28) * 60;
}

export function getGeographicMidpoint(people: PersonLocation[]): { lat: number; lng: number } {
  const points = people.flatMap((p) => (p.to ? [p.from, p.to] : [p.from]));
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

export function scorePlace(
  placeLat: number,
  placeLng: number,
  placeId: string,
  people: PersonLocation[]
): ScoredPlace {
  const scores: PersonScore[] = people.map((person) => {
    const travelTimeMins = drivingMins(haversineKm(person.from.lat, person.from.lng, placeLat, placeLng));

    let detourMins = 0;
    if (person.to) {
      const directMins = drivingMins(haversineKm(person.from.lat, person.from.lng, person.to.lat, person.to.lng));
      const viaMins =
        travelTimeMins + drivingMins(haversineKm(placeLat, placeLng, person.to.lat, person.to.lng));
      detourMins = Math.max(0, viaMins - directMins);
    }

    return {
      personId: person.id,
      personName: person.name,
      travelTimeMins: Math.round(travelTimeMins),
      detourMins: Math.round(detourMins),
    };
  });

  const times = scores.map((s) => s.travelTimeMins);
  const detours = scores.map((s) => s.detourMins);
  const maxTravelMins = Math.max(...times);
  const maxDetourMins = Math.max(...detours);
  const totalTravelMins = times.reduce((a, b) => a + b, 0);
  const meanTime = totalTravelMins / times.length;
  const stdDev = Math.sqrt(times.reduce((sum, t) => sum + (t - meanTime) ** 2, 0) / times.length);

  const fairnessScore = maxTravelMins * 0.6 + stdDev * 0.4;

  return { placeId, scores, fairnessScore, totalTravelMins, maxTravelMins, maxDetourMins };
}

export function rankPlaces(
  places: Array<{ id: string; lat: number; lng: number }>,
  people: PersonLocation[]
): ScoredPlace[] {
  return places
    .map((p) => scorePlace(p.lat, p.lng, p.id, people))
    .sort((a, b) => a.fairnessScore - b.fairnessScore);
}
