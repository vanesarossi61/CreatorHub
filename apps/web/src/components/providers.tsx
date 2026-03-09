"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

// ClerkProvider is in app/layout.tsx (server component) wrapping this.
// This file handles client-side providers only.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
