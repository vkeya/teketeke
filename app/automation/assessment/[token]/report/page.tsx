 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function formatNumber(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function formatCurrency(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function priorityClass(priority: string): string {
  if (priority === "critical") {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }
  if (priority === "high") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }
  return "border-white/10 bg-white/[0.03] text-slate-400";
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#050B14] px-4 py-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p
        className={`mt-1.5 text-xl font-semibold ${
          accent ? "text-[#6DE7DC]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AutomationAssessmentReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hourlyValue, setHourlyValue] = useState("");
  const [implementationCost, setImplementationCost] =
    useState("");
  const [implementationDays, setImplementationDays] =
    useState("");
  const [implementationRate, setImplementationRate] =
    useState("");

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
        throw new Error(
          result.error ?? "Unable to load the report."
        );
      }

      setData(result);

      const existing = result.report.businessCase;
      if (existing?.estimatedAnnualValue !== undefined) {
        const annualHours =
          existing.estimatedAnnualHoursSaved ?? 0;

        if (annualHours > 0) {
          setHourlyValue(
            String(
              Math.round(
                existing.estimatedAnnualValue /
                  annualHours
              )
            )
          );
        }
      }
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

  const opportunities = data?.report.opportunities ?? [];

  const annualHours = useMemo(
    () =>
      opportunities.reduce(
        (total, opportunity) =>
          total +
          (opportunity.estimatedWeeklyHoursSaved ?? 0) *
            52,
        0
      ),
    [opportunities]
  );

  const hourlyValueNumber = Number(hourlyValue);
  const directImplementationCost = Number(
    implementationCost
  );
  const implementationDaysNumber = Number(
    implementationDays
  );
  const implementationRateNumber = Number(
    implementationRate
  );

  const calculatedAnnualValue =
    hourlyValue.trim() &&
    Number.isFinite(hourlyValueNumber) &&
    hourlyValueNumber >= 0
      ? annualHours * hourlyValueNumber
      : undefined;

  const calculatedImplementationCost =
    implementationCost.trim() &&
    Number.isFinite(directImplementationCost) &&
    directImplementationCost >= 0
      ? directImplementationCost
      : implementationDays.trim() &&
          implementationRate.trim() &&
          Number.isFinite(implementationDaysNumber) &&
          Number.isFinite(implementationRateNumber) &&
          implementationDaysNumber >= 0 &&
          implementationRateNumber >= 0
        ? implementationDaysNumber *
          implementationRateNumber
        : undefined;

  const calculatedPayback =
    calculatedAnnualValue !== undefined &&
    calculatedAnnualValue > 0 &&
    calculatedImplementationCost !== undefined
      ? (calculatedImplementationCost /
          calculatedAnnualValue) *
        12
      : undefined;

  const calculatedRoi =
    calculatedAnnualValue !== undefined &&
    calculatedImplementationCost !== undefined &&
    calculatedImplementationCost > 0
      ? ((calculatedAnnualValue -
          calculatedImplementationCost) /
          calculatedImplementationCost) *
        100
      : undefined;

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

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {assessment.organization.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Automation assessment
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Status
              </p>
              <p className="mt-1 text-xs font-semibold uppercase text-[#6DE7DC]">
                {assessment.status.replace("_", " ")}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
                Executive impact
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {opportunities.length} automation{" "}
                {opportunities.length === 1
                  ? "opportunity"
                  : "opportunities"}{" "}
                identified
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {calculatedAnnualValue !== undefined
                  ? `${formatNumber(annualHours)} hours/year potentially recoverable · ${formatCurrency(calculatedAnnualValue)} estimated annual value.`
                  : `${formatNumber(annualHours)} hours/year potentially recoverable. Enter business-case assumptions below to calculate financial impact.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:w-[58%]">
              <Metric
                label="Hours / year"
                value={formatNumber(annualHours)}
                accent
              />
              <Metric
                label="Annual value"
                value={formatCurrency(calculatedAnnualValue)}
                accent
              />
              <Metric
                label="Payback"
                value={
                  calculatedPayback !== undefined
                    ? `${calculatedPayback.toFixed(1)} mo`
                    : "—"
                }
              />
              <Metric
                label="Year 1 ROI"
                value={
                  calculatedRoi !== undefined
                    ? `${calculatedRoi.toFixed(0)}%`
                    : "—"
                }
                accent
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A1422] p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Business case assumptions
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Adjust the economics
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
              Enter the values you know. The results update immediately.
              Implementation cost can be entered directly or calculated
              from implementation days × rate/day.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="rounded-xl border border-white/10 bg-[#050B14] p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Value / hour
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={hourlyValue}
                  onChange={(event) =>
                    setHourlyValue(event.target.value)
                  }
                  placeholder="e.g. 35"
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
                />
              </div>
            </label>

            <label className="rounded-xl border border-white/10 bg-[#050B14] p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Implementation cost
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={implementationCost}
                  onChange={(event) => {
                    setImplementationCost(
                      event.target.value
                    );
                    if (event.target.value) {
                      setImplementationDays("");
                      setImplementationRate("");
                    }
                  }}
                  placeholder="e.g. 7500"
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
                />
              </div>
            </label>

            <label className="rounded-xl border border-white/10 bg-[#050B14] p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Implementation days
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={implementationDays}
                onChange={(event) => {
                  setImplementationDays(
                    event.target.value
                  );
                  if (event.target.value) {
                    setImplementationCost("");
                  }
                }}
                placeholder="e.g. 12"
                className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
              />
            </label>

            <label className="rounded-xl border border-white/10 bg-[#050B14] p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Rate / day
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={implementationRate}
                  onChange={(event) => {
                    setImplementationRate(
                      event.target.value
                    );
                    if (event.target.value) {
                      setImplementationCost("");
                    }
                  }}
                  placeholder="e.g. 600"
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-700"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-[#19D3C5]/15 bg-[#19D3C5]/5 px-4 py-3">
            <p className="text-xs text-slate-400">
              {calculatedImplementationCost !== undefined
                ? `Estimated implementation: ${formatCurrency(calculatedImplementationCost)}`
                : "Enter an implementation cost or implementation days and rate/day."}
              {" · "}
              {calculatedAnnualValue !== undefined
                ? `Annual value: ${formatCurrency(calculatedAnnualValue)}`
                : "Enter value/hour to calculate annual value."}
            </p>
          </div>
        </section>

        {report.keyFindings.length > 0 && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A1422] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Key findings
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {report.keyFindings.map((finding) => (
                <div
                  key={finding}
                  className="rounded-xl border border-white/8 bg-[#050B14] px-4 py-3 text-sm font-medium text-slate-300"
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
                Priority opportunities
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Where value can be created
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {opportunities.length} identified
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {opportunities.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-2xl border border-white/10 bg-[#0A1422] p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {opportunity.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${priorityClass(
                          opportunity.priority
                        )}`}
                      >
                        {opportunity.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {opportunity.proposedAutomation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[440px]">
                    <Metric
                      label="Impact"
                      value={opportunity.impactScore}
                      accent
                    />
                    <Metric
                      label="Feasibility"
                      value={opportunity.feasibilityScore}
                    />
                    <Metric
                      label="Risk"
                      value={opportunity.riskScore}
                    />
                    <Metric
                      label="Auto score"
                      value={opportunity.automationScore}
                      accent
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-2 border-t border-white/6 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                      Time recovered
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {opportunity.estimatedWeeklyHoursSaved !==
                      undefined
                        ? `${formatNumber(
                            opportunity.estimatedWeeklyHoursSaved
                          )} hrs/week`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                      Value / year
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {hourlyValue.trim()
                        ? formatCurrency(
                            (opportunity.estimatedWeeklyHoursSaved ??
                              0) *
                              52 *
                              hourlyValueNumber
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                      Implementation
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {calculatedImplementationCost !==
                      undefined
                        ? formatCurrency(
                            calculatedImplementationCost
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-8 border-t border-white/10 py-5 text-[10px] text-slate-600">
          {assessment.organization.name} · Automation Intelligence Assessment
        </footer>
      </div>
    </main>
  );
}