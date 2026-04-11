"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BellRing, Loader2, RefreshCcw, SendHorizontal } from "lucide-react";
import {
  DashboardSectionCard,
  EmptyState,
  KeyValueGrid,
  SectionActionBar,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/DashboardPrimitives";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SmartAlertItem = {
  alertType: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  metricValue: number | null;
  metricLabel: string | null;
  channel: "whatsapp" | "email" | "sms" | "push" | null;
  destination: string | null;
  routeStatus: "ready" | "deferred" | "blocked" | "suppressed";
  routeReason: string;
  dispatchStatus?: "sent" | "failed" | "skipped";
  dispatchProvider?: string;
  dispatchError?: string | null;
};

type Summary = {
  evaluatedUserCount: number;
  triggeredCount: number;
  readyCount: number;
  deferredCount: number;
  blockedCount: number;
  suppressedCount: number;
};

type AlertsSubscription = {
  plan: "free" | "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  isPaidPlan: boolean;
  canUseWhatsappChannel: boolean;
  upgradeMessage: string | null;
};

type AlertsPayload = {
  ok?: boolean;
  mode?: string;
  alerts?: SmartAlertItem[];
  summary?: Summary;
  subscription?: AlertsSubscription;
  generatedAt?: string;
  dispatchedAt?: string;
  error?: string;
};

type SmartAlertsPanelProps = {
  refreshKey: number;
};

const EMPTY_SUMMARY: Summary = {
  evaluatedUserCount: 0,
  triggeredCount: 0,
  readyCount: 0,
  deferredCount: 0,
  blockedCount: 0,
  suppressedCount: 0,
};

type BadgeTone = "neutral" | "success" | "warning" | "critical" | "info";

type RunHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
  mode: string;
  summary: Summary;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSeverityClassName(severity: SmartAlertItem["severity"]): string {
  if (severity === "high") {
    return "border-finance-border border-l-4 border-l-finance-red bg-white text-finance-text";
  }

  if (severity === "medium") {
    return "border-finance-border border-l-4 border-l-amber-500 bg-white text-finance-text";
  }

  return "border-finance-border border-l-4 border-l-finance-accent bg-white text-finance-text";
}

function formatMetric(metricLabel: string | null, metricValue: number | null): string {
  const normalizedLabel = metricLabel
    ? metricLabel
        .replace(/[_-]+/g, " ")
        .replace(/\bpct\b/gi, "percent")
        .replace(/\binr\b/gi, "INR")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Signal";

  if (metricValue === null) {
    return normalizedLabel;
  }

  const isPercentMetric = /pct|percent/i.test(metricLabel ?? "");
  const formattedValue = Number(metricValue).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  return `${normalizedLabel} • ${isPercentMetric ? `${formattedValue}%` : formattedValue}`;
}

function formatModeLabel(modeValue: string | null): string {
  if (!modeValue) {
    return "On-demand check";
  }

  if (modeValue === "user-daily") {
    return "Daily automation";
  }

  if (modeValue === "evaluate") {
    return "On-demand check";
  }

  return "Smart evaluation";
}

function routeStatusLabel(status: SmartAlertItem["routeStatus"]): string {
  if (status === "ready") {
    return "ready to notify";
  }

  if (status === "deferred") {
    return "scheduled for later";
  }

  if (status === "blocked") {
    return "needs your action";
  }

  return "already handled";
}

function dispatchStatusLabel(status: SmartAlertItem["dispatchStatus"]): string {
  if (status === "sent") {
    return "sent";
  }

  if (status === "failed") {
    return "delivery failed";
  }

  if (status === "skipped") {
    return "not sent";
  }

  return "pending";
}

function getRouteTone(status: SmartAlertItem["routeStatus"]): BadgeTone {
  if (status === "ready") {
    return "success";
  }

  if (status === "deferred") {
    return "warning";
  }

  if (status === "blocked") {
    return "critical";
  }

  return "neutral";
}

function getDispatchTone(status: SmartAlertItem["dispatchStatus"]): BadgeTone {
  if (status === "sent") {
    return "success";
  }

  if (status === "failed") {
    return "critical";
  }

  if (status === "skipped") {
    return "warning";
  }

  return "neutral";
}

