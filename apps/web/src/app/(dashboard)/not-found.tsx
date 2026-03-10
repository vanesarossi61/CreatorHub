// CreatorHub — Dashboard 404 Page
// Shown when a dashboard route doesn't match (Next.js App Router convention)

import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        {/* 404 illustration */}
        <div className="text-7xl font-black text-muted-foreground/20 mb-4">
          404
        </div>

        <h2 className="text-xl font-bold mb-2">Pagina no encontrada</h2>
        <p className="text-muted-foreground text-sm mb-6">
          La pagina que buscas no existe o fue movida.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/explore"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Explorar
          </Link>
        </div>
      </div>
    </div>
  );
}
