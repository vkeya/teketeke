"use client";

import { ChangeEvent, useState } from "react";
import { inferSchemaMapping } from "@/lib/data/SchemaMapper";
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
  hasCanonicalSchema?: boolean;
  suggestedMapping?: Partial<Record<MappingField, string>>;
};

type MappingField =
  | "date"
  | "revenue"
  | "cost"
  | "gross_profit"
  | "customer_name"
  | "country"
  | "product"
  | "payment_status";

const MAPPING_LABELS: Record<MappingField, string> = {
  date: "Date",
  revenue: "Revenue",
  cost: "Cost",
  gross_profit: "Gross Profit",
  customer_name: "Customer",
  country: "Country / Market",
  product: "Product",
  payment_status: "Payment Status",
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
  cleaningSummary?: {
    originalRows: number;
    analyzedRows: number;
    rowsRemoved: number;
    duplicatesRemoved: number;
    missingValuesFilled: number;
    missingRowsRemoved: number;
    categoriesNormalized: number;
    outlierRowsRemoved: number;
    invalidDatesRemoved: number;
    keptRows: number;
    reviewLaterGroups: number;
    reviewLaterColumns: number;
  };
  dataQuality?: {
    errors: string[];
    warnings: string[];
    rows: number;
    originalRows?: number;
    cleanedRows?: number;
    removedRows?: number[];
    keptRows?: number[];
    reviewLaterGroupIds?: string[];
    readinessScore?: number;
    issueCount?: number;
    criticalIssues?: number;
    warningIssues?: number;
    infoIssues?: number;
    issues?: Array<{
      id: string;
      type: string;
      severity: "critical" | "warning" | "info";
      title: string;
      description: string;
      affectedRows: number;
      affectedColumns: string[];
      recommendation: string;
      autoFixAvailable: boolean;
        outlierRowIndexes?: number[];
      duplicateGroups?: Array<{
        id: string;
        kind: "exact" | "transaction_id";
        key: string;
        exactMatch: boolean;
        records: Array<{
          rowIndex: number;
          transactionId?: string;
          values: Record<string, string>;
        }>;
      }>;
    }>;
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

  type DuplicateDecision = {
    action:
      | "keep_all"
      | "remove_duplicates"
      | "keep_record"
      | "review_later";
    selectedRowIndexes?: number[];
  };

  const [duplicateDecisions, setDuplicateDecisions] =
    useState<Record<string, DuplicateDecision>>({});

  type MissingValueDecision = {
    issueId: string;
    column: string;
    action: "fill_unknown" | "exclude_rows" | "review_later";
    replacementValue?: string;
    decidedAt: string;
  };

  const [missingValueDecisions, setMissingValueDecisions] =
    useState<Record<string, MissingValueDecision>>({});

  type CategoryNormalizationDecision = {
    issueId: string;
    column: string;
    action: "normalize" | "review_later";
    decidedAt: string;
  };

  const [categoryNormalizationDecisions, setCategoryNormalizationDecisions] =
    useState<Record<string, CategoryNormalizationDecision>>({});

  type OutlierDecision = {
    issueId: string;
    column: string;
    action: "keep" | "exclude_rows" | "review_later";
    rowIndexes?: number[];
    decidedAt: string;
  };

  const [outlierDecisions, setOutlierDecisions] =
    useState<Record<string, OutlierDecision>>({});

  type DateQualityDecision = {
    issueId: string;
    column: string;
    action: "exclude_invalid" | "review_later";
    decidedAt: string;
  };

  const [dateQualityDecisions, setDateQualityDecisions] =
    useState<Record<string, DateQualityDecision>>({});

  const [columnMapping, setColumnMapping] =
    useState<Record<MappingField, string>>({
      date: "",
      revenue: "",
      cost: "",
      gross_profit: "",
      customer_name: "",
      country: "",
      product: "",
      payment_status: "",
    });

  const coreColumnMap = [
    ["date", "Date / period"],
    ["revenue", "Revenue"],
    ["cost", "Cost"],
    ["gross_profit", "Gross profit"],
    ["customer_name", "Customer"],
    ["country", "Country / market"],
    ["product", "Product"],
    ["payment_status", "Payment status"],
  ] as const;

  const detectedCoreColumns = validation?.columns
    ? coreColumnMap.filter(([column]) =>
        validation.columns?.some((item) =>
          item.trim().toLowerCase() === column
        )
      )
    : [];

  const additionalColumns = validation?.columns
    ? validation.columns.filter(
        (column) =>
          !coreColumnMap.some(
            ([core]) => core === column.trim().toLowerCase()
          )
      )
    : [];

  function selectFile(selectedFile: File | null) {
    setValidation(null);
    setAnalysis(null);
    setDuplicateDecisions({});
    setMissingValueDecisions({});
    setCategoryNormalizationDecisions({});
    setOutlierDecisions({});
    setDateQualityDecisions({});

    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setColumnMapping({
      date: "",
      revenue: "",
      cost: "",
      gross_profit: "",
      customer_name: "",
      country: "",
      product: "",
      payment_status: "",
    });
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

  function inferColumnMapping(
    columns: string[]
  ): Record<MappingField, string> {
    const inferred = inferSchemaMapping(columns);

    return {
      date: inferred.date ?? columnMapping.date,
      revenue: inferred.revenue ?? columnMapping.revenue,
      cost: inferred.cost ?? columnMapping.cost,
      gross_profit:
        inferred.gross_profit ?? columnMapping.gross_profit,
      customer_name:
        inferred.customer_name ?? columnMapping.customer_name,
      country: inferred.country ?? columnMapping.country,
      product: inferred.product ?? columnMapping.product,
      payment_status:
        inferred.payment_status ?? columnMapping.payment_status,
    };
  }

  function handleValidationMapping(columns: string[]) {
    setColumnMapping(inferColumnMapping(columns));
  }

  function setDuplicateDecision(
    groupId: string,
    action: DuplicateDecision["action"],
    selectedRowIndexes?: number[]
  ) {
    setDuplicateDecisions((current) => ({
      ...current,
      [groupId]: {
        action,
        selectedRowIndexes,
      },
    }));
  }

  function setMissingValueDecision(
    issueId: string,
    column: string,
    action: MissingValueDecision["action"],
    replacementValue?: string
  ) {
    setMissingValueDecisions((current) => ({
      ...current,
      [column]: {
        issueId,
        column,
        action,
        replacementValue,
        decidedAt: new Date().toISOString(),
      },
    }));
  }

  function setCategoryNormalizationDecision(
    issueId: string,
    column: string,
    action: CategoryNormalizationDecision["action"]
  ) {
    setCategoryNormalizationDecisions((current) => ({
      ...current,
      [column]: {
        issueId,
        column,
        action,
        decidedAt: new Date().toISOString(),
      },
    }));
  }

  function setOutlierDecision(
    issueId: string,
    column: string,
    action: OutlierDecision["action"],
    rowIndexes?: number[]
  ) {
    setOutlierDecisions((current) => ({
      ...current,
      [column]: {
        issueId,
        column,
        action,
        rowIndexes,
        decidedAt: new Date().toISOString(),
      },
    }));
  }

  function setDateQualityDecision(
    issueId: string,
    column: string,
    action: DateQualityDecision["action"]
  ) {
    setDateQualityDecisions((current) => ({
      ...current,
      [column]: {
        issueId,
        column,
        action,
        decidedAt: new Date().toISOString(),
      },
    }));
  }

  async function validateData() {
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

      const suggestedMapping = validationData.suggestedMapping ?? {};
      const mappingToUse: Record<MappingField, string> = {
        ...columnMapping,
        ...suggestedMapping,
      };

      if (
        Object.keys(suggestedMapping).length === 0 &&
        validationData.columns?.length
      ) {
        Object.assign(
          mappingToUse,
          inferColumnMapping(validationData.columns)
        );
      }

      setColumnMapping(mappingToUse);

      if (validationData.columns?.length) {
        const inferred = inferSchemaMapping(
          validationData.columns
        );

        console.info("Inferred schema mapping:", inferred);
      }
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

  async function analyzeData() {
    if (!file || loading || !validation?.valid) {
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const analysisForm = new FormData();
      analysisForm.append("file", file);
      analysisForm.append(
        "mapping",
        JSON.stringify(columnMapping)
      );

      const cleaningDecisions = Object.entries(
        duplicateDecisions
      ).map(([groupId, decision]) => ({
        issueId:
          analysis?.dataQuality?.issues?.find((issue) =>
            issue.duplicateGroups?.some(
              (group) => group.id === groupId
            )
          )?.id ?? "duplicate_rows:dataset",
        groupId,
        action: decision.action,
        selectedRowIndexes: decision.selectedRowIndexes,
        decidedAt: new Date().toISOString(),
      }));

      if (cleaningDecisions.length > 0) {
        analysisForm.append(
          "cleaningDecisions",
          JSON.stringify(cleaningDecisions)
        );
      }

      const missingDecisions = Object.values(
        missingValueDecisions
      );

      if (missingDecisions.length > 0) {
        analysisForm.append(
          "missingValueDecisions",
          JSON.stringify(missingDecisions)
        );
      }

      const categoryDecisions = Object.values(
        categoryNormalizationDecisions
      );

      if (categoryDecisions.length > 0) {
        analysisForm.append(
          "categoryNormalizationDecisions",
          JSON.stringify(categoryDecisions)
        );
      }

      const outlierDecisionValues = Object.values(outlierDecisions);

      if (outlierDecisionValues.length > 0) {
        analysisForm.append(
          "outlierDecisions",
          JSON.stringify(outlierDecisionValues)
        );
      }

      const dateDecisionValues = Object.values(
        dateQualityDecisions
      );

      if (dateDecisionValues.length > 0) {
        analysisForm.append(
          "dateQualityDecisions",
          JSON.stringify(dateDecisionValues)
        );
      }

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
      setValidation((current) => ({
        valid: false,
        errors: [
          error instanceof Error
            ? error.message
            : "Unable to process the uploaded data.",
        ],
        warnings: current?.warnings ?? [],
        rowCount: current?.rowCount,
        columns: current?.columns,
        fileName: current?.fileName,
        hasCanonicalSchema: current?.hasCanonicalSchema,
        suggestedMapping: current?.suggestedMapping,
      }));
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
                Drop your business CSV here
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                or click to browse your computer
              </p>

              <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-slate-600">
                CSV · Maximum 10 MB · Excel support coming next
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

            {validation?.valid &&
              (Object.keys(duplicateDecisions).length > 0 ||
                Object.keys(missingValueDecisions).length > 0 ||
                Object.keys(categoryNormalizationDecisions).length > 0 ||
                Object.keys(outlierDecisions).length > 0 ||
                  Object.keys(dateQualityDecisions).length > 0) && (
                <div className="mt-4 rounded-xl border border-[#19D3C5]/10 bg-[#19D3C5]/[0.03] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#19D3C5]">
                    Cleaning decisions ready
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {Object.keys(duplicateDecisions).length +
                      Object.keys(missingValueDecisions).length +
                      Object.keys(categoryNormalizationDecisions).length +
                      Object.keys(outlierDecisions).length}{" "}
                    cleaning decision(s) will be applied before analysis.
                  </p>
                </div>
              )}

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={validation?.valid ? analyzeData : validateData}
                disabled={!file || loading}
                className="rounded-xl bg-[#19D3C5] px-6 py-3.5 text-sm font-bold text-[#07111F] shadow-[0_0_35px_rgba(25,211,197,0.10)] transition hover:bg-[#6DE7DC] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                {loading
                  ? validation?.valid
                    ? "Analyzing your business..."
                    : "Validating your data..."
                  : validation?.valid
                    ? Object.keys(duplicateDecisions).length > 0 ||
                      Object.keys(missingValueDecisions).length > 0 ||
                      Object.keys(categoryNormalizationDecisions).length > 0 ||
                      Object.keys(outlierDecisions).length > 0 ||
                      Object.keys(dateQualityDecisions).length > 0
                      ? "Apply Cleaning & Analyze →"
                      : "Analyze with Selected Mapping →"
                    : "Validate Data →"}
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

            {validation.valid && validation.columns && (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#19D3C5]/10 bg-[#07111F] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6DE7DC]">
                        Detected business fields
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Fields Teketeke can use for the current analysis.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#19D3C5]/10 px-2.5 py-1 text-[10px] font-bold text-[#6DE7DC]">
                      {detectedCoreColumns.length}/{coreColumnMap.length}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {detectedCoreColumns.map(([column, label]) => (
                      <div key={column} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                        <span className="text-[#19D3C5]">✓</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200">{label}</p>
                          <p className="truncate text-[10px] text-slate-600">{column}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#07111F] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Additional columns
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    These columns are present and can become future analytical dimensions.
                  </p>

                  {additionalColumns.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {additionalColumns.map((column) => (
                        <span key={column} className="rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-slate-400">
                          {column}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-600">No additional columns detected.</p>
                  )}
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

        {/* COLUMN MAPPING */}

        {validation?.valid && validation.columns?.length ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-[#0D1B2A] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
                Column mapping
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Confirm how Teketeke should understand your data.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                We detected likely matches from your column names. Review them
                before analysis. Columns that are not mapped remain available
                in the source file for future intelligence.
              </p>
            </div>

            <div className="grid gap-3">
              {(Object.keys(MAPPING_LABELS) as MappingField[]).map((field) => (
                <div
                  key={field}
                  className="grid gap-3 rounded-2xl border border-white/7 bg-[#07111F] p-4 sm:grid-cols-[1fr_1.4fr]"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {MAPPING_LABELS[field]}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Teketeke business field
                    </p>
                  </div>

                  <select
                    value={columnMapping[field]}
                    onChange={(event) =>
                      setColumnMapping((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-white/10 bg-[#0D1B2A] px-3 py-2.5 text-sm text-slate-200 outline-none"
                  >
                    <option value="">Not mapped</option>
                    {(validation.columns ?? []).map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#19D3C5]/10 bg-[#19D3C5]/[0.03] p-4">
              <p className="text-xs leading-5 text-slate-500">
                Mapping is currently a confirmation layer. The next backend
                step will send these mappings into the analyzer so different
                column names can be analyzed without renaming the source file.
              </p>
              <span className="shrink-0 rounded-full border border-[#19D3C5]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6DE7DC]">
                {Object.values(columnMapping).filter(Boolean).length}/8 mapped
              </span>
            </div>
          </section>
        ) : null}

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

            {analysis.dataQuality && (
              <div className="mb-5 rounded-2xl border border-white/10 bg-[#0D1B2A] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#19D3C5]">
                      Data quality
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {analysis.dataQuality.errors.length === 0
                        ? analysis.dataQuality.warnings.length === 0
                          ? "Data ready"
                          : "Data ready with warnings"
                        : "Data needs attention"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {analysis.dataQuality.rows.toLocaleString()} rows analyzed
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      analysis.dataQuality.errors.length > 0
                        ? "border-[#FF6B6B]/20 bg-[#FF6B6B]/10 text-[#FF8A8A]"
                        : analysis.dataQuality.warnings.length > 0
                          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                          : "border-[#19D3C5]/20 bg-[#19D3C5]/10 text-[#6DE7DC]"
                    }`}
                  >
                    {analysis.dataQuality.errors.length > 0
                      ? "Needs attention"
                      : analysis.dataQuality.warnings.length > 0
                        ? "Good · review warnings"
                        : "Excellent"}
                  </span>
                </div>

                {analysis.cleaningSummary && (
                  <div className="mt-4 rounded-2xl border border-[#19D3C5]/10 bg-[#07111F] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#19D3C5]">
                          Cleaning summary
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Approved cleaning decisions applied before analysis.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {analysis.cleaningSummary.analyzedRows.toLocaleString()}
                        </p>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-600">
                          rows analyzed
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        ["Uploaded", analysis.cleaningSummary.originalRows],
                        ["Removed", analysis.cleaningSummary.rowsRemoved],
                        ["Duplicates", analysis.cleaningSummary.duplicatesRemoved],
                        ["Missing filled", analysis.cleaningSummary.missingValuesFilled],
                        ["Missing rows", analysis.cleaningSummary.missingRowsRemoved],
                        ["Categories", analysis.cleaningSummary.categoriesNormalized],
                        ["Outliers", analysis.cleaningSummary.outlierRowsRemoved],
                        ["Invalid dates", analysis.cleaningSummary.invalidDatesRemoved],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-xl border border-white/7 bg-[#050D18] px-3 py-2.5"
                        >
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-200">
                            {Number(value).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {(analysis.cleaningSummary.reviewLaterGroups > 0 ||
                      analysis.cleaningSummary.reviewLaterColumns > 0) && (
                      <p className="mt-3 text-[10px] text-amber-300/80">
                        {analysis.cleaningSummary.reviewLaterGroups +
                          analysis.cleaningSummary.reviewLaterColumns}{" "}
                        cleaning item(s) remain marked for review.
                      </p>
                    )}
                  </div>
                )}

                {analysis.dataQuality.originalRows !== undefined &&
                  analysis.dataQuality.cleanedRows !== undefined &&
                  analysis.dataQuality.originalRows !==
                    analysis.dataQuality.cleanedRows && (
                    <div className="mt-4 rounded-xl border border-[#19D3C5]/10 bg-[#19D3C5]/[0.03] px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#19D3C5]">
                        Cleaning impact
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {analysis.dataQuality.originalRows.toLocaleString()}
                        {" uploaded → "}
                        {analysis.dataQuality.cleanedRows.toLocaleString()}
                        {" analyzed · "}
                        {(
                          analysis.dataQuality.originalRows -
                          analysis.dataQuality.cleanedRows
                        ).toLocaleString()}
                        {" row(s) removed by approved cleaning decisions."}
                      </p>
                    </div>
                  )}

                {analysis.dataQuality.readinessScore !== undefined && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#07111F] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Data readiness
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {analysis.dataQuality.issueCount ?? 0} issue(s) detected
                        </p>
                      </div>
                      <p className="text-2xl font-semibold text-white">
                        {Math.round(analysis.dataQuality.readinessScore)}/100
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#19D3C5]"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, analysis.dataQuality.readinessScore)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {analysis.dataQuality.issues &&
                  analysis.dataQuality.issues.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Cleaning review
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Teketeke detected these conditions without changing your source data.
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Review before cleaning
                        </span>
                      </div>

                      <div className="space-y-2">
                        {analysis.dataQuality.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="rounded-2xl border border-white/7 bg-[#07111F] p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-white">
                                    {issue.title}
                                  </p>
                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                                      issue.severity === "critical"
                                        ? "bg-[#FF6B6B]/10 text-[#FF8A8A]"
                                        : issue.severity === "warning"
                                          ? "bg-amber-400/10 text-amber-300"
                                          : "bg-white/5 text-slate-400"
                                    }`}
                                  >
                                    {issue.severity}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {issue.description}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs font-medium text-slate-400">
                                {issue.affectedRows.toLocaleString()} row(s)
                              </span>
                            </div>

                            <div className="mt-3 rounded-xl border border-white/7 bg-white/[0.02] px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#19D3C5]">
                                Recommendation
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                {issue.recommendation}
                              </p>
                            </div>

                            {issue.type === "missing_values" && (
                              <div className="mt-4 rounded-xl border border-white/7 bg-[#050D18] p-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMissingValueDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "fill_unknown",
                                        "Unknown"
                                      )
                                    }
                                    className="rounded-lg border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6DE7DC]"
                                  >
                                    Fill as Unknown
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMissingValueDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "exclude_rows"
                                      )
                                    }
                                    className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300"
                                  >
                                    Exclude Missing Rows
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMissingValueDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "review_later"
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                  >
                                    Review Later
                                  </button>
                                </div>
                                {missingValueDecisions[
                                  issue.affectedColumns[0] ?? ""
                                ] && (
                                  <p className="mt-2 text-[10px] font-medium text-[#6DE7DC]">
                                    Decision recorded:{" "}
                                    {missingValueDecisions[
                                      issue.affectedColumns[0] ?? ""
                                    ].action === "fill_unknown"
                                      ? 'fill missing values as "Unknown"'
                                      : missingValueDecisions[
                                            issue.affectedColumns[0] ?? ""
                                          ].action === "exclude_rows"
                                        ? "exclude affected rows"
                                        : "review later"}
                                  </p>
                                )}
                              </div>
                            )}

                            {issue.type === "inconsistent_categories" && (
                              <div className="mt-4 rounded-xl border border-white/7 bg-[#050D18] p-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCategoryNormalizationDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "normalize"
                                      )
                                    }
                                    className="rounded-lg border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6DE7DC]"
                                  >
                                    Normalize Categories
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCategoryNormalizationDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "review_later"
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                  >
                                    Review Later
                                  </button>
                                </div>

                                {categoryNormalizationDecisions[
                                  issue.affectedColumns[0] ?? ""
                                ] && (
                                  <p className="mt-2 text-[10px] font-medium text-[#6DE7DC]">
                                    Decision recorded:{" "}
                                    {categoryNormalizationDecisions[
                                      issue.affectedColumns[0] ?? ""
                                    ].action === "normalize"
                                      ? "normalize category labels"
                                      : "review later"}
                                  </p>
                                )}
                              </div>
                            )}

                            {issue.type === "outliers" && (
                              <div className="mt-4 rounded-xl border border-white/7 bg-[#050D18] p-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                  Flagged rows
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {(issue.outlierRowIndexes ?? []).map((rowIndex) => (
                                    <span
                                      key={`${issue.id}-${rowIndex}`}
                                      className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-[9px] font-medium text-slate-400"
                                    >
                                      Row {rowIndex}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOutlierDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "keep",
                                        issue.outlierRowIndexes
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"
                                  >
                                    Keep
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOutlierDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "exclude_rows",
                                        issue.outlierRowIndexes
                                      )
                                    }
                                    className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300"
                                  >
                                    Exclude Rows
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOutlierDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "review_later"
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                  >
                                    Review Later
                                  </button>
                                </div>
                                {outlierDecisions[
                                  issue.affectedColumns[0] ?? ""
                                ] && (
                                  <p className="mt-2 text-[10px] font-medium text-[#6DE7DC]">
                                    Decision recorded:{" "}
                                    {outlierDecisions[
                                      issue.affectedColumns[0] ?? ""
                                    ].action === "exclude_rows"
                                      ? "exclude flagged rows"
                                      : outlierDecisions[
                                            issue.affectedColumns[0] ?? ""
                                          ].action === "keep"
                                        ? "keep flagged rows"
                                        : "review later"}
                                  </p>
                                )}
                              </div>
                            )}

                            {issue.type === "invalid_dates" && (
                              <div className="mt-4 rounded-xl border border-white/7 bg-[#050D18] p-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                  Date quality decision
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  Invalid date values were detected in{" "}
                                  {issue.affectedColumns[0] ?? "the date column"}.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDateQualityDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "exclude_invalid"
                                      )
                                    }
                                    className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300"
                                  >
                                    Exclude Invalid Dates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDateQualityDecision(
                                        issue.id,
                                        issue.affectedColumns[0] ?? "",
                                        "review_later"
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                  >
                                    Review Later
                                  </button>
                                </div>
                                {dateQualityDecisions[
                                  issue.affectedColumns[0] ?? ""
                                ] && (
                                  <p className="mt-2 text-[10px] font-medium text-[#6DE7DC]">
                                    Decision recorded:{" "}
                                    {dateQualityDecisions[
                                      issue.affectedColumns[0] ?? ""
                                    ].action === "exclude_invalid"
                                      ? "exclude invalid dates"
                                      : "review later"}
                                  </p>
                                )}
                              </div>
                            )}

                            {issue.duplicateGroups &&
                              issue.duplicateGroups.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                    Duplicate groups
                                  </p>

                                  {issue.duplicateGroups.map((group) => (
                                    <div
                                      key={group.id}
                                      className="rounded-xl border border-white/7 bg-[#050D18] p-3"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                          <p className="text-xs font-semibold text-white">
                                            {group.kind === "exact"
                                              ? "Exact duplicate"
                                              : `Repeated transaction ID: ${group.key}`}
                                          </p>
                                          <p className="mt-1 text-[10px] text-slate-500">
                                            {group.records.length} records
                                            {group.exactMatch
                                              ? " · identical values"
                                              : " · values differ"}
                                          </p>
                                        </div>

                                        <span className="rounded-full border border-amber-400/10 bg-amber-400/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-300">
                                          Review
                                        </span>
                                      </div>

                                      <div className="mt-3 space-y-2">
                                        {group.records.map((record) => {
                                          const preview = Object.entries(
                                            record.values
                                          )
                                            .filter(
                                              ([, value]) =>
                                                value.trim() !== ""
                                            )
                                            .slice(0, 4);

                                          return (
                                            <div
                                              key={`${group.id}-${record.rowIndex}`}
                                              className="rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2.5"
                                            >
                                              <div className="flex items-center justify-between gap-3">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                                  Row {record.rowIndex}
                                                </span>
                                                {record.transactionId && (
                                                  <span className="text-[10px] font-medium text-[#6DE7DC]">
                                                    {record.transactionId}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                                                {preview.map(
                                                  ([column, value]) => (
                                                    <div
                                                      key={`${record.rowIndex}-${column}`}
                                                      className="flex min-w-0 justify-between gap-3 text-[10px]"
                                                    >
                                                      <span className="truncate text-slate-600">
                                                        {column}
                                                      </span>
                                                      <span className="truncate text-slate-400">
                                                        {value}
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDuplicateDecision(
                                              group.id,
                                              "keep_all",
                                              group.records.map(
                                                (record) => record.rowIndex
                                              )
                                            )
                                          }
                                          className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 transition hover:border-white/20 hover:text-white"
                                        >
                                          Keep All
                                        </button>

                                        {group.kind === "exact" ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setDuplicateDecision(
                                                group.id,
                                                "remove_duplicates",
                                                group.records
                                                  .slice(1)
                                                  .map(
                                                    (record) =>
                                                      record.rowIndex
                                                  )
                                              )
                                            }
                                            className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300 transition hover:bg-amber-400/10"
                                          >
                                            Remove Duplicates
                                          </button>
                                        ) : (
                                          group.records.map((record) => (
                                            <button
                                              key={`keep-${group.id}-${record.rowIndex}`}
                                              type="button"
                                              onClick={() =>
                                                setDuplicateDecision(
                                                  group.id,
                                                  "keep_record",
                                                  [record.rowIndex]
                                                )
                                              }
                                              className="rounded-lg border border-[#19D3C5]/20 bg-[#19D3C5]/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6DE7DC] transition hover:bg-[#19D3C5]/10"
                                            >
                                              Keep Row {record.rowIndex}
                                            </button>
                                          ))
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDuplicateDecision(
                                              group.id,
                                              "review_later"
                                            )
                                          }
                                          className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 transition hover:border-white/20 hover:text-slate-300"
                                        >
                                          Review Later
                                        </button>
                                      </div>

                                      {duplicateDecisions[group.id] && (
                                        <p className="mt-2 text-[10px] font-medium text-[#6DE7DC]">
                                          Decision recorded:{" "}
                                          {duplicateDecisions[group.id].action ===
                                          "remove_duplicates"
                                            ? "remove duplicate records"
                                            : duplicateDecisions[group.id]
                                                  .action === "keep_record"
                                              ? `keep row ${duplicateDecisions[
                                                  group.id
                                                ].selectedRowIndexes?.join(", ")}`
                                              : duplicateDecisions[group.id]
                                                    .action === "review_later"
                                                ? "review later"
                                                : "keep all records"}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {analysis.dataQuality.warnings.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {analysis.dataQuality.warnings.map((warning, index) => (
                      <p
                        key={`${warning}-${index}`}
                        className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2 text-xs leading-5 text-slate-400"
                      >
                        ⚠ {warning}
                      </p>
                    ))}
                  </div>
                )}

                {analysis.dataQuality.errors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {analysis.dataQuality.errors.map((error, index) => (
                      <p
                        key={`${error}-${index}`}
                        className="rounded-xl border border-[#FF6B6B]/10 bg-[#FF6B6B]/[0.04] px-3 py-2 text-xs leading-5 text-[#FFB0B0]"
                      >
                        • {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

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