function labelFromAlertType(alertType: string): string {
  if (alertType === "market_crash") {
    return "Crash Alert";
  }

  if (alertType === "rebalance") {
    return "Rebalance Drift";
  }

  if (alertType === "sip_due") {
    return "SIP Due";
  }

  if (alertType === "tax_deadline") {
    return "Tax Deadline";
  }

  return alertType;
}

export default function SmartAlertsPanel({ refreshKey }: SmartAlertsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDaily, setIsRunningDaily] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SmartAlertItem[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [mode, setMode] = useState<string>("evaluate");
  const [subscription, setSubscription] = useState<AlertsSubscription | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [lastDispatchedAt, setLastDispatchedAt] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  const pushHistory = useCallback((entry: RunHistoryItem) => {
    setRunHistory((previous) => [entry, ...previous].slice(0, 4));
  }, []);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.getSession();

    if (authError) {
      throw authError;
    }

    const token = data.session?.access_token;
    if (!token) {
      throw new Error("Authentication session expired. Please sign in again.");
    }

    return token;
  }, []);

  const callEndpoint = useCallback(
    async (url: string, method: "GET" | "POST"): Promise<AlertsPayload> => {
      const token = await getAccessToken();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as AlertsPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? "Smart alerts request failed.");
      }

      return payload;
    },
    [getAccessToken],
  );

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await callEndpoint("/api/agent/alerts", "GET");
      setAlerts(payload.alerts ?? []);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setMode(payload.mode ?? "evaluate");
      setSubscription(payload.subscription ?? null);
      setLastGeneratedAt(payload.generatedAt ?? null);
      pushHistory({
        id: `evaluate-${Date.now()}`,
        title: "Alerts evaluated",
        timestamp: payload.generatedAt ?? new Date().toISOString(),
        mode: payload.mode ?? "evaluate",
        summary: payload.summary ?? EMPTY_SUMMARY,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load smart alerts.");
    } finally {
      setIsLoading(false);
    }
  }, [callEndpoint, pushHistory]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts, refreshKey]);

  async function runDailyAutomation() {
    setIsRunningDaily(true);
    setError(null);

    try {
      const payload = await callEndpoint("/api/agent/alerts/daily", "POST");
      setAlerts(payload.alerts ?? []);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setMode(payload.mode ?? "user-daily");
      setSubscription(payload.subscription ?? null);
      setLastGeneratedAt(payload.generatedAt ?? null);
      setLastDispatchedAt(payload.dispatchedAt ?? payload.generatedAt ?? null);
      pushHistory({
        id: `dispatch-${Date.now()}`,
        title: "Daily automation executed",
        timestamp: payload.dispatchedAt ?? payload.generatedAt ?? new Date().toISOString(),
        mode: payload.mode ?? "user-daily",
        summary: payload.summary ?? EMPTY_SUMMARY,
      });
    } catch (dailyError) {
      setError(dailyError instanceof Error ? dailyError.message : "Could not run daily automation.");
    } finally {
      setIsRunningDaily(false);
    }
  }

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const severityRank = { high: 3, medium: 2, low: 1 };
      return severityRank[b.severity] - severityRank[a.severity];
    });
  }, [alerts]);

  return (
    <DashboardSectionCard
      eyebrow="Smart Alerts"
      title="Rule-driven risk and opportunity routing"
      description="Crash, rebalance, SIP due, and tax deadline alerts with channel-aware dispatching."
      actions={
        <SectionActionBar>
          <button
            type="button"
            onClick={() => void loadAlerts()}
            disabled={isLoading || isRunningDaily}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-finance-border px-4 text-sm font-semibold text-finance-text transition-all duration-150 hover:bg-finance-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh Alerts
          </button>
          <button
            type="button"
            onClick={() => void runDailyAutomation()}
            disabled={isLoading || isRunningDaily}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-finance-accent px-4 text-sm font-semibold text-white transition-all duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRunningDaily ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
            Run Daily Automation
          </button>
        </SectionActionBar>
      }
    >

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-finance-red/25 bg-finance-red/10 p-3 text-sm text-finance-red sm:p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <section className="mt-2 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Triggered" value={summary.triggeredCount} />
        <StatCard label="Ready to Send" value={summary.readyCount} tone="positive" />
        <StatCard label="Scheduled" value={summary.deferredCount} tone="warning" />
        <StatCard label="Needs Review" value={summary.blockedCount + summary.suppressedCount} tone="critical" />
      </section>

      <section className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-finance-border bg-finance-surface/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-finance-text">Automation Status</p>
            <p className="text-xs font-medium text-finance-muted">{formatModeLabel(mode)}</p>
          </div>
          <KeyValueGrid
            items={[
              { label: "Last evaluation", value: formatDateTime(lastGeneratedAt) },
              { label: "Last dispatch", value: formatDateTime(lastDispatchedAt) },
            ]}
          />
          {subscription ? (
            <div className="mt-3 rounded-lg border border-finance-border bg-white p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-finance-muted">
                  Plan: <span className="font-semibold capitalize text-finance-text">{subscription.plan}</span>
                </p>
                <p className="text-xs text-finance-muted">
                  Status: <span className="font-semibold capitalize text-finance-text">{subscription.status}</span>
                </p>
              </div>

              {subscription.canUseWhatsappChannel ? (
                <p className="mt-2 text-xs text-finance-green">WhatsApp delivery is included in your plan.</p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-amber-700">
                    {subscription.upgradeMessage ?? "Upgrade to unlock WhatsApp delivery."}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                    Upgrade
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </article>

        <article className="rounded-xl border border-finance-border bg-finance-surface/60 p-4 sm:p-5">
          <p className="text-xs font-semibold text-finance-text">Recent Activity</p>
          {runHistory.length === 0 ? (
            <p className="mt-2 text-sm text-finance-muted">No activity yet. Run an evaluation to build a timeline.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {runHistory.map((item) => (
                <div key={item.id} className="rounded-lg border border-finance-border bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(10,25,48,0.06)] sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-finance-text">{item.title}</p>
                    <p className="text-xs font-medium text-finance-muted">{formatDateTime(item.timestamp)}</p>
                  </div>
                  <p className="mt-1 text-xs text-finance-muted">
                    Ready {item.summary.readyCount} · Deferred {item.summary.deferredCount} · Blocked {item.summary.blockedCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {isLoading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-finance-muted sm:mt-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Evaluating smart alerts...
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="mt-5 sm:mt-6">
          <EmptyState
            title="No active alerts right now"
            description="Your portfolio signals look stable at the moment. Re-run daily automation or check again after market movement."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3 sm:mt-6">
          {sortedAlerts.map((alert, index) => (
            <article
              key={`${alert.alertType}-${index}`}
              className={`rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(10,25,48,0.08)] sm:p-5 ${getSeverityClassName(alert.severity)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  <p className="text-sm font-semibold">{labelFromAlertType(alert.alertType)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={routeStatusLabel(alert.routeStatus)} tone={getRouteTone(alert.routeStatus)} />
                  {alert.dispatchStatus ? (
                    <StatusBadge label={dispatchStatusLabel(alert.dispatchStatus)} tone={getDispatchTone(alert.dispatchStatus)} />
                  ) : null}
                </div>
              </div>

              <p className="mt-2 font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm leading-relaxed">{alert.message}</p>

              <div className="mt-3">
                <KeyValueGrid
                  items={[
                    { label: "Channel", value: alert.channel ?? "none" },
                    { label: "Destination", value: alert.destination ?? "not available" },
                    {
                      label: "Signal",
                      value: formatMetric(alert.metricLabel, alert.metricValue),
                    },
                    { label: "Route note", value: alert.routeReason },
                    { label: "Provider", value: alert.dispatchProvider ?? "pending" },
                  ]}
                />
              </div>
              {alert.dispatchError ? <p className="mt-2 text-xs text-finance-red">Dispatch error: {alert.dispatchError}</p> : null}
            </article>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  );
}