"use client";

import { useCallback, useEffect, useState } from "react";

type StatusResponse = {
  assessmentId: string;
  organization: {
    name: string;
  };
  status: string;
  statusLabel: string;
  implementationComplete: boolean;
  measurementComplete: boolean;
};

const workflow = [
  ["created", "Assessment", "assessment"],
  ["in_discovery", "Discovery", "assessment"],
  ["analyzed", "Analysis", "report"],
  ["reported", "Report", "report"],
  ["awaiting_decision", "Decision", "decision"],
  ["approved", "Approved", "implementation"],
  ["implementation", "Implementation", "implementation"],
  ["measurement", "Measurement", "measurement"],
  ["value_measured", "Realized value", "value-report"],
] as const;

export default function AutomationStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async (publicToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/status?token=${encodeURIComponent(publicToken)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to load the assessment status."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the assessment status."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadStatus(publicToken);
    });
  }, [loadStatus, params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Loading workflow status...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">
            {error || "Workflow status unavailable."}
          </p>
        </div>
      </main>
    );
  }

  const currentIndex = workflow.findIndex(
    ([status]) => status === data.status
  );

  function hrefFor(route: string) {
    return `/automation/assessment/${encodeURIComponent(token)}/${route}`;
  }

  const progress =
    currentIndex < 0
      ? 0
      : Math.round(
          ((currentIndex + 1) / workflow.length) * 100
        );

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Workflow
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {data.organization.name}
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Current stage:{" "}
                <span className="text-white">
                  {data.statusLabel}
                </span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold">
                {progress}%
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                Workflow progress
              </p>
            </div>
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[#19D3C5]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <div className="space-y-3">
            {workflow.map(([status, label, route], index) => {
              const complete =
                currentIndex >= 0 && index < currentIndex;
              const current = index === currentIndex;
              const actionable =
                current ||
                (status === "reported" &&
                  data.status === "reported") ||
                (status === "approved" &&
                  data.implementationComplete) ||
                (status === "measurement" &&
                  data.implementationComplete);

              const content = (
                <div
                  className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${
                    current
                      ? "border-[#19D3C5]/40 bg-[#19D3C5]/10"
                      : complete
                        ? "border-white/10 bg-[#050B14]"
                        : "border-white/5 bg-[#050B14]/50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      current
                        ? "bg-[#19D3C5] text-[#050B14]"
                        : complete
                          ? "border border-[#19D3C5]/30 text-[#6DE7DC]"
                          : "border border-white/10 text-slate-600"
                    }`}
                  >
                    {complete ? "✓" : index + 1}
                  </span>

                  <div className="flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        current
                          ? "text-white"
                          : complete
                            ? "text-slate-300"
                            : "text-slate-600"
                      }`}
                    >
                      {label}
                    </p>

                    {current && (
                      <p className="mt-1 text-xs text-[#6DE7DC]">
                        Current stage
                      </p>
                    )}
                  </div>

                  {actionable && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      Open
                    </span>
                  )}
                </div>
              );

              if (!actionable || route === "assessment") {
                return <div key={status}>{content}</div>;
              }

              return (
                <a key={status} href={hrefFor(route)}>
                  {content}
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Implementation
            </p>
            <p className="mt-2 text-sm font-semibold">
              {data.implementationComplete
                ? "Complete"
                : "In progress"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Measurement
            </p>
            <p className="mt-2 text-sm font-semibold">
              {data.measurementComplete
                ? "Recorded"
                : "Not recorded"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}