"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoveryQuestion } from "@/lib/automation/AutomationDiscoveryEngine";

type AssessmentView = {
  assessment: {
    id: string;
    organization: {
      name: string;
      industry?: string;
      location?: string;
      department?: string;
      objective?: string;
    };
    status: string;
  };
  nextQuestion: DiscoveryQuestion | null;
  complete: boolean;
};

export default function PublicAutomationAssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [view, setView] = useState<AssessmentView | null>(null);
  const [answer, setAnswer] = useState<string | string[] | boolean>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAssessment = useCallback(async (publicToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/automation/assessment?token=${encodeURIComponent(
          publicToken
        )}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load assessment.");
      }

      setView(data);
      setAnswer(
        data.nextQuestion?.type === "multi_choice"
          ? []
          : data.nextQuestion?.type === "yes_no"
            ? false
            : ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assessment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadAssessment(publicToken);
    });
  }, [loadAssessment, params]);

  async function submitAnswer() {
    if (!view?.nextQuestion || !token) {
      return;
    }

    if (
      view.nextQuestion.required &&
      (answer === "" ||
        (Array.isArray(answer) && answer.length === 0))
    ) {
      setError("Please provide an answer before continuing.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/automation/assessment",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            answer: {
              questionId: view.nextQuestion.id,
              question: view.nextQuestion.question,
              answer,
              answeredAt: new Date().toISOString(),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save your answer.");
      }

      setView((current) =>
        current
          ? {
              ...current,
              nextQuestion: data.nextQuestion,
              complete: data.complete,
            }
          : current
      );

      setAnswer(
        data.nextQuestion?.type === "multi_choice"
          ? []
          : data.nextQuestion?.type === "yes_no"
            ? false
            : ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your answer."
      );
    } finally {
      setSaving(false);
    }
  }

  const question = view?.nextQuestion;

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Assessment
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Understand your workplace. Discover what can be automated.
          </h1>
          {view?.assessment.organization.name && (
            <p className="mt-3 text-sm text-slate-400">
              Assessment for {view.assessment.organization.name}
            </p>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0A1422] p-6 text-sm text-slate-400">
            Loading your assessment...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
            <p className="text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={() => token && void loadAssessment(token)}
              className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && view && view.complete && (
          <div className="rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6DE7DC]">
              Discovery complete
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Thank you. We have what we need.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your responses have been captured. The next stage is to analyze
              the current processes, identify automation opportunities, and
              prepare your recommendations.
            </p>
          </div>
        )}

        {!loading && !error && view && !view.complete && question && (
          <section className="rounded-2xl border border-white/10 bg-[#0A1422] p-6 shadow-2xl">
            <div className="mb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                Guided discovery
              </p>
              <h2 className="mt-3 text-xl font-medium leading-8 text-slate-100">
                {question.question}
              </h2>
              {question.helpText && (
                <p className="mt-2 text-sm text-slate-500">
                  {question.helpText}
                </p>
              )}
            </div>

            {question.type === "long_text" ||
            question.type === "text" ? (
              <textarea
                value={typeof answer === "string" ? answer : ""}
                onChange={(event) => setAnswer(event.target.value)}
                rows={6}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40"
                placeholder="Tell us about how this works today..."
              />
            ) : question.type === "number" ? (
              <input
                type="number"
                value={typeof answer === "string" ? answer : ""}
                onChange={(event) => setAnswer(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#050B14] px-4 py-3 text-sm text-slate-200 outline-none focus:border-[#19D3C5]/40"
              />
            ) : question.type === "yes_no" ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setAnswer(option.value)}
                    className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                      answer === option.value
                        ? "border-[#19D3C5]/50 bg-[#19D3C5]/10 text-[#6DE7DC]"
                        : "border-white/10 bg-[#050B14] text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(question.options ?? []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      question.type === "multi_choice"
                        ? setAnswer((current) => {
                            const values = Array.isArray(current)
                              ? current
                              : [];
                            return values.includes(option)
                              ? values.filter((item) => item !== option)
                              : [...values, option];
                          })
                        : setAnswer(option)
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      (Array.isArray(answer) && answer.includes(option)) ||
                      answer === option
                        ? "border-[#19D3C5]/50 bg-[#19D3C5]/10 text-[#6DE7DC]"
                        : "border-white/10 bg-[#050B14] text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 text-xs text-red-300">{error}</p>
            )}

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitAnswer()}
                className="rounded-xl bg-[#19D3C5] px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#041014] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue →"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}