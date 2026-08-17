"use client";

import type { BusinessContext } from "../../lib/ai/businessContext";

type ExecutiveBriefingProps = {
  context: BusinessContext;
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExecutiveBriefing({
  context,
}: ExecutiveBriefingProps) {
  const risks = context.insights.filter(
    (item) => item.type === "risk"
  );

  const opportunities = context.insights.filter(
    (item) => item.type === "opportunity"
  );

  const topRisk = risks[0];

  /*
   * Opportunity signals must represent genuine growth potential.
   * Concentration signals are important, but they belong in the
   * attention/protection narrative rather than being labelled as
   * growth opportunities.
   */
  const growthOpportunities = opportunities.filter(
    (item) =>
      /growth|expansion|market|acquisition|sales|capacity|investment/i.test(
        `${item.title} ${item.finding} ${item.recommendation}`
      )
  );

  const topOpportunity =
    growthOpportunities[0] ?? opportunities[0];

  const opening =
    `The business generated ${money(
      context.financials.revenue
    )} in revenue and ${money(
      context.financials.grossProfit
    )} in gross profit, with a ${context.financials.grossMarginPct.toFixed(
      1
    )}% gross margin.`;

  const attention =
    topRisk
      ? `${topRisk.title}: ${topRisk.finding}`
      : "No material risk has been identified in the current intelligence signals.";

  const growth =
    topOpportunity
      ? `${topOpportunity.title}: ${topOpportunity.finding}`
      : "No material growth opportunity has been identified in the current intelligence signals.";

  const recommendation =
    topRisk
      ? topRisk.recommendation
      : topOpportunity
        ? topOpportunity.recommendation
        : "Continue monitoring the strongest business signals and investigate changes in revenue, margin and customer concentration.";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.2)]">

      <div className="border-b border-white/5 px-6 py-6 sm:px-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#7C5CFC]/15 bg-[#7C5CFC]/5 px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC] shadow-[0_0_9px_rgba(124,92,252,0.8)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A993FF]">
                Executive briefing
              </span>

            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              The business, at a glance.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A management-ready interpretation of the strongest
              signals in the current business data.
            </p>

          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Intelligence status
            </p>

            <div className="mt-1 flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5] shadow-[0_0_8px_rgba(25,211,197,0.8)]" />

              <span className="text-xs font-semibold text-slate-300">
                Based on analyzed data
              </span>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-2">

        <BriefingBlock
          label="Performance"
          title="What happened"
          text={opening}
          tone="neutral"
        />

        <BriefingBlock
          label="Attention"
          title="What matters"
          text={attention}
          tone="risk"
        />

        <BriefingBlock
          label="Growth"
          title="Where to look next"
          text={growth}
          tone="opportunity"
        />

        <BriefingBlock
          label="Management action"
          title="What to do"
          text={recommendation}
          tone="focus"
        />

      </div>

      <div className="border-t border-white/5 px-6 py-5 sm:px-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Executive takeaway
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {topRisk
                ? `Leadership should first address ${topRisk.title.toLowerCase()} while protecting the business areas already demonstrating strength.`
                : topOpportunity
                  ? `Leadership should evaluate ${topOpportunity.title.toLowerCase()} while continuing to monitor the wider business for emerging risks.`
                  : "Leadership should continue using the intelligence signals to prioritize decisions and investigate meaningful changes early."}
            </p>

          </div>

          <div className="shrink-0 rounded-xl border border-[#7C5CFC]/15 bg-[#7C5CFC]/5 px-4 py-3">

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#A993FF]">
              Ask Teketeke
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Explore the signals in more detail →
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

function BriefingBlock({
  label,
  title,
  text,
  tone,
}: {
  label: string;
  title: string;
  text: string;
  tone: "neutral" | "risk" | "opportunity" | "focus";
}) {
  const styles = {
    neutral: {
      label: "text-slate-600",
      border: "border-l-slate-700",
    },
    risk: {
      label: "text-[#FF8A8A]",
      border: "border-l-[#FF6B6B]",
    },
    opportunity: {
      label: "text-[#19D3C5]",
      border: "border-l-[#19D3C5]",
    },
    focus: {
      label: "text-[#A993FF]",
      border: "border-l-[#7C5CFC]",
    },
  }[tone];

  return (
    <article
      className={`border-l-2 ${styles.border} bg-[#091625] p-6`}
    >

      <p
        className={`text-[9px] font-bold uppercase tracking-[0.16em] ${styles.label}`}
      >
        {label}
      </p>

      <h3 className="mt-3 text-base font-semibold text-slate-100">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </article>
  );
}