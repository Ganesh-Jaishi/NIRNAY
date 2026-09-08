// Weather / ocean conditions service stub.
// Wire VITE_WEATHER_API_URL to a real ECMWF/NOAA GFS/Copernicus endpoint.

export interface WeatherSnapshot {
  timestamp: string;
  windSpeedKmh: number;
  windDirectionDeg: number;
  waveHeightM: number;
  seaSurfaceTempC: number;
  airTempC: number;
  pressureHPa: number;
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  sicPercent: number;
}

const API_URL = import.meta.env.VITE_WEATHER_API_URL as string | undefined;

export async function fetchWeather(): Promise<WeatherSnapshot> {
  if (!API_URL) {
    throw new Error('VITE_WEATHER_API_URL not configured');
  }
  const res = await fetch(`${API_URL}/weather/current`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json() as Promise<WeatherSnapshot>;
}
