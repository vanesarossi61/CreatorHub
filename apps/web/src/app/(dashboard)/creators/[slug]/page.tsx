"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatNumber, formatCurrency, getInitials } from "@/lib/utils";

// ----- Types -----

interface CreatorProfile {
  id: string;
  slug: string;
  displayName: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  longBio: string | null;
  categories: string[];
  platforms: string[];
  totalFollowers: number;
  avgEngagement: number;
  completedDeals: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number | null;
  country: string | null;
  city: string | null;
  languages: string[];
  skills: string[];
  isVerified: boolean;
  socials: {
    platform: string;
    url: string;
    username: string;
    followers: number;
  }[];
  portfolio: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    url: string;
    type: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    brandName: string;
    brandLogo: string | null;
    createdAt: string;
  }[];
}

type Tab = "about" | "portfolio" | "reviews";

// ----- Creator Profile Page -----

export default function CreatorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setCreator(json.data);
        } else if (res.status === 404) {
          router.push("/creators");
        }
      } catch (err) {
        console.error("Error fetching creator:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCreator();
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/creators"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Volver
      </Link>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20">
          {creator.banner && (
            <img
              src={creator.banner}
              alt="Banner"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
            <div className="flex items-end gap-4">
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.displayName}
                  className="h-20 w-20 rounded-full border-4 border-card object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-xl font-bold text-primary shadow-lg">
                  {getInitials(creator.displayName)}
                </div>
              )}
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{creator.displayName}</h1>
                  {creator.isVerified && (
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {creator.country && <span>{creator.city ? `${creator.city}, ` : ""}{creator.country}</span>}
                  {creator.hourlyRate && (
                    <>
                      <span>-</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(creator.hourlyRate)}/hr
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <button className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Contactar
            </button>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {creator.bio}
            </p>
          )}

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {creator.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {cat}
              </span>
            ))}
            {creator.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Seguidores" value={formatNumber(creator.totalFollowers)} />
        <StatCard label="Engagement" value={`${creator.avgEngagement.toFixed(1)}%`} />
        <StatCard label="Deals Completados" value={creator.completedDeals} />
        <StatCard
          label="Rating"
          value={`${creator.rating.toFixed(1)} (${creator.reviewCount})`}
        />
        <StatCard label="Idiomas" value={creator.languages.join(", ") || "--"} />
      </div>

      {/* Social links */}
      {creator.socials.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Redes Sociales</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creator.socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                  {social.platform[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    @{social.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {social.platform} - {formatNumber(social.followers)} seg.
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: "about" as Tab, label: "Sobre mi" },
          { key: "portfolio" as Tab, label: `Portfolio (${creator.portfolio.length})` },
          { key: "reviews" as Tab, label: `Reviews (${creator.reviewCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "about" && (
        <div className="rounded-xl border border-border bg-card p-6">
          {creator.longBio ? (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap leading-relaxed">{creator.longBio}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este creator todavia no agrego una descripcion detallada.
            </p>
          )}
        </div>
      )}

      {activeTab === "portfolio" && (
        creator.portfolio.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creator.portfolio.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
              >
                {item.thumbnailUrl ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.type}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin portfolio todavia"
            description="Este creator no subio contenido a su portfolio."
          />
        )
      )}

      {activeTab === "reviews" && (
        creator.reviews.length > 0 ? (
          <div className="space-y-4">
            {creator.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {review.brandLogo ? (
                      <img
                        src={review.brandLogo}
                        alt={review.brandName}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {review.brandName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{review.brandName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < review.rating ? "text-yellow-500" : "text-muted"
                        )}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin reviews todavia"
            description="Este creator todavia no recibio reviews de marcas."
          />
        )
      )}
    </div>
  );
}
