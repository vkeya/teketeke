"use client";

import type { BusinessContext } from "../../lib/ai/businessContext";

type ExecutiveDecisionPanelProps = {
  context: BusinessContext;
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExecutiveDecisionPanel({
  context,
}: ExecutiveDecisionPanelProps) {
  const risks = context.insights
    .filter((item) => item.type === "risk")
    .sort((a, b) =>
      a.priority === b.priority
        ? 0
        : a.priority === "high"
          ? -1
          : 1
    )
    .slice(0, 3);

  const opportunities = context.insights
    .filter((item) => item.type === "opportunity")
    .sort((a, b) =>
      a.priority === b.priority
        ? 0
        : a.priority === "high"
          ? -1
          : 1
    )
    .slice(0, 3);

  /*
   * Keep executive decision labels semantically truthful.
   * Concentration signals are not automatically growth opportunities.
   * Prefer genuine growth/expansion signals for "Accelerate".
   */
  const growthOpportunities = opportunities.filter(
    (item) =>
      /growth|expansion|market|acquisition|sales|capacity|investment/i.test(
        `${item.title} ${item.finding} ${item.recommendation}`
      )
  );

  const primaryOpportunity =
    growthOpportunities[0] ?? opportunities[0];

  const decisions = [
    risks[0]
      ? {
          label: "Protect",
          title: risks[0].title,
          description: risks[0].finding,
          action: risks[0].recommendation,
          tone: "risk" as const,
        }
      : null,

    primaryOpportunity
      ? {
          label: "Accelerate",
          title: primaryOpportunity.title,
          description: primaryOpportunity.finding,
          action: primaryOpportunity.recommendation,
          tone: "opportunity" as const,
        }
      : null,

    context.leaders.country
      ? {
          label: "Focus",
          title: context.leaders.country.name,
          description: `${context.leaders.country.name} contributes ${context.leaders.country.sharePct.toFixed(
            1
          )}% of total revenue.`,
          action:
            "Understand the drivers of market performance and determine where the model can be replicated.",
          tone: "focus" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    title: string;
    description: string;
    action: string;
    tone: "risk" | "opportunity" | "focus";
  }>;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.22)]">

      <div className="border-b border-white/5 px-6 py-6 sm:px-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/15 bg-[#19D3C5]/5 px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5] shadow-[0_0_10px_rgba(25,211,197,0.8)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#19D3C5]">
                Executive intelligence
              </span>

            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              What deserves your attention?
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Teketeke converts the strongest business signals into
              a short list of decisions worth discussing.
            </p>

          </div>

          <div className="grid grid-cols-3 gap-2">

            <Metric
              label="Revenue"
              value={money(
                context.financials.revenue
              )}
            />

            <Metric
              label="Margin"
              value={`${context.financials.grossMarginPct.toFixed(
                1
              )}%`}
            />

            <Metric
              label="Risks"
              value={String(
                context.insights.filter(
                  (item) => item.type === "risk"
                ).length
              )}
            />

          </div>

        </div>

      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-3">

        {decisions.length > 0 ? (
          decisions.map((decision) => (
            <DecisionCard
              key={`${decision.label}-${decision.title}`}
              {...decision}
            />
          ))
        ) : (
          <div className="bg-[#091625] p-6 text-sm text-slate-500 md:col-span-3">
            No material decision signals are available yet.
          </div>
        )}

      </div>

      {(risks.length > 1 ||
        opportunities.length > 1) && (

        <div className="border-t border-white/5 px-6 py-5 sm:px-8">

          <div className="grid gap-6 md:grid-cols-2">

            {risks.length > 1 && (
              <SignalList
                title="Other risks"
                items={risks.slice(1)}
              />
            )}

            {growthOpportunities.length > 1 && (
              <SignalList
                title="Other opportunities"
                items={growthOpportunities.slice(1)}
              />
            )}

          </div>

        </div>

      )}

    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">

      <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-300">
        {value}
      </p>

    </div>
  );
}

function DecisionCard({
  label,
  title,
  description,
  action,
  tone,
}: {
  label: string;
  title: string;
  description: string;
  action: string;
  tone: "risk" | "opportunity" | "focus";
}) {
  const toneClasses = {
    risk: {
      badge: "bg-[#FF6B6B]/10 text-[#FF8A8A]",
      icon: "bg-[#FF6B6B]/10 text-[#FF8A8A]",
    },
    opportunity: {
      badge: "bg-[#19D3C5]/10 text-[#19D3C5]",
      icon: "bg-[#19D3C5]/10 text-[#19D3C5]",
    },
    focus: {
      badge: "bg-[#7C5CFC]/10 text-[#A993FF]",
      icon: "bg-[#7C5CFC]/10 text-[#A993FF]",
    },
  }[tone];

  return (
    <article className="bg-[#091625] p-6 transition hover:bg-white/[0.015]">

      <div className="flex items-center justify-between gap-3">

        <span
          className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] ${toneClasses.badge}`}
        >
          {label}
        </span>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${toneClasses.icon}`}
        >
          {tone === "risk"
            ? "!"
            : tone === "opportunity"
              ? "↗"
              : "◎"}
        </span>

      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-100">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-5 border-t border-white/5 pt-4">

        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
          Recommended action
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-300">
          {action}
        </p>

      </div>

    </article>
  );
}

function SignalList({
  title,
  items,
}: {
  title: string;
  items: BusinessContext["insights"];
}) {
  return (
    <div>

      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
        {title}
      </p>

      <div className="mt-3 space-y-2">

        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >

            <p className="text-xs font-semibold text-slate-300">
              {item.title}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {item.finding}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}