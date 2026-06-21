const MAPBOX_BASE = "https://api.mapbox.com";

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

function estimateMins(straightKm: number): number {
  return (straightKm * 1.35 / 28) * 60;
}

function getToken(): string | null {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? null;
}

export function getGeographicMidpoint(people: PersonLocation[]): { lat: number; lng: number } {
  const points = people.flatMap((p) => (p.to ? [p.from, p.to] : [p.from]));
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

interface Coord { lat: number; lng: number }

async function fetchMapboxMatrix(sources: Coord[], destinations: Coord[]): Promise<number[][]> {
  const token = getToken();
  if (!token) throw new Error("No token");

  const allCoords = [...sources, ...destinations];
  const coordStr = allCoords.map((c) => `${c.lng},${c.lat}`).join(";");
  const sourceIdxs = sources.map((_, i) => i).join(";");
  const destIdxs = destinations.map((_, i) => sources.length + i).join(";");

  const url = `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving/${coordStr}?sources=${sourceIdxs}&destinations=${destIdxs}&annotations=duration&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Matrix API error: ${res.status}`);
  const data = await res.json();
  return (data.durations as number[][]).map((row) => row.map((s) => s / 60));
}

export async function getRealTravelTimes(
  people: PersonLocation[],
  candidates: Array<{ id: string; lat: number; lng: number }>
): Promise<Map<string, number[]>> {
  const token = getToken();
  const result = new Map<string, number[]>();

  if (!token || candidates.length === 0 || people.length === 0) {
    for (const c of candidates) {
      result.set(c.id, people.map((p) => estimateMins(haversineKm(p.from.lat, p.from.lng, c.lat, c.lng))));
    }
    return result;
  }

  try {
    const BATCH = 24;
    const allTimes: number[][] = [];

    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      const mins = await fetchMapboxMatrix(
        people.map((p) => p.from),
        batch
      );
      allTimes.push(...mins);
    }

    for (let ci = 0; ci < candidates.length; ci++) {
      const timesForCandidate = people.map((_, pi) => Math.round(allTimes[pi]?.[ci] ?? estimateMins(haversineKm(people[pi]!.from.lat, people[pi]!.from.lng, candidates[ci]!.lat, candidates[ci]!.lng))));
      result.set(candidates[ci]!.id, timesForCandidate);
    }
  } catch {
    for (const c of candidates) {
      result.set(c.id, people.map((p) => Math.round(estimateMins(haversineKm(p.from.lat, p.from.lng, c.lat, c.lng)))));
    }
  }

  return result;
}

export function scorePlace(
  placeLat: number,
  placeLng: number,
  placeId: string,
  people: PersonLocation[],
  realTimes?: number[]
): ScoredPlace {
  const scores: PersonScore[] = people.map((person, idx) => {
    const travelTimeMins = realTimes
      ? (realTimes[idx] ?? Math.round(estimateMins(haversineKm(person.from.lat, person.from.lng, placeLat, placeLng))))
      : Math.round(estimateMins(haversineKm(person.from.lat, person.from.lng, placeLat, placeLng)));

    let detourMins = 0;
    if (person.to) {
      const directMins = Math.round(estimateMins(haversineKm(person.from.lat, person.from.lng, person.to.lat, person.to.lng)));
      const viaMins = travelTimeMins + Math.round(estimateMins(haversineKm(placeLat, placeLng, person.to.lat, person.to.lng)));
      detourMins = Math.max(0, viaMins - directMins);
    }

    return { personId: person.id, personName: person.name, travelTimeMins, detourMins };
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
  people: PersonLocation[],
  travelTimes?: Map<string, number[]>
): ScoredPlace[] {
  return places
    .map((p) => scorePlace(p.lat, p.lng, p.id, people, travelTimes?.get(p.id)))
    .sort((a, b) => a.fairnessScore - b.fairnessScore);
}
