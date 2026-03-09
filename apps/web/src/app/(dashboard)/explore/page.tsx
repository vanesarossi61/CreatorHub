"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CampaignCard, type CampaignCardData } from "@/components/ui/campaign-card";
import { CreatorCard, type CreatorCardData } from "@/components/ui/creator-card";
import { SearchInput, SelectFilter, ActiveFilters, Pagination } from "@/components/ui/search-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Tab = "campaigns" | "creators";

// ----- Filter options -----

const CATEGORY_OPTIONS = [
  { value: "GAMING", label: "Gaming" },
  { value: "LIFESTYLE", label: "Lifestyle" },
  { value: "TECH", label: "Tecnologia" },
  { value: "BEAUTY", label: "Belleza" },
  { value: "FITNESS", label: "Fitness" },
  { value: "FOOD", label: "Comida" },
  { value: "MUSIC", label: "Musica" },
  { value: "EDUCATION", label: "Educacion" },
  { value: "ENTERTAINMENT", label: "Entretenimiento" },
  { value: "SPORTS", label: "Deportes" },
];

const PLATFORM_OPTIONS = [
  { value: "TWITCH", label: "Twitch" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter/X" },
  { value: "KICK", label: "Kick" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mas Recientes" },
  { value: "budget_desc", label: "Mayor Presupuesto" },
  { value: "budget_asc", label: "Menor Presupuesto" },
  { value: "popular", label: "Mas Populares" },
];

const CREATOR_SORT_OPTIONS = [
  { value: "rating", label: "Mejor Rating" },
  { value: "followers", label: "Mas Seguidores" },
  { value: "engagement", label: "Mayor Engagement" },
  { value: "deals", label: "Mas Deals" },
  { value: "rate_asc", label: "Menor Tarifa" },
  { value: "rate_desc", label: "Mayor Tarifa" },
];

// ----- Explore Page -----

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "campaigns"
  );
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [creators, setCreators] = useState<CreatorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = Number(searchParams.get("page")) || 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");

      const endpoint =
        activeTab === "campaigns"
          ? `/api/campaigns?${params}`
          : `/api/creators?${params}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (activeTab === "campaigns") {
          setCampaigns(json.data || []);
        } else {
          setCreators(json.data || []);
        }
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Explore fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explorar</h1>
        <p className="mt-1 text-muted-foreground">
          Descubri campañas y creadores que se ajusten a lo que buscas.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "campaigns"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Campañas
        </button>
        <button
          onClick={() => setActiveTab("creators")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "creators"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Creators
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={
            activeTab === "campaigns"
              ? "Buscar campañas..."
              : "Buscar creators..."
          }
          className="w-full sm:w-72"
        />
        <SelectFilter
          label="Categoria"
          paramName="category"
          options={CATEGORY_OPTIONS}
        />
        <SelectFilter
          label="Plataforma"
          paramName="platform"
          options={PLATFORM_OPTIONS}
        />
        <SelectFilter
          label="Ordenar por"
          paramName="sort"
          options={
            activeTab === "campaigns" ? SORT_OPTIONS : CREATOR_SORT_OPTIONS
          }
        />
      </div>

      {/* Active filters */}
      <ActiveFilters />

      {/* Results */}
      {isLoading ? (
        <div
          className={cn(
            "grid gap-4",
            activeTab === "campaigns"
              ? "sm:grid-cols-1 lg:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : activeTab === "campaigns" ? (
        campaigns.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {campaigns.map((c) => (
              <CampaignCard key={c.slug} campaign={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No se encontraron campañas"
            description="Intenta cambiar los filtros o buscar con otros terminos."
          />
        )
      ) : creators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <CreatorCard key={c.slug} creator={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No se encontraron creators"
          description="Intenta cambiar los filtros o buscar con otros terminos."
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        className="pt-4"
      />
    </div>
  );
}
