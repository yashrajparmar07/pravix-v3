"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CircleUserRound, Loader2, LogOut, RefreshCcw } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import AuthPanel from "@/components/AuthPanel";
import AgentAdvisorPanel from "@/components/AgentAdvisorPanel";
import HoldingsAnalyzerPanel from "@/components/HoldingsAnalyzerPanel";
import SmartAlertsPanel from "@/components/SmartAlertsPanel";
import TaxOptimizationPanel from "@/components/TaxOptimizationPanel";
import { DashboardSectionCard, EmptyState, StatCard, StatusBadge } from "@/components/dashboard/DashboardPrimitives";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RiskAppetite = "conservative" | "moderate" | "aggressive";

type ProfileRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  monthly_income_inr: number;
  current_savings_inr: number;
  risk_appetite: RiskAppetite;
  target_amount_inr: number;
  target_horizon_years: number;
  notes: string;
  consent_to_contact: boolean;
  source: string;
  created_at: string;
  updated_at: string;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return inrFormatter.format(value);
}

function formatRisk(value: RiskAppetite): string {
  if (value === "conservative") {
    return "Conservative";
  }

  if (value === "aggressive") {
    return "Aggressive";
  }

  return "Moderate";
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setRefreshTick((current) => current + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setProfile(null);
      setSignedInEmail(null);
      setRefreshTick((current) => current + 1);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out right now.");
    } finally {
      setIsSigningOut(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (!cancelled) {
            setSignedInEmail(null);
            setProfile(null);
          }
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id,user_id,full_name,email,monthly_income_inr,current_savings_inr,risk_appetite,target_amount_inr,target_horizon_years,notes,consent_to_contact,source,created_at,updated_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        if (!cancelled) {
          setSignedInEmail(user.email ?? null);
          setProfile((data?.[0] as ProfileRow | undefined) ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load your dashboard profile.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const latestCreatedAt = useMemo(() => formatDateTime(profile?.created_at ?? null), [profile?.created_at]);

  const latestUpdatedAt = useMemo(() => formatDateTime(profile?.updated_at ?? null), [profile?.updated_at]);

  const profileFreshness = useMemo(() => {
    if (!profile) {
      return { label: "Awaiting profile", tone: "neutral" as const };
    }

    const updatedAtMs = new Date(profile.updated_at).getTime();
    const ageInDays = Number.isFinite(updatedAtMs)
      ? Math.floor((Date.now() - updatedAtMs) / (1000 * 60 * 60 * 24))
      : 999;

    if (ageInDays <= 30) {
      return { label: "Up to date", tone: "success" as const };
    }

    if (ageInDays <= 90) {
      return { label: "Review soon", tone: "warning" as const };
    }

    return { label: "Needs review", tone: "critical" as const };
  }, [profile]);

  const targetGap = useMemo(() => {
    if (!profile) {
      return 0;
    }

    return Math.max(profile.target_amount_inr - profile.current_savings_inr, 0);
  }, [profile]);

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-finance-bg pb-12 pt-20 sm:pb-16 sm:pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <section className="rounded-2xl border border-finance-border bg-finance-panel p-5 shadow-[0_24px_50px_rgba(43,92,255,0.08)] transition-shadow duration-200 sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-finance-muted">Client Dashboard</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-finance-text sm:text-3xl md:text-5xl">
                  Trusted Wealth Control Center
                </h1>
                <p className="mt-2.5 max-w-3xl text-sm text-finance-muted sm:mt-3 sm:text-base">
                  A unified view of profile, alerts, portfolio health, tax readiness, and personalized AI guidance.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRefreshTick((current) => current + 1)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-finance-border px-4 text-sm font-semibold text-finance-text transition-all duration-150 hover:bg-finance-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/30 active:scale-[0.98]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>

                {signedInEmail ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-finance-border px-4 text-sm font-semibold text-finance-text transition-all duration-150 hover:bg-finance-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Sign Out
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {isLoading && (
            <DashboardSectionCard
              className="mt-5 sm:mt-6"
              eyebrow="Overview"
              title="Preparing your dashboard"
              description="Loading authenticated profile and advisory context."
            >
              <div className="flex items-center gap-3 text-finance-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Loading your profile snapshot...</p>
              </div>
            </DashboardSectionCard>
          )}

          {!isLoading && error && (
            <DashboardSectionCard
              className="mt-5 sm:mt-6"
              eyebrow="Overview"
              title="Dashboard temporarily unavailable"
              description="We could not fetch profile details right now."
            >
              <div className="rounded-xl border border-finance-red/25 bg-finance-red/10 p-4 text-finance-red">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Unable to load dashboard data</p>
                    <p className="mt-1 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </DashboardSectionCard>
          )}

          {!isLoading && !error && !signedInEmail && (
            <DashboardSectionCard
              className="mt-5 sm:mt-6"
              eyebrow="Overview"
              title="Sign in to activate your dashboard"
              description="Authentication unlocks personalized profile, alerts, and advisor modules."
            >
              <div className="flex items-start gap-3">
                <CircleUserRound className="h-5 w-5 mt-0.5 text-finance-muted" />
                <div>
                  <p className="font-semibold text-finance-text">You are not signed in</p>
                  <p className="mt-1 text-sm text-finance-muted">
                    Sign in to reliably view your own profile and plan inputs on this dashboard.
                  </p>
                  <AuthPanel onSignedIn={() => setRefreshTick((current) => current + 1)} />
                </div>
              </div>
            </DashboardSectionCard>
          )}

          {!isLoading && !error && signedInEmail && !profile && (
            <DashboardSectionCard
              className="mt-5 sm:mt-6"
              eyebrow="Overview"
              title="Complete onboarding to enable insights"
              description={`No profile rows are available yet for ${signedInEmail}.`}
            >
              <EmptyState
                title="Your personalized dashboard is waiting"
                description="Complete onboarding while signed in, then refresh this page to unlock profile and module analytics."
                action={
                  <Link
                    href="/onboarding"
                    className="inline-flex h-10 items-center rounded-full bg-finance-accent px-4 text-sm font-semibold text-white transition-all duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/40 active:scale-[0.98]"
                  >
                    Complete Onboarding
                  </Link>
                }
              />
            </DashboardSectionCard>
          )}

          {!isLoading && !error && profile && (
            <DashboardSectionCard
              className="mt-5 sm:mt-6"
              eyebrow="Overview"
              title="Your financial command snapshot"
              description="A quick status view before diving into alerts, portfolio, tax, and AI guidance."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-finance-text">{profile.full_name}</p>
                  <p className="text-sm text-finance-muted">{profile.email}</p>
                </div>
                <StatusBadge label={profileFreshness.label} tone={profileFreshness.tone} />
              </div>

              <section className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Monthly Income" value={formatCurrency(profile.monthly_income_inr)} tone="default" />
                <StatCard label="Current Savings" value={formatCurrency(profile.current_savings_inr)} tone="positive" />
                <StatCard label="Target Gap" value={formatCurrency(targetGap)} tone={targetGap > 0 ? "warning" : "positive"} />
                <StatCard
                  label="Risk and Horizon"
                  value={`${formatRisk(profile.risk_appetite)} · ${profile.target_horizon_years}y`}
                  tone="info"
                />
              </section>

              <section className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-finance-border bg-finance-surface/70 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-finance-muted">Profile Metadata</p>
                    <StatusBadge
                      label={profile.consent_to_contact ? "contact allowed" : "contact blocked"}
                      tone={profile.consent_to_contact ? "success" : "warning"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-finance-text">Source: {profile.source}</p>
                  <p className="mt-1 text-xs text-finance-muted">Captured: {latestCreatedAt}</p>
                  <p className="mt-1 text-xs text-finance-muted">Last Updated: {latestUpdatedAt}</p>
                </article>

                <article className="rounded-xl border border-finance-border bg-finance-surface/70 p-3.5 sm:p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-finance-muted">Planner Notes</p>
                  <p className="mt-2 text-sm leading-relaxed text-finance-text">
                    {profile.notes.trim() ? profile.notes : "No additional notes provided in your latest submission."}
                  </p>
                </article>
              </section>
            </DashboardSectionCard>
          )}

          {!isLoading && !error && signedInEmail && (
            <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
              <SmartAlertsPanel refreshKey={refreshTick} />
              <HoldingsAnalyzerPanel
                refreshKey={refreshTick}
                onHoldingsChanged={() => setRefreshTick((current) => current + 1)}
              />
              <TaxOptimizationPanel refreshKey={refreshTick} />
              <AgentAdvisorPanel refreshKey={refreshTick} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
