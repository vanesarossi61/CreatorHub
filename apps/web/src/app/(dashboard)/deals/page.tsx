"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { SearchInput, SelectFilter, Pagination } from "@/components/ui/search-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatRelativeDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

// ----- Types -----

interface DealListItem {
  id: string;
  status: string;
  agreedRate: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
  campaign: {
    slug: string;
    title: string;
    category: string;
  };
  creator: {
    slug: string;
    displayName: string;
    avatar: string | null;
  };
  brand: {
    name: string;
    logo: string | null;
  };
}

interface DealStats {
  total: number;
  active: number;
  completed: number;
  totalValue: number;
}

const STATUS_OPTIONS = [
  { value: "NEGOTIATION", label: "Negociacion" },
  { value: "ACTIVE", label: "Activos" },
  { value: "IN_PROGRESS", label: "En Progreso" },
  { value: "IN_REVIEW", label: "En Revision" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "DISPUTED", label: "En Disputa" },
];

// Valid transitions per status
const DEAL_ACTIONS: Record<string, { label: string; status: string; color: string }[]> = {
  NEGOTIATION: [
    { label: "Activar", status: "ACTIVE", color: "text-emerald-500 hover:bg-emerald-500/10" },
    { label: "Cancelar", status: "CANCELLED", color: "text-destructive hover:bg-destructive/10" },
  ],
  ACTIVE: [
    { label: "Iniciar Trabajo", status: "IN_PROGRESS", color: "text-blue-500 hover:bg-blue-500/10" },
    { label: "Cancelar", status: "CANCELLED", color: "text-destructive hover:bg-destructive/10" },
  ],
  IN_PROGRESS: [
    { label: "Enviar a Revision", status: "IN_REVIEW", color: "text-purple-500 hover:bg-purple-500/10" },
  ],
  IN_REVIEW: [
    { label: "Aprobar y Completar", status: "COMPLETED", color: "text-emerald-500 hover:bg-emerald-500/10" },
    { label: "Pedir Cambios", status: "IN_PROGRESS", color: "text-yellow-500 hover:bg-yellow-500/10" },
    { label: "Disputar", status: "DISPUTED", color: "text-destructive hover:bg-destructive/10" },
  ],
};

// ----- Deals Page -----

export default function DealsPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<DealListItem[]>([]);
  const [stats, setStats] = useState<DealStats>({ total: 0, active: 0, completed: 0, totalValue: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    async function fetchDeals() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/deals?${params}`);
        if (res.ok) {
          const json = await res.json();
          setDeals(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          if (json.stats) setStats(json.stats);
        }
      } catch (err) {
        console.error("Error fetching deals:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) fetchDeals();
  }, [searchParams, user]);

  const handleStatusChange = async (dealId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }
      toast.success("Deal actualizado");
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
        <p className="mt-1 text-muted-foreground">
          {user.isCreator
            ? "Gestiona tus acuerdos activos con marcas."
            : "Seguimiento de acuerdos con creators."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Deals" value={stats.total} />
        <StatCard label="Activos" value={stats.active} />
        <StatCard label="Completados" value={stats.completed} />
        <StatCard
          label={user.isCreator ? "Ganancias" : "Invertido"}
          value={formatCurrency(stats.totalValue)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Buscar deals..." className="w-full sm:w-72" />
        <SelectFilter label="Estado" paramName="status" options={STATUS_OPTIONS} />
      </div>

      {/* Deals list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : deals.length > 0 ? (
        <div className="space-y-3">
          {deals.map((deal) => {
            const isExpanded = expandedId === deal.id;
            const actions = DEAL_ACTIONS[deal.status] || [];
            // Creator sees brand info, brand sees creator info
            const counterparty = user.isCreator
              ? { name: deal.brand.name, avatar: deal.brand.logo, href: null }
              : { name: deal.creator.displayName, avatar: deal.creator.avatar, href: `/creators/${deal.creator.slug}` };

            return (
              <div
                key={deal.id}
                className="rounded-xl border border-border bg-card transition-colors hover:bg-muted/30"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : deal.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {counterparty.avatar ? (
                      <img
                        src={counterparty.avatar}
                        alt={counterparty.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {getInitials(counterparty.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{counterparty.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link
                          href={`/campaigns/${deal.campaign.slug}`}
                          className="hover:text-foreground truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deal.campaign.title}
                        </Link>
                        <span>-</span>
                        <span>{deal.campaign.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm font-semibold sm:inline">
                      {formatCurrency(deal.agreedRate)}
                    </span>
                    <StatusBadge status={deal.status} />
                    <svg
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 animate-in">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <DetailItem label="Tarifa Acordada" value={formatCurrency(deal.agreedRate)} />
                      <DetailItem label="Total Pagado" value={formatCurrency(deal.totalPaid)} />
                      <DetailItem label="Creado" value={formatRelativeDate(deal.createdAt)} />
                      <DetailItem label="Actualizado" value={formatRelativeDate(deal.updatedAt)} />
                    </div>

                    {/* Timeline - status progression */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Progreso</p>
                      <div className="flex items-center gap-1">
                        {["NEGOTIATION", "ACTIVE", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"].map((step, i) => {
                          const stepOrder = ["NEGOTIATION", "ACTIVE", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"];
                          const currentOrder = stepOrder.indexOf(deal.status);
                          const thisOrder = stepOrder.indexOf(step);
                          const isCurrent = deal.status === step;
                          const isPast = thisOrder < currentOrder;
                          const isCancelled = deal.status === "CANCELLED" || deal.status === "DISPUTED";

                          return (
                            <div key={step} className="flex items-center gap-1 flex-1">
                              <div
                                className={cn(
                                  "h-2 flex-1 rounded-full",
                                  isCancelled
                                    ? "bg-destructive/30"
                                    : isPast || isCurrent
                                    ? "bg-primary"
                                    : "bg-muted"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    {actions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() => handleStatusChange(deal.id, action.status)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              action.color
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="mt-3 flex gap-3 text-xs">
                      <Link
                        href={`/campaigns/${deal.campaign.slug}`}
                        className="text-primary hover:underline"
                      >
                        Ver Campaña
                      </Link>
                      {counterparty.href && (
                        <Link
                          href={counterparty.href}
                          className="text-primary hover:underline"
                        >
                          Ver Perfil
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No tenés deals"
          description={
            user.isCreator
              ? "Aplica a campañas para empezar a generar deals."
              : "Acepta aplicaciones de creators para crear deals."
          }
          action={
            <Link
              href={user.isCreator ? "/explore" : "/applications"}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {user.isCreator ? "Explorar Campañas" : "Ver Aplicaciones"}
            </Link>
          }
        />
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}

// ----- Helper -----

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
