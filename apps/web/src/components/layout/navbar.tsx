"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// ----- Mobile menu toggle -----

function MobileMenuButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        )}
      </svg>
    </button>
  );
}

// ----- Theme toggle -----

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Cambiar tema"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
    </button>
  );
}

// ----- Breadcrumb -----

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  explore: "Explorar",
  campaigns: "Campanas",
  applications: "Aplicaciones",
  deals: "Deals",
  creators: "Creators",
  profile: "Mi Perfil",
  analytics: "Analytics",
  settings: "Configuracion",
  new: "Nueva",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);

        return (
          <span key={href} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ----- Navbar Component -----

export function Navbar() {
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <MobileMenuButton isOpen={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} />

      {/* Mobile logo */}
      <Link href="/dashboard" className="text-lg font-bold tracking-tight lg:hidden">
        Creator<span className="text-primary">Hub</span>
      </Link>

      {/* Breadcrumb (desktop) */}
      <div className="hidden flex-1 lg:block">
        <Breadcrumb />
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 lg:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button
          className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notificaciones"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <ThemeToggle />

        {/* Clerk user button */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            C
          </div>
          <span className="text-lg font-bold tracking-tight">
            Creator<span className="text-primary">Hub</span>
          </span>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {/* Mobile nav items rendered by parent - using event to close */}
          <p className="px-3 py-6 text-sm text-muted-foreground">
            Navegacion mobile via sidebar component
          </p>
        </nav>
      </div>
    </header>
  );
}
