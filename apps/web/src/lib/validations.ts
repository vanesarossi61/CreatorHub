// CreatorHub — Client-Side Form Validation Schemas
// Extends @creatorhub/shared schemas with UX-friendly error messages.
// Usage: schema.safeParse(formData) -> { success, data, error }

import { z } from "zod";
import {
  CREATOR_ROLES,
  PLATFORMS,
  COUNTRIES,
  LANGUAGES,
  campaignCreateSchema,
  applicationCreateSchema,
  reviewCreateSchema,
  onboardingCreatorSchema,
  onboardingBrandSchema,
} from "@creatorhub/shared";

// =============================
// HELPERS
// =============================

/** Safely parse and return typed errors keyed by field name */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}

// =============================
// ONBOARDING — CREATOR
// =============================

export const creatorOnboardingSchema = onboardingCreatorSchema.extend({
  displayName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "Maximo 50 caracteres")
    .regex(/^[a-zA-Z0-9\s._-]+$/, "Solo letras, numeros, espacios, puntos y guiones"),
  bio: z
    .string()
    .max(500, "Maximo 500 caracteres")
    .optional(),
  country: z.enum(COUNTRIES, {
    errorMap: () => ({ message: "Selecciona un pais" }),
  }),
  languages: z
    .array(z.enum(LANGUAGES))
    .min(1, "Selecciona al menos un idioma"),
  roles: z
    .array(z.enum(CREATOR_ROLES))
    .min(1, "Selecciona al menos un rol"),
});

export type CreatorOnboardingForm = z.infer<typeof creatorOnboardingSchema>;

// =============================
// ONBOARDING — BRAND
// =============================

export const brandOnboardingSchema = onboardingBrandSchema.extend({
  companyName: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
    .max(100, "Maximo 100 caracteres"),
  industry: z
    .string()
    .min(2, "Indica la industria")
    .max(50, "Maximo 50 caracteres"),
  country: z.enum(COUNTRIES, {
    errorMap: () => ({ message: "Selecciona un pais" }),
  }),
  website: z
    .string()
    .url("Ingresa una URL valida (https://...)")
    .optional()
    .or(z.literal("")),
});

export type BrandOnboardingForm = z.infer<typeof brandOnboardingSchema>;

// =============================
// CAMPAIGN — CREATE / EDIT
// =============================

export const campaignFormSchema = campaignCreateSchema
  .extend({
    title: z
      .string()
      .min(5, "El titulo debe tener al menos 5 caracteres")
      .max(100, "Maximo 100 caracteres"),
    brief: z
      .string()
      .min(20, "El brief debe tener al menos 20 caracteres")
      .max(2000, "Maximo 2000 caracteres"),
    description: z
      .string()
      .min(20, "La descripcion debe tener al menos 20 caracteres")
      .max(5000, "Maximo 5000 caracteres")
      .optional()
      .or(z.literal("")),
    budgetMin: z
      .number({ invalid_type_error: "Ingresa un monto" })
      .positive("El presupuesto debe ser mayor a 0")
      .max(1000000, "Maximo USD 1,000,000"),
    budgetMax: z
      .number({ invalid_type_error: "Ingresa un monto" })
      .positive("El presupuesto debe ser mayor a 0")
      .max(1000000, "Maximo USD 1,000,000"),
    rolesNeeded: z
      .array(z.enum(CREATOR_ROLES))
      .min(1, "Selecciona al menos un tipo de creador"),
    platforms: z
      .array(z.enum(PLATFORMS))
      .min(1, "Selecciona al menos una plataforma"),
    deadline: z
      .string()
      .datetime("Fecha invalida")
      .refine(
        (d) => new Date(d) > new Date(),
        "La fecha limite debe ser futura",
      ),
    // Extended fields (not in shared schema)
    dealType: z
      .enum(["FIXED_PRICE", "HOURLY", "REVENUE_SHARE", "PRODUCT_ONLY", "HYBRID"])
      .default("FIXED_PRICE"),
    visibility: z
      .enum(["PUBLIC", "PRIVATE", "UNLISTED"])
      .default("PUBLIC"),
    maxCreators: z
      .number()
      .int("Debe ser un numero entero")
      .positive("Debe ser mayor a 0")
      .optional(),
    tags: z
      .array(z.string().max(30, "Maximo 30 caracteres por tag"))
      .max(10, "Maximo 10 tags")
      .default([]),
    startDate: z.string().datetime().optional().or(z.literal("")),
    endDate: z.string().datetime().optional().or(z.literal("")),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "El presupuesto maximo debe ser mayor o igual al minimo",
    path: ["budgetMax"],
  });

