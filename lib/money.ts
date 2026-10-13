export const toKobo = (naira: string) => {
  const cleaned = String(naira).replace(/,/g, "").trim();
  const val = parseFloat(cleaned);
  return Number.isFinite(val) ? Math.round(val * 100) : 0;
};

export const formatNaira = (kobo: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Number(kobo) / 100);

export const formatTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function getLagosDatetimeLocal(): string {
  const now = new Date();
  // Lagos is always UTC+1
  const lagosOffsetMs = 60 * 60 * 1000;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const lagosDate = new Date(utcMs + lagosOffsetMs);

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = lagosDate.getFullYear();
  const mm = pad(lagosDate.getMonth() + 1);
  const dd = pad(lagosDate.getDate());
  const hh = pad(lagosDate.getHours());
  const min = pad(lagosDate.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
