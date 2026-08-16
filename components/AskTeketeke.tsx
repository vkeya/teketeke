import React, { useState } from "react";

type AskTeketekeProps = {
  suggestedQuestions?: string[];
};

type ApiResponse = {
  answer?: string;
  error?: string;
};

export default function AskTeketeke({
  suggestedQuestions = [
    "What are my biggest business risks?",
    "Which market is growing fastest?",
    "Which customers should I protect?",
  ],
}: AskTeketekeProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(questionToAsk = question) {
    const trimmed = questionToAsk.trim();

    if (!trimmed || loading) return;

    setQuestion(trimmed);
    setAnswer("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask-teketeke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an answer.");
      }

      setAnswer(data.answer || "No answer was returned.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while asking Teketeke."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-slate-950 p-2 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h3 className="font-semibold">Ask Teketeke</h3>
          <p className="text-sm text-slate-500">
            Ask questions about your business data.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={loading}
          type="text"
          maxLength={500}
          placeholder="e.g. Why is Uganda revenue declining?"
          className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        />

        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="min-h-12 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Analyzing..." : "Ask Teketeke"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestedQuestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => void ask(suggestion)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Teketeke is analyzing the business data…
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {answer && !loading && !error && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Teketeke analysis
          </div>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {answer}
          </div>
        </div>
      )}
    </section>
  );
}
