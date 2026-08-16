"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  getUploadedAnalysis,
  type UploadedAnalysis,
} from "../lib/analysisStorage";
import {
  buildBusinessContext,
  businessContextToPrompt,
  type BusinessContext,
} from "../lib/ai/businessContext";
import { answerBusinessQuestion } from "../lib/ai/localQuestionEngine";

type AskTeketekeProps = {
  suggestedQuestions?: string[];
};

type StructuredAIResponse = {
  title: string;
  type:
    | "answer"
    | "risk"
    | "opportunity"
    | "recommendation"
    | "summary";
  priority: "high" | "medium" | "low";
  answer: string;
  keyPoints: string[];
  recommendedActions: string[];
  supportingSignals: string[];
  confidence: "high" | "medium" | "low";
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AskTeketeke({
  suggestedQuestions = [],
}: AskTeketekeProps) {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] =
    useState<StructuredAIResponse | null>(null);

  const analysis = useMemo(
    () => getUploadedAnalysis(),
    [submittedQuestion]
  );

  const context = useMemo(
    () =>
      analysis
        ? buildBusinessContext(analysis)
        : null,
    [analysis]
  );

  const response =
    submittedQuestion && context
      ? answerBusinessQuestion(
          submittedQuestion,
          context
        )
      : submittedQuestion
        ? {
            title:
              "Upload business data first",
            type: "summary" as const,
            priority: "low" as const,
            answer:
              "Upload and analyze a CSV dataset before asking Teketeke questions about your business.",
            keyPoints: [],
            recommendedActions: [],
            supportingSignals: [],
            confidence: "low" as const,
          }
        : null;

  async function submitQuestion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = question.trim();

    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setAiResponse(null);
    setSubmittedQuestion("");

    try {
      if (context) {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmed,
            businessContext:
              businessContextToPrompt(context),
          }),
        });

        if (!response.ok) {
          throw new Error("AI request failed.");
        }

        const data = await response.json();

        /*
         * The API returns mode="local" while the paid provider is
         * disabled. In that state the UI must NOT display the API
         * readiness message. It uses the local intelligence engine
         * below to answer the actual business question.
         *
         * Only a real provider response is rendered as structured AI.
         */
        if (
          data.mode === "provider" &&
          data.response
        ) {
          setAiResponse(
            data.response as StructuredAIResponse
          );
        }
      }

      setSubmittedQuestion(trimmed);
    } catch (error) {
      console.error("Ask Teketeke error:", error);

      /*
       * The local intelligence engine remains the resilient
       * fallback if the API boundary is unavailable.
       */
      setSubmittedQuestion(trimmed);
    } finally {
      setLoading(false);
    }
  }

  const aiContextAvailable = Boolean(
    context
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-[#7C5CFC]/20 bg-gradient-to-br from-[#151331] via-[#0D1B2A] to-[#091625] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.25)]">

      <div className="rounded-[22px] border border-white/5 bg-[#091625] p-6 sm:p-8">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#7C5CFC]/20 bg-[#7C5CFC]/10 px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC] shadow-[0_0_10px_rgba(124,92,252,0.8)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#19D3C5]">
                Intelligence assistant
              </span>

            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Ask Teketeke.
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ask a business question in plain language.
              Teketeke uses the structured intelligence from
              your dataset to focus the answer on the signals
              that matter.
            </p>

          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Business context
            </p>

            <div className="mt-2 flex items-center gap-2">

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  aiContextAvailable
                    ? "bg-[#19D3C5] shadow-[0_0_8px_rgba(25,211,197,0.8)]"
                    : "bg-slate-600"
                }`}
              />

              <p className="text-xs font-medium text-slate-300">
                {aiContextAvailable
                  ? "Connected to analyzed data"
                  : "Awaiting business data"}
              </p>

            </div>

          </div>

        </div>

        <form
          onSubmit={submitQuestion}
          className="mt-7"
        >

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="e.g. What are my biggest business risks?"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#07111F] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/10"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="rounded-xl bg-[#7C5CFC] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#8D70FF] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
            >
              {loading
                ? "Thinking..."
                : "Ask →"}
            </button>

          </div>

        </form>

        {suggestedQuestions.length > 0 && (

          <div className="mt-5">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Try asking
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {suggestedQuestions.map(
                (suggestion) => (

                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      setQuestion(suggestion)
                    }
                    className="rounded-lg border border-white/7 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 transition hover:border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/5 hover:text-slate-200"
                  >
                    {suggestion}
                  </button>

                )
              )}

            </div>

          </div>

        )}

        {aiResponse && (

          <div className="mt-7 rounded-2xl border border-[#7C5CFC]/15 bg-[#7C5CFC]/[0.05] p-5">

            <div className="flex flex-col gap-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFC]/10 text-[#A993FF]">
                    ✦
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A993FF]">
                      Teketeke insight
                    </p>

                    <h3 className="mt-2 text-lg font-semibold">
                      {aiResponse.title}
                    </h3>
                  </div>

                </div>

                <div className="flex shrink-0 gap-2">

                  <span className="rounded-lg border border-white/7 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {aiResponse.type}
                  </span>

                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                      aiResponse.priority === "high"
                        ? "bg-[#FF6B6B]/10 text-[#FF8A8A]"
                        : aiResponse.priority === "medium"
                          ? "bg-[#F4C95D]/10 text-[#F4C95D]"
                          : "bg-[#19D3C5]/10 text-[#19D3C5]"
                    }`}
                  >
                    {aiResponse.priority}
                  </span>

                </div>

              </div>

              <p className="text-sm leading-7 text-slate-200">
                {aiResponse.answer}
              </p>

              {aiResponse.keyPoints.length > 0 && (

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Key points
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">

                    {aiResponse.keyPoints.map(
                      (point, index) => (
                        <div
                          key={`${point}-${index}`}
                          className="rounded-xl border border-white/5 bg-[#07111F]/70 p-3 text-xs leading-5 text-slate-300"
                        >
                          <span className="mr-2 text-[#7C5CFC]">
                            •
                          </span>
                          {point}
                        </div>
                      )
                    )}

                  </div>

                </div>

              )}

              {aiResponse.recommendedActions.length > 0 && (

                <div className="rounded-xl border border-[#19D3C5]/15 bg-[#19D3C5]/[0.04] p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19D3C5]">
                    Recommended actions
                  </p>

                  <ol className="mt-3 space-y-2">

                    {aiResponse.recommendedActions.map(
                      (action, index) => (
                        <li
                          key={`${action}-${index}`}
                          className="flex gap-3 text-sm leading-6 text-slate-200"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#19D3C5]/10 text-[10px] font-bold text-[#19D3C5]">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      )
                    )}

                  </ol>

                </div>

              )}

              <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Supporting signals
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {aiResponse.supportingSignals.length > 0
                      ? aiResponse.supportingSignals.map(
                          (signal, index) => (
                            <span
                              key={`${signal}-${index}`}
                              className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-slate-500"
                            >
                              {signal}
                            </span>
                          )
                        )
                      : (
                        <span className="text-xs text-slate-600">
                          No additional signals supplied.
                        </span>
                      )}

                  </div>

                </div>

                <div className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">

                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Confidence
                  </p>

                  <p className="mt-1 text-xs font-semibold capitalize text-slate-300">
                    {aiResponse.confidence}
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

        {response && !aiResponse && (

          <div className="mt-7 rounded-2xl border border-[#19D3C5]/15 bg-[#19D3C5]/[0.04] p-5">

            <div className="flex flex-col gap-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19D3C5]/10 text-[#19D3C5]">
                    ✦
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19D3C5]">
                      Teketeke intelligence
                    </p>

                    <h3 className="mt-2 text-lg font-semibold">
                      {response.title}
                    </h3>
                  </div>

                </div>

                <div className="flex shrink-0 gap-2">

                  <span className="rounded-lg border border-white/7 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {response.type}
                  </span>

                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                      response.priority === "high"
                        ? "bg-[#FF6B6B]/10 text-[#FF8A8A]"
                        : response.priority === "medium"
                          ? "bg-[#F4C95D]/10 text-[#F4C95D]"
                          : "bg-[#19D3C5]/10 text-[#19D3C5]"
                    }`}
                  >
                    {response.priority}
                  </span>

                </div>

              </div>

              <p className="text-sm leading-7 text-slate-200">
                {response.answer}
              </p>

              {response.keyPoints.length > 0 && (

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Key points
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">

                    {response.keyPoints.map(
                      (point, index) => (
                        <div
                          key={`${point}-${index}`}
                          className="rounded-xl border border-white/5 bg-[#07111F]/70 p-3 text-xs leading-5 text-slate-300"
                        >
                          <span className="mr-2 text-[#19D3C5]">
                            •
                          </span>
                          {point}
                        </div>
                      )
                    )}

                  </div>

                </div>

              )}

              {response.recommendedActions.length > 0 && (

                <div className="rounded-xl border border-[#19D3C5]/15 bg-[#07111F]/60 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19D3C5]">
                    Recommended actions
                  </p>

                  <ol className="mt-3 space-y-2">

                    {response.recommendedActions.map(
                      (action, index) => (
                        <li
                          key={`${action}-${index}`}
                          className="flex gap-3 text-sm leading-6 text-slate-200"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#19D3C5]/10 text-[10px] font-bold text-[#19D3C5]">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      )
                    )}

                  </ol>

                </div>

              )}

              <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Supporting signals
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {response.supportingSignals.length > 0
                      ? response.supportingSignals.map(
                          (signal, index) => (
                            <span
                              key={`${signal}-${index}`}
                              className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-slate-500"
                            >
                              {signal}
                            </span>
                          )
                        )
                      : (
                        <span className="text-xs text-slate-600">
                          No additional signals supplied.
                        </span>
                      )}

                  </div>

                </div>

                <div className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">

                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Confidence
                  </p>

                  <p className="mt-1 text-xs font-semibold capitalize text-slate-300">
                    {response.confidence}
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

        <details className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">

          <summary className="cursor-pointer text-xs font-semibold text-slate-500">
            AI context readiness
          </summary>

          <div className="mt-4">

            <p className="text-xs leading-6 text-slate-500">
              Teketeke has separated business context from the
              interface. This same structured context can be
              passed to a future AI model without changing the
              dashboard or upload workflow.
            </p>

            {context && (
              <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-white/5 bg-[#07111F] p-4 text-[10px] leading-5 text-slate-500">
                {businessContextToPrompt(context)}
              </pre>
            )}

          </div>

        </details>

        <p className="mt-5 text-[10px] leading-5 text-slate-600">
          Current responses use Teketeke&apos;s local
          intelligence engine. The generative AI layer can be
          connected later without redesigning the business
          intelligence foundation.
        </p>

      </div>

    </section>
  );
}