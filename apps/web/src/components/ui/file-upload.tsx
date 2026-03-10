"use client";

import { useState, useRef, useCallback } from "react";
import api, { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================
// TYPES
// =============================================

export interface UploadedFile {
  objectKey: string;
  publicUrl: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface FileUploadProps {
  /** Called when file is successfully uploaded */
  onUpload: (file: UploadedFile) => void;
  /** Called when file is removed */
  onRemove?: () => void;
  /** Currently uploaded file key (for showing existing) */
  value?: string | null;
  /** Accepted MIME types (e.g., "image/*", "video/*") */
  accept?: string;
  /** Max file size in MB (default: 10) */
  maxSizeMB?: number;
  /** Upload variant */
  variant?: "default" | "avatar" | "banner";
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Class name override */
  className?: string;
}

// =============================================
// COMPONENT
// =============================================

export function FileUpload({
  onUpload,
  onRemove,
  value,
  accept = "image/*",
  maxSizeMB = 10,
  variant = "default",
  label,
  helperText,
  disabled = false,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`El archivo excede ${maxSizeMB}MB`);
        return;
      }

      // Validate type
      if (accept !== "*" && accept) {
        const acceptTypes = accept.split(",").map((t) => t.trim());
        const matches = acceptTypes.some((pattern) => {
          if (pattern.endsWith("/*")) {
            return file.type.startsWith(pattern.replace("/*", "/"));
          }
          return file.type === pattern;
        });
        if (!matches) {
          toast.error("Tipo de archivo no permitido");
          return;
        }
      }

      // Preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      setUploading(true);
      setProgress(0);

      // Simulate progress (actual upload doesn't support progress events with fetch)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 200);

      try {
        const result = await api.upload.uploadFile(file);
        setProgress(100);

        onUpload({
          objectKey: result.objectKey,
          publicUrl: result.publicUrl,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        toast.success("Archivo subido exitosamente");
      } catch (err) {
        setPreview(null);
        if (err instanceof ApiError) {
          toast.error(`Error: ${err.statusText}`);
        } else {
          toast.error("Error al subir el archivo");
        }
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
        setProgress(0);
      }
    },
    [accept, maxSizeMB, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, uploading, handleFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  const hasFile = value || preview;

  // ---- AVATAR VARIANT ----
  if (variant === "avatar") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div
          className={cn(
            "w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border",
            dragOver && "border-primary",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {hasFile ? (
            <img
              src={preview || value || ""}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : uploading ? (
            <div className="text-xs text-muted-foreground">{progress}%</div>
          ) : (
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : hasFile ? "Cambiar foto" : "Subir foto"}
          </button>
          {hasFile && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-500 hover:underline ml-3"
            >
              Eliminar
            </button>
          )}
          {helperText && (
            <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  // ---- BANNER VARIANT ----
  if (variant === "banner") {
    return (
      <div className={cn("space-y-1", className)}>
        {label && <label className="block text-sm font-medium">{label}</label>}
        <div
          className={cn(
            "relative w-full h-40 rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-colors cursor-pointer",
            dragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {hasFile ? (
            <>
              <img
                src={preview || value || ""}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Cambiar banner</span>
              </div>
            </>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Subiendo... {progress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <p className="text-sm text-muted-foreground">Arrastra una imagen o hace clic</p>
              <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB</p>
            </div>
          )}
        </div>
        {hasFile && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-500 hover:underline"
          >
            Eliminar banner
          </button>
        )}
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  // ---- DEFAULT VARIANT ----
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div
        className={cn(
          "flex items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : hasFile ? (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">Archivo listo</span>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="text-xs text-red-500 hover:underline ml-2"
              >
                Eliminar
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Arrastra un archivo o <span className="text-primary">hace clic</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}