import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {change && (
        <p
          className={cn("mt-1 text-xs font-medium", {
            "text-emerald-500": changeType === "positive",
            "text-destructive": changeType === "negative",
            "text-muted-foreground": changeType === "neutral",
          })}
        >
          {changeType === "positive" && "+"}
          {change}
        </p>
      )}
    </div>
  );
}
