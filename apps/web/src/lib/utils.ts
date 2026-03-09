import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with proper precedence.
 * cn("px-4 py-2", condition && "bg-primary", "text-sm")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with locale-appropriate separators.
 * formatNumber(1234567) => "1.234.567" (es-AR)
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

/**
 * Format currency (defaults to USD).
 * formatCurrency(1500) => "US$1.500,00"
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date relative to now.
 * formatRelativeDate(date) => "hace 2 horas", "hace 3 días", etc.
 */
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHour < 24) return `hace ${diffHour}h`;
  if (diffDay < 7) return `hace ${diffDay}d`;
  if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)}sem`;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Generate initials from a name.
 * getInitials("Juan Perez") => "JP"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Status color mapping for campaigns, deals, applications.
 */
export const STATUS_COLORS: Record<string, string> = {
  // Campaign statuses
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/10 text-emerald-500",
  PAUSED: "bg-yellow-500/10 text-yellow-500",
  COMPLETED: "bg-blue-500/10 text-blue-500",
  CANCELLED: "bg-destructive/10 text-destructive",
  // Application statuses
  PENDING: "bg-yellow-500/10 text-yellow-500",
  SHORTLISTED: "bg-blue-500/10 text-blue-500",
  ACCEPTED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground",
  // Deal statuses
  NEGOTIATION: "bg-yellow-500/10 text-yellow-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  IN_REVIEW: "bg-purple-500/10 text-purple-500",
  DISPUTED: "bg-destructive/10 text-destructive",
};

/**
 * Status labels in Spanish.
 */
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  PENDING: "Pendiente",
  SHORTLISTED: "Preseleccionada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  WITHDRAWN: "Retirada",
  NEGOTIATION: "Negociacion",
  IN_PROGRESS: "En Progreso",
  IN_REVIEW: "En Revision",
  DISPUTED: "En Disputa",
};
