"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CampaignCard, type CampaignCardData } from "@/components/ui/campaign-card";
import { SearchInput, SelectFilter, Pagination } from "@/components/ui/search-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activas" },
  { value: "DRAFT", label: "Borradores" },
  { value: "PAUSED", label: "Pausadas" },
  { value: "COMPLETED", label: "Completadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

export default function CampaignsPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    async function fetchCampaigns() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        // For brands, fetch only their campaigns
        if (user?.isBrand) params.set("mine", "true");

        const res = await fetch(`/api/campaigns?${params}`);
        if (res.ok) {
          const json = await res.json();
          setCampaigns(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          if (json.stats) setStats(json.stats);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) fetchCampaigns();
  }, [searchParams, user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.isBrand ? "Mis Campañas" : "Campañas"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {user.isBrand
              ? "Gestioná tus campañas y revisá las aplicaciones."
              : "Encontrá campañas que matcheen con tu perfil."}
          </p>
        </div>
        {user.isBrand && (
          <Link
            href="/campaigns/new"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Campaña
          </Link>
        )}
      </div>

      {/* Stats (brand only) */}
      {user.isBrand && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Activas" value={stats.active} />
          <StatCard label="Borradores" value={stats.draft} />
          <StatCard label="Completadas" value={stats.completed} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Buscar campañas..." className="w-full sm:w-72" />
        <SelectFilter label="Estado" paramName="status" options={STATUS_OPTIONS} />
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard key={c.slug} campaign={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={user.isBrand ? "No tenés campañas" : "No hay campañas"}
          description={
            user.isBrand
              ? "Creá tu primera campaña para empezar a recibir postulaciones."
              : "No se encontraron campañas con estos filtros."
          }
          action={
            user.isBrand ? (
              <Link
                href="/campaigns/new"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Crear Campaña
              </Link>
            ) : undefined
          }
        />
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
