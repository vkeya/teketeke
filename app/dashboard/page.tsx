"use client";

import { useEffect, useMemo, useState } from "react";

import { dashboardData } from "../../data/teketeke_dashboard_data";
import businessInsights from "../../data/business_insights.json";
import AskTeketeke from "../../components/AskTeketeke";
import ExecutiveBriefingContainer from "../../components/dashboard/ExecutiveBriefingContainer";
import RiskOpportunityRadar from "../../components/dashboard/RiskOpportunityRadar";
import {
  getUploadedAnalysis,
  type UploadedAnalysis,
} from "../../lib/analysisStorage";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }

  return formatCurrency(value);
};

type DashboardAnalysis = UploadedAnalysis & {
  monthlyPerformance?: Array<{
    month: string;
    revenue: number;
    grossProfit?: number;
  }>;
  countries?: Array<{
    name: string;
    revenue: number;
    sharePct: number;
  }>;
  customers?: Array<{
    name: string;
    revenue: number;
    sharePct: number;
  }>;
  paymentStatus?: Array<{
    status: string;
    revenue: number;
    sharePct: number;
  }>;
};

function MetricCard({
  label,
  value,
  description,
  negative = false,
}: {
  label: string;
  value: string;
  description: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p
        className={`mt-2 text-xs font-medium ${
          negative ? "text-[#FF8A8A]" : "text-[#19D3C5]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function formatTrendPeriodLabel(
  value: string,
  period: "monthly" | "quarterly" | "yearly"
): string {
  if (period === "monthly") {
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        1
      );

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(date);
    }
  }

  if (period === "quarterly") {
    const match = value.match(/^(\d{4})-Q([1-4])$/);
    if (match) {
      return `Q${match[2]} ${match[1]}`;
    }
  }

  return value;
}

function ProductMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#091625] px-6 py-5 sm:px-7">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}


export default function DashboardPage() {
  const [uploadedAnalysis, setUploadedAnalysis] =
    useState<UploadedAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUploadedAnalysis(getUploadedAnalysis());
    setLoaded(true);
  }, []);

  const dashboardAnalysis =
    uploadedAnalysis as DashboardAnalysis | null;

  const executive =
    dashboardAnalysis?.metrics ?? dashboardData.executive;

  const monthlyPerformance =
    dashboardAnalysis?.monthlyPerformance?.length
      ? dashboardAnalysis.monthlyPerformance
      : dashboardData.monthlyPerformance;

  const countries =
    dashboardAnalysis?.countries?.length
      ? dashboardAnalysis.countries
      : dashboardData.countries;

  const uploadedOverdueRevenue =
    dashboardAnalysis?.paymentStatus
      ?.filter(
        (item) => item.status.toLowerCase() === "overdue"
      )
      .reduce(
        (sum, item) => sum + item.revenue,
        0
      ) ?? 0;

  const overdueRevenue =
    dashboardData.payments.find(
      (payment) => payment.status === "Overdue"
    )?.revenue ?? 0;

  const effectiveOverdueRevenue = dashboardAnalysis
    ? uploadedOverdueRevenue
    : overdueRevenue;

  const topCustomer = uploadedAnalysis?.topCustomer ?? null;
  const topCountry = uploadedAnalysis?.topCountry ?? null;
  const topProduct =
    uploadedAnalysis?.topProduct ?? dashboardData.products[0];

  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [trendMetric, setTrendMetric] = useState<"revenue" | "grossProfit">("revenue");
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [marketView, setMarketView] =
    useState<"revenue" | "share">("revenue");
  const [marketSort, setMarketSort] =
    useState<"highest" | "lowest">("highest");
  const [hoveredMarket, setHoveredMarket] = useState<string | null>(null);
  const [productView, setProductView] =
    useState<"revenue" | "share">("revenue");
  const [productSort, setProductSort] =
    useState<"highest" | "lowest">("highest");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [customerView, setCustomerView] =
    useState<"revenue" | "share">("revenue");
  const [customerSort, setCustomerSort] =
    useState<"highest" | "lowest">("highest");
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);

  const customerData = useMemo(() => {
    const customers = dashboardAnalysis?.customers ?? [];

    return [...customers].sort((a, b) =>
      customerSort === "highest"
        ? b.revenue - a.revenue
        : a.revenue - b.revenue
    );
  }, [dashboardAnalysis, customerSort]);


  const productData = useMemo(() => {
    const products =
      uploadedAnalysis?.products && uploadedAnalysis.products.length > 0
        ? uploadedAnalysis.products
        : uploadedAnalysis?.topProduct
          ? [
              {
                name: uploadedAnalysis.topProduct.name,
                revenue: uploadedAnalysis.topProduct.revenue,
                sharePct:
                  executive.totalRevenue > 0
                    ? (uploadedAnalysis.topProduct.revenue /
                        executive.totalRevenue) *
                      100
                    : 0,
              },
            ]
          : dashboardData.products.map((product) => ({
              name: product.name,
              revenue: product.revenue,
              sharePct:
                executive.totalRevenue > 0
                  ? (product.revenue / executive.totalRevenue) * 100
                  : 0,
            }));

    return [...products].sort((a, b) =>
      productSort === "highest"
        ? b.revenue - a.revenue
        : a.revenue - b.revenue
    );
  }, [
    uploadedAnalysis,
    dashboardData.products,
    executive.totalRevenue,
    productSort,
  ]);

  const marketData = useMemo(() => {
    return [...countries].sort((a, b) =>
      marketSort === "highest"
        ? b.revenue - a.revenue
        : a.revenue - b.revenue
    );
  }, [countries, marketSort]);

  const decisionSignals = useMemo(() => {
    const insights: UploadedAnalysis["insights"] =
      dashboardAnalysis?.insights ??
      (businessInsights.insights as UploadedAnalysis["insights"]);

    const byPriority = (items: UploadedAnalysis["insights"]) =>
      [...items].sort(
        (a, b) =>
          Number(b.priority === "high") - Number(a.priority === "high")
      );

    const risks = byPriority(
      insights.filter((item) => item.type === "risk")
    );
    const opportunities = byPriority(
      insights.filter((item) => item.type === "opportunity")
    );

    const topCustomerShare = customerData[0]?.sharePct ?? 0;
    const topProductShare = productData[0]?.sharePct ?? 0;
    const topMarketShare = marketData[0]?.sharePct ?? 0;

    const scoreSignal = (
      signal: UploadedAnalysis["insights"][number]
    ) => {
      const priorityScore = signal.priority === "high" ? 60 : 35;
      const evidenceText =
        `${signal.title} ${signal.finding} ${signal.recommendation}`.toLowerCase();

      const evidenceScore =
        (evidenceText.includes("revenue") ? 10 : 0) +
        (evidenceText.includes("margin") ? 10 : 0) +
        (evidenceText.includes("customer") ? 8 : 0) +
        (evidenceText.includes("market") ? 6 : 0) +
        (evidenceText.includes("product") ? 6 : 0);

      const score = Math.min(priorityScore + evidenceScore, 100);

      return {
        ...signal,
        score,
        level:
          score >= 75 ? ("critical" as const) :
          score >= 50 ? ("high" as const) :
          ("medium" as const),
      };
    };

    const scoredRisks = risks.map(scoreSignal).sort((a, b) => b.score - a.score);
    const scoredOpportunities = opportunities
      .map(scoreSignal)
      .sort((a, b) => b.score - a.score);

    const strongestRisk = scoredRisks[0];
    const strongestOpportunity = scoredOpportunities[0];

    return {
      risks: scoredRisks,
      opportunities: scoredOpportunities,
      strongestRisk,
      strongestOpportunity,
      topCustomerShare,
      topProductShare,
      topMarketShare,
    };
  }, [
    dashboardAnalysis,
    businessInsights.insights,
    customerData,
    productData,
    marketData,
  ]);

  const trendData = useMemo(() => {
    type TrendPoint = {
      label: string;
      revenue: number;
      grossProfit: number;
    };

    if (!monthlyPerformance.length) return [] as TrendPoint[];

    const grouped = new Map<string, TrendPoint>();

    for (const item of monthlyPerformance) {
      const [yearText, monthText] = item.month.split("-");
      const year = Number(yearText);
      const month = Number(monthText);
      if (!Number.isFinite(year) || !Number.isFinite(month)) continue;

      let key = item.month;
      let label = item.month;

      if (trendPeriod === "quarterly") {
        const quarter = Math.floor((month - 1) / 3) + 1;
        key = `${year}-Q${quarter}`;
        label = `Q${quarter} ${year}`;
      } else if (trendPeriod === "yearly") {
        key = String(year);
        label = String(year);
      }

      const current = grouped.get(key) ?? {
        label,
        revenue: 0,
        grossProfit: 0,
      };

      current.revenue += item.revenue;
      current.grossProfit += item.grossProfit ?? 0;
      grouped.set(key, current);
    }

    return Array.from(grouped.values());
  }, [monthlyPerformance, trendPeriod]);

  const trendSummary = useMemo(() => {
    if (!trendData.length) {
      return { total: 0, average: 0, best: "—", changePct: 0 };
    }

    const values = trendData.map((item) =>
      trendMetric === "revenue" ? item.revenue : item.grossProfit
    );
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    const bestIndex = values.indexOf(Math.max(...values));
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const changePct = first === 0 ? 0 : ((last - first) / first) * 100;

    return {
      total,
      average,
      best: trendData[bestIndex]?.label ?? "—",
      changePct,
    };
  }, [trendData, trendMetric]);

  const selectedPeriodPerformance = useMemo(() => {
    if (!trendData.length) {
      return {
        periodLabel: trendPeriod === "monthly"
          ? "Monthly"
          : trendPeriod === "quarterly"
            ? "Quarterly"
            : "Yearly",
        total: 0,
        average: 0,
        changePct: 0,
      };
    }

    return {
      periodLabel:
        trendPeriod === "monthly"
          ? "Monthly"
          : trendPeriod === "quarterly"
            ? "Quarterly"
            : "Yearly",
      total: trendSummary.total,
      average: trendSummary.average,
      changePct: trendSummary.changePct,
    };
  }, [trendData, trendPeriod, trendSummary]);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111F]">
        <p className="text-sm text-slate-500">
          Loading your intelligence dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111F] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[5%] top-[5%] h-72 w-72 rounded-full bg-[#19D3C5]/5 blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-96 w-96 rounded-full bg-[#7C5CFC]/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* HEADER */}

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white">
              T
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                TEKETEKE
              </p>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                AI BUSINESS INTELLIGENCE
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-slate-500">
              Executive Overview
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              See what matters. Decide what comes next.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Teketeke turns your business data into clear performance
              metrics, risks and opportunities.
            </p>

            {uploadedAnalysis && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#19D3C5]/10 px-3 py-2 text-xs font-medium text-[#19D3C5]">
                <span className="h-2 w-2 rounded-full bg-[#19D3C5]/100" />
                Using uploaded data: {uploadedAnalysis.fileName}
              </div>
            )}
          </div>
        </header>

        {/* EXECUTIVE BRIEFING */}

        <div className="mb-8">
          <ExecutiveBriefingContainer />
        </div>

                {/* EXECUTIVE SCORECARD */}

        <section className="mb-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Executive scorecard
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The core financial and commercial measures behind the executive view.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Revenue"
            value={formatCompactCurrency(executive.totalRevenue)}
            description="Total revenue"
          />

          <MetricCard
            label="Gross Profit"
            value={formatCompactCurrency(executive.grossProfit)}
            description="Profit after direct costs"
          />

          <MetricCard
            label="Gross Margin"
            value={`${executive.grossMarginPct.toFixed(2)}%`}
            description="Profitability"
          />

          <MetricCard
            label="Customers"
            value={executive.customers.toLocaleString()}
            description="Unique customers"
          />

          <MetricCard
            label="Overdue"
            value={formatCompactCurrency(effectiveOverdueRevenue)}
            description={
              effectiveOverdueRevenue > 0
                ? "Requires attention"
                : "No overdue revenue detected"
            }
            negative={effectiveOverdueRevenue > 0}
          />
          </div>
        </section>

        {/* PERFORMANCE */}

        <section id="market-explorer" className="mb-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] lg:col-span-2">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Performance explorer
                </p>
                <h2 className="mt-2 font-semibold">Revenue & profitability trend</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Change the period or metric and Teketeke recalculates the view from the analyzed data.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-white/10 bg-[#07111F] p-1">
                  {([
                    ["monthly", "Monthly"],
                    ["quarterly", "Quarterly"],
                    ["yearly", "Yearly"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTrendPeriod(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        trendPeriod === value
                          ? "bg-[#19D3C5]/15 text-[#6DE7DC]"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Trend metric"
                  value={trendMetric}
                  onChange={(event) =>
                    setTrendMetric(event.target.value as "revenue" | "grossProfit")
                  }
                  className="rounded-xl border border-white/10 bg-[#07111F] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="revenue">Revenue</option>
                  <option value="grossProfit">Gross profit</option>
                </select>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-[#091625] px-3 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Selected total</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(trendSummary.total)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#091625] px-3 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Average / period</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(trendSummary.average)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#091625] px-3 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Best period</p>
                <p className="mt-1 text-sm font-semibold text-white">
                {formatTrendPeriodLabel(trendSummary.best, trendPeriod)}
              </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#091625] px-3 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">First → last</p>
                <p className={`mt-1 text-sm font-semibold ${trendSummary.changePct >= 0 ? "text-[#19D3C5]" : "text-[#FF8A8A]"}`}>
                  {trendSummary.changePct >= 0 ? "+" : ""}{trendSummary.changePct.toFixed(1)}%
                </p>
              </div>
            </div>

            <div
              className="relative flex h-64 items-end gap-1 rounded-xl bg-[#07111F] px-4 pb-6 pt-5"
              onMouseLeave={() => setHoveredTrendIndex(null)}
            >
              {trendData.map((point, index) => {
                const value =
                  trendMetric === "revenue"
                    ? point.revenue
                    : point.grossProfit;

                const maxValue = Math.max(
                  ...trendData.map((item) =>
                    trendMetric === "revenue"
                      ? item.revenue
                      : item.grossProfit
                  )
                );

                const height =
                  maxValue > 0 ? (value / maxValue) * 100 : 0;

                const previousPoint = trendData[index - 1];
                const previousValue = previousPoint
                  ? trendMetric === "revenue"
                    ? previousPoint.revenue
                    : previousPoint.grossProfit
                  : 0;

                const changePct =
                  previousPoint && previousValue !== 0
                    ? ((value - previousValue) / previousValue) * 100
                    : null;

                const isHovered = hoveredTrendIndex === index;

                return (
                  <div
                    key={point.label}
                    className="group relative flex h-full min-w-0 flex-1 items-end"
                    onMouseEnter={() => setHoveredTrendIndex(index)}
                  >
                    {isHovered ? (
                      <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 w-44 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0D1B2A] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6DE7DC]">
                          {formatTrendPeriodLabel(point.label, trendPeriod)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatCurrency(value)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {trendMetric === "revenue"
                            ? "Revenue"
                            : "Gross profit"}
                        </p>
                        {changePct !== null ? (
                          <p
                            className={`mt-2 text-[11px] font-semibold ${
                              changePct >= 0
                                ? "text-[#19D3C5]"
                                : "text-[#FF8A8A]"
                            }`}
                          >
                            {changePct >= 0 ? "+" : ""}
                            {changePct.toFixed(1)}% vs previous period
                          </p>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-500">
                            First period
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div
                      className={`w-full rounded-t-sm transition ${
                        isHovered
                          ? "bg-[#6DE7DC]"
                          : "bg-[#19D3C5]"
                      }`}
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-[11px] text-slate-500">
              <span>
                {trendData[0]
                  ? formatTrendPeriodLabel(trendData[0].label, trendPeriod)
                  : "—"}
              </span>
              <span>
                {trendData[trendData.length - 1]
                  ? formatTrendPeriodLabel(
                      trendData[trendData.length - 1].label,
                      trendPeriod
                    )
                  : "—"}
              </span>
            </div>

            {dashboardAnalysis ? (
              <p className="mt-4 rounded-lg bg-[#19D3C5]/10 px-3 py-2 text-xs text-[#6DE7DC]">
                Calculated from the uploaded dataset. The selected view aggregates the underlying monthly analysis into {trendPeriod} periods.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-500">
                Calculated from the Teketeke demo dataset.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Market explorer
                </p>
                <h2 className="mt-2 font-semibold">Revenue by market</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Explore market contribution and change the ranking.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-white/10 bg-[#07111F] p-1">
                  {([
                    ["revenue", "Revenue"],
                    ["share", "Share %"],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button"
                      onClick={() => setMarketView(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        marketView === value
                          ? "bg-[#19D3C5]/15 text-[#6DE7DC]"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Market sort order"
                  value={marketSort}
                  onChange={(event) =>
                    setMarketSort(event.target.value as "highest" | "lowest")
                  }
                  className="rounded-xl border border-white/10 bg-[#07111F] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="highest">Highest first</option>
                  <option value="lowest">Lowest first</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              {marketData.length > 0 ? (
                marketData.slice(0, 5).map((country) => {
                  const isHovered = hoveredMarket === country.name;

                  return (
                    <div
                      key={country.name}
                      className="group relative"
                      onMouseEnter={() => setHoveredMarket(country.name)}
                      onMouseLeave={() => setHoveredMarket(null)}
                    >
                      {isHovered ? (
                        <div className="pointer-events-none absolute right-0 top-0 z-20 w-48 -translate-y-1 rounded-xl border border-white/10 bg-[#0D1B2A] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6DE7DC]">
                            {country.name}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatCompactCurrency(country.revenue)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {country.sharePct.toFixed(1)}% of total revenue
                          </p>
                        </div>
                      ) : null}

                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium">{country.name}</span>
                        <span className="font-semibold">
                          {marketView === "revenue"
                            ? formatCompactCurrency(country.revenue)
                            : `${country.sharePct.toFixed(1)}%`}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full transition ${
                            isHovered ? "bg-[#6DE7DC]" : "bg-[#19D3C5]"
                          }`}
                          style={{ width: `${country.sharePct}%` }}
                        />
                      </div>

                      <p className="mt-1 text-right text-[11px] text-slate-500">
                        {formatCompactCurrency(country.revenue)} ·{" "}
                        {country.sharePct.toFixed(1)}% of revenue
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No market data available.</p>
              )}
            </div>
          </div>
        </section>

        {/* EXECUTIVE DECISION INTELLIGENCE */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-[#19D3C5]/10 bg-gradient-to-br from-[#0D1B2A] to-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.2)]">
          <div className="border-b border-white/5 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
                  Executive decision intelligence
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  What needs your attention?
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Teketeke prioritizes the strongest signals already found in
                  your business data while the performance context follows the
                  period and metric selected above.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#07111F] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Signals
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {decisionSignals.risks.length} risks ·{" "}
                  {decisionSignals.opportunities.length} opportunities
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {decisionSignals.risks.filter((item) => item.priority === "high").length} high-priority signals
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-white/5 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Selected performance view
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPeriodPerformance.periodLabel} ·{" "}
                  {trendMetric === "revenue" ? "Revenue" : "Gross profit"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl border border-white/5 bg-[#07111F] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatCompactCurrency(selectedPeriodPerformance.total)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#07111F] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                    Avg / period
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatCompactCurrency(selectedPeriodPerformance.average)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#07111F] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                    First → last
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      selectedPeriodPerformance.changePct >= 0
                        ? "text-[#19D3C5]"
                        : "text-[#FF8A8A]"
                    }`}
                  >
                    {selectedPeriodPerformance.changePct >= 0 ? "+" : ""}
                    {selectedPeriodPerformance.changePct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#FF8A8A]/15 bg-[#FF8A8A]/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF8A8A]">
                Priority risk
              </p>

              {decisionSignals.strongestRisk ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {decisionSignals.strongestRisk.title}
                    </h3>
                    <span className="rounded-full border border-[#FF8A8A]/20 bg-[#FF8A8A]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FF8A8A]">
                      {decisionSignals.strongestRisk.level} ·{" "}
                      {decisionSignals.strongestRisk.score}/100
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {decisionSignals.strongestRisk.finding}
                  </p>
                  <div className="mt-4 rounded-xl border border-white/5 bg-[#07111F] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Recommended action
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {decisionSignals.strongestRisk.recommendation}
                    </p>
                  </div>
                  <a
                    href={
                      decisionSignals.strongestRisk.title
                        .toLowerCase()
                        .includes("customer")
                        ? "#customer-explorer"
                        : "#executive-scorecard"
                    }
                    className="mt-4 inline-flex items-center text-xs font-semibold text-[#FF8A8A] transition hover:text-white"
                  >
                    Explore the underlying signal →
                  </a>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No material risk signal was identified.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[#19D3C5]/15 bg-[#19D3C5]/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6DE7DC]">
                Priority opportunity
              </p>

              {decisionSignals.strongestOpportunity ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {decisionSignals.strongestOpportunity.title}
                    </h3>
                    <span className="rounded-full border border-[#19D3C5]/20 bg-[#19D3C5]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6DE7DC]">
                      {decisionSignals.strongestOpportunity.level} ·{" "}
                      {decisionSignals.strongestOpportunity.score}/100
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {decisionSignals.strongestOpportunity.finding}
                  </p>
                  <div className="mt-4 rounded-xl border border-white/5 bg-[#07111F] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Recommended action
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {decisionSignals.strongestOpportunity.recommendation}
                    </p>
                  </div>
                  <a
                    href={
                      decisionSignals.strongestOpportunity.title
                        .toLowerCase()
                        .includes("product")
                        ? "#product-explorer"
                        : "#market-explorer"
                    }
                    className="mt-4 inline-flex items-center text-xs font-semibold text-[#6DE7DC] transition hover:text-white"
                  >
                    Explore the underlying signal →
                  </a>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No material opportunity signal was identified.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/5 px-6 py-5 sm:grid-cols-3 sm:px-8">
            {[
              ["Customer concentration", decisionSignals.topCustomerShare],
              ["Product concentration", decisionSignals.topProductShare],
              ["Market concentration", decisionSignals.topMarketShare],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/5 bg-[#07111F] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {Number(value).toFixed(1)}%
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Share held by the leading dimension
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RISK & OPPORTUNITY RADAR */}

        <div className="mb-8">
          <RiskOpportunityRadar
            context={
              (dashboardAnalysis ?? {
                insights: businessInsights.insights,
              }) as any
            }
          />
        </div>

        {/* PRODUCT EXPLORER */}

        <section id="product-explorer" className="mb-8 overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.18)]">
          <div className="border-b border-white/5 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#A993FF]/15 bg-[#A993FF]/5 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A993FF] shadow-[0_0_9px_rgba(169,147,255,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A993FF]">
                    Product explorer
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  What is driving the portfolio?
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Compare product contribution and change the ranking to
                  investigate where the business is concentrated.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-white/10 bg-[#07111F] p-1">
                  {([
                    ["revenue", "Revenue"],
                    ["share", "Share %"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProductView(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        productView === value
                          ? "bg-[#A993FF]/15 text-[#C0B3FF]"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Product sort order"
                  value={productSort}
                  onChange={(event) =>
                    setProductSort(
                      event.target.value as "highest" | "lowest"
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#07111F] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="highest">Highest first</option>
                  <option value="lowest">Lowest first</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            {productData.length > 0 ? (
              productData.slice(0, 8).map((product) => {
                const share =
                  executive.totalRevenue > 0
                    ? (product.revenue / executive.totalRevenue) * 100
                    : 0;
                const isHovered = hoveredProduct === product.name;

                return (
                  <div
                    key={product.name}
                    className="group relative"
                    onMouseEnter={() => setHoveredProduct(product.name)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    {isHovered ? (
                      <div className="pointer-events-none absolute right-0 top-0 z-20 w-52 -translate-y-1 rounded-xl border border-white/10 bg-[#0D1B2A] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C0B3FF]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatCompactCurrency(product.revenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {share.toFixed(1)}% of total revenue
                        </p>
                      </div>
                    ) : null}

                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-200">
                        {product.name}
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {productView === "revenue"
                          ? formatCompactCurrency(product.revenue)
                          : `${share.toFixed(1)}%`}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition ${
                          isHovered ? "bg-[#C0B3FF]" : "bg-[#A993FF]"
                        }`}
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      {formatCompactCurrency(product.revenue)} ·{" "}
                      {share.toFixed(1)}% of revenue
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No product data available.
              </p>
            )}
          </div>
        </section>

        {/* CUSTOMER EXPLORER */}

        <section id="customer-explorer" className="mb-8 overflow-hidden rounded-3xl border border-white/7 bg-[#091625] shadow-[0_25px_80px_rgba(0,0,0,0.18)]">
          <div className="border-b border-white/5 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/15 bg-[#19D3C5]/5 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8FE8DF]">
                    Customer explorer
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Where is revenue concentrated?
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Identify your largest revenue relationships and the level of
                  customer concentration in the uploaded business data.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-white/10 bg-[#07111F] p-1">
                  {([
                    ["revenue", "Revenue"],
                    ["share", "Share %"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCustomerView(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        customerView === value
                          ? "bg-[#19D3C5]/15 text-[#6DE7DC]"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Customer sort order"
                  value={customerSort}
                  onChange={(event) =>
                    setCustomerSort(
                      event.target.value as "highest" | "lowest"
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#07111F] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="highest">Highest first</option>
                  <option value="lowest">Lowest first</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            {customerData.length > 0 ? (
              customerData.slice(0, 8).map((customer) => {
                const isHovered = hoveredCustomer === customer.name;

                return (
                  <div
                    key={customer.name}
                    className="group relative"
                    onMouseEnter={() => setHoveredCustomer(customer.name)}
                    onMouseLeave={() => setHoveredCustomer(null)}
                  >
                    {isHovered ? (
                      <div className="pointer-events-none absolute right-0 top-0 z-20 w-52 -translate-y-1 rounded-xl border border-white/10 bg-[#0D1B2A] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8FE8DF]">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatCompactCurrency(customer.revenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {customer.sharePct.toFixed(1)}% of total revenue
                        </p>
                      </div>
                    ) : null}

                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="truncate text-sm font-medium text-slate-200">
                        {customer.name}
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-white">
                        {customerView === "revenue"
                          ? formatCompactCurrency(customer.revenue)
                          : `${customer.sharePct.toFixed(1)}%`}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition ${
                          isHovered ? "bg-[#6DE7DC]" : "bg-[#19D3C5]"
                        }`}
                        style={{ width: `${Math.min(customer.sharePct, 100)}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      {formatCompactCurrency(customer.revenue)} ·{" "}
                      {customer.sharePct.toFixed(1)}% of revenue
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No customer-level data is available in this analysis.
              </p>
            )}
          </div>
        </section>

        {/* ASK TEKETEKE */}

        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Decision assistant
          </p>
          <span className="text-[10px] text-slate-500">
            Local intelligence active
          </span>
        </div>

        <AskTeketeke
          suggestedQuestions={[
            "Why is Uganda revenue declining?",
            "What are my biggest business risks?",
            "Which market is growing fastest?",
            "Which customers should I protect?",
          ]}
        />
      </div>
    </main>
  );
}