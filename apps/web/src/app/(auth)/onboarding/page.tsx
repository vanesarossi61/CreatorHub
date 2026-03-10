"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type UserRole = "CREATOR" | "BRAND" | "AGENCY";

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "CREATOR",
    label: "Creador",
    description:
      "Soy streamer, YouTuber, tiktoker o creador de contenido y quiero conectar con marcas.",
    icon: "🎬",
  },
  {
    value: "BRAND",
    label: "Marca",
    description:
      "Represento una marca o empresa y busco creadores para campanas de marketing.",
    icon: "🏢",
  },
  {
    value: "AGENCY",
    label: "Agencia",
    description:
      "Soy una agencia de talentos o marketing que gestiona multiples creadores.",
    icon: "📊",
  },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedRole || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Update Clerk publicMetadata with role + onboarded flag
      await user.update({
        unsafeMetadata: {
          role: selectedRole,
        },
      });

      // 2. Call our API to create the user record in the database
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al completar el onboarding");
      }

      // 3. Reload session to pick up new metadata, then redirect
      await user.reload();
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Algo salio mal. Intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold">Elegí tu rol</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto personaliza tu experiencia en CreatorHub. Podés cambiarlo
          después.
        </p>

        <div className="mt-6 space-y-3">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50 ${
                selectedRole === role.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{role.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{role.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || isSubmitting}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Configurando..." : "Continuar"}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Al continuar, aceptás nuestros{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Términos de Servicio
        </a>{" "}
        y{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Política de Privacidad
        </a>
        .
      </p>
    </div>
  );
}
