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
  assessment: {
    id: string;
    organization: {
      name: string;
    };
    status: string;
  };
  report: ValueReport;
};

export default function AutomationValueReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/value-report?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to load the value report."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the value report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void params.then(({ token }) => load(token));
  }, [load, params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing your realized-value report...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">
            {error || "Value report unavailable."}
          </p>
        </div>
      </main>
    );
  }

  const { assessment, report } = data;

  const metrics = [
    ["Weekly hours recovered", `${report.weeklyHoursRecovered.toFixed(1)} hrs`],
    ["Hours reduction", `${report.hoursReductionPct.toFixed(1)}%`],
    ["Error reduction", `${report.errorReductionPct.toFixed(1)}%`],
    ["Current weekly effort", `${report.currentWeeklyHours.toFixed(1)} hrs`],
  ];

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Realized Value
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {assessment.organization.name}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Measured results from the automation implementation.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            Result
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            {report.headline}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            {report.summary}
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-[#0A1422] p-5"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Before vs current
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-[#050B14] p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                Baseline weekly effort
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {report.baselineWeeklyHours.toFixed(1)} hrs
              </p>
            </div>

            <div className="rounded-xl border border-[#19D3C5]/15 bg-[#050B14] p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#6DE7DC]">
                Current weekly effort
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {report.currentWeeklyHours.toFixed(1)} hrs
              </p>
            </div>
          </div>

          {report.measuredAt && (
            <p className="mt-5 text-[10px] text-slate-600">
              Measured {new Date(report.measuredAt).toLocaleString()}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            What next
          </p>

          <ol className="mt-4 space-y-3">
            {report.nextSteps.map((step, index) => (
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
      </div>
    </main>
  );
}