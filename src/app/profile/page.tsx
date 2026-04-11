"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CircleUserRound, Loader2, LogOut, RefreshCcw } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
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

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: unknown): string {
  return inrFormatter.format(toFiniteNumber(value));
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

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setSignedInEmail(null);
      setProfile(null);
      setRefreshTick((current) => current + 1);
      router.push("/login");
      router.refresh();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out right now.");
    } finally {
      setIsSigningOut(false);
    }
  }
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

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
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
          setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const targetGap = useMemo(() => {
    if (!profile) {
      return 0;
    }

    return Math.max(toFiniteNumber(profile.target_amount_inr) - toFiniteNumber(profile.current_savings_inr), 0);
  }, [profile]);

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

  const profileIdentity = useMemo(() => {
    const fullName = profile?.full_name?.trim();

    if (fullName) {
      return fullName;
    }

    const localPart = signedInEmail?.split("@")[0]?.trim();
    if (localPart) {
      return localPart;
    }

    return "Pravix User";
  }, [profile?.full_name, signedInEmail]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-finance-bg pt-28 pb-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <section className="rounded-2xl border border-finance-border bg-finance-panel p-6 shadow-[0_14px_36px_rgba(10,25,48,0.06)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-finance-muted">Account Workspace</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-finance-text sm:text-4xl">Your Profile</h1>
                <p className="mt-2 max-w-2xl text-sm text-finance-muted sm:text-base">
                  Connected directly to your Supabase account data so your details stay in sync with dashboard insights.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRefreshTick((current) => current + 1)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-finance-border px-3.5 text-xs font-semibold text-finance-text hover:bg-finance-surface"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
                <StatusBadge label={signedInEmail ? "Signed in" : "Signed out"} tone={signedInEmail ? "success" : "neutral"} />
                {signedInEmail ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-finance-border px-3.5 text-xs font-semibold text-finance-text hover:bg-finance-surface disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                    Sign Out
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {isLoading ? (
            <section className="mt-6 rounded-2xl border border-finance-border bg-white p-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-finance-accent" />
              <p className="mt-3 text-sm text-finance-muted">Loading your profile...</p>
            </section>
          ) : null}

          {!isLoading && error ? (
            <section className="mt-6 rounded-2xl border border-finance-red/30 bg-finance-red/10 p-5 sm:p-6">
              <div className="flex items-start gap-2.5 text-finance-red">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Could not load profile data</p>
                  <p className="mt-1 text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={() => setRefreshTick((current) => current + 1)}
                    className="mt-3 inline-flex rounded-full border border-finance-red/30 px-3.5 py-1.5 text-xs font-semibold text-finance-red hover:bg-finance-red/5"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {!isLoading && !signedInEmail ? (
            <section className="mt-6 rounded-2xl border border-finance-border bg-white p-5 sm:p-6">
              <EmptyState
                title="You are not signed in"
                description="Sign in or create an account to view your saved profile and personalized finance details."
                action={
                  <div className="flex flex-wrap gap-2">
                    <Link href="/sign-in" className="inline-flex rounded-full bg-finance-accent px-4 py-2 text-xs font-semibold text-white">
                      Sign In
                    </Link>
                    <Link
                      href="/create-account"
                      className="inline-flex rounded-full border border-finance-border px-4 py-2 text-xs font-semibold text-finance-text hover:bg-finance-surface"
                    >
                      Create Account
                    </Link>
                  </div>
                }
              />
            </section>
          ) : null}

          {!isLoading && signedInEmail && !profile ? (
            <section className="mt-6 rounded-2xl border border-finance-border bg-white p-5 sm:p-6">
              <EmptyState
                title="No profile details yet"
                description="We found your account, but there is no onboarding profile row yet. Complete onboarding to populate your financial profile."
                action={
                  <Link href="/onboarding" className="inline-flex rounded-full bg-finance-accent px-4 py-2 text-xs font-semibold text-white">
                    Complete Onboarding
                  </Link>
                }
              />
            </section>
          ) : null}

          {!isLoading && signedInEmail && profile ? (
            <section className="mt-6 space-y-6">
              <DashboardSectionCard
                eyebrow="Supabase Profile Row"
                title="Your latest submitted financial profile"
                description="This view reads your latest profile record using your authenticated user id."
                actions={
                  <Link
                    href="/dashboard"
                    className="inline-flex h-9 items-center rounded-full border border-finance-border px-3.5 text-xs font-semibold text-finance-text hover:bg-finance-surface"
                  >
                    Open Dashboard
                  </Link>
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-finance-border bg-finance-surface text-finance-accent">
                      <CircleUserRound className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-finance-text">{profileIdentity}</p>
                      <p className="text-sm text-finance-muted">{signedInEmail}</p>
                    </div>
                  </div>

                  <StatusBadge label={profileFreshness.label} tone={profileFreshness.tone} />
                </div>

                <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Monthly Income" value={formatCurrency(profile.monthly_income_inr)} />
                  <StatCard label="Current Savings" value={formatCurrency(profile.current_savings_inr)} tone="positive" />
                  <StatCard
                    label="Target Gap"
                    value={formatCurrency(targetGap)}
                    tone={targetGap > 0 ? "warning" : "positive"}
                    hint={targetGap > 0 ? "Remaining to target" : "Target achieved"}
                  />
                  <StatCard
                    label="Risk and Horizon"
                    value={`${formatRisk(profile.risk_appetite)} · ${profile.target_horizon_years}y`}
                    tone="info"
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <article className="rounded-xl border border-finance-border bg-finance-surface/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-finance-muted">Profile Metadata</p>
                    <div className="mt-2 space-y-1.5 text-sm text-finance-text">
                      <p>Source: {profile.source}</p>
                      <p>Profile Email: {profile.email}</p>
                      <p>Created: {formatDateTime(profile.created_at)}</p>
                      <p>Last Updated: {formatDateTime(profile.updated_at)}</p>
                    </div>
                    <StatusBadge
                      className="mt-3"
                      label={profile.consent_to_contact ? "Contact allowed" : "Contact blocked"}
                      tone={profile.consent_to_contact ? "success" : "warning"}
                    />
                  </article>

                  <article className="rounded-xl border border-finance-border bg-finance-surface/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-finance-muted">Planner Notes</p>
                    <p className="mt-2 text-sm leading-relaxed text-finance-text">
                      {profile.notes.trim() ? profile.notes : "No additional notes were provided in your latest submission."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/onboarding"
                        className="inline-flex rounded-full border border-finance-border px-3.5 py-1.5 text-xs font-semibold text-finance-text hover:bg-finance-surface"
                      >
                        Update via Onboarding
                      </Link>
                      <Link href="/dashboard" className="inline-flex rounded-full bg-finance-accent px-3.5 py-1.5 text-xs font-semibold text-white">
                        View Insights
                      </Link>
                    </div>
                  </article>
                </div>
              </DashboardSectionCard>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}