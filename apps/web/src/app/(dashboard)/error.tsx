"use client";

// CreatorHub — Dashboard Error Boundary
// Catches runtime errors in dashboard pages (Next.js App Router convention)

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (Sentry, etc.)
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2">Algo salio mal</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Ocurrio un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Detalles del error
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
