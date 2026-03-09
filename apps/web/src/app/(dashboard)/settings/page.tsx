"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import api, { ApiError } from "@/lib/api-client";
import type { UserProfile, SocialAccount, PortfolioItem } from "@/lib/types";
import {
  validateForm,
  creatorProfileSchema,
  brandProfileSchema,
  addSocialSchema,
  addPortfolioSchema,
  type CreatorProfileForm,
  type BrandProfileForm,
  type AddSocialForm,
  type AddPortfolioForm,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================
// TABS
// =============================================

const CREATOR_TABS = [
  { id: "profile", label: "Perfil" },
  { id: "socials", label: "Redes Sociales" },
  { id: "portfolio", label: "Portfolio" },
  { id: "account", label: "Cuenta" },
] as const;

const BRAND_TABS = [
  { id: "profile", label: "Empresa" },
  { id: "account", label: "Cuenta" },
] as const;

type TabId = "profile" | "socials" | "portfolio" | "account";

// =============================================
// MAIN COMPONENT
// =============================================

export default function SettingsPage() {
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = currentUser?.isCreator ? CREATOR_TABS : BRAND_TABS;

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.profile.get();
      setProfile(data);
    } catch (err) {
      toast.error("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!currentUser?.isLoaded) return null;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-96 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Configuracion</h1>
      <p className="text-muted-foreground mb-6">
        Administra tu perfil y preferencias
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium -mb-px transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && currentUser.isCreator && profile?.creator && (
        <CreatorProfileTab
          creator={profile.creator as any}
          onSaved={loadProfile}
        />
      )}
      {activeTab === "profile" && currentUser.isBrand && profile?.brand && (
        <BrandProfileTab
          brand={profile.brand as any}
          onSaved={loadProfile}
        />
      )}
      {activeTab === "socials" && currentUser.isCreator && (
        <SocialsTab
          socials={(profile?.creator as any)?.socialAccounts || []}
          onSaved={loadProfile}
        />
      )}
      {activeTab === "portfolio" && currentUser.isCreator && (
        <PortfolioTab
          items={(profile?.creator as any)?.portfolioItems || []}
          onSaved={loadProfile}
        />
      )}
      {activeTab === "account" && (
        <AccountTab user={currentUser} />
      )}
    </div>
  );
}

// =============================================
// CREATOR PROFILE TAB
// =============================================

