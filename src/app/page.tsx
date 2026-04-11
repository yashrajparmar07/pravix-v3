"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  ShieldCheck,
  Compass,
  BarChart3,
  Globe2,
  LineChart as LineChartIcon,
  Sparkles,
  BellRing,
  Calculator,
  MessageCircle,
  CircleUserRound,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SiteHeader from "@/components/SiteHeader";

type LiveChartPoint = {
  label: string;
  value: number;
  avg: number;
};

type LiveFxPoint = {
  label: string;
  rate: number;
  rolling: number;
};

type HomepageMarketPayload = {
  ok?: boolean;
  generatedAt?: string;
  sentimentSource?: "live" | "fallback";
  fxSource?: "live" | "fallback";
  fearGreedTrend?: LiveChartPoint[];
  usdInrTrend?: LiveFxPoint[];
  error?: string;
};

const fallbackSentimentTrend: LiveChartPoint[] = [
  { label: "Apr 01", value: 41, avg: 40 },
  { label: "Apr 02", value: 43, avg: 41 },
  { label: "Apr 03", value: 44, avg: 43 },
  { label: "Apr 04", value: 46, avg: 44 },
  { label: "Apr 05", value: 45, avg: 45 },
  { label: "Apr 06", value: 47, avg: 46 },
  { label: "Apr 07", value: 49, avg: 47 },
  { label: "Apr 08", value: 50, avg: 49 },
];

const fallbackFxTrend: LiveFxPoint[] = [
  { label: "Apr 01", rate: 83.09, rolling: 83.05 },
  { label: "Apr 02", rate: 83.18, rolling: 83.11 },
  { label: "Apr 03", rate: 83.24, rolling: 83.17 },
  { label: "Apr 04", rate: 83.21, rolling: 83.21 },
  { label: "Apr 05", rate: 83.31, rolling: 83.25 },
  { label: "Apr 06", rate: 83.35, rolling: 83.29 },
  { label: "Apr 07", rate: 83.27, rolling: 83.31 },
  { label: "Apr 08", rate: 83.42, rolling: 83.35 },
];

const allocationMixData = [
  { name: "Domestic Equity", value: 52 },
  { name: "Debt & Bonds", value: 24 },
  { name: "International Equity", value: 12 },
  { name: "Gold", value: 7 },
  { name: "Liquidity", value: 5 },
];

const moduleImpactData = [
  { module: "Alerts", score: 88 },
  { module: "Holdings", score: 93 },
  { module: "Tax", score: 81 },
  { module: "Profile", score: 76 },
  { module: "Copilot", score: 90 },
];

const taxEfficiencyData = [
  { quarter: "Q1", used: 28, potential: 40 },
  { quarter: "Q2", used: 47, potential: 63 },
  { quarter: "Q3", used: 71, potential: 84 },
  { quarter: "Q4", used: 96, potential: 100 },
];

const allocationColors = ["#2f7a70", "#b38a4a", "#86a9a3", "#6fa39a", "#ece6d8"];

const motionEase = [0.22, 1, 0.36, 1] as const;

function createSectionReveal(isCompactMotion: boolean) {
  return {
    hidden: { opacity: 0, y: isCompactMotion ? 14 : 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isCompactMotion ? 0.4 : 0.62,
        ease: motionEase,
      },
    },
  };
}

function createChartCardReveal(isCompactMotion: boolean) {
  return {
    hidden: { opacity: 0, y: isCompactMotion ? 12 : 24, scale: isCompactMotion ? 0.996 : 0.985 },
    show: (delayOrder: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isCompactMotion ? 0.38 : 0.56,
        delay: (isCompactMotion ? 0.045 : 0.08) * delayOrder,
        ease: motionEase,
      },
    }),
  };
}

function createFeatureCardReveal(isCompactMotion: boolean) {
  return {
    hidden: { opacity: 0, y: isCompactMotion ? 10 : 16, scale: isCompactMotion ? 0.997 : 0.992 },
    show: (delayOrder: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isCompactMotion ? 0.34 : 0.48,
        delay: (isCompactMotion ? 0.03 : 0.05) * delayOrder,
        ease: motionEase,
      },
    }),
  };
}

