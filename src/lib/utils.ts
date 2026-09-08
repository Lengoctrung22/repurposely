import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Escapes special regular expression characters to prevent ReDoS and regex injection.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Sanitizes CSV cell values to neutralize CSV / Formula Injection (CWE-1236).
 */
export function sanitizeCsvCell(val: unknown): string {
  const str = String(val ?? "").replace(/"/g, '""');
  // If the cell begins with formula triggers, prepend a single quote to treat as text in Excel/Sheets
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str}"`;
  }
  return `"${str}"`;
}
