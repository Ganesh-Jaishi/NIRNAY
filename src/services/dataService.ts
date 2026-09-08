// Data service abstraction layer.
// Each external service has a connection status derived from whether its
// environment variable is configured. When a real backend is wired up,
// replace the `fetchVessels`, `fetchIcebergs`, etc. stubs with real calls.

export type ConnectionStatus = 'CONNECTED' | 'UPDATING' | 'DEGRADED' | 'OFFLINE' | 'NOT_CONFIGURED' | 'OPERATIONAL';

export interface ServiceStatus {
  name: string;
  key: string;
  status: ConnectionStatus;
  lastSuccessAt: Date | null;
  errorMessage?: string;
}

// Determine if an env variable is configured (non-empty)
function isConfigured(envKey: string): boolean {
  const val = (import.meta.env[envKey] as string | undefined);
  return typeof val === 'string' && val.trim().length > 0;
}

// Build the status for each external data service
export function getServiceStatuses(): ServiceStatus[] {
  return [
    {
      name: 'AIS Vessel Feed',
      key: 'VITE_VESSEL_API_URL',
      status: isConfigured('VITE_VESSEL_API_URL') ? 'CONNECTED' : 'NOT_CONFIGURED',
      lastSuccessAt: null,
    },
    {
      name: 'Iceberg Tracking',
      key: 'VITE_ICEBERG_API_URL',
      status: isConfigured('VITE_ICEBERG_API_URL') ? 'CONNECTED' : 'NOT_CONFIGURED',
      lastSuccessAt: null,
    },
    {
      name: 'Sea-Ice Forecast',
      key: 'VITE_SEA_ICE_API_URL',
      status: isConfigured('VITE_SEA_ICE_API_URL') ? 'CONNECTED' : 'NOT_CONFIGURED',
      lastSuccessAt: null,
    },
    {
      name: 'Weather / Ocean',
      key: 'VITE_WEATHER_API_URL',
      status: isConfigured('VITE_WEATHER_API_URL') ? 'CONNECTED' : 'NOT_CONFIGURED',
      lastSuccessAt: null,
    },
    {
      name: 'Routing Engine',
      key: 'internal',
      status: 'OPERATIONAL',
      lastSuccessAt: new Date(),
    },
  ];
}

export function overallSystemStatus(services: ServiceStatus[]): ConnectionStatus {
  if (services.every((s) => s.status === 'OPERATIONAL' || s.status === 'CONNECTED')) return 'CONNECTED';
  if (services.some((s) => s.status === 'DEGRADED' || s.status === 'OFFLINE')) return 'DEGRADED';
  return 'NOT_CONFIGURED';
}

export const STATUS_DOT: Record<ConnectionStatus, string> = {
  CONNECTED:      'bg-emerald-400',
  OPERATIONAL:    'bg-emerald-400',
  UPDATING:       'bg-blue-400 animate-pulse',
  DEGRADED:       'bg-amber-400',
  OFFLINE:        'bg-red-500',
  NOT_CONFIGURED: 'bg-[#3a5a78]',
};

export const STATUS_TEXT: Record<ConnectionStatus, string> = {
  CONNECTED:      'CONNECTED',
  OPERATIONAL:    'OPERATIONAL',
  UPDATING:       'UPDATING',
  DEGRADED:       'DEGRADED',
  OFFLINE:        'OFFLINE',
  NOT_CONFIGURED: 'NOT CONFIGURED',
};

export const STATUS_COLOR: Record<ConnectionStatus, string> = {
  CONNECTED:      'text-emerald-400',
  OPERATIONAL:    'text-emerald-400',
  UPDATING:       'text-blue-400',
  DEGRADED:       'text-amber-400',
  OFFLINE:        'text-red-400',
  NOT_CONFIGURED: 'text-[#3a5a78]',
};
