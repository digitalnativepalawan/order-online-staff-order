import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, subDays, subWeeks, subMonths,
} from "date-fns";

export type DateRange = { from: Date | null; to: Date | null };

export type PresetKey =
  | "today" | "yesterday" | "this_week" | "last_week"
  | "this_month" | "last_month" | "this_year" | "all_time" | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
];

export function getPresetRange(key: PresetKey): DateRange {
  const now = new Date();
  switch (key) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "this_week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "last_week": {
      const w = subWeeks(now, 1);
      return { from: startOfWeek(w, { weekStartsOn: 1 }), to: endOfWeek(w, { weekStartsOn: 1 }) };
    }
    case "this_month": return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const m = subMonths(now, 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    }
    case "this_year": return { from: startOfYear(now), to: endOfYear(now) };
    case "all_time":
    default:
      return { from: null, to: null };
  }
}
