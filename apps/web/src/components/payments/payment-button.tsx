"use client";

// CreatorHub — PaymentButton Component
// Initiates Stripe Checkout for deal/milestone payments.
// Used by brands on deal detail pages.

import { useState } from "react";
import api from "@/lib/api-client";

interface PaymentButtonProps {
  dealId: string;
  milestoneId?: string;
  amount: number;
  currency?: string;
  label?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentButton({
  dealId,
  milestoneId,
  amount,
  currency = "USD",
  label,
  disabled = false,
  variant = "primary",
  size = "md",
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await api.payments.createCheckout(dealId, milestoneId);
      if (result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
        onSuccess?.();
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      const message = err.message || "Payment failed";
      onError?.(message);
      console.error("[PaymentButton]", err);
    } finally {
      setLoading(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);

  const buttonLabel = label || `Pay ${formattedAmount}`;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500",
    secondary:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    outline:
      "border-2 border-violet-600 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 focus:ring-violet-500",
  };

  return (
    <button
      onClick={handlePay}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
          {buttonLabel}
        </>
      )}
    </button>
  );
}

// =============================
// PaymentStatus — Shows current payment state
// =============================

interface PaymentStatusProps {
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  amount?: number;
  currency?: string;
  stripePaymentId?: string | null;
  className?: string;
}

export function PaymentStatus({
  status,
  amount,
  currency = "USD",
  className = "",
}: PaymentStatusProps) {
  const statusConfig = {
    pending: {
      label: "Payment Pending",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    processing: {
      label: "Processing",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
    },
    completed: {
      label: "Paid",
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    failed: {
      label: "Payment Failed",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
    },
    refunded: {
      label: "Refunded",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      icon: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3",
    },
  };

  const config = statusConfig[status];
  const formattedAmount = amount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount)
    : null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color} ${className}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
      </svg>
      <span>
        {config.label}
        {formattedAmount && ` - ${formattedAmount}`}
      </span>
    </div>
  );
}
