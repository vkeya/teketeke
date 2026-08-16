"use client";

import { useEffect, useState } from "react";

import { dashboardData } from "../../data/teketeke_dashboard_data";
import businessInsights from "../../data/business_insights.json";
import AskTeketeke from "../../components/AskTeketeke";
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

export default function DashboardPage() {
  const [uploadedAnalysis, setUploadedAnalysis] =
    useState<UploadedAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUploadedAnalysis(getUploadedAnalysis());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111F]">
        <p className="text-sm text-slate-500">
          Loading your intelligence dashboard...
        </p>
      </main>
    );
  }

  const executive =
    uploadedAnalysis?.metrics ?? dashboardData.executive;

  const insights =
    uploadedAnalysis?.insights ?? businessInsights.insights;

  const overdueRevenue =
    dashboardData.payments.find(
      (payment) => payment.status === "Overdue"
    )?.revenue ?? 0;

  const effectiveOverdueRevenue = uploadedAnalysis
    ? 0
    : overdueRevenue;

  const topCustomer = uploadedAnalysis?.topCustomer ?? null;
  const topCountry = uploadedAnalysis?.topCountry ?? null;
  const topProduct =
    uploadedAnalysis?.topProduct ?? dashboardData.products[0];

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

        {/* EXECUTIVE SUMMARY */}

        <section className="mb-8 rounded-2xl bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <p className="text-sm font-medium text-slate-500">
            Executive summary
          </p>

          <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight">
            Your business generated{" "}
            {formatCompactCurrency(executive.totalRevenue)} in revenue
            with a {executive.grossMarginPct.toFixed(2)}% gross margin.
          </h2>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-lg bg-[#0D1B2A]/10 px-3 py-2">
              {executive.transactions.toLocaleString()} transactions
            </span>

            <span className="rounded-lg bg-[#0D1B2A]/10 px-3 py-2">
              {executive.customers.toLocaleString()} customers
            </span>

            <span className="rounded-lg bg-[#0D1B2A]/10 px-3 py-2">
              {uploadedAnalysis
                ? `${uploadedAnalysis.metrics.countries.toLocaleString()} countries`
                : `${dashboardData.executive.unitsSold.toLocaleString()} units sold`}
            </span>

            <span className="rounded-lg bg-[#19D3C5]/100/20 px-3 py-2 text-[#6DE7DC]">
              Data validated
            </span>
          </div>
        </section>

        {/* KPI CARDS */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            value={uploadedAnalysis ? "—" : formatCompactCurrency(effectiveOverdueRevenue)}
            description={uploadedAnalysis ? "Not calculated yet" : "Requires attention"}
            negative={!uploadedAnalysis}
          />
        </section>

        {/* PERFORMANCE */}

        <section className="mb-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] lg:col-span-2">
            <div className="mb-6">
              <h2 className="font-semibold">Revenue trend</h2>
              <p className="mt-1 text-sm text-slate-500">
                Monthly revenue across the analysis period.
              </p>
            </div>

            <div className="flex h-64 items-end gap-1 rounded-xl bg-[#07111F] px-4 pb-6 pt-5">
              {dashboardData.monthlyPerformance.map((month) => {
                const maxRevenue = Math.max(
                  ...dashboardData.monthlyPerformance.map(
                    (item) => item.revenue
                  )
                );

                const height =
                  (month.revenue / maxRevenue) * 100;

                return (
                  <div
                    key={month.month}
                    className="group flex h-full flex-1 items-end"
                    title={`${month.month}: ${formatCurrency(month.revenue)}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-[#19D3C5] transition group-hover:bg-[#6DE7DC]"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-[11px] text-slate-500">
              <span>{dashboardData.monthlyPerformance[0]?.month}</span>
              <span>
                {
                  dashboardData.monthlyPerformance[
                    dashboardData.monthlyPerformance.length - 1
                  ]?.month
                }
              </span>
            </div>

            {uploadedAnalysis && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This chart is currently showing the demo time-series dataset.
                Uploaded-data KPIs and insights are active above.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0D1B2A] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-6">
              <h2 className="font-semibold">Revenue by market</h2>
              <p className="mt-1 text-sm text-slate-500">
                Where revenue is coming from.
              </p>
            </div>

            {uploadedAnalysis && topCountry ? (
              <div className="rounded-xl bg-[#07111F] p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Leading market
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {topCountry.name}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {formatCompactCurrency(topCountry.revenue)} in revenue.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {dashboardData.countries.map((country) => (
                  <div key={country.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{country.name}</span>
                      <span className="font-semibold">
                        {formatCompactCurrency(country.revenue)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[#19D3C5]"
                        style={{ width: `${country.sharePct}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      {country.sharePct.toFixed(1)}% of revenue
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* BUSINESS INTELLIGENCE */}

        <section className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2032] to-[#0B1828] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Intelligence
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              What deserves your attention?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {uploadedAnalysis
                ? "Automatically detected from your uploaded business data."
                : "Automatically detected from the Teketeke demo dataset."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => {
              const isRisk = insight.type === "risk";

              return (
                <article
                  key={insight.title}
                  className={`rounded-xl border p-5 ${
                    isRisk
                      ? "border-[#FF6B6B]/25 bg-[#FF6B6B]/[0.08]"
                      : "border-[#19D3C5]/25 bg-[#19D3C5]/[0.08]"
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      isRisk ? "text-[#FF8A8A]" : "text-[#19D3C5]"
                    }`}
                  >
                    {isRisk ? "Risk" : "Opportunity"}
                  </p>

                  <h3 className="mt-2 font-semibold text-white">
                    {insight.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {insight.finding}
                  </p>

                  <div className="mt-4 rounded-lg bg-[#0D1B2A]/70 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Recommended action
                    </p>

                    <p className="mt-1 text-sm font-medium leading-6 text-slate-200">
                      {insight.recommendation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* PRODUCT INTELLIGENCE */}

        <section className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2032] to-[#0B1828] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Product intelligence
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {topProduct?.name ?? "No product data"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Highest revenue product in the available dataset.
              </p>
            </div>

            {topProduct && (
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-slate-500">Revenue</p>
                  <p className="mt-1 font-semibold">
                    {formatCompactCurrency(topProduct.revenue)}
                  </p>
                </div>

                {"grossMarginPct" in topProduct && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Gross margin
                    </p>
                    <p className="mt-1 font-semibold">
                      {topProduct.grossMarginPct.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ASK TEKETEKE */}

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