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

export type DateRangeOption = 'Last 30 Days' | 'Last 6 Months' | 'Year 2025' | 'Year 2026' | 'All Time';

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
    case 'Year 2025':
      return d.getFullYear() === 2025;
    case 'Year 2026':
      return d.getFullYear() === 2026;
    default:
      return true; // All Time
  }
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