export default function Home() {
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [liveMarket, setLiveMarket] = useState<HomepageMarketPayload | null>(null);
  const [isLiveMarketLoading, setIsLiveMarketLoading] = useState(true);
  const [isCompactMotion, setIsCompactMotion] = useState(false);

  useEffect(() => {
    // Shorter fallback since no video is loaded
    const fallbackTimer = window.setTimeout(() => {
      setIsHeroReady(true);
    }, 500);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMotionDensity = () => {
      setIsCompactMotion(mediaQuery.matches);
    };

    updateMotionDensity();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMotionDensity);

      return () => {
        mediaQuery.removeEventListener("change", updateMotionDensity);
      };
    }

    mediaQuery.addListener(updateMotionDensity);

    return () => {
      mediaQuery.removeListener(updateMotionDensity);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveMarket() {
      setIsLiveMarketLoading(true);

      try {
        const response = await fetch("/api/market/homepage", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as HomepageMarketPayload;

        if (!cancelled) {
          if (response.ok && payload.ok) {
            setLiveMarket(payload);
          } else {
            setLiveMarket(null);
          }
        }
      } catch {
        if (!cancelled) {
          setLiveMarket(null);
        }
      } finally {
        if (!cancelled) {
          setIsLiveMarketLoading(false);
        }
      }
    }

    void loadLiveMarket();

    return () => {
      cancelled = true;
    };
  }, []);

  const sentimentChartData = liveMarket?.fearGreedTrend?.length
    ? liveMarket.fearGreedTrend
    : fallbackSentimentTrend;

  const fxChartData = liveMarket?.usdInrTrend?.length
    ? liveMarket.usdInrTrend
    : fallbackFxTrend;

  const sentimentSourceLabel = liveMarket?.sentimentSource === "live"
    ? "Live source: Alternative.me Fear & Greed Index"
    : "Fallback mode: sentiment baseline";

  const fxSourceLabel = liveMarket?.fxSource === "live"
    ? "Live source: Frankfurter USD/INR"
    : "Fallback mode: FX baseline";

  const sectionReveal = useMemo(() => createSectionReveal(isCompactMotion), [isCompactMotion]);
  const chartCardReveal = useMemo(() => createChartCardReveal(isCompactMotion), [isCompactMotion]);
  const featureCardReveal = useMemo(() => createFeatureCardReveal(isCompactMotion), [isCompactMotion]);

  const sectionViewport = { once: true, amount: isCompactMotion ? 0.12 : 0.22 };
  const denseSectionViewport = { once: true, amount: isCompactMotion ? 0.1 : 0.2 };
  const cardGridViewport = { once: true, amount: isCompactMotion ? 0.14 : 0.25 };
  const narrativeViewport = { once: true, amount: isCompactMotion ? 0.18 : 0.35 };

  return (
    <>
      {!isHeroReady && (
        <div className="fixed inset-0 z-[120] bg-white flex items-center justify-center">
          <div className="text-center px-6">
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-gray-200 border-t-finance-accent animate-spin" />
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-gray-400">Loading Pravix Experience</p>
          </div>
        </div>
      )}

      <SiteHeader />
      <div className={`flex flex-col min-h-screen transition-opacity duration-700 ${isHeroReady ? "opacity-100" : "opacity-0"}`}>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-finance-border/70 bg-finance-bg pt-24 pb-14 md:pt-28 md:pb-20">
          <div className="pointer-events-none absolute inset-0">
            <video
              aria-hidden="true"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/video/pravix%20hero%20video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,240,232,0.9),rgba(244,240,232,0.82)_42%,rgba(255,255,255,0.72)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(15,91,82,0.06),transparent_42%),radial-gradient(circle_at_82%_74%,rgba(179,138,74,0.08),transparent_48%)]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
              {/* Left: Life-outcome messaging */}
              <div className="max-w-2xl text-center lg:text-left">
                <p className="inline-flex items-center rounded-full border border-finance-border bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-finance-muted shadow-sm">
                  Goal-based wealth planning for modern Indian families
                </p>

                <h1 className="mt-6 text-balance text-[clamp(2.05rem,5.2vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-finance-text">
                  Turn life goals into a clear wealth plan
                </h1>

                <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-finance-muted md:text-lg">
                  Pravix helps you plan goals, track investments, optimize taxes, and get AI guidance in one place.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/onboarding"
                    className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-finance-accent px-7 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,91,82,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c4a43]"
                  >
                    Start your plan
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/learn"
                    className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-finance-border bg-white px-7 text-sm font-semibold text-finance-text transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2f7a70]/45 hover:bg-finance-surface"
                  >
                    See How It Works
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-finance-muted">Popular family goals</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                  {[
                    "Child education",
                    "Retirement",
                    "Home down payment",
                    "Emergency corpus",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-finance-border/80 bg-white px-3.5 py-2 text-xs font-medium text-finance-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Premium simplified dashboard mockup */}
              <div className="mx-auto w-full max-w-[32rem] lg:mx-0 lg:justify-self-end">
                <div className="relative">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-[94%] w-[94%] rounded-[1.8rem] border border-[#2f7a70]/12 bg-white/60" />
                  <div className="pointer-events-none absolute -left-4 bottom-4 h-[88%] w-[86%] rounded-[1.7rem] border border-[#b38a4a]/20 bg-[#f6f1e5]/70" />

                  <div className="relative rounded-[1.9rem] border border-finance-border bg-white p-5 shadow-[0_26px_46px_rgba(18,37,33,0.14)] sm:p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-finance-muted">Pravix Plan Snapshot</p>
                      <span className="rounded-full bg-[#ecf4f2] px-3 py-1 text-[11px] font-semibold text-finance-accent">Today</span>
                    </div>

                    <div className="mt-5 space-y-3.5">
                      <article className="rounded-2xl border border-finance-border bg-[#f9f7f1] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-finance-muted">Goal progress card</p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-finance-text">Home down payment</p>
                            <p className="mt-1 text-xs text-finance-muted">INR 13.6L of INR 20L target</p>
                          </div>
                          <span className="text-sm font-semibold text-finance-accent">68%</span>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-[#dce6e3]">
                          <div className="h-full w-[68%] rounded-full bg-finance-accent" />
                        </div>
                      </article>

                      <article className="rounded-2xl border border-finance-border bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-finance-muted">Next action card</p>
                        <p className="mt-2 text-sm font-semibold text-finance-text">Increase monthly SIP by INR 2,000</p>
                        <p className="mt-1 text-xs text-finance-muted">Keeps your retirement goal on schedule by Q4.</p>
                      </article>

                      <article className="rounded-2xl border border-[#b38a4a]/30 bg-[#fbf8f0] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-finance-muted">Tax runway widget</p>
                        <div className="mt-2 flex items-end justify-between">
                          <p className="text-sm font-semibold text-finance-text">Section 80C headroom</p>
                          <p className="text-sm font-semibold text-[#9a763b]">INR 42,000</p>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-[#eadfca]">
                          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#2f7a70] to-[#b38a4a]" />
                        </div>
                      </article>
                    </div>

                    <div className="mt-3 rounded-2xl border border-[#2f7a70]/30 bg-[#eef6f4] px-4 py-3 text-sm text-finance-text md:absolute md:-bottom-7 md:right-5 md:mt-0 md:max-w-[16rem] md:shadow-[0_14px_28px_rgba(15,91,82,0.15)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-finance-accent">AI recommendation bubble</p>
                      <p className="mt-1.5 leading-relaxed">Shift your next SIP split to 55% equity, 35% debt, and 10% gold for smoother goal progress.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: WHO PRAVIX IS FOR */}
        <motion.section
          id="why-goals"
          className="bg-[linear-gradient(180deg,#faf8f2_0%,#f4efe4_100%)] py-20 md:py-24"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={denseSectionViewport}
        >
          <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.article
                className="rounded-3xl border border-finance-border/80 bg-white p-7 shadow-[0_16px_34px_rgba(15,91,82,0.08)]"
                variants={featureCardReveal}
                custom={0}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f5b52]">Who It&apos;s For</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#0a1930] md:text-3xl">
                  Built for people planning real life goals.
                </h3>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {[
                    "Salaried professionals",
                    "Young families",
                    "Goal-based investors",
                    "Tax-conscious earners",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-finance-border bg-[#fbf8f1] px-4 py-3 text-sm font-medium text-[#324a45]">
                      {item}
                    </div>
                  ))}
                </div>
              </motion.article>

              <motion.article
                className="rounded-3xl border border-finance-border/80 bg-white p-7 shadow-[0_16px_34px_rgba(15,91,82,0.08)]"
                variants={featureCardReveal}
                custom={1}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f5b52]">Money Mistakes Pravix Helps Prevent</p>
                <div className="mt-5 space-y-2.5">
                  {[
                    "Missed SIPs and delayed monthly actions",
                    "Poor diversification and unnoticed concentration",
                    "Last-minute tax moves in March",
                    "Emotional reactions to market noise",
                  ].map((mistake) => (
                    <div key={mistake} className="rounded-xl border border-finance-border bg-[#fbf8f1] px-4 py-3 text-sm text-[#4f6180]">
                      {mistake}
                    </div>
                  ))}
                </div>
              </motion.article>
            </div>

            <motion.article
              className="mt-6 rounded-3xl border border-[#d8d0c0] bg-white p-7 shadow-[0_16px_34px_rgba(15,91,82,0.08)]"
              variants={featureCardReveal}
              custom={2}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f5b52]">Built For Indian Wealth Decisions</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#0a1930] md:text-3xl">
                Local context, family goals, and disciplined long-term planning.
              </h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {[
                  "INR-based goals",
                  "Section 80C and tax runway",
                  "Family-focused milestones",
                  "Monthly action nudges",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-[#0f5b52]/18 bg-[#f1eee4] px-3.5 py-2 text-xs font-semibold text-[#0f5b52]">
                    {item}
                  </span>
                ))}
              </div>
            </motion.article>
          </div>
        </motion.section>

        {/* SECTION 1: EXECUTIVE INTELLIGENCE LAYER */}
        <motion.section
          id="insights"
          className="relative overflow-hidden bg-[#1c302c] py-24 text-white md:py-28"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(179,138,74,0.14),transparent_42%),radial-gradient(circle_at_88%_85%,rgba(15,91,82,0.24),transparent_48%)]" />

          <div className="relative mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b38a4a]">Know What Matters This Month</p>
                <h3 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
                  Clear signals for your next money move.
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#d8ddd1] md:text-lg">
                  See what needs attention now, what can wait, and what action keeps your family goals on track.
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b38a4a]">Signals Pravix Checks For You</p>
                <motion.div className="mt-4 space-y-3" initial="hidden" whileInView="show" viewport={narrativeViewport}>
                  {[
                    "Market mood and INR trend for context",
                    "Goal progress and monthly plan health",
                    "SIP, rebalance, and tax nudges before deadlines",
                    "AI guidance with reason, risk note, and next step",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-[#f1eee4]"
                      variants={featureCardReveal}
                      custom={index}
                    >
                      {item}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <motion.div className="mt-10 grid gap-4 md:grid-cols-3" initial="hidden" whileInView="show" viewport={cardGridViewport}>
              {[
                {
                  icon: Sparkles,
                  title: "Monthly Goal Focus",
                  detail:
                    "Pravix highlights the one goal area where your action this week will matter most.",
                  metric: "Prioritized weekly",
                },
                {
                  icon: BellRing,
                  title: "Smart Alerts",
                  detail:
                    "Timely nudges help you avoid missed SIPs, drift, and last-minute tax pressure.",
                  metric: "Timely alerts",
                },
                {
                  icon: MessageCircle,
                  title: "Pravix AI Buddy",
                  detail:
                    "Get practical next actions in plain language, with clear reasoning and risk context.",
                  metric: "Action-ready guidance",
                },
              ].map((item, index) => (
                <motion.article
                  key={item.title}
                  className="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/14"
                  variants={featureCardReveal}
                  custom={index}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/10">
                    <item.icon className="h-5 w-5 text-[#b38a4a]" />
                  </div>
                  <h4 className="mt-4 text-xl font-semibold text-white">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#d8ddd1]">{item.detail}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#b38a4a]">{item.metric}</p>
                </motion.article>
              ))}
            </motion.div>

            <motion.div className="mt-10 grid gap-5 lg:grid-cols-3" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
              <motion.article
                className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm lg:col-span-2"
                variants={chartCardReveal}
                custom={0}
              >
                <div className="flex items-center gap-2">
                  <LineChartIcon className="h-4.5 w-4.5 text-[#b38a4a]" />
                  <p className="text-sm font-semibold text-white">Fear &amp; Greed Trend</p>
                </div>
                <p className="mt-1 text-xs text-[#d8ddd1]">
                  {isLiveMarketLoading ? "Loading live sentiment feed..." : sentimentSourceLabel}
                </p>
                <div className="mt-4 h-64">
                  {isHeroReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sentimentChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(219,234,254,0.18)" />
                        <XAxis dataKey="label" stroke="#c3cbc0" fontSize={12} />
                        <YAxis stroke="#c3cbc0" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                          formatter={(value, name) => [
                            `${Number(value ?? 0).toFixed(1)}`,
                            name === "value" ? "Index" : "3D Avg",
                          ]}
                          contentStyle={{ backgroundColor: "#2b3b37", borderColor: "#62756f", borderRadius: "10px" }}
                          labelStyle={{ color: "#ece6d8" }}
                          itemStyle={{ color: "#f6f3eb" }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#b38a4a" strokeWidth={2.8} dot={false} />
                        <Line type="monotone" dataKey="avg" stroke="#86a9a3" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl border border-white/20 bg-white/10" />
                  )}
                </div>
              </motion.article>

              <motion.article
                className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
                variants={chartCardReveal}
                custom={1}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4.5 w-4.5 text-[#b38a4a]" />
                  <p className="text-sm font-semibold text-white">Allocation Mix</p>
                </div>
                <p className="mt-1 text-xs text-[#d8ddd1]">A balanced goal-first structure with diversification controls</p>
                <div className="mt-4 h-56">
                  {isHeroReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationMixData}
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={86}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {allocationMixData.map((entry, index) => (
                            <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, "Weight"]}
                          contentStyle={{ backgroundColor: "#2b3b37", borderColor: "#62756f", borderRadius: "10px" }}
                          labelStyle={{ color: "#ece6d8" }}
                          itemStyle={{ color: "#f6f3eb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl border border-white/20 bg-white/10" />
                  )}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5">
                  {allocationMixData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs text-[#d8ddd1]">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                        {item.name}
                      </span>
                      <span className="font-semibold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </motion.article>

              <motion.article
                className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm lg:col-span-3"
                variants={chartCardReveal}
                custom={2}
              >
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4.5 w-4.5 text-[#b38a4a]" />
                  <p className="text-sm font-semibold text-white">USD/INR Drift (Live)</p>
                </div>
                <p className="mt-1 text-xs text-[#d8ddd1]">
                  {isLiveMarketLoading ? "Loading live FX feed..." : fxSourceLabel}
                </p>
                <div className="mt-4 h-56">
                  {isHeroReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fxChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sipGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b38a4a" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#b38a4a" stopOpacity={0.06} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(219,234,254,0.18)" />
                        <XAxis dataKey="label" stroke="#c3cbc0" fontSize={12} />
                        <YAxis stroke="#c3cbc0" fontSize={12} tickFormatter={(value) => `${Number(value).toFixed(2)}`} />
                        <Tooltip
                          formatter={(value, name) => [
                            `${Number(value ?? 0).toFixed(3)}`,
                            name === "rate" ? "USD/INR" : "3D Avg",
                          ]}
                          contentStyle={{ backgroundColor: "#2b3b37", borderColor: "#62756f", borderRadius: "10px" }}
                          labelStyle={{ color: "#ece6d8" }}
                          itemStyle={{ color: "#f6f3eb" }}
                        />
                        <Area type="monotone" dataKey="rolling" stroke="#86a9a3" fill="transparent" strokeDasharray="7 4" />
                        <Area type="monotone" dataKey="rate" stroke="#b38a4a" fill="url(#sipGradient)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl border border-white/20 bg-white/10" />
                  )}
                </div>
              </motion.article>
            </motion.div>
          </div>
        </motion.section>

        {/* SECTION 2: DASHBOARD MODULES */}
        <motion.section
          id="platform"
          className="bg-[linear-gradient(180deg,#faf7f0_0%,#f3efe5_100%)] py-24 md:py-28"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={denseSectionViewport}
        >
          <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f5b52]">What You Can Do With Pravix</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1930] md:text-5xl">
                  Feature clusters built around your outcomes.
                </h2>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 self-start rounded-full border border-[#0f5b52]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f5b52] transition-colors hover:bg-[#f1eee4]"
              >
                View dashboard preview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <motion.div className="mt-8 grid gap-5 lg:grid-cols-3" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
              {[
                {
                  title: "Plan smarter",
                  summary: "Set goals clearly, personalize risk, and build the right baseline allocation.",
                  items: ["Smart onboarding", "Goal setup", "Risk profile"],
                },
                {
                  title: "Act on time",
                  summary: "Stay consistent with monthly actions instead of reacting late.",
                  items: ["Smart alerts", "Focus ranking", "Monthly checklist"],
                },
                {
                  title: "Optimize wealth",
                  summary: "Improve long-term outcomes across tax, holdings, and guided decisions.",
                  items: ["Tax assistant", "Holdings analysis", "Pravix AI Buddy"],
                },
              ].map((cluster, index) => (
                <motion.article
                  key={cluster.title}
                  className="rounded-2xl border border-[#d7d0c1] bg-white p-5 shadow-[0_12px_28px_rgba(15,91,82,0.08)]"
                  variants={featureCardReveal}
                  custom={index}
                >
                  <h3 className="text-xl font-bold text-[#0a1930]">{cluster.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#50607d]">{cluster.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cluster.items.map((item) => (
                      <span key={item} className="rounded-full border border-[#0f5b52]/20 bg-[#f1eee4] px-3 py-1 text-xs font-semibold text-[#0f5b52]">
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </motion.div>

            <p className="mt-8 text-sm text-[#4f6180]">
              Every module below remains available. They now work together to help you plan smarter, act on time, and optimize wealth.
            </p>

            <motion.div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
              {[
                {
                  icon: BellRing,
                  title: "Smart Alerts Panel",
                  desc: "Proactive signal routing for market crash, SIP due, rebalance drift, and tax deadline conditions.",
                  badge: "Risk Radar",
                },
                {
                  icon: BarChart3,
                  title: "Holdings Analyzer",
                  desc: "Manual or CSV holdings ingestion, allocation analytics, sector exposure, and concentration warnings.",
                  badge: "Portfolio Depth",
                },
                {
                  icon: Calculator,
                  title: "Tax Optimization Assistant",
                  desc: "Tracks Section 80C progress, regime direction, and practical monthly tax actions before FY close.",
                  badge: "Tax Clarity",
                },
                {
                  icon: Sparkles,
                  title: "Next Best Action Engine",
                  desc: "Combines goals, alerts, holdings, and tax context to show what needs attention first.",
                  badge: "Action Priority",
                },
                {
                  icon: MessageCircle,
                  title: "Pravix AI Buddy",
                  desc: "Conversational guidance with recommendation, reason, risk warning, and next action in every response.",
                  badge: "Human + AI",
                },
                {
                  icon: CircleUserRound,
                  title: "Secure Profile Core",
                  desc: "Authenticated sessions and user-scoped data access ensure your financial context stays private.",
                  badge: "Trust Layer",
                },
              ].map((module, index) => (
                <motion.article
                  key={module.title}
                  className="rounded-2xl border border-[#d7d0c1] bg-white p-6 shadow-[0_14px_34px_rgba(15,91,82,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-[#0f5b52]/30"
                  variants={featureCardReveal}
                  custom={index}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1eee4] text-[#0f5b52]">
                      <module.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[#0f5b52]/20 bg-[#f1eee4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f5b52]">
                      {module.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-[#0a1930]">{module.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#50607d]">{module.desc}</p>
                </motion.article>
              ))}
            </motion.div>

            <motion.div className="mt-12 grid gap-5 lg:grid-cols-2" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
              <motion.article
                className="rounded-3xl border border-[#d7d0c1] bg-white p-6 shadow-[0_14px_34px_rgba(15,91,82,0.08)]"
                variants={chartCardReveal}
                custom={0}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-[#0f5b52]" />
                  <p className="text-sm font-semibold text-[#0a1930]">Module Impact Index</p>
                </div>
                <p className="mt-1 text-xs text-[#60739a]">How strongly each module contributes to monthly execution quality</p>
                <div className="mt-4 h-64">
                  {isHeroReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moduleImpactData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4ddd0" />
                        <XAxis dataKey="module" stroke="#6f7d76" fontSize={12} />
                        <YAxis stroke="#6f7d76" fontSize={12} />
                        <Tooltip
                          formatter={(value) => [`${Number(value ?? 0).toFixed(0)}/100`, "Impact"]}
                          contentStyle={{ backgroundColor: "#fbf8f1", borderColor: "#cfc8bb", borderRadius: "10px" }}
                          labelStyle={{ color: "#2d3b37" }}
                          itemStyle={{ color: "#3f5b55" }}
                        />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#0f5b52" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl border border-[#d7d0c1] bg-[#f2ede3]" />
                  )}
                </div>
              </motion.article>

              <motion.article
                className="rounded-3xl border border-[#d7d0c1] bg-white p-6 shadow-[0_14px_34px_rgba(15,91,82,0.08)]"
                variants={chartCardReveal}
                custom={1}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-[#0f5b52]" />
                  <p className="text-sm font-semibold text-[#0a1930]">Tax Efficiency Runway</p>
                </div>
                <p className="mt-1 text-xs text-[#60739a]">Quarterly progression of 80C utilization versus potential optimization path</p>
                <div className="mt-4 h-64">
                  {isHeroReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={taxEfficiencyData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4ddd0" />
                        <XAxis dataKey="quarter" stroke="#6f7d76" fontSize={12} />
                        <YAxis stroke="#6f7d76" fontSize={12} tickFormatter={(value) => `${value}%`} />
                        <Tooltip
                          formatter={(value) => [`${Number(value ?? 0).toFixed(0)}%`, "Coverage"]}
                          contentStyle={{ backgroundColor: "#fbf8f1", borderColor: "#cfc8bb", borderRadius: "10px" }}
                          labelStyle={{ color: "#2d3b37" }}
                          itemStyle={{ color: "#3f5b55" }}
                        />
                        <Line type="monotone" dataKey="potential" stroke="#86a9a3" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                        <Line type="monotone" dataKey="used" stroke="#0f5b52" strokeWidth={2.6} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl border border-[#d7d0c1] bg-[#f2ede3]" />
                  )}
                </div>
              </motion.article>
            </motion.div>
          </div>
        </motion.section>

        {/* SECTION 3: HUMAN JOURNEY + EMOTIONAL CONNECT */}
        <motion.section
          id="how-it-works"
          className="border-y border-finance-border/70 bg-white py-24 md:py-28"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={denseSectionViewport}
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f5b52]">How Pravix Works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1930] md:text-5xl">
                A simple four-step path from goals to action.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#50607d] md:text-lg">
                Share your goals, get a clear roadmap, follow monthly actions, and adjust with AI plus expert support.
              </p>

              <motion.div className="mt-10 space-y-4" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
                {[
                  {
                    step: "01",
                    title: "Tell us your goals",
                    detail: "Capture your milestones, income profile, risk comfort, and preferences in one guided flow.",
                    icon: CircleUserRound,
                  },
                  {
                    step: "02",
                    title: "Get your wealth roadmap",
                    detail: "See a practical starting plan across goals, allocation, tax runway, and monthly focus.",
                    icon: Target,
                  },
                  {
                    step: "03",
                    title: "Track progress and monthly actions",
                    detail: "Stay disciplined with timely nudges, checklists, and progress tracking across each goal.",
                    icon: RefreshCcw,
                  },
                  {
                    step: "04",
                    title: "Adjust with AI + expert support",
                    detail: "Use Pravix AI Buddy and advisor guidance to refine the plan as life and markets change.",
                    icon: Compass,
                  },
                ].map((item, index) => (
                  <motion.article
                    key={item.step}
                    className="rounded-2xl border border-finance-border/70 bg-[#fbf8f1] p-5 sm:p-6"
                    variants={featureCardReveal}
                    custom={index}
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f5b52] text-white">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0f5b52]">Step {item.step}</p>
                        <h3 className="mt-1 text-lg font-bold text-[#0a1930]">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#586987]">{item.detail}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>

            <div className="rounded-3xl border border-[#d8e7ff] bg-[linear-gradient(160deg,#1d3a35_0%,#24584f_58%,#0f5b52_100%)] p-8 text-white shadow-[0_24px_56px_rgba(10,25,48,0.24)] sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b38a4a]">Why Families Choose Pravix</p>
              <h3 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                Not just better returns.
                <br />
                Better financial behavior.
              </h3>

              <motion.div className="mt-7 space-y-5" initial="hidden" whileInView="show" viewport={cardGridViewport}>
                {[
                  {
                    icon: ShieldCheck,
                    title: "Disciplined decisioning",
                    detail: "Priority scoring and checklist-driven execution reduce emotional investing mistakes.",
                  },
                  {
                    icon: Sparkles,
                    title: "Transparent intelligence",
                    detail: "Every suggestion surfaces why it matters, risk implications, and what to do next.",
                  },
                  {
                    icon: BellRing,
                    title: "Timely interventions",
                    detail: "Automated nudges keep goals on track before missed SIPs, drifts, or tax gaps become expensive.",
                  },
                ].map((point, index) => (
                  <motion.div
                    key={point.title}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm"
                    variants={featureCardReveal}
                    custom={index}
                  >
                    <div className="flex items-start gap-3">
                      <point.icon className="mt-0.5 h-5 w-5 text-[#b38a4a]" />
                      <div>
                        <p className="text-base font-semibold text-white">{point.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#d8ddd1]">{point.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-8 rounded-2xl border border-white/25 bg-white/10 px-4 py-3.5 text-sm text-[#f1eee4]">
                Pravix is designed to make wealth planning feel calm, clear, and confident even during uncertain markets.
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 4: TRUST + LEARN + PREMIUM CTA */}
        <motion.section
          id="contact"
          className="relative overflow-hidden bg-[#1a2a26] py-24 text-white md:py-28"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={denseSectionViewport}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(179,138,74,0.12),transparent_40%)]" />

          <div className="relative mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
            <motion.div className="grid gap-6 md:grid-cols-3" initial="hidden" whileInView="show" viewport={denseSectionViewport}>
              {[
                {
                  title: "Secure private profile",
                  desc: "Authenticated sessions with user-scoped access and robust backend enforcement for profile privacy.",
                },
                {
                  title: "Educational guidance with transparent reasoning",
                  desc: "Each recommendation explains what changed, why it matters, and what you can do next.",
                },
                {
                  title: "Human + AI support",
                  desc: "Use self-serve guidance daily, and connect with an expert when you want deeper confidence.",
                },
              ].map((item, index) => (
                <motion.article
                  key={item.title}
                  className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm"
                  variants={featureCardReveal}
                  custom={index}
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#d8ddd1]">{item.desc}</p>
                </motion.article>
              ))}
            </motion.div>

            <div className="mt-6 rounded-2xl border border-white/20 bg-white/8 px-5 py-4 text-sm leading-relaxed text-[#d8ddd1]">
              Pravix provides educational guidance and planning support. It does not promise guaranteed returns and does not replace personalized licensed investment advice.
            </div>

            <div className="mt-14 rounded-3xl border border-[#40635d] bg-[linear-gradient(135deg,#1a322d_0%,#255449_58%,#0f5b52_100%)] p-8 shadow-[0_24px_58px_rgba(0,0,0,0.28)] sm:p-10 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b38a4a]">Start With Confidence</p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight text-white md:text-5xl">
                    Stay on track for every major life goal.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[#d8ddd1] md:text-lg">
                    Begin with guided onboarding, follow clear monthly actions, and use Pravix support whenever you need it.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[17rem]">
                  <Link
                    href="/onboarding"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#255449] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                  >
                    Start your plan
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/onboarding?mode=advisor"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Talk to an expert
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-transparent px-6 text-sm font-semibold text-[#d8ddd1] transition-colors hover:bg-white/10"
                  >
                    View dashboard preview
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="fixed inset-x-0 bottom-3 z-40 px-4 sm:hidden">
          <Link
            href="/onboarding"
            className="mx-auto flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-finance-accent text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,91,82,0.34)]"
          >
            Start your plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </>
  );
}


