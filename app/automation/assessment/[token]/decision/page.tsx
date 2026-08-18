"use client";

import { useCallback, useEffect, useState } from "react";
import { recommendAutomationDecision } from "@/lib/automation/AutomationDecisionEngine";
import type { AutomationOpportunity } from "@/lib/automation/AutomationAssessment";

type Opportunity = {
  id: string;
  title?: string;
  name?: string;
  priority?: string;
  automationScore?: number;
  impactScore?: number;
  feasibilityScore?: number;
  riskScore?: number;
  estimatedWeeklyHoursSaved?: number;
  estimatedAnnualValue?: number;
  estimatedImplementationDays?: number;
  proposedAutomation?: string;
};

type Report = {
  executiveSummary?: string;
  opportunities?: Opportunity[];
  businessCase?: {
    estimatedAnnualHoursSaved?: number;
    estimatedAnnualValue?: number;
    estimatedImplementationCost?: number;
    estimatedPaybackMonths?: number;
    estimatedYearOneRoiPct?: number;
  };
};

type ReportResponse = {
  assessment: {
    id: string;
    organization: { name: string };
    status: string;
  };
  report: Report;
};

type DecisionOutcome =
  | "approved"
  | "declined"
  | "needs_revision";

function number(value?: number) {
  return value === undefined
    ? "—"
    : value.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      });
}

function money(value?: number) {
  return value === undefined
    ? "—"
    : `$${value.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`;
}

function priorityClass(priority?: string) {
  if (priority === "critical") {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }
  if (priority === "high") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }
  return "border-white/10 bg-white/[0.03] text-slate-400";
}

export default function AutomationDecisionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] =
    useState<ReportResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [outcome, setOutcome] =
    useState<DecisionOutcome>("approved");
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadReport = useCallback(
    async (publicToken: string) => {
      try {
        const response = await fetch(
          `/api/automation/report?token=${encodeURIComponent(
            publicToken
          )}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ?? "Unable to load the assessment."
          );
        }

        setData(result);

        const recommended = recommendAutomationDecision(
          (result.report.opportunities ?? []) as unknown as AutomationOpportunity[]
        );

        setSelected(recommended.opportunityIds);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the assessment."
        );
      }
    },
    []
  );

  useEffect(() => {
    void params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadReport(publicToken);
    });
  }, [loadReport, params]);

  const opportunities =
    data?.report.opportunities ?? [];

  function toggleOpportunity(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
    setSaved(false);
  }

  async function submitDecision() {
    if (!token) return;

    if (
      outcome === "approved" &&
      selected.length === 0
    ) {
      setError(
        "Select at least one opportunity to approve."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(
        "/api/automation/decision",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            decision: {
              outcome,
              selectedOpportunityIds: selected,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to save the decision."
        );
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the decision."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createImplementationPlan() {
    if (!token || outcome !== "approved") return;

    setBuilding(true);
    setError("");

    try {
      const response = await fetch(
        "/api/automation/implementation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to create the implementation plan."
        );
      }

      window.location.href =
        `/automation/assessment/${encodeURIComponent(
          token
        )}/implementation`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the implementation plan."
      );
    } finally {
      setBuilding(false);
    }
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing the decision workspace...
        </div>
      </main>
    );
  }

  const businessCase = data.report.businessCase;

  const recommendation = recommendAutomationDecision(
    opportunities as unknown as AutomationOpportunity[]
  );

  const recommendedOpportunityIds = recommendation.opportunityIds;

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence · Decision
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {data.assessment.organization.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Teketeke has evaluated the opportunities and prepared a
            recommended first implementation decision.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#19D3C5]/20 bg-[#0A1422] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
                Teketeke recommendation
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {recommendation.recommendation === "approve"
                  ? "Approve the first implementation phase"
                  : recommendation.recommendation === "defer"
                    ? "Defer implementation for now"
                    : "Review the opportunities before approving"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {recommendation.rationale}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#19D3C5]/20 bg-[#19D3C5]/[0.04] px-5 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#6DE7DC]">
                Recommended
              </p>

              <p className="mt-1 text-lg font-semibold text-white">
                {recommendedOpportunityIds.length > 0
                  ? `${recommendedOpportunityIds.length} ${
                      recommendedOpportunityIds.length === 1
                        ? "opportunity"
                        : "opportunities"
                    }`
                  : "Review"}
              </p>
            </div>
          </div>

          {recommendedOpportunityIds.length > 0 && (
            <div className="mt-5 border-t border-white/8 pt-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Why these are recommended
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {opportunities
                  .filter((opportunity) =>
                    recommendedOpportunityIds.includes(opportunity.id)
                  )
                  .map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="rounded-xl border border-white/8 bg-[#050B14] p-4"
                    >
                      <p className="text-sm font-semibold text-white">
                        {opportunity.title ??
                          opportunity.name ??
                          "Automation opportunity"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.08em]">
                        <span className="rounded-full border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-2.5 py-1 text-[#6DE7DC]">
                          Automation {number(opportunity.automationScore)}
                        </span>

                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-500">
                          Priority {opportunity.priority ?? "review"}
                        </span>

                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-500">
                          Risk {number(opportunity.riskScore)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#0A1422] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
              Opportunities
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {opportunities.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A1422] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
              Hours / year
            </p>
            <p className="mt-1 text-xl font-semibold text-[#6DE7DC]">
              {number(
                businessCase?.estimatedAnnualHoursSaved
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A1422] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
              Annual value
            </p>
            <p className="mt-1 text-xl font-semibold text-[#6DE7DC]">
              {money(
                businessCase?.estimatedAnnualValue
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A1422] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
              Payback
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {businessCase?.estimatedPaybackMonths !==
              undefined
                ? `${businessCase.estimatedPaybackMonths.toFixed(
                    1
                  )} mo`
                : "—"}
            </p>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Choose opportunities
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                What should move forward?
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {selected.length} selected
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {opportunities.map((opportunity) => {
              const id = opportunity.id;
              const title =
                opportunity.title ??
                opportunity.name ??
                "Automation opportunity";
              const isSelected =
                selected.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    toggleOpportunity(id)
                  }
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? "border-[#19D3C5]/50 bg-[#19D3C5]/8"
                      : "border-white/10 bg-[#0A1422]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                          isSelected
                            ? "border-[#19D3C5] bg-[#19D3C5] text-[#050B14]"
                            : "border-white/15 text-transparent"
                        }`}
                      >
                        ✓
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">
                            {title}
                          </h3>
                          <span
                            className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${priorityClass(
                              opportunity.priority
                            )}`}
                          >
                            {opportunity.priority ??
                              "review"}
                          </span>

                          {recommendedOpportunityIds.includes(
                            opportunity.id
                          ) && (
                            <span className="rounded-full border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#6DE7DC]">
                              Teketeke recommends
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs text-slate-500">
                          {opportunity.proposedAutomation ??
                            "Automation opportunity identified from discovery."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
                      <div>
                        <p className="text-[8px] uppercase text-slate-600">
                          Impact
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#6DE7DC]">
                          {number(
                            opportunity.impactScore
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-slate-600">
                          Feasibility
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {number(
                            opportunity.feasibilityScore
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-slate-600">
                          Saved / week
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {opportunity.estimatedWeeklyHoursSaved !==
                          undefined
                            ? `${number(
                                opportunity.estimatedWeeklyHoursSaved
                              )}h`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-slate-600">
                          Value / year
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#6DE7DC]">
                          {money(
                            opportunity.estimatedAnnualValue
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
            Decision readiness
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Are you ready to move forward?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review the recommended opportunities, expected value and
            implementation assumptions before recording the decision.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/8 bg-[#050B14] p-4">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                Selected
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {selected.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#050B14] p-4">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                Annual value
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6DE7DC]">
                {money(businessCase?.estimatedAnnualValue)}
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#050B14] p-4">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                Payback
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {businessCase?.estimatedPaybackMonths !== undefined
                  ? `${businessCase.estimatedPaybackMonths.toFixed(1)} mo`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Decision
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["approved", "Approve"],
                ["needs_revision", "Request changes"],
                ["declined", "Decline"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setOutcome(value);
                  setSaved(false);
                  setError("");
                }}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  outcome === value
                    ? "border-[#19D3C5]/40 bg-[#19D3C5]/10 text-white"
                    : "border-white/10 bg-[#050B14] text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-xs text-red-300">
              {error}
            </p>
          )}

          {saved && (
            <div className="mt-4 rounded-xl border border-[#19D3C5]/20 bg-[#19D3C5]/5 p-4">
              <p className="text-sm text-[#B7FFF7]">
                Decision recorded.
              </p>

              {outcome === "approved" && (
                <button
                  type="button"
                  onClick={() =>
                    void createImplementationPlan()
                  }
                  disabled={building}
                  className="mt-3 rounded-xl bg-[#19D3C5] px-5 py-3 text-xs font-bold text-[#050B14] disabled:opacity-40"
                >
                  {building
                    ? "Creating plan..."
                    : "Create implementation plan"}
                </button>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void submitDecision()}
              disabled={saving || building}
              className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:opacity-40"
            >
              {saving
                ? "Saving..."
                : "Record decision"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}