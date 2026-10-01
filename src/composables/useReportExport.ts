// Shared by every audience-facing report/export tool (Researcher Report,
// and the admin's own CSV/GeoJSON exports) — one CSV builder, one download
// trigger, one date-range filter, so each report only has to decide *which*
// rows and columns go in, not *how* a CSV gets built or downloaded.
export function toCsv(rows: Record<string, unknown>[], headers: { label: string; field: string }[]): string {
  const escape = (v: unknown) => {
    const str = v === null || v === undefined ? '' : String(v as string | number | boolean);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map((h) => escape(h.label)).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h.field])).join(','));
  }
  return lines.join('\n');
}

export function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// 'Year 2025', 'Year 2026', … — a template literal type rather than one
// hardcoded literal per year, since the fixed list used to be exactly that
// (stuck at 'Year 2025' | 'Year 2026', defined independently in 3 files) and
// just went stale once 2027 actually arrived. See buildYearRangeOptions
// below for how the real list gets generated.
export type DateRangeOption = 'Last 30 Days' | 'Last 6 Months' | 'All Time' | `Year ${number}`;

export function withinDateRange(dateStr: string | undefined, range: DateRangeOption): boolean {
  if (!dateStr) return range === 'All Time';
  const d = new Date(dateStr);
  switch (range) {
    case 'Last 30 Days': {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    }
    case 'Last 6 Months': {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);
      return d >= cutoff;
    }
    case 'All Time':
      return true;
    default: {
      // range is `Year ${number}` here (e.g. "Year 2027") — matched
      // generically instead of one switch case per year.
      const year = Number(range.slice('Year '.length));
      return d.getFullYear() === year;
    }
  }
}

// Builds the date-range dropdown's options, spanning from the platform's
// sampling start year through whichever year it actually is right now —
// computed fresh on every call instead of a list someone has to remember to
// extend by hand each January.
export function buildYearRangeOptions(startYear: number): DateRangeOption[] {
  const currentYear = new Date().getFullYear();
  const endYear = Math.max(startYear, currentYear);
  const years: DateRangeOption[] = [];
  for (let y = endYear; y >= startYear; y--) years.push(`Year ${y}`);
  return ['Last 30 Days', 'Last 6 Months', ...years, 'All Time'];
}

// ── Per-viewer "recent downloads" history ──
// No server-side artifact exists for a client-generated CSV blob, so this
// tracks *that a report was generated* (label + when), not the file itself.
// Keyed per report tool (e.g. "researcher-report") so different tools don't
// clobber each other's history, and scoped to this browser only.
export interface RecentReportEntry {
  id: string;
  label: string;
  timestamp: string;
}

const MAX_RECENT = 10;

export function loadRecentReports(storageKey: string): RecentReportEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RecentReportEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentReport(storageKey: string, label: string): RecentReportEntry[] {
  const entry: RecentReportEntry = { id: `${Date.now()}`, label, timestamp: new Date().toISOString() };
  const updated = [entry, ...loadRecentReports(storageKey)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    // Private browsing / storage disabled — the download itself still succeeded, just isn't remembered.
  }
  return updated;
}
