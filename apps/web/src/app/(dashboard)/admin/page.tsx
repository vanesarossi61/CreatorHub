"use client";

// CreatorHub — Admin Dashboard Page
// Protected by email allowlist. Shows platform stats, user management, and deal oversight.

import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

// =============================
// TYPES
// =============================

interface AdminStats {
  overview: {
    totalUsers: number;
    totalCreators: number;
    totalBrands: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalDeals: number;
    completedDeals: number;
    totalApplications: number;
    totalRevenue: number;
    platformRevenue: number;
    conversionRate: string;
  };
  recentUsers: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    type: string;
    createdAt: string;
  }[];
  recentDeals: {
    id: string;
    status: string;
    agreedRate: number;
    createdAt: string;
    campaign: { title: string };
    creator: { displayName: string };
  }[];
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  type: string;
  isActive: boolean;
  onboardingDone: boolean;
  createdAt: string;
  creator: { displayName: string; slug: string; completedDeals: number; totalEarnings: number; isVerified: boolean } | null;
  brand: { companyName: string; slug: string; totalSpent: number; isVerified: boolean } | null;
}

type Tab = "overview" | "users" | "deals";

// =============================
// MAIN COMPONENT
// =============================

export default function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState("");
  const [dealFilter, setDealFilter] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
      else setError(json.error);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const fetchUsers = useCallback(async (q = "") => {
    try {
      const params = new URLSearchParams({ pageSize: "15" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.items);
        setUsersTotal(json.data.total);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const fetchDeals = useCallback(async (status = "") => {
    try {
      const params = new URLSearchParams({ pageSize: "15" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/deals?${params}`);
      const json = await res.json();
      if (json.success) {
        setDeals(json.data.items);
        setDealsTotal(json.data.total);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchDeals()]).finally(() =>
      setLoading(false)
    );
  }, [fetchStats, fetchUsers, fetchDeals]);

  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: !currentActive }),
    });
    fetchUsers(userFilter);
  };

  const handleVerifyUser = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isVerified: true }),
    });
    fetchUsers(userFilter);
  };

  const handleDealAction = async (dealId: string, action: string) => {
    await fetch("/api/admin/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId, action }),
    });
    fetchDeals(dealFilter);
    fetchStats();
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">Access Denied</h2>
          <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users (${usersTotal})` },
    { id: "deals", label: `Deals (${dealsTotal})` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Platform management and oversight
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.overview.totalUsers },
              { label: "Creators", value: stats.overview.totalCreators },
              { label: "Brands", value: stats.overview.totalBrands },
              { label: "Active Campaigns", value: stats.overview.activeCampaigns },
              { label: "Total Deals", value: stats.overview.totalDeals },
              { label: "Completed Deals", value: stats.overview.completedDeals },
              { label: "Total Revenue", value: `$${stats.overview.totalRevenue.toLocaleString()}` },
              { label: "Platform Revenue", value: `$${stats.overview.platformRevenue.toLocaleString()}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Recent Users</h3>
              <div className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="ml-2 text-zinc-500">{u.email}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.type === "CREATOR" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      : u.type === "BRAND" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {u.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Deals */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Recent Deals</h3>
              <div className="space-y-3">
                {stats.recentDeals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {d.campaign.title}
                      </span>
                      <span className="ml-2 text-zinc-500">by {d.creator.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">${d.agreedRate}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : d.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : d.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              fetchUsers(e.target.value);
            }}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">User</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Verified</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {u.creator?.displayName || u.brand?.companyName || `${u.firstName || ''} ${u.lastName || ''}`}
                        </p>
                        <p className="text-zinc-500 text-xs">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.type === "CREATOR" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {u.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.isActive ? "text-emerald-600" : "text-red-500"
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(u.creator?.isVerified || u.brand?.isVerified) ? (
                        <span className="text-emerald-600 text-xs font-medium">Verified</span>
                      ) : (
                        <button
                          onClick={() => handleVerifyUser(u.id)}
                          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id, u.isActive)}
                        className={`text-xs font-medium px-3 py-1 rounded-lg ${
                          u.isActive
                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        }`}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {activeTab === "deals" && (
        <div className="space-y-4">
          <select
            value={dealFilter}
            onChange={(e) => {
              setDealFilter(e.target.value);
              fetchDeals(e.target.value);
            }}
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONTRACTED">Contracted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="DISPUTED">Disputed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Campaign</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Creator</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Brand</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d: any) => (
                  <tr key={d.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                      {d.campaign.title}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {d.creator.displayName}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {d.campaign.brand.companyName}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                      ${d.agreedRate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : d.status === "DISPUTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : d.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : d.status === "CANCELLED" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {d.status === "DISPUTED" && (
                          <button
                            onClick={() => handleDealAction(d.id, "resolve")}
                            className="text-xs font-medium px-3 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            Resolve
                          </button>
                        )}
                        {!["COMPLETED", "CANCELLED"].includes(d.status) && (
                          <>
                            <button
                              onClick={() => handleDealAction(d.id, "complete")}
                              className="text-xs font-medium px-3 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleDealAction(d.id, "cancel")}
                              className="text-xs font-medium px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
