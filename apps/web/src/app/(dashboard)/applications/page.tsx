"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput, SelectFilter, Pagination } from "@/components/ui/search-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatRelativeDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

// ----- Types -----

interface ApplicationListItem {
  id: string;
  status: string;
  message: string | null;
  proposedRate: number | null;
  createdAt: string;
  campaign: {
    slug: string;
    title: string;
    brandName: string;
    brandLogo: string | null;
    budget: number;
    category: string;
  };
  creator: {
    slug: string;
    displayName: string;
    avatar: string | null;
    totalFollowers: number;
    avgEngagement: number;
    rating: number;
  };
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "SHORTLISTED", label: "Preseleccionadas" },
  { value: "ACCEPTED", label: "Aceptadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "WITHDRAWN", label: "Retiradas" },
];

// ----- Applications Page -----

export default function ApplicationsPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    async function fetchApplications() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/applications?${params}`);
        if (res.ok) {
          const json = await res.json();
          setApplications(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) fetchApplications();
  }, [searchParams, user]);

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const label =
        status === "ACCEPTED" ? "aceptada" :
        status === "SHORTLISTED" ? "preseleccionada" :
        status === "REJECTED" ? "rechazada" : "retirada";
      toast.success(`Aplicacion ${label}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
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
        <h1 className="text-2xl font-bold tracking-tight">Aplicaciones</h1>
        <p className="mt-1 text-muted-foreground">
          {user.isCreator
            ? "Seguimiento de tus postulaciones a campañas."
            : "Revisá y gestioná las aplicaciones de creators."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Buscar..." className="w-full sm:w-72" />
        <SelectFilter label="Estado" paramName="status" options={STATUS_OPTIONS} />
      </div>

      {/* Applications list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Campaign or Creator info depending on role */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.isCreator ? (
                    // Creator sees campaign info
                    <>
                      {app.campaign.brandLogo ? (
                        <img
                          src={app.campaign.brandLogo}
                          alt={app.campaign.brandName}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {app.campaign.brandName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/campaigns/${app.campaign.slug}`}
                          className="truncate font-medium hover:text-primary transition-colors"
                        >
                          {app.campaign.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{app.campaign.brandName}</span>
                          <span>-</span>
                          <span>{app.campaign.category}</span>
                          {app.proposedRate && (
                            <>
                              <span>-</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(app.proposedRate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Brand sees creator info
                    <>
                      {app.creator.avatar ? (
                        <img
                          src={app.creator.avatar}
                          alt={app.creator.displayName}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {getInitials(app.creator.displayName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/creators/${app.creator.slug}`}
                          className="truncate font-medium hover:text-primary transition-colors"
                        >
                          {app.creator.displayName}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{(app.creator.totalFollowers / 1000).toFixed(0)}K seg.</span>
                          <span>{app.creator.avgEngagement.toFixed(1)}% eng.</span>
                          <span>Rating: {app.creator.rating.toFixed(1)}</span>
                          <span>-</span>
                          <Link
                            href={`/campaigns/${app.campaign.slug}`}
                            className="hover:text-foreground"
                          >
                            {app.campaign.title}
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Status + Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {formatRelativeDate(app.createdAt)}
                  </span>
                  <StatusBadge status={app.status} />

                  {/* Brand actions */}
                  {user.isBrand && app.status === "PENDING" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAction(app.id, "SHORTLISTED")}
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Preseleccionar"
                      >
                        Pre
                      </button>
                      <button
                        onClick={() => handleAction(app.id, "ACCEPTED")}
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        title="Aceptar"
                      >
                        Si
                      </button>
                      <button
                        onClick={() => handleAction(app.id, "REJECTED")}
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        title="Rechazar"
                      >
                        No
                      </button>
                    </div>
                  )}
                  {user.isBrand && app.status === "SHORTLISTED" && (
                    <button
                      onClick={() => handleAction(app.id, "ACCEPTED")}
                      className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                    >
                      Aceptar
                    </button>
                  )}

                  {/* Creator can withdraw pending applications */}
                  {user.isCreator && app.status === "PENDING" && (
                    <button
                      onClick={() => handleAction(app.id, "WITHDRAWN")}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Retirar
                    </button>
                  )}
                </div>
              </div>

              {/* Message preview */}
              {app.message && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-1 pl-14">
                  {app.message}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            user.isCreator
              ? "No tenés aplicaciones"
              : "No hay aplicaciones"
          }
          description={
            user.isCreator
              ? "Explora campañas y aplica a las que te interesen."
              : "Cuando los creators apliquen a tus campañas, van a aparecer aca."
          }
          action={
            user.isCreator ? (
              <Link
                href="/explore"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Explorar Campañas
              </Link>
            ) : undefined
          }
        />
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
