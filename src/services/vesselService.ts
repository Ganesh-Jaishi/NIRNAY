// Vessel data service.
// Replace `fetchVessels()` with a real API call once VITE_VESSEL_API_URL is configured.
// The UI imports from this module so the data source can be swapped without touching components.

export interface VesselPosition {
  id: string;
  name: string;
  type: string;
  flag: string;
  iceClass: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedKnots: number;
  status: string;
  currentRouteId: string | null;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_VESSEL_API_URL as string | undefined;

export async function fetchVessels(): Promise<VesselPosition[]> {
  if (!API_URL) {
    // No external service configured — caller should use fallback data
    throw new Error('VITE_VESSEL_API_URL not configured');
  }
  const res = await fetch(`${API_URL}/vessels`);
  if (!res.ok) throw new Error(`Vessel API error: ${res.status}`);
  return res.json() as Promise<VesselPosition[]>;
}
