"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

// ----- Navigation config by role -----

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: ("CREATOR" | "BRAND" | "AGENCY")[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["CREATOR", "BRAND", "AGENCY"],
  },
  {
    label: "Explorar",
    href: "/explore",
    icon: "Search",
    roles: ["CREATOR", "BRAND", "AGENCY"],
  },
  {
    label: "Mis Campañas",
    href: "/campaigns",
    icon: "Megaphone",
    roles: ["BRAND", "AGENCY"],
  },
  {
    label: "Campañas",
    href: "/campaigns",
    icon: "Megaphone",
    roles: ["CREATOR"],
  },
  {
    label: "Aplicaciones",
    href: "/applications",
    icon: "FileText",
    roles: ["CREATOR", "BRAND", "AGENCY"],
  },
  {
    label: "Deals",
    href: "/deals",
    icon: "Handshake",
    roles: ["CREATOR", "BRAND", "AGENCY"],
  },
  {
    label: "Creators",
    href: "/creators",
    icon: "Users",
    roles: ["BRAND", "AGENCY"],
  },
  {
    label: "Mi Perfil",
    href: "/profile",
    icon: "UserCircle",
    roles: ["CREATOR"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    roles: ["CREATOR", "BRAND", "AGENCY"],
    badge: "Pronto",
  },
  {
    label: "Configuración",
    href: "/settings",
    icon: "Settings",
    roles: ["CREATOR", "BRAND", "AGENCY"],
  },
];

// Icon mapping using simple SVG paths (avoids heavy icon library)
const ICONS: Record<string, string> = {
  LayoutDashboard:
    "M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 8h7v9h-7v-9zM3 15h7v5H3v-5z",
  Search:
    "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  Megaphone:
    "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  FileText:
    "M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2zM14 2v6h6M16 13H8m8 4H8m2-8H8",
  Handshake:
    "M11 17a1 1 0 001 1h2a1 1 0 001-1M7 10V7a5 5 0 0110 0v3M5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z",
  Users:
    "M15 19.128a9.38 9.38 0 002.625.372c3.314 0 6-2.015 6-4.5 0-.862-.393-1.664-1.079-2.332M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H9m6 0a5.972 5.972 0 00-.786-3.07M9 19.128A9.38 9.38 0 016.375 19.5C3.061 19.5.375 17.485.375 15c0-.862.393-1.664 1.079-2.332M9 19.128v-.003c0-1.113.285-2.16.786-3.07m0 0a5.97 5.97 0 014.428-2.555 5.97 5.97 0 014.428 2.555",
  UserCircle:
    "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
  BarChart3:
    "M18 20V10M12 20V4M6 20v-6",
  Settings:
    "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z",
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const path = ICONS[name] || ICONS.LayoutDashboard;
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

// ----- Sidebar Component -----

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-border bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          C
        </div>
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Creator<span className="text-primary">Hub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <NavIcon
                name={item.icon}
                className={isActive ? "text-primary" : undefined}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section — role badge */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">
              {user.fullName || user.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
