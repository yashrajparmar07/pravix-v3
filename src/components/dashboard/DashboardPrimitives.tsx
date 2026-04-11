import { ReactNode } from "react";

type ClassValue = string | false | null | undefined;

function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}

type DashboardSectionCardProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DashboardSectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: DashboardSectionCardProps) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-finance-border bg-white/95 shadow-[0_8px_22px_rgba(10,25,48,0.05)] backdrop-blur-[1px] transition-shadow duration-200",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-6 sm:gap-4 sm:px-7 sm:pt-7 md:px-9 md:pt-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-finance-muted">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-medium text-finance-text sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1.5 text-sm leading-relaxed text-finance-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2.5 sm:gap-2">{actions}</div> : null}
      </header>
      <div className={cx("px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6 md:px-9 md:pb-8", bodyClassName)}>{children}</div>
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "warning" | "critical" | "info";
};

function statToneClass(tone: StatCardProps["tone"]): string {
  if (tone === "positive") {
    return "text-finance-green";
  }

  if (tone === "warning") {
    return "text-amber-700";
  }

  if (tone === "critical") {
    return "text-finance-red";
  }

  if (tone === "info") {
    return "text-finance-accent";
  }

  return "text-finance-text";
}

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <article className="rounded-xl border border-finance-border bg-finance-panel p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(10,25,48,0.08)] sm:p-6">
      <p className="text-xs sm:text-sm font-medium text-finance-muted">{label}</p>
      <p className={cx("mt-2 text-lg font-semibold sm:mt-2.5 sm:text-xl", statToneClass(tone))}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-finance-muted">{hint}</p> : null}
    </article>
  );
}

type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "critical" | "info";
  className?: string;
};

function badgeToneClass(tone: StatusBadgeProps["tone"]): string {
  if (tone === "success") {
    return "border-finance-green/35 bg-finance-green/10 text-finance-green";
  }

  if (tone === "warning") {
    return "border-amber-300/40 bg-amber-100/60 text-amber-800";
  }

  if (tone === "critical") {
    return "border-finance-red/35 bg-finance-red/10 text-finance-red";
  }

  if (tone === "info") {
    return "border-finance-accent/25 bg-finance-accent/10 text-finance-accent";
  }

  return "border-finance-border bg-finance-surface text-finance-muted";
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex select-none items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
        badgeToneClass(tone),
        className,
      )}
    >
      {label}
    </span>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-finance-border bg-finance-surface/70 p-4 sm:p-5">
      <p className="text-sm font-semibold text-finance-text">{title}</p>
      <p className="mt-1.5 text-sm text-finance-muted">{description}</p>
      {action ? <div className="mt-3.5">{action}</div> : null}
    </div>
  );
}

type SectionActionBarProps = {
  children: ReactNode;
};

export function SectionActionBar({ children }: SectionActionBarProps) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

type KeyValueGridItem = {
  label: string;
  value: ReactNode;
};

type KeyValueGridProps = {
  items: KeyValueGridItem[];
  columns?: 1 | 2 | 3;
};

function getGridClass(columns: KeyValueGridProps["columns"]): string {
  if (columns === 1) {
    return "grid-cols-1";
  }

  if (columns === 3) {
    return "grid-cols-1 md:grid-cols-3";
  }

  return "grid-cols-1 md:grid-cols-2";
}

export function KeyValueGrid({ items, columns = 2 }: KeyValueGridProps) {
  return (
    <div className={cx("grid gap-1.5 text-[11px] sm:gap-2 sm:text-xs", getGridClass(columns))}>
      {items.map((item) => (
        <p key={`${item.label}-${String(item.value)}`}>
          <span className="text-finance-muted">{item.label}: </span>
          <span className="font-semibold text-finance-text">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

type ChecklistCardProps = {
  title: string;
  detail: string;
  urgency: "low" | "medium" | "high";
  actionLabel?: string;
};

export function ChecklistCard({ title, detail, urgency, actionLabel }: ChecklistCardProps) {
  const tone = urgency === "high" ? "critical" : urgency === "medium" ? "warning" : "neutral";

  return (
    <article className="rounded-xl border border-finance-border bg-finance-surface/40 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[auto] sm:p-5">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <p className="text-sm font-semibold leading-snug text-finance-text">{title}</p>
        <StatusBadge label={urgency} tone={tone} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-finance-text">{detail}</p>
      {actionLabel ? (
        <button
          type="button"
          className="mt-3 inline-flex h-9 items-center rounded-full border border-finance-border px-3.5 text-xs font-semibold text-finance-text transition-colors hover:bg-finance-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/30 active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

type AIInsightChipsProps = {
  items: string[];
  onClick?: (item: string) => void;
  disabled?: boolean;
};

export function AIInsightChips({ items, onClick, disabled = false }: AIInsightChipsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onClick?.(item)}
          disabled={disabled}
          className="inline-flex min-h-9 items-center rounded-full border border-finance-border px-3.5 text-xs font-semibold text-finance-text transition-all duration-150 hover:bg-finance-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finance-accent/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
