import { useState, useEffect } from 'react';

export interface ClockState {
  local: Date;
  istString: string;       // e.g. "01 SEP 2026 · 22:34:18"
  istTime: string;         // e.g. "22:34:18"
  istDate: string;         // e.g. "01 SEP 2026"
  utcTime: string;         // e.g. "17:04:18"
  utcString: string;       // e.g. "17:04:18 UTC"
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function buildClockState(now: Date): ClockState {
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);

  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  const dd = pad(istDate.getUTCDate());
  const mon = months[istDate.getUTCMonth()];
  const yyyy = istDate.getUTCFullYear();
  const hh = pad(istDate.getUTCHours());
  const mm = pad(istDate.getUTCMinutes());
  const ss = pad(istDate.getUTCSeconds());

  const utcHH = pad(now.getUTCHours());
  const utcMM = pad(now.getUTCMinutes());
  const utcSS = pad(now.getUTCSeconds());

  return {
    local: now,
    istDate: `${dd} ${mon} ${yyyy}`,
    istTime: `${hh}:${mm}:${ss}`,
    istString: `${dd} ${mon} ${yyyy} · ${hh}:${mm}:${ss} IST`,
    utcTime: `${utcHH}:${utcMM}:${utcSS}`,
    utcString: `${utcHH}:${utcMM}:${utcSS} UTC`,
  };
}

export function useClock(): ClockState {
  const [clock, setClock] = useState<ClockState>(() => buildClockState(new Date()));

  useEffect(() => {
    const id = setInterval(() => setClock(buildClockState(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}
