"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

// ----- Types -----

interface CampaignDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  category: string;
  platforms: string[];
  budget: number;
  budgetSpent: number;
  ratePerCreator: number | null;
  maxCreators: number | null;
  requirements: string | null;
  deliverables: string | null;
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  brand: {
    name: string;
    logo: string | null;
    website: string | null;
  };
  _count: {
    applications: number;
    deals: number;
  };
}

interface ApplicationItem {
  id: string;
  status: string;
  message: string | null;
  proposedRate: number | null;
  createdAt: string;
  creator: {
    displayName: string;
    slug: string;
    avatar: string | null;
    totalFollowers: number;
    avgEngagement: number;
    rating: number;
  };
}

type Tab = "info" | "applications" | "deals";

// ----- Campaign Detail Page -----

export default function CampaignDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyRate, setApplyRate] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Fetch campaign detail
  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setCampaign(json.data);
        } else if (res.status === 404) {
          router.push("/campaigns");
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaign();
  }, [slug, router]);

  // Fetch applications when tab switches (brand only)
  useEffect(() => {
    async function fetchApplications() {
      if (!campaign) return;
      try {
        const res = await fetch(`/api/applications?campaignId=${campaign.id}`);
        if (res.ok) {
          const json = await res.json();
          setApplications(json.data || []);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
    }
    if (activeTab === "applications" && user?.isBrand) {
      fetchApplications();
    }
  }, [activeTab, campaign, user]);

  // Apply to campaign (creator only)
  const handleApply = async () => {
    if (!campaign) return;
    setIsApplying(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          message: applyMessage || undefined,
          proposedRate: applyRate ? Number(applyRate) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al aplicar");
      }
      toast.success("Aplicacion enviada exitosamente");
      setShowApplyForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar");
    } finally {
      setIsApplying(false);
    }
  };

  // Update application status (brand only)
  const handleApplicationAction = async (
    applicationId: string,
    status: string
  ) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(
        status === "ACCEPTED"
          ? "Creator aceptado — se creo el deal"
          : status === "SHORTLISTED"
          ? "Creator preseleccionado"
          : "Aplicacion rechazada"
      );
      // Refresh applications
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!campaign) return null;

  const isOwner = user?.isBrand; // Simplified — real check via API

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Volver a campañas
      </Link>

      {/* Campaign Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {campaign.brand.logo ? (
              <img
                src={campaign.brand.logo}
                alt={campaign.brand.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {campaign.brand.name[0]}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                {campaign.brand.name}
              </p>
              <h1 className="text-xl font-bold">{campaign.title}</h1>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={campaign.status} size="md" />
                <span className="text-sm text-muted-foreground">
                  Creada {formatRelativeDate(campaign.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          {user?.isCreator && campaign.status === "ACTIVE" && (
            <button
              onClick={() => setShowApplyForm(true)}
              className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Aplicar
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Presupuesto" value={formatCurrency(campaign.budget)} />
          <StatCard
            label="Tarifa / Creator"
            value={
              campaign.ratePerCreator
                ? formatCurrency(campaign.ratePerCreator)
                : "A definir"
            }
          />
          <StatCard label="Aplicaciones" value={campaign._count.applications} />
          <StatCard label="Deals Activos" value={campaign._count.deals} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: "info" as Tab, label: "Informacion" },
            ...(isOwner
              ? [
                  {
                    key: "applications" as Tab,
                    label: `Aplicaciones (${campaign._count.applications})`,
                  },
                  {
                    key: "deals" as Tab,
                    label: `Deals (${campaign._count.deals})`,
                  },
                ]
              : []),
          ] as { key: Tab; label: string }[]
        ).map((tab) => (
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
      {activeTab === "info" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {campaign.description}
              </p>
            </div>

            {campaign.requirements && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Requisitos</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {campaign.requirements}
                </p>
              </div>
            )}

            {campaign.deliverables && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Entregables</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {campaign.deliverables}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar details */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Detalles</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <DetailRow label="Categoria" value={campaign.category} />
                <DetailRow
                  label="Plataformas"
                  value={campaign.platforms.join(", ")}
                />
                <DetailRow
                  label="Max. Creators"
                  value={campaign.maxCreators?.toString() || "Sin limite"}
                />
                {campaign.targetAudience && (
                  <DetailRow label="Audiencia" value={campaign.targetAudience} />
                )}
                {campaign.startDate && (
                  <DetailRow
                    label="Inicio"
                    value={new Date(campaign.startDate).toLocaleDateString("es-AR")}
                  />
                )}
                {campaign.endDate && (
                  <DetailRow
                    label="Fin"
                    value={new Date(campaign.endDate).toLocaleDateString("es-AR")}
                  />
                )}
              </dl>
            </div>

            {/* Budget progress */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Presupuesto</h3>
              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastado</span>
                  <span className="font-medium">
                    {formatCurrency(campaign.budgetSpent)} /{" "}
                    {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        (campaign.budgetSpent / campaign.budget) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications tab (brand only) */}
      {activeTab === "applications" && isOwner && (
        <div className="space-y-3">
          {applications.length > 0 ? (
            applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {app.creator.avatar ? (
                    <img
                      src={app.creator.avatar}
                      alt={app.creator.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {app.creator.displayName[0]}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/creators/${app.creator.slug}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {app.creator.displayName}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{(app.creator.totalFollowers / 1000).toFixed(0)}K seguidores</span>
                      <span>{app.creator.avgEngagement.toFixed(1)}% eng.</span>
                      <span>Rating: {app.creator.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  {app.status === "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          handleApplicationAction(app.id, "SHORTLISTED")
                        }
                        className="rounded-md bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/20 transition-colors"
                      >
                        Preseleccionar
                      </button>
                      <button
                        onClick={() =>
                          handleApplicationAction(app.id, "ACCEPTED")
                        }
                        className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() =>
                          handleApplicationAction(app.id, "REJECTED")
                        }
                        className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {app.status === "SHORTLISTED" && (
                    <button
                      onClick={() =>
                        handleApplicationAction(app.id, "ACCEPTED")
                      }
                      className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                    >
                      Aceptar
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin aplicaciones todavia"
              description="Cuando los creadores apliquen a tu campaña, van a aparecer aca."
            />
          )}
        </div>
      )}

      {/* Deals tab placeholder */}
      {activeTab === "deals" && (
        <EmptyState
          title="Deals de esta campaña"
          description="Los deals se crean automaticamente cuando aceptas una aplicacion."
          action={
            <Link
              href="/deals"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ver todos los deals
            </Link>
          }
        />
      )}

      {/* Apply Modal (creator only) */}
      {showApplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Aplicar a {campaign.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Contale a la marca por que sos el creator ideal para esta campaña.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Por que querés participar en esta campaña..."
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Tarifa propuesta (USD)
                </label>
                <input
                  type="number"
                  value={applyRate}
                  onChange={(e) => setApplyRate(e.target.value)}
                  placeholder={campaign.ratePerCreator?.toString() || "500"}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowApplyForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isApplying ? "Enviando..." : "Enviar Aplicacion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Detail Row helper -----

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
