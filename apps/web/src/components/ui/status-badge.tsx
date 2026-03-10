import { cn, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  className,
  size = "sm",
}: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {label}
    </span>
  );
}
