"use client";

import type { BusinessContext } from "../../lib/ai/businessContext";

type RiskOpportunityRadarProps = {
  context: BusinessContext;
};

export default function RiskOpportunityRadar({
  context,
}: RiskOpportunityRadarProps) {
  const risks = context.insights
    .filter((item) => item.type === "risk")
    .slice(0, 3);

  const opportunities = context.insights
    .filter((item) => item.type === "opportunity")
    .filter((item) =>
      /growth|expansion|market|acquisition|sales|capacity|investment/i.test(
        `${item.title} ${item.finding} ${item.recommendation}`
      )
    )
    .slice(0, 3);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/5 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/15 bg-[#19D3C5]/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5] shadow-[0_0_9px_rgba(25,211,197,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
                Risk &amp; opportunity radar
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Where leadership should focus.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A concise view of the business signals that may require protection
              or investment.
            </p>
          </div>

          <div className="flex gap-2">
            <RadarCount label="Risks" value={risks.length} tone="risk" />
            <RadarCount
              label="Opportunities"
              value={opportunities.length}
              tone="opportunity"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-2">
        <RadarColumn
          label="Protect"
          title="Risks requiring attention"
          items={risks}
          tone="risk"
        />

        <RadarColumn
          label="Accelerate"
          title="Growth signals worth evaluating"
          items={opportunities}
          tone="opportunity"
        />
      </div>

      <div className="border-t border-white/5 px-6 py-5 sm:px-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
          Leadership lens
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
          {risks[0] && opportunities[0]
            ? `Protect against ${risks[0].title.toLowerCase()} while evaluating ${opportunities[0].title.toLowerCase()} as a potential growth lever.`
            : risks[0]
              ? `Prioritize ${risks[0].title.toLowerCase()} and monitor the wider business for emerging opportunities.`
              : opportunities[0]
                ? `Evaluate ${opportunities[0].title.toLowerCase()} while continuing to monitor emerging risks.`
                : "No material risk or growth signal requires immediate leadership attention."}
        </p>
      </div>
    </section>
  );
}

function RadarColumn({
  label,
  title,
  items,
  tone,
}: {
  label: string;
  title: string;
  items: BusinessContext["insights"];
  tone: "risk" | "opportunity";
}) {
  const colors =
    tone === "risk"
      ? {
          label: "text-[#FF8A8A]",
          border: "border-l-[#FF6B6B]",
          badge: "bg-[#FF6B6B]/10 text-[#FF8A8A]",
        }
      : {
          label: "text-[#19D3C5]",
          border: "border-l-[#19D3C5]",
          badge: "bg-[#19D3C5]/10 text-[#6DE7DC]",
        };

  return (
    <div className="bg-[#091625] p-6 sm:p-7">
      <p
        className={`text-[9px] font-bold uppercase tracking-[0.16em] ${colors.label}`}
      >
        {label}
      </p>

      <h3 className="mt-3 text-base font-semibold text-slate-100">
        {title}
      </h3>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              key={item.title}
              className={`border-l-2 ${colors.border} rounded-r-2xl bg-[#07111F] p-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  {item.title}
                </h4>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${colors.badge}`}
                >
                  {item.priority}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {item.finding}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-300">
                <span className="font-semibold text-slate-100">
                  Action:
                </span>{" "}
                {item.recommendation}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#07111F] p-4 text-xs text-slate-500">
            No material signals in this category.
          </div>
        )}
      </div>
    </div>
  );
}

function RadarCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "risk" | "opportunity";
}) {
  const className =
    tone === "risk"
      ? "border-[#FF6B6B]/10 bg-[#FF6B6B]/5 text-[#FF8A8A]"
      : "border-[#19D3C5]/10 bg-[#19D3C5]/5 text-[#6DE7DC]";

  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}