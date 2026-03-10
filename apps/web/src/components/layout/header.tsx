"use client";

import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-64 rounded-lg border bg-muted/50 px-3 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            [Q]
          </span>
        </div>

        {/* Notifications */}
        <button className="relative h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
          <span className="text-xs">[bell]</span>
          {/* Unread badge — show when count > 0 */}
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </button>

        {/* Theme toggle placeholder */}
        <button className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
          <span className="text-xs">[sun]</span>
        </button>

        {/* User menu — will be replaced with Clerk UserButton in Fase 3 */}
        <Link
          href="/settings/profile"
          className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
        >
          <span className="text-xs font-medium text-primary">U</span>
        </Link>
      </div>
    </header>
  );
}
