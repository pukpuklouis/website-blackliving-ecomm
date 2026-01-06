export function normalizeToDatetimeLocal(val: unknown): string {
  if (!val) {
    return "";
  }
  try {
    let date: Date | null = null;
    if (typeof val === "number") {
      const ms = val < 1e12 ? val * 1000 : val;
      date = new Date(ms);
    } else if (typeof val === "string") {
      const d = new Date(val);
      date = Number.isNaN(d.getTime()) ? null : d;
    } else if (val instanceof Date) {
      date = val;
    }
    if (!date) {
      return "";
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

export function processDateField(dateStr: unknown): number | undefined {
  if (!dateStr || (typeof dateStr === "string" && dateStr.trim() === "")) {
    return;
  }
  try {
    const str = typeof dateStr === "string" ? dateStr : String(dateStr);
    const date = new Date(str);
    return Math.floor(date.getTime() / 1000);
  } catch {
    return;
  }
}
