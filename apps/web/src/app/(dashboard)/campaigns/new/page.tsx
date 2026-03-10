"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ----- Form types -----

interface CampaignForm {
  title: string;
  description: string;
  category: string;
  platforms: string[];
  budget: string;
  ratePerCreator: string;
  maxCreators: string;
  requirements: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  status: "DRAFT" | "ACTIVE";
}

const INITIAL_FORM: CampaignForm = {
  title: "",
  description: "",
  category: "",
  platforms: [],
  budget: "",
  ratePerCreator: "",
  maxCreators: "",
  requirements: "",
  deliverables: "",
  startDate: "",
  endDate: "",
  targetAudience: "",
  status: "DRAFT",
};

const CATEGORIES = [
  "GAMING",
  "LIFESTYLE",
  "TECH",
  "BEAUTY",
  "FITNESS",
  "FOOD",
  "MUSIC",
  "EDUCATION",
  "ENTERTAINMENT",
  "SPORTS",
  "FINANCE",
  "TRAVEL",
];

const PLATFORMS = [
  { value: "TWITCH", label: "Twitch" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter/X" },
  { value: "KICK", label: "Kick" },
];

// ----- New Campaign Page -----

export default function NewCampaignPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [form, setForm] = useState<CampaignForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect creators — only brands/agencies can create campaigns
  if (user && user.isCreator) {
    router.push("/campaigns");
    return null;
  }

  const updateField = <K extends keyof CampaignForm>(
    field: K,
    value: CampaignForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = "El titulo es obligatorio";
    if (!form.description.trim()) newErrors.description = "La descripcion es obligatoria";
    if (!form.category) newErrors.category = "Selecciona una categoria";
    if (form.platforms.length === 0) newErrors.platforms = "Selecciona al menos una plataforma";
    if (!form.budget || Number(form.budget) <= 0) newErrors.budget = "Ingresa un presupuesto valido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          ratePerCreator: form.ratePerCreator ? Number(form.ratePerCreator) : undefined,
          maxCreators: form.maxCreators ? Number(form.maxCreators) : undefined,
          status: publishNow ? "ACTIVE" : "DRAFT",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la campaña");
      }

      const { data } = await res.json();
      toast.success(
        publishNow ? "Campaña publicada exitosamente" : "Borrador guardado"
      );
      router.push(`/campaigns/${data.slug}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear la campaña"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Campaña</h1>
        <p className="mt-1 text-muted-foreground">
          Completa los datos de tu campaña. Podes guardarla como borrador o publicarla directamente.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <FormField label="Titulo" error={errors.title} required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Ej: Campaña de lanzamiento - Nuevo producto Gaming"
            className="form-input"
            maxLength={120}
          />
        </FormField>

        {/* Description */}
        <FormField label="Descripcion" error={errors.description} required>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe tu campaña, objetivos y que esperas de los creadores..."
            className="form-input min-h-[120px] resize-y"
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.description.length}/2000
          </p>
        </FormField>

        {/* Category + Budget row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Categoria" error={errors.category} required>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="form-input"
            >
              <option value="">Seleccionar categoria</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Presupuesto Total (USD)" error={errors.budget} required>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => updateField("budget", e.target.value)}
              placeholder="5000"
              min={0}
              className="form-input"
            />
          </FormField>
        </div>

        {/* Platforms */}
        <FormField label="Plataformas" error={errors.platforms} required>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                  form.platforms.includes(p.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Rate + Max Creators row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tarifa por Creator (USD)">
            <input
              type="number"
              value={form.ratePerCreator}
              onChange={(e) => updateField("ratePerCreator", e.target.value)}
              placeholder="500"
              min={0}
              className="form-input"
            />
          </FormField>

          <FormField label="Max. Creators">
            <input
              type="number"
              value={form.maxCreators}
              onChange={(e) => updateField("maxCreators", e.target.value)}
              placeholder="10"
              min={1}
              className="form-input"
            />
          </FormField>
        </div>

        {/* Dates row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Fecha de inicio">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="Fecha de fin">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              className="form-input"
            />
          </FormField>
        </div>

        {/* Requirements */}
        <FormField label="Requisitos">
          <textarea
            value={form.requirements}
            onChange={(e) => updateField("requirements", e.target.value)}
            placeholder="Requisitos minimos que deben cumplir los creadores (seguidores, engagement, etc.)..."
            className="form-input min-h-[80px] resize-y"
          />
        </FormField>

        {/* Deliverables */}
        <FormField label="Entregables">
          <textarea
            value={form.deliverables}
            onChange={(e) => updateField("deliverables", e.target.value)}
            placeholder="Que esperás que entreguen los creadores (videos, posts, streams, etc.)..."
            className="form-input min-h-[80px] resize-y"
          />
        </FormField>

        {/* Target Audience */}
        <FormField label="Audiencia Objetivo">
          <input
            type="text"
            value={form.targetAudience}
            onChange={(e) => updateField("targetAudience", e.target.value)}
            placeholder="Ej: Gamers 18-35, Argentina y LATAM"
            className="form-input"
          />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          onClick={() => handleSubmit(false)}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar Borrador"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Publicando..." : "Publicar Campaña"}
        </button>
      </div>
    </div>
  );
}

// ----- Form Field wrapper -----

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
