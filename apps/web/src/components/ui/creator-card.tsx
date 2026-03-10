import Link from "next/link";
import { cn, formatNumber, getInitials } from "@/lib/utils";

export interface CreatorCardData {
  slug: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  categories: string[];
  platforms: string[];
  totalFollowers: number;
  avgEngagement: number;
  completedDeals: number;
  rating: number;
  hourlyRate?: number | null;
  country?: string | null;
  isVerified: boolean;
}

interface CreatorCardProps {
  creator: CreatorCardData;
  className?: string;
}

export function CreatorCard({ creator, className }: CreatorCardProps) {
  return (
    <Link
      href={`/creators/${creator.slug}`}
      className={cn(
        "group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.displayName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-border">
            {getInitials(creator.displayName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <svg
                className="h-4 w-4 shrink-0 text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {creator.country && (
            <p className="text-xs text-muted-foreground">{creator.country}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {creator.bio && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {creator.bio}
        </p>
      )}

      {/* Categories */}
      <div className="mt-3 flex flex-wrap gap-1">
        {creator.categories.slice(0, 3).map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div className="text-center">
          <p className="text-sm font-semibold">{formatNumber(creator.totalFollowers)}</p>
          <p className="text-[10px] text-muted-foreground">Seguidores</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{creator.avgEngagement.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">Engagement</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{creator.completedDeals}</p>
          <p className="text-[10px] text-muted-foreground">Deals</p>
        </div>
      </div>

      {/* Rating + Rate footer */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{creator.rating.toFixed(1)}</span>
        </div>
        {creator.hourlyRate && (
          <span className="font-semibold text-foreground">
            ${creator.hourlyRate}/hr
          </span>
        )}
      </div>
    </Link>
  );
}
