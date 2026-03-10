"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

/**
 * Dashboard layout — wraps all authenticated pages.
 * Desktop: fixed sidebar + scrollable main area with sticky navbar.
 * Mobile: hamburger menu + full-width content.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-[var(--sidebar-width)]">
        <Navbar />

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
