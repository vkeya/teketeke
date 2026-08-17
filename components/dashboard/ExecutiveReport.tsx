"use client";

import type { BusinessContext } from "../../lib/ai/businessContext";

type ExecutiveReportProps = {
  context: BusinessContext;
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExecutiveReport({
  context,
}: ExecutiveReportProps) {
  const risks = context.insights.filter(
    (item) => item.type === "risk"
  );

  const opportunities = context.insights.filter(
    (item) => item.type === "opportunity"
  );

  const topRisk = risks[0];
  const topOpportunity = opportunities.find((item) =>
    /growth|expansion|market|acquisition|sales|capacity|investment/i.test(
      `${item.title} ${item.finding} ${item.recommendation}`
    )
  ) ?? opportunities[0];

  const focusMarket = context.leaders.country;
  const focusCustomer = context.leaders.customer;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.2)]">

      <div className="border-b border-white/5 px-6 py-7 sm:px-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#A993FF]/15 bg-[#A993FF]/5 px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#A993FF] shadow-[0_0_9px_rgba(169,147,255,0.8)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A993FF]">
                Executive report
              </span>

            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Business performance &amp; priorities
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A concise management view of performance, material risks,
              growth opportunities and the decisions that deserve attention.
            </p>

          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Prepared by
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-300">
              Teketeke Intelligence
            </p>

          </div>

        </div>

      </div>

      <div className="grid gap-px bg-white/5 sm:grid-cols-3">

        <ReportMetric
          label="Revenue"
          value={money(context.financials.revenue)}
        />

        <ReportMetric
          label="Gross profit"
          value={money(context.financials.grossProfit)}
        />

        <ReportMetric
          label="Gross margin"
          value={`${context.financials.grossMarginPct.toFixed(1)}%`}
        />

      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-2">

        <ReportSection
          label="Executive summary"
          title="Where the business stands"
        >
          <p>
            {`The business generated ${money(
              context.financials.revenue
            )} in revenue and ${money(
              context.financials.grossProfit
            )} in gross profit, producing a ${context.financials.grossMarginPct.toFixed(
              1
            )}% gross margin.`}
          </p>
        </ReportSection>

        <ReportSection
          label="Priority"
          title="What leadership should address"
          tone="risk"
        >
          <p>
            {topRisk
              ? `${topRisk.title}: ${topRisk.finding}`
              : "No material risk has been identified in the current intelligence signals."}
          </p>
        </ReportSection>

        <ReportSection
          label="Growth"
          title="Where leadership can look next"
          tone="opportunity"
        >
          <p>
            {topOpportunity
              ? `${topOpportunity.title}: ${topOpportunity.finding}`
              : "No material growth opportunity has been identified in the current intelligence signals."}
          </p>
        </ReportSection>

        <ReportSection
          label="Strategic focus"
          title="What deserves deeper attention"
          tone="focus"
        >
          <div className="space-y-3">

            {focusMarket && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  Leading market
                </p>
                <p className="mt-1">
                  {focusMarket.name} contributes{" "}
                  {focusMarket.sharePct.toFixed(1)}% of revenue.
                </p>
              </div>
            )}

            {focusCustomer && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  Largest customer
                </p>
                <p className="mt-1">
                  {focusCustomer.name} contributes{" "}
                  {focusCustomer.sharePct.toFixed(1)}% of revenue.
                </p>
              </div>
            )}

          </div>
        </ReportSection>

      </div>

      <div className="border-t border-white/5 px-6 py-7 sm:px-8">

        <div className="grid gap-6 lg:grid-cols-2">

          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Recommended priorities
            </p>

            <ol className="mt-4 space-y-3">

              {[
                topRisk?.recommendation,
                topOpportunity?.recommendation,
                "Continue monitoring revenue concentration, margin and overdue balances.",
              ]
                .filter(Boolean)
                .slice(0, 3)
                .map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#A993FF]/10 text-[10px] font-bold text-[#A993FF]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}

            </ol>

          </div>

          <div className="rounded-2xl border border-[#A993FF]/10 bg-[#A993FF]/[0.035] p-5">

            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#A993FF]">
              Board-level takeaway
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-200">
              {topRisk && topOpportunity
                ? `Protect the current revenue base while evaluating ${topOpportunity.title.toLowerCase()} as a growth lever.`
                : topRisk
                  ? `Prioritize ${topRisk.title.toLowerCase()} while protecting the business areas already demonstrating strength.`
                  : topOpportunity
                    ? `Evaluate ${topOpportunity.title.toLowerCase()} while continuing to monitor emerging risks.`
                    : "Use the current intelligence signals to prioritize management attention and investigate meaningful changes early."}
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#091625] px-6 py-5">

      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>

    </div>
  );
}

function ReportSection({
  label,
  title,
  tone = "neutral",
  children,
}: {
  label: string;
  title: string;
  tone?: "neutral" | "risk" | "opportunity" | "focus";
  children: React.ReactNode;
}) {
  const labelClass = {
    neutral: "text-slate-600",
    risk: "text-[#FF8A8A]",
    opportunity: "text-[#19D3C5]",
    focus: "text-[#A993FF]",
  }[tone];

  return (
    <article className="bg-[#091625] p-6 sm:p-7">

      <p
        className={`text-[9px] font-bold uppercase tracking-[0.16em] ${labelClass}`}
      >
        {label}
      </p>

      <h3 className="mt-3 text-base font-semibold text-slate-100">
        {title}
      </h3>

      <div className="mt-3 text-sm leading-7 text-slate-400">
        {children}
      </div>

    </article>
  );
}