"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutomationReport } from "@/lib/automation/AutomationReportEngine";

type ReportResponse = {
  assessment: {
    id: string;
    organization: {
      name: string;
      industry?: string;
      location?: string;
      department?: string;
    };
    status: string;
  };
  report: AutomationReport;
};

export default function AutomationAssessmentReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (publicToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/report?token=${encodeURIComponent(publicToken)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to load the report.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadReport(publicToken);
    });
  }, [loadReport, params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing your automation assessment report...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">
            {error || "Report unavailable."}
          </p>
          {token && (
            <button
              type="button"
              onClick={() => void loadReport(token)}
              className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300"
            >
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  const { assessment, report } = data;
  const businessCase = report.businessCase;

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {report.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            A structured view of the current operation, automation
            opportunities, expected value, and recommended next steps.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            Executive summary
          </p>
          <p className="mt-4 text-base leading-7 text-slate-300">
            {report.executiveSummary}
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["People / roles", report.currentState.peopleCount],
            ["Systems", report.currentState.systemCount],
            ["Processes", report.currentState.processCount],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/10 bg-[#0A1422] p-5"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </section>

        {report.keyFindings.length > 0 && (
          <section className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              What we found
            </p>
            <div className="mt-3 space-y-2">
              {report.keyFindings.map((finding) => (
                <div
                  key={finding}
                  className="rounded-xl border border-white/8 bg-[#0A1422] px-5 py-4 text-sm leading-6 text-slate-300"
                >
                  {finding}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Automation opportunities
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Where automation can create value
              </h2>
            </div>
            <span className="rounded-full border border-[#19D3C5]/20 px-3 py-1 text-[10px] font-bold text-[#6DE7DC]">
              {report.opportunities.length} identified
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {report.opportunities.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-2xl border border-white/10 bg-[#0A1422] p-6"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {opportunity.title}
                      </h3>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {opportunity.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {opportunity.proposedAutomation}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-xl border border-[#19D3C5]/10 bg-[#050B14] px-5 py-3 text-center">
                    <p className="text-2xl font-semibold text-[#6DE7DC]">
                      {opportunity.automationScore}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                      automation score
                    </p>
                  </div>
                </div>

                {opportunity.estimatedWeeklyHoursSaved !== undefined && (
                  <p className="mt-4 text-xs text-slate-500">
                    Estimated potential time recovery:{" "}
                    <span className="font-semibold text-slate-300">
                      {opportunity.estimatedWeeklyHoursSaved} hrs/week
                    </span>
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {businessCase && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Potential business case
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Annual hours saved",
                  businessCase.estimatedAnnualHoursSaved,
                ],
                [
                  "Annual value",
                  businessCase.estimatedAnnualValue !== undefined
                    ? `$${businessCase.estimatedAnnualValue.toLocaleString()}`
                    : "—",
                ],
                [
                  "Implementation",
                  businessCase.estimatedImplementationCost !== undefined
                    ? `$${businessCase.estimatedImplementationCost.toLocaleString()}`
                    : "—",
                ],
                [
                  "Payback",
                  businessCase.estimatedPaybackMonths !== undefined
                    ? `${businessCase.estimatedPaybackMonths.toFixed(1)} mo`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/8 bg-[#050B14] p-4"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {typeof value === "number"
                      ? value.toLocaleString()
                      : value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-5 text-slate-600">
              These figures are estimates based on the information provided
              during discovery and should be validated before implementation.
            </p>
          </section>
        )}

        <section className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Recommended roadmap
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {report.roadmap.map((phase, index) => (
              <div
                key={phase.id}
                className="rounded-2xl border border-white/10 bg-[#0A1422] p-6"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6DE7DC]">
                  Phase {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  {phase.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {phase.objective}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  {phase.opportunityIds.length} opportunity
                  {phase.opportunityIds.length === 1 ? "" : "ies"} ·{" "}
                  {phase.estimatedDays} estimated days
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            Next steps
          </p>
          <ol className="mt-4 space-y-3">
            {report.recommendedNextSteps.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 text-sm leading-6 text-slate-300"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#19D3C5]/10 text-[10px] font-bold text-[#6DE7DC]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-10 border-t border-white/10 py-6 text-[10px] leading-5 text-slate-600">
          {assessment.organization.name} · Automation Intelligence Assessment
        </footer>
      </div>
    </main>
  );
}