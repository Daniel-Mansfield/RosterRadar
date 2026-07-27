/** Parse BALLDONTLIE / box-score minute strings (`"32:30"`, `"00"`) to decimal minutes. */
export function parseMinutes(
  value: string | number | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw || raw === "00" || raw === "0") return 0;
  if (raw.includes(":")) {
    const [m, s] = raw.split(":");
    const minutes = Number(m);
    const seconds = Number(s);
    if (!Number.isFinite(minutes)) return 0;
    return minutes + (Number.isFinite(seconds) ? seconds / 60 : 0);
  }
  const asNum = Number(raw);
  return Number.isFinite(asNum) ? asNum : 0;
}
