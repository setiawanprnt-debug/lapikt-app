export function toDatetimeLocalValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTanggalDisplay(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });
  }
  return value;
}

export function tanggalToDatetimeLocal(
  tanggal?: string,
  createdAt?: string
): string {
  if (createdAt) {
    const fromCreated = new Date(createdAt);
    if (!Number.isNaN(fromCreated.getTime())) {
      return toDatetimeLocalValue(fromCreated);
    }
  }
  if (tanggal) {
    const parsed = new Date(tanggal);
    if (!Number.isNaN(parsed.getTime())) {
      return toDatetimeLocalValue(parsed);
    }
  }
  return toDatetimeLocalValue();
}
