"use client";

import { ChangeEvent, useState } from "react";
import {
  saveUploadedAnalysis,
  type UploadedAnalysis,
} from "../../lib/analysisStorage";

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount?: number;
  columns?: string[];
  fileName?: string;
};

type AnalysisResult = {
  success: boolean;
  fileName: string;
  metrics: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    grossMarginPct: number;
    transactions: number;
    customers: number;
    countries: number;
    products: number;
  };
  topCustomer: {
    name: string;
    revenue: number;
    sharePct: number;
  } | null;
  topCountry: {
    name: string;
    revenue: number;
    sharePct?: number;
  } | null;
  topProduct: {
    name: string;
    revenue: number;
    sharePct?: number;
  } | null;
  insights: Array<{
    type: "risk" | "opportunity";
    priority: "high" | "medium";
    title: string;
    finding: string;
    recommendation: string;
  }>;
  summary: {
    totalInsights: number;
    risks: number;
    opportunities: number;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] =
    useState<ValidationResult | null>(null);
  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function selectFile(selectedFile: File | null) {
    setValidation(null);
    setAnalysis(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      selectFile(droppedFile);
    }
  }

  async function validateAndAnalyze() {
    if (!file || loading) {
      return;
    }

    setLoading(true);
    setValidation(null);
    setAnalysis(null);

    try {
      const validationForm = new FormData();
      validationForm.append("file", file);

      const validationResponse = await fetch(
        "/api/validate-data",
        {
          method: "POST",
          body: validationForm,
        }
      );

      const validationData: ValidationResult =
        await validationResponse.json();

      setValidation(validationData);

      if (!validationData.valid) {
        return;
      }

      const analysisForm = new FormData();
      analysisForm.append("file", file);

      const analysisResponse = await fetch(
        "/api/analyze-data",
        {
          method: "POST",
          body: analysisForm,
        }
      );

      const analysisData: AnalysisResult | { error?: string } =
        await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(
          "error" in analysisData
            ? analysisData.error
            : "Unable to analyze the data."
        );
      }

      const completedAnalysis =
        analysisData as AnalysisResult;

      setAnalysis(completedAnalysis);

      saveUploadedAnalysis(
        completedAnalysis as UploadedAnalysis
      );
    } catch (error) {
      setValidation({
        valid: false,
        errors: [
          error instanceof Error
            ? error.message
            : "Unable to process the uploaded data.",
        ],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111F] text-white">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[5%] top-[5%] h-72 w-72 rounded-full bg-[#19D3C5]/5 blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-96 w-96 rounded-full bg-[#7C5CFC]/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 lg:px-8">

        {/* HEADER */}

        <header className="flex items-center justify-between">

          <a href="/" className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#19D3C5]/30 bg-[#0D1B2A] text-sm font-bold text-[#19D3C5]">
              T
            </div>

            <div>
              <p className="text-base font-bold tracking-[0.12em]">
                TEKETEKE
              </p>

              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">
                AI Business Intelligence
              </p>
            </div>

          </a>

          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          >
            Executive Dashboard →
          </a>

        </header>

        {/* INTRO */}

        <section className="mx-auto max-w-3xl pb-12 pt-20 text-center">

          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/20 bg-[#0D1B2A]/80 px-3.5 py-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5] shadow-[0_0_10px_rgba(25,211,197,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8FE8DF]">
              Intelligence workspace
            </span>

          </div>

          <h1 className="mt-7 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Give Teketeke your data.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Upload your business transactions and let Teketeke
            uncover the performance signals, risks and
            opportunities that deserve your attention.
          </p>

        </section>

        {/* UPLOAD CARD */}

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F2032] to-[#0B1828] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.25)]">

          <div className="rounded-[22px] border border-white/5 bg-[#091625] p-6 sm:p-8">

            <label
              htmlFor="business-file"
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition ${
                dragging
                  ? "border-[#19D3C5] bg-[#19D3C5]/10"
                  : "border-white/10 bg-[#0D1B2A]/70 hover:border-[#19D3C5]/40 hover:bg-[#0D1B2A]"
              }`}
            >

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#19D3C5]/20 bg-[#19D3C5]/10 text-2xl text-[#19D3C5]">
                ↑
              </div>

              <h2 className="mt-6 text-lg font-semibold">
                Drop your CSV here
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                or click to browse your computer
              </p>

              <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-slate-600">
                CSV · Maximum 10 MB
              </p>

              <input
                id="business-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

            </label>

            {/* SELECTED FILE */}

            {file && (

              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#19D3C5]/15 bg-[#19D3C5]/5 p-4">

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-white">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB · Ready for analysis
                  </p>

                </div>

                <span className="shrink-0 rounded-lg bg-[#19D3C5]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#19D3C5]">
                  Selected
                </span>

              </div>

            )}

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={validateAndAnalyze}
                disabled={!file || loading}
                className="rounded-xl bg-[#19D3C5] px-6 py-3.5 text-sm font-bold text-[#07111F] shadow-[0_0_35px_rgba(25,211,197,0.10)] transition hover:bg-[#6DE7DC] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                {loading
                  ? "Analyzing your business..."
                  : "Analyze Business →"}
              </button>

            </div>

          </div>

        </section>

        {/* VALIDATION */}

        {validation && (

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0D1B2A] p-6">

            <div className="flex items-start gap-4">

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                  validation.valid
                    ? "bg-[#19D3C5]/10 text-[#19D3C5]"
                    : "bg-[#FF6B6B]/10 text-[#FF8A8A]"
                }`}
              >
                {validation.valid ? "✓" : "!"}
              </div>

              <div>

                <h2 className="font-semibold">
                  {validation.valid
                    ? "Data validation passed"
                    : "Data needs attention"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {validation.valid
                    ? "Your dataset passed the initial quality checks."
                    : "Resolve the issues below before analysis can continue."}
                </p>

              </div>

            </div>

            {validation.valid && (

              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-white/5 bg-[#07111F] p-4">
                  <p className="text-xs text-slate-500">Rows</p>
                  <p className="mt-2 text-xl font-semibold">
                    {validation.rowCount?.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#07111F] p-4">
                  <p className="text-xs text-slate-500">Columns</p>
                  <p className="mt-2 text-xl font-semibold">
                    {validation.columns?.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#07111F] p-4">
                  <p className="text-xs text-slate-500">Warnings</p>
                  <p className="mt-2 text-xl font-semibold">
                    {validation.warnings.length}
                  </p>
                </div>

              </div>

            )}

            {validation.errors.length > 0 && (

              <div className="mt-6 rounded-xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/[0.06] p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-[#FF8A8A]">
                  Errors
                </p>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {validation.errors.map((error, index) => (
                    <li key={`${error}-${index}`}>
                      • {error}
                    </li>
                  ))}
                </ul>

              </div>

            )}

          </section>

        )}

        {/* ANALYSIS RESULT */}

        {analysis && (

          <section className="mt-8">

            <div className="mb-5">

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
                Analysis complete
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your business intelligence is ready.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {analysis.fileName}
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5">
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrency(analysis.metrics.totalRevenue)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5">
                <p className="text-xs text-slate-500">Gross Profit</p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrency(analysis.metrics.grossProfit)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5">
                <p className="text-xs text-slate-500">Gross Margin</p>
                <p className="mt-3 text-2xl font-semibold">
                  {analysis.metrics.grossMarginPct.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5">
                <p className="text-xs text-slate-500">Insights</p>
                <p className="mt-3 text-2xl font-semibold">
                  {analysis.summary.totalInsights}
                </p>
              </div>

            </div>

            <div className="mt-6 flex justify-end">

              <a
                href="/dashboard"
                className="rounded-xl bg-[#19D3C5] px-6 py-3.5 text-sm font-bold text-[#07111F] transition hover:bg-[#6DE7DC]"
              >
                Open Executive Dashboard →
              </a>

            </div>

          </section>

        )}

        {/* PROCESS */}

        <section className="grid gap-4 py-16 md:grid-cols-3">

          {[
            ["01", "Upload", "Provide the transaction data you already have."],
            ["02", "Understand", "Teketeke validates and analyzes the business signals."],
            ["03", "Decide", "Move from numbers to practical executive action."],
          ].map(([number, title, description]) => (

            <div
              key={number}
              className="rounded-2xl border border-white/7 bg-[#0D1B2A]/70 p-6"
            >

              <span className="text-xs font-bold tracking-[0.15em] text-[#19D3C5]">
                {number}
              </span>

              <h3 className="mt-8 font-semibold">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>

            </div>

          ))}

        </section>

        <footer className="border-t border-white/5 py-8">

          <p className="text-xs text-slate-600">
            TEKETEKE · AI-powered business intelligence
          </p>

        </footer>

      </div>

    </main>
  );
}