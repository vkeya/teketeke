"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AutomationActivitySelector from "@/components/automation/AutomationActivitySelector";
import AutomationActivityDetails from "@/components/automation/AutomationActivityDetails";
import {
  findActivity,
} from "@/lib/automation/AutomationDiscoveryOptions";
import type {
  AutomationDiscoveryProfile,
  DiscoveryActivityDetail,
} from "@/lib/automation/AutomationAssessment";

type DiscoveryQuestion = {
  id?: string;
  question?: string;
  text?: string;
  type?: string;
  options?: string[];
};

type AssessmentResponse = {
  error?: string;
  assessment: {
    id: string;
    organization: {
      name: string;
      industry?: string;
      location?: string;
    };
    decisionMaker?: {
      name: string;
      role?: string;
      email?: string;
    };
    status: string;
    discovery?: {
      profile?: AutomationDiscoveryProfile;
    };
  };
  nextQuestion: DiscoveryQuestion | null;
  complete: boolean;
};

type DiscoveryStep = "activities" | "details" | "questions";

const emptyProfile: AutomationDiscoveryProfile = {
  activityIds: [],
  customActivities: [],
  activityDetails: [],
};

export default function AutomationAssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [data, setData] =
    useState<AssessmentResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [otherAnswer, setOtherAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] =
    useState<DiscoveryStep>("activities");
  const [profile, setProfile] =
    useState<AutomationDiscoveryProfile>(emptyProfile);

  const loadAssessment = useCallback(
    async (publicToken: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/automation/assessment?token=${encodeURIComponent(
            publicToken
          )}`,
          { cache: "no-store" }
        );

        const result =
          (await response.json()) as AssessmentResponse;

        if (!response.ok) {
          throw new Error(
            result.error ?? "Unable to load the assessment."
          );
        }

        setData(result);

        const existingProfile =
          result.assessment.discovery?.profile;

        setProfile(
          existingProfile ?? {
            ...emptyProfile,
            industryId:
              result.assessment.organization.industry ||
              undefined,
            countryId:
              result.assessment.organization.location ||
              undefined,
            roleId:
              result.assessment.decisionMaker?.role ||
              undefined,
          }
        );

        if (
          existingProfile?.activityIds.length ||
          existingProfile?.customActivities.length
        ) {
          setStep("details");
        } else {
          setStep("activities");
        }

        setAnswer("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the assessment."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void params.then(({ token: publicToken }) => {
      setToken(publicToken);
      void loadAssessment(publicToken);
    });
  }, [loadAssessment, params]);

  const selectedActivities = useMemo(
    () =>
      profile.activityIds
        .map((id) => findActivity(id))
        .filter(
          (
            activity
          ): activity is NonNullable<typeof activity> =>
            Boolean(activity)
        ),
    [profile.activityIds]
  );

  const saveProfile = useCallback(
    async (
      nextProfile: AutomationDiscoveryProfile
    ) => {
      if (!token) return false;

      setSavingProfile(true);
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
              discoveryProfile: nextProfile,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Unable to save your discovery information."
          );
        }

        setProfile(nextProfile);
        setData((current) =>
          current
            ? {
                ...current,
                assessment: {
                  ...current.assessment,
                  discovery: {
                    ...current.assessment.discovery,
                    profile: nextProfile,
                  },
                },
              }
            : current
        );

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save your discovery information."
        );
        return false;
      } finally {
        setSavingProfile(false);
      }
    },
    [token]
  );

  async function continueFromActivities() {
    if (
      profile.activityIds.length === 0 &&
      profile.customActivities.length === 0
    ) {
      setError(
        "Select at least one activity so we can understand where work happens."
      );
      return;
    }

    const saved = await saveProfile(profile);

    if (saved) {
      setStep("details");
    }
  }

  async function continueFromDetails() {
    const saved = await saveProfile(profile);

    if (saved) {
      setStep("questions");
    }
  }

  const completeAssessment = useCallback(async () => {
    if (!token) return;

    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch(
        "/api/automation/assessment/complete",
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
            "Unable to complete the assessment."
        );
      }

      window.location.href =
        `/automation/assessment/${encodeURIComponent(
          token
        )}/report`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the assessment."
      );
      setAnalyzing(false);
    }
  }, [token]);

  async function submitAnswer() {
    const finalAnswer =
      answer.toLowerCase() === "other"
        ? `Other: ${otherAnswer.trim()}`
        : answer.trim();

    if (
      !token ||
      !data?.nextQuestion?.id ||
      !finalAnswer
    ) {
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
              questionId: data.nextQuestion.id,
              value: finalAnswer,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to save your answer."
        );
      }

      setData((current) =>
        current
          ? {
              ...current,
              nextQuestion: result.nextQuestion,
              complete: result.complete,
            }
          : current
      );
      setAnswer("");
      setOtherAnswer("");

      if (result.complete) {
        await completeAssessment();
      }
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0A1422] p-8 text-sm text-slate-400">
          Preparing your assessment...
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  if (analyzing) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Assessment complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Analyzing your workplace
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            We are processing the information you provided and
            preparing your automation assessment.
          </p>
        </div>
      </main>
    );
  }

  if (step === "activities" || step === "details") {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <header className="border-b border-white/10 pb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
              Automation Intelligence
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Let's understand how your workplace works
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {data.assessment.organization.name} does not need to
              know what can be automated. Select the work that
              happens regularly and we will identify the
              opportunities.
            </p>
          </header>

          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
            {[
              ["activities", "1. Activities"],
              ["details", "2. Details"],
              ["questions", "3. Final questions"],
            ].map(([key, label]) => (
              <span
                key={key}
                className={`rounded-full border px-3 py-2 ${
                  step === key
                    ? "border-[#19D3C5]/40 bg-[#19D3C5]/10 text-[#6DE7DC]"
                    : "border-white/10 text-slate-600"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
            {step === "activities" ? (
              <>
                <AutomationActivitySelector
                  selectedIds={profile.activityIds}
                  customActivities={
                    profile.customActivities
                  }
                  disabled={savingProfile}
                  onChange={(
                    selectedIds,
                    customActivities
                  ) =>
                    setProfile((current) => ({
                      ...current,
                      activityIds: selectedIds,
                      customActivities,
                    }))
                  }
                />

                {error && (
                  <p className="mt-5 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void continueFromActivities()
                    }
                    disabled={savingProfile}
                    className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:opacity-40"
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <AutomationActivityDetails
                  activities={selectedActivities}
                  details={profile.activityDetails}
                  disabled={savingProfile}
                  onChange={(
                    details: DiscoveryActivityDetail[]
                  ) =>
                    setProfile((current) => ({
                      ...current,
                      activityDetails: details,
                    }))
                  }
                />

                {error && (
                  <p className="mt-5 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("activities")}
                    disabled={savingProfile}
                    className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-slate-400"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void continueFromDetails()
                    }
                    disabled={savingProfile}
                    className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:opacity-40"
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Continue"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (data.complete || !data.nextQuestion) {
    return (
      <main className="min-h-screen bg-[#050B14] px-5 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#19D3C5]/15 bg-[#0A1422] p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Discovery complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            We have enough to analyze your workplace.
          </h1>
          <button
            type="button"
            onClick={() => void completeAssessment()}
            className="mt-6 rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14]"
          >
            Generate assessment
          </button>
          {error && (
            <p className="mt-4 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  const question = data.nextQuestion;
  const questionText =
    question.question ??
    question.text ??
    "Tell us about this part of your workplace.";

  return (
    <main className="min-h-screen bg-[#050B14] px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6DE7DC]">
            Automation Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            A few final questions
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            These questions help us complete the picture. You do
            not need to explain everything — give us what you know.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0A1422] p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Final question
            </p>

            {question.type && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {question.type}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-semibold leading-9">
            {questionText}
          </h2>

          {question.options?.length ? (
            <div className="mt-6 grid gap-3">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setAnswer(option);

                    if (option.toLowerCase() !== "other") {
                      setOtherAnswer("");
                    }
                  }}
                  className={`rounded-xl border px-4 py-4 text-left text-sm ${
                    answer === option
                      ? "border-[#19D3C5]/50 bg-[#19D3C5]/10 text-white"
                      : "border-white/10 bg-[#050B14] text-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}

              {answer.toLowerCase() === "other" && (
                <textarea
                  value={otherAnswer}
                  onChange={(event) =>
                    setOtherAnswer(event.target.value)
                  }
                  rows={4}
                  placeholder="Tell us what you have in mind..."
                  className="mt-1 w-full resize-none rounded-xl border border-[#19D3C5]/30 bg-[#050B14] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-[#19D3C5]/60"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <textarea
              value={answer}
              onChange={(event) =>
                setAnswer(event.target.value)
              }
              rows={6}
              placeholder="Tell us what happens today..."
              className="mt-6 w-full resize-none rounded-xl border border-white/10 bg-[#050B14] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-[#19D3C5]/40"
            />
          )}

          {error && (
            <p className="mt-4 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep("details")}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-slate-400"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={
                saving ||
                !answer.trim() ||
                (answer.toLowerCase() === "other" &&
                  !otherAnswer.trim())
              }
              className="rounded-xl bg-[#19D3C5] px-6 py-3 text-xs font-bold text-[#050B14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}