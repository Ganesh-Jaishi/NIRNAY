// Iceberg tracking service stub.
// Wire VITE_ICEBERG_API_URL to a real endpoint to receive live positions.

export interface IcebergPosition {
  id: string;
  latitude: number;
  longitude: number;
  headingDeg: number;
  speedKnots: number;
  sizeKm2: number;
  riskLevel: string;
  nearestRouteId: string | null;
  nearestRouteDistKm: number;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_ICEBERG_API_URL as string | undefined;

export async function fetchIcebergs(): Promise<IcebergPosition[]> {
  if (!API_URL) {
    throw new Error('VITE_ICEBERG_API_URL not configured');
  }
  const res = await fetch(`${API_URL}/icebergs`);
  if (!res.ok) throw new Error(`Iceberg API error: ${res.status}`);
  return res.json() as Promise<IcebergPosition[]>;
}
