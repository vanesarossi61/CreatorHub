import Link from "next/link";
import { cn, formatCurrency, formatRelativeDate, truncate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export interface CampaignCardData {
  slug: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  category: string;
  platforms: string[];
  brandName: string;
  brandLogo?: string | null;
  applicationsCount: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

interface CampaignCardProps {
  campaign: CampaignCardData;
  className?: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  TWITCH: "Twitch",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter/X",
  KICK: "Kick",
};

export function CampaignCard({ campaign, className }: CampaignCardProps) {
  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className={cn(
        "group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Header: Brand + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {campaign.brandLogo ? (
            <img
              src={campaign.brandLogo}
              alt={campaign.brandName}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {campaign.brandName[0]}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">{campaign.brandName}</p>
            <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
              {campaign.title}
            </h3>
          </div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        {truncate(campaign.description, 120)}
      </p>

      {/* Tags: Category + Platforms */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {campaign.category}
        </span>
        {campaign.platforms.slice(0, 3).map((p) => (
          <span
            key={p}
            className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {PLATFORM_ICONS[p] || p}
          </span>
        ))}
        {campaign.platforms.length > 3 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            +{campaign.platforms.length - 3}
          </span>
        )}
      </div>

      {/* Footer: Budget + Applications + Date */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">
            {formatCurrency(campaign.budget)}
          </span>
          <span>{campaign.applicationsCount} aplicaciones</span>
        </div>
        <span>{formatRelativeDate(campaign.createdAt)}</span>
      </div>
    </Link>
  );
}
