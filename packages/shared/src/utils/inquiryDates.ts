/** Farba udalosti v kalendári – blokovanie voľna predajcu */
export const CALENDAR_COLOR_BLOCKED = 'blocked';
/** Potvrdená rezervácia / objednávka */
export const CALENDAR_COLOR_BOOKING = 'booking';

/** Sk formát môže byť 23.04.2026 alebo 23. 04. 2026 (toLocaleDateString s medzerami). */
const INQUIRY_BLOCK_RE =
  /---\s*(OBJEDNÁVKA|REZERVÁCIA)\s*---[\s\S]*?Od:\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})[\s\S]*?Do:\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/i;

function toIsoYmd(dd: string, mm: string, yyyy: string): string | null {
  const d = Number(dd);
  const m = Number(mm);
  const y = Number(yyyy);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Parsuje blok Od/Do z textu správy (formát z platformy pri objednávke/rezervácii). */
export function parseInquiryDateRangeYmd(
  content: string,
): { startYmd: string; endYmd: string } | null {
  const m = content.match(INQUIRY_BLOCK_RE);
  if (!m) return null;
  const startYmd = toIsoYmd(m[2], m[3], m[4]);
  const endYmd = toIsoYmd(m[5], m[6], m[7]);
  if (!startYmd || !endYmd || startYmd > endYmd) return null;
  return { startYmd, endYmd };
}

export function rangesOverlapYmd(
  a: { startYmd: string; endYmd: string },
  b: { startYmd: string; endYmd: string },
): boolean {
  return a.startYmd <= b.endYmd && b.startYmd <= a.endYmd;
}

/** Rozsah uložený v DB (date + voliteľný endDate), normalizovaný na YMD cez ISO UTC. */
export function ymdRangeFromStoredEvent(
  date: Date,
  endDate: Date | null | undefined,
): { startYmd: string; endYmd: string } {
  const startYmd = date.toISOString().slice(0, 10);
  const endYmd = (endDate ?? date).toISOString().slice(0, 10);
  return { startYmd, endYmd };
}

export function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Všetky kalendárne dni v uzavretom intervale [startYmd, endYmd] (lokálne dátumy). */
export function iterateYmdRangeLocal(startYmd: string, endYmd: string): string[] {
  const [ys, ms, ds] = startYmd.split('-').map(Number);
  const [ye, me, de] = endYmd.split('-').map(Number);
  const out: string[] = [];
  const t = new Date(ys, ms - 1, ds);
  const end = new Date(ye, me - 1, de);
  while (t <= end) {
    out.push(formatYmdLocal(t));
    t.setDate(t.getDate() + 1);
  }
  return out;
}