function CreatorProfileTab({
  creator,
  onSaved,
}: {
  creator: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CreatorProfileForm>({
    displayName: creator.displayName || "",
    bio: creator.bio || "",
    country: creator.country || undefined,
    city: creator.city || "",
    languages: creator.languages || [],
    website: creator.website || "",
    hourlyRateMin: creator.hourlyRateMin ? Number(creator.hourlyRateMin) : undefined,
    hourlyRateMax: creator.hourlyRateMax ? Number(creator.hourlyRateMax) : undefined,
    isAvailable: creator.isAvailable ?? true,
    category: creator.category || undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(creatorProfileSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.profile.updateCreator(result.data);
      toast.success("Perfil actualizado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.body : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const CATEGORIES = [
    "STREAMER", "YOUTUBER", "TIKTOKER", "INSTAGRAMMER",
    "PODCASTER", "BLOGGER", "DESIGNER", "VIDEO_EDITOR",
    "PHOTOGRAPHER", "MUSICIAN", "OTHER",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de display</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
          {errors.displayName && <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={form.category || ""}
            onChange={(e) => setForm({ ...form, category: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">Seleccionar...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Bio */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            rows={3}
            value={form.bio || ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{(form.bio || "").length}/500</p>
          {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium mb-1">Pais</label>
          <select
            value={form.country || ""}
            onChange={(e) => setForm({ ...form, country: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">Seleccionar...</option>
            {["AR", "MX", "CO", "CL", "PE", "BR", "US", "ES", "UY"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input
            type="text"
            value={form.city || ""}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            type="url"
            value={form.website || ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
          {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website}</p>}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-3 pt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
          <span className="text-sm">Disponible para trabajar</span>
        </div>

        {/* Rate Range */}
        <div>
          <label className="block text-sm font-medium mb-1">Tarifa minima (USD/hr)</label>
          <input
            type="number"
            value={form.hourlyRateMin ?? ""}
            onChange={(e) => setForm({ ...form, hourlyRateMin: e.target.value ? Number(e.target.value) : undefined })}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tarifa maxima (USD/hr)</label>
          <input
            type="number"
            value={form.hourlyRateMax ?? ""}
            onChange={(e) => setForm({ ...form, hourlyRateMax: e.target.value ? Number(e.target.value) : undefined })}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}

// =============================================
// BRAND PROFILE TAB
// =============================================

function BrandProfileTab({
  brand,
  onSaved,
}: {
  brand: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BrandProfileForm>({
    companyName: brand.companyName || "",
    description: brand.description || "",
    website: brand.website || "",
    industry: brand.industry || "",
    companySize: brand.companySize || undefined,
    country: brand.country || undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(brandProfileSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.profile.updateBrand(result.data);
      toast.success("Perfil actualizado");
      onSaved();
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de Empresa</label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
          {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Industria</label>
          <input
            type="text"
            value={form.industry || ""}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Descripcion</label>
          <textarea
            rows={4}
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">{(form.description || "").length}/1000</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            type="url"
            value={form.website || ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tamano de empresa</label>
          <select
            value={form.companySize || ""}
            onChange={(e) => setForm({ ...form, companySize: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">Seleccionar...</option>
            <option value="SOLO">Solo (1 persona)</option>
            <option value="SMALL">Pequena (2-10)</option>
            <option value="MEDIUM">Mediana (11-50)</option>
            <option value="LARGE">Grande (51-200)</option>
            <option value="ENTERPRISE">Enterprise (200+)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pais</label>
          <select
            value={form.country || ""}
            onChange={(e) => setForm({ ...form, country: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">Seleccionar...</option>
            {["AR", "MX", "CO", "CL", "PE", "BR", "US", "ES", "UY"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}

// =============================================
// SOCIALS TAB
// =============================================

function SocialsTab({
  socials,
  onSaved,
}: {
  socials: SocialAccount[];
  onSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddSocialForm>({
    platform: "TIKTOK" as any,
    username: "",
    profileUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const PLATFORMS = [
    "TWITCH", "YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER",
    "KICK", "DISCORD", "SPOTIFY", "LINKEDIN", "OTHER",
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(addSocialSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.profile.addSocial(result.data);
      toast.success("Red social agregada");
      setShowForm(false);
      setForm({ platform: "TIKTOK" as any, username: "", profileUrl: "" });
      onSaved();
    } catch (err) {
      toast.error("Error al agregar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.profile.removeSocial(id);
      toast.success("Red social eliminada");
      onSaved();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing socials */}
      {socials.length === 0 && !showForm && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tienes redes sociales vinculadas.</p>
        </div>
      )}

      {socials.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase px-2 py-1 bg-muted rounded">
              {s.platform}
            </span>
            <div>
              <p className="font-medium">@{s.username}</p>
              <p className="text-sm text-muted-foreground">
                {s.followers.toLocaleString()} seguidores
                {s.isVerified && " - Verificado"}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove(s.id)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plataforma</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="tu_usuario"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
              {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL del perfil</label>
              <input
                type="url"
                value={form.profileUrl}
                onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
              {errors.profileUrl && <p className="text-sm text-red-500 mt-1">{errors.profileUrl}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              {saving ? "Agregando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          + Agregar red social
        </button>
      )}
    </div>
  );
}

// =============================================
// PORTFOLIO TAB
// =============================================

function PortfolioTab({
  items,
  onSaved,
}: {
  items: PortfolioItem[];
  onSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddPortfolioForm>({
    title: "",
    description: "",
    mediaType: "IMAGE" as any,
    externalUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload.uploadFile(file);
      setUploadedKey(result.objectKey);
      toast.success("Archivo subido");
    } catch (err) {
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(addPortfolioSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    if (!uploadedKey && !form.externalUrl) {
      toast.error("Subi un archivo o agrega un link externo");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.profile.addPortfolioItem({
        title: result.data.title,
        description: result.data.description,
        mediaKey: uploadedKey || "",
        mediaType: result.data.mediaType,
        externalUrl: result.data.externalUrl,
      });
      toast.success("Item agregado al portfolio");
      setShowForm(false);
      setForm({ title: "", description: "", mediaType: "IMAGE" as any, externalUrl: "" });
      setUploadedKey(null);
      onSaved();
    } catch (err) {
      toast.error("Error al agregar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.profile.removePortfolioItem(id);
      toast.success("Item eliminado");
      onSaved();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const MEDIA_TYPES = ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LINK"];

  return (
    <div className="space-y-4">
      {items.length === 0 && !showForm && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Tu portfolio esta vacio. Agrega tu mejor trabajo.</p>
        </div>
      )}

      {/* Existing items as grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            <div className="h-32 bg-muted flex items-center justify-center">
              <span className="text-xs uppercase text-muted-foreground">{item.mediaType}</span>
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm truncate">{item.title}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
              <button
                onClick={() => handleRemove(item.id)}
                className="text-xs text-red-500 hover:text-red-700 mt-2"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titulo</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={form.mediaType}
                onChange={(e) => setForm({ ...form, mediaType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripcion</label>
              <textarea
                rows={2}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Archivo</label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-sm"
              />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Subiendo...</p>}
              {uploadedKey && <p className="text-xs text-green-600 mt-1">Archivo listo</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">O link externo</label>
              <input
                type="url"
                value={form.externalUrl || ""}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              {saving ? "Agregando..." : "Agregar al Portfolio"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setUploadedKey(null); }}
              className="px-4 py-2 border border-border rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          + Agregar pieza al portfolio
        </button>
      )}
    </div>
  );
}

// =============================================
// ACCOUNT TAB
// =============================================

function AccountTab({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-medium mb-3">Informacion de Cuenta</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span>{user.fullName || "No configurado"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rol</span>
            <span className="capitalize">{user.role?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-medium mb-2">Gestion de cuenta</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Para cambiar tu contrasena, email, o configuracion de seguridad,
          usa el boton de tu perfil en la barra superior.
        </p>
        <p className="text-xs text-muted-foreground">
          La autenticacion es gestionada por Clerk de forma segura.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">Zona de Peligro</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Eliminar tu cuenta es irreversible. Todos tus datos seran borrados permanentemente.
        </p>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          Eliminar Cuenta
        </button>
      </div>
    </div>
  );
}