export type CampaignFormData = z.infer<typeof campaignFormSchema>;

// =============================
// APPLICATION — SUBMIT
// =============================

export const applicationFormSchema = applicationCreateSchema.extend({
  proposal: z
    .string()
    .min(20, "Tu propuesta debe tener al menos 20 caracteres")
    .max(1000, "Maximo 1000 caracteres"),
  price: z
    .number({ invalid_type_error: "Ingresa un precio" })
    .positive("El precio debe ser mayor a 0")
    .max(500000, "Maximo USD 500,000"),
  campaignId: z.string().min(1, "Campaign ID requerido"),
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

// =============================
// REVIEW — CREATE
// =============================

export const reviewFormSchema = reviewCreateSchema.extend({
  rating: z
    .number()
    .min(1, "Selecciona una calificacion")
    .max(5, "Maximo 5 estrellas"),
  text: z
    .string()
    .min(10, "La resena debe tener al menos 10 caracteres")
    .max(500, "Maximo 500 caracteres"),
  dealId: z.string().min(1, "Deal ID requerido"),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

// =============================
// PROFILE — CREATOR EDIT
// =============================

export const creatorProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Minimo 2 caracteres")
    .max(50, "Maximo 50 caracteres"),
  bio: z
    .string()
    .max(500, "Maximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  country: z.enum(COUNTRIES).optional(),
  city: z
    .string()
    .max(100, "Maximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  languages: z
    .array(z.enum(LANGUAGES))
    .min(1, "Selecciona al menos un idioma"),
  website: z
    .string()
    .url("URL invalida")
    .optional()
    .or(z.literal("")),
  hourlyRateMin: z
    .number()
    .min(0, "No puede ser negativo")
    .optional(),
  hourlyRateMax: z
    .number()
    .min(0, "No puede ser negativo")
    .optional(),
  isAvailable: z.boolean().default(true),
  category: z
    .enum([
      "STREAMER", "YOUTUBER", "TIKTOKER", "INSTAGRAMMER",
      "PODCASTER", "BLOGGER", "DESIGNER", "VIDEO_EDITOR",
      "PHOTOGRAPHER", "MUSICIAN", "OTHER",
    ])
    .optional(),
});

export type CreatorProfileForm = z.infer<typeof creatorProfileSchema>;

// =============================
// PROFILE — BRAND EDIT
// =============================

export const brandProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "Minimo 2 caracteres")
    .max(100, "Maximo 100 caracteres"),
  description: z
    .string()
    .max(1000, "Maximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL invalida")
    .optional()
    .or(z.literal("")),
  industry: z
    .string()
    .max(50, "Maximo 50 caracteres")
    .optional(),
  companySize: z
    .enum(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
    .optional(),
  country: z.enum(COUNTRIES).optional(),
});

export type BrandProfileForm = z.infer<typeof brandProfileSchema>;

// =============================
// SOCIAL ACCOUNT — ADD
// =============================

export const addSocialSchema = z.object({
  platform: z.enum(
    ["TWITCH", "YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER", "KICK", "DISCORD", "SPOTIFY", "LINKEDIN", "OTHER"],
    { errorMap: () => ({ message: "Selecciona una plataforma" }) },
  ),
  username: z
    .string()
    .min(1, "Ingresa tu nombre de usuario")
    .max(100, "Maximo 100 caracteres"),
  profileUrl: z
    .string()
    .url("Ingresa la URL de tu perfil")
    .max(500, "Maximo 500 caracteres"),
});

export type AddSocialForm = z.infer<typeof addSocialSchema>;

// =============================
// PORTFOLIO ITEM — ADD
// =============================

export const addPortfolioSchema = z.object({
  title: z
    .string()
    .min(2, "Minimo 2 caracteres")
    .max(100, "Maximo 100 caracteres"),
  description: z
    .string()
    .max(500, "Maximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LINK"], {
    errorMap: () => ({ message: "Selecciona el tipo de contenido" }),
  }),
  externalUrl: z
    .string()
    .url("URL invalida")
    .optional()
    .or(z.literal("")),
  // mediaKey is set programmatically after upload, not in the form
});

export type AddPortfolioForm = z.infer<typeof addPortfolioSchema>;

// =============================
// MESSAGE — SEND
// =============================

export const sendMessageSchema = z.object({
  body: z
    .string()
    .min(1, "Escribe un mensaje")
    .max(5000, "Maximo 5000 caracteres"),
  recipientId: z.string().min(1, "Destinatario requerido"),
});

export type SendMessageForm = z.infer<typeof sendMessageSchema>;
