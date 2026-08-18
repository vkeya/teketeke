"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AutomationMeasurementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [baselineWeeklyHours, setBaselineWeeklyHours] = useState("");
  const [currentWeeklyHours, setCurrentWeeklyHours] = useState("");
  const [baselineManualSteps, setBaselineManualSteps] = useState("");
  const [currentManualSteps, setCurrentManualSteps] = useState("");
  const [baselineErrorRatePct, setBaselineErrorRatePct] = useState("");
  const [currentErrorRatePct, setCurrentErrorRatePct] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void params.then(({ token: publicToken }) => setToken(publicToken));
  }, [params]);

  async function submitMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const baseline = Number(baselineWeeklyHours);
    const current = Number(currentWeeklyHours);

    if (
      !Number.isFinite(baseline) ||
      !Number.isFinite(current) ||
      baseline < 0 ||
      current < 0
    ) {
      setError(
        "Baseline and current weekly hours must be valid non-negative numbers."
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/automation/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          measurement: {
            baselineWeeklyHours: baseline,
            currentWeeklyHours: current,
            baselineManualSteps:
              baselineManualSteps === ""
                ? undefined
                : Number(baselineManualSteps),
            currentManualSteps:
              currentManualSteps === ""
                ? undefined
                : Number(currentManualSteps),
            baselineErrorRatePct:
              baselineErrorRatePct === ""
                ? undefined
                : Number(baselineErrorRatePct),
            currentErrorRatePct:
              currentErrorRatePct === ""
                ? undefined
                : Number(currentErrorRatePct),
            notes: notes
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to save the measurement."
        );
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the measurement."
      );
    } finally {
      setSaving(false);
    }
  }

  const valueReportHref = token
    ? `/automation/assessment/${encodeURIComponent(token)}/value-report`
    : "#";

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Measurement
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Measure the result
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Compare the original process baseline with the current
            operating result so the platform can calculate realized
            automation value.
          </p>
        </header>

        <form onSubmit={submitMeasurement} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Weekly effort
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs text-slate-400">
                  Baseline weekly hours *
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={baselineWeeklyHours}
                  onChange={(event) =>
                    setBaselineWeeklyHours(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Current weekly hours *
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentWeeklyHours}
                  onChange={(event) =>
                    setCurrentWeeklyHours(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Process quality
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs text-slate-400">
                  Baseline manual steps
                </span>
                <input
                  type="number"
                  min="0"
                  value={baselineManualSteps}
                  onChange={(event) =>
                    setBaselineManualSteps(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Current manual steps
                </span>
                <input
                  type="number"
                  min="0"
                  value={currentManualSteps}
                  onChange={(event) =>
                    setCurrentManualSteps(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Baseline error rate %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={baselineErrorRatePct}
                  onChange={(event) =>
                    setBaselineErrorRatePct(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">
                  Current error rate %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={currentErrorRatePct}
                  onChange={(event) =>
                    setCurrentErrorRatePct(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm outline-none focus:border-[#19D3C5]/40"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Notes
            </p>
            <textarea
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add one observation per line..."
              className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#050B14] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40"
            />
          </section>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-200">
              {error}
            </p>
          )}

          {saved && (
            <div className="rounded-xl border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-4 py-5">
              <p className="text-sm text-[#B7FFF7]">
                Measurement saved successfully.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                The realized-value report is now available.
              </p>
              <a
                href={valueReportHref}
                className="mt-4 inline-flex rounded-xl bg-[#19D3C5] px-5 py-3 text-xs font-bold text-[#050B14]"
              >
                View realized-value report
              </a>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !token}
              className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving measurement..." : "Save measurement"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}