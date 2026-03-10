"use client";

// CreatorHub — StripeConnect Panel
// Shows Stripe Connect onboarding status and actions for creators.
// Used in Settings > Payments tab.

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api-client";

interface StripeConnectStatus {
  connected: boolean;
  onboarded: boolean;
  dashboardUrl: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

export function StripeConnectPanel() {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.payments.getConnectStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load Stripe status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check URL params for returning from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "complete") {
      fetchStatus();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname + "?tab=payments");
    }
  }, [fetchStatus]);

  const handleSetup = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const result = await api.payments.startConnectOnboarding();
      if (result.onboardingUrl) {
        window.location.href = result.onboardingUrl;
      }
    } catch (err: any) {
      setError(err.message || "Failed to start Stripe setup");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <svg
            className="h-6 w-6 text-violet-600 dark:text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Stripe Payments
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Receive payments from brand deals directly to your bank account
          </p>
        </div>
      </div>

      {/* Status indicators */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatusCard
            label="Account"
            active={status.connected}
            activeText="Connected"
            inactiveText="Not connected"
          />
          <StatusCard
            label="Verification"
            active={status.onboarded}
            activeText="Verified"
            inactiveText="Incomplete"
          />
          <StatusCard
            label="Payouts"
            active={status.payoutsEnabled}
            activeText="Enabled"
            inactiveText="Disabled"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!status?.connected && (
          <button
            onClick={handleSetup}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up...
              </>
            ) : (
              "Set up Stripe"
            )}
          </button>
        )}

        {status?.connected && !status.onboarded && (
          <button
            onClick={handleSetup}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Complete Verification
          </button>
        )}

        {status?.onboarded && status.dashboardUrl && (
          <a
            href={status.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open Stripe Dashboard
          </a>
        )}
      </div>

      {/* Info box */}
      {status?.onboarded && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                You're all set!
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Payments from deals will be deposited directly into your connected bank account.
                CreatorHub charges a 12% platform fee on each transaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================
// Status Card sub-component
// =============================

function StatusCard({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            active
              ? "bg-emerald-500"
              : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            active
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {active ? activeText : inactiveText}
        </span>
      </div>
    </div>
  );
}
