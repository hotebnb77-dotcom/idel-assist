import type { ISODate } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date locale au format AAAA-MM-JJ (sans décalage UTC). */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function formatDateLong(iso: ISODate): string {
  const s = parseISODate(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateShort(iso: ISODate): string {
  return parseISODate(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Grille du mois commençant le lundi (cases null pour compléter). */
export function monthGrid(month: string): (ISODate | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const cells: (ISODate | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function minutes(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}
