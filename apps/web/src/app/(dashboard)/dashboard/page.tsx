"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatCard } from "@/components/ui/stat-card";
import { CampaignCard, type CampaignCardData } from "@/components/ui/campaign-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";

// ----- Types for dashboard data -----

interface DashboardStats {
  // Creator stats
  activeDeals?: number;
  pendingApplications?: number;
  totalEarnings?: number;
  avgRating?: number;
  // Brand stats
  activeCampaigns?: number;
  totalApplications?: number;
  totalSpent?: number;
  activeCreators?: number;
}

interface RecentActivity {
  id: string;
  type: "application" | "deal" | "campaign" | "message";
  title: string;
  description: string;
  status?: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentCampaigns: CampaignCardData[];
  recentActivity: RecentActivity[];
}

// ----- Dashboard Page -----

export default function DashboardPage() {
  const user = useCurrentUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hola, {user.firstName || "ahi"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user.isCreator && "Aca tenes un resumen de tu actividad como creador."}
          {user.isBrand && "Gestioná tus campañas y encontrá los mejores creadores."}
          {user.isAgency && "Administrá tu roster de creadores y campañas."}
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : user.isCreator ? (
        <CreatorStats stats={data?.stats} />
      ) : (
        <BrandStats stats={data?.stats} />
      )}

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {user.isCreator ? "Campañas Recomendadas" : "Tus Campañas Activas"}
            </h2>
            <Link
              href={user.isCreator ? "/explore" : "/campaigns"}
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          ) : data?.recentCampaigns && data.recentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {data.recentCampaigns.map((campaign) => (
                <CampaignCard key={campaign.slug} campaign={campaign} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                user.isCreator
                  ? "No hay campañas nuevas"
                  : "Todavía no creaste campañas"
              }
              description={
                user.isCreator
                  ? "Explora las campañas disponibles y aplica a las que te interesen."
                  : "Crea tu primera campaña para empezar a recibir aplicaciones de creadores."
              }
              action={
                <Link
                  href={user.isCreator ? "/explore" : "/campaigns/new"}
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {user.isCreator ? "Explorar Campañas" : "Crear Campaña"}
                </Link>
              }
            />
          )}
        </div>

        {/* Sidebar — Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Actividad Reciente</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-border bg-card"
                />
              ))}
            </div>
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {activity.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    {activity.status && (
                      <StatusBadge status={activity.status} />
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {formatRelativeDate(activity.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay actividad reciente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Acciones Rapidas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {user.isCreator ? (
            <>
              <QuickAction href="/explore" label="Explorar Campañas" description="Encontra campañas que matcheen con tu perfil" />
              <QuickAction href="/applications" label="Mis Aplicaciones" description="Revisa el estado de tus postulaciones" />
              <QuickAction href="/deals" label="Mis Deals" description="Gestiona tus acuerdos activos" />
              <QuickAction href="/profile" label="Editar Perfil" description="Actualiza tu portfolio y tarifas" />
            </>
          ) : (
            <>
              <QuickAction href="/campaigns/new" label="Nueva Campaña" description="Crea una campaña y recibí aplicaciones" />
              <QuickAction href="/applications" label="Aplicaciones" description="Revisa las postulaciones pendientes" />
              <QuickAction href="/creators" label="Buscar Creators" description="Explora el directorio de creadores" />
              <QuickAction href="/deals" label="Deals Activos" description="Seguimiento de acuerdos en curso" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ----- Sub-components -----

function CreatorStats({ stats }: { stats?: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Deals Activos"
        value={stats?.activeDeals ?? 0}
      />
      <StatCard
        label="Aplicaciones Pendientes"
        value={stats?.pendingApplications ?? 0}
      />
      <StatCard
        label="Ganancias Totales"
        value={formatCurrency(stats?.totalEarnings ?? 0)}
      />
      <StatCard
        label="Rating Promedio"
        value={stats?.avgRating?.toFixed(1) ?? "--"}
      />
    </div>
  );
}

function BrandStats({ stats }: { stats?: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Campañas Activas"
        value={stats?.activeCampaigns ?? 0}
      />
      <StatCard
        label="Aplicaciones Recibidas"
        value={stats?.totalApplications ?? 0}
      />
      <StatCard
        label="Gasto Total"
        value={formatCurrency(stats?.totalSpent ?? 0)}
      />
      <StatCard
        label="Creators Activos"
        value={stats?.activeCreators ?? 0}
      />
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
    >
      <p className="font-medium group-hover:text-primary transition-colors">
        {label}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
