// Sea-ice concentration service stub.
// Wire VITE_SEA_ICE_API_URL to a real NIC/NSIDC/CMEMS endpoint.

export interface SeaIceGrid {
  zoneId: string;
  name: string;
  sicPercent: number;
  riskLevel: string;
  updatedAt: string;
  coords: Array<[number, number]>;
}

const API_URL = import.meta.env.VITE_SEA_ICE_API_URL as string | undefined;

export async function fetchSeaIceGrid(): Promise<SeaIceGrid[]> {
  if (!API_URL) {
    throw new Error('VITE_SEA_ICE_API_URL not configured');
  }
  const res = await fetch(`${API_URL}/sea-ice`);
  if (!res.ok) throw new Error(`Sea-ice API error: ${res.status}`);
  return res.json() as Promise<SeaIceGrid[]>;
}
