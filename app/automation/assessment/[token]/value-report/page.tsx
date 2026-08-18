"use client";

import { useCallback, useEffect, useState } from "react";

type ValueReport = {
  headline: string;
  summary: string;
  weeklyHoursRecovered: number;
  hoursReductionPct: number;
  errorReductionPct: number;
  baselineWeeklyHours: number;
  currentWeeklyHours: number;
  measuredAt?: string;
  nextSteps: string[];
};

type ResponseData = {
  assessmentId: string;
  organization: {
    name: string;
  };
  report: ValueReport;
};

function formatNumber(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

export default function AutomationValueReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (publicToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/value-report?token=${encodeURIComponent(
          publicToken
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load the realized-value report."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the realized-value report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void params.then(({ token }) => {
      void loadReport(token);
    });
  }, [loadReport, params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing the realized-value report...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">
            {error || "Realized-value report unavailable."}
          </p>
        </div>
      </main>
    );
  }

  const { report } = data;

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Realized Value
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {data.organization.name}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Measured operational impact after implementation, based on
            the recorded baseline and current-state results.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            Realized outcome
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            {report.headline}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            {report.summary}
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Hours recovered / week"
            value={formatNumber(report.weeklyHoursRecovered)}
          />

          <Metric
            label="Hours reduction"
            value={`${formatNumber(report.hoursReductionPct)}%`}
          />

          <Metric
            label="Error reduction"
            value={`${formatNumber(report.errorReductionPct)}%`}
          />

          <Metric
            label="Measured at"
            value={
              report.measuredAt
                ? new Date(report.measuredAt).toLocaleDateString()
                : "—"
            }
          />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Metric
            label="Baseline weekly hours"
            value={formatNumber(report.baselineWeeklyHours)}
          />

          <Metric
            label="Current weekly hours"
            value={formatNumber(report.currentWeeklyHours)}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Next steps
          </p>

          <div className="mt-5 space-y-3">
            {report.nextSteps.map((step, index) => (
              <div
                key={`${index}-${step}`}
                className="flex gap-4 rounded-xl border border-white/10 bg-[#050B14] p-5"
              >
                <span className="text-xs font-bold text-[#6DE7DC]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-300">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
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
    <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-6">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}