import { dashboardData } from "../../data/teketeke_dashboard_data";
import businessInsights from "../../data/business_insights.json";


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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p
        className={`mt-2 text-xs font-medium ${
          negative ? "text-rose-600" : "text-emerald-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { executive, countries, products } = dashboardData;

  const overdueRevenue =
    dashboardData.payments.find(
      (payment) => payment.status === "Overdue"
    )?.revenue ?? 0;

  const topCountry = countries[0];

  const topProduct = products[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

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
                Business Intelligence
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-slate-500">
              Executive Overview
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Understand your business at a glance.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Teketeke turns your business data into clear performance
              metrics, risks and opportunities.
            </p>
          </div>
        </header>

        {/* EXECUTIVE SUMMARY */}

        <section className="mb-8 rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-slate-400">
            Executive summary
          </p>

          <h2 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight">
            Your business generated{" "}
            {formatCompactCurrency(executive.totalRevenue)} in revenue
            with a {executive.grossMarginPct.toFixed(2)}% gross margin.
          </h2>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-lg bg-white/10 px-3 py-2">
              {executive.transactions.toLocaleString()} transactions
            </span>

            <span className="rounded-lg bg-white/10 px-3 py-2">
              {executive.customers} customers
            </span>

            <span className="rounded-lg bg-white/10 px-3 py-2">
              {executive.unitsSold.toLocaleString()} units sold
            </span>

            <span className="rounded-lg bg-emerald-500/20 px-3 py-2 text-emerald-300">
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
            value={formatCompactCurrency(overdueRevenue)}
            description="Requires attention"
            negative
          />

        </section>

        {/* PERFORMANCE */}

        <section className="mb-8 grid gap-6 lg:grid-cols-3">

          {/* REVENUE TREND */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="mb-6">
              <h2 className="font-semibold">
                Revenue trend
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monthly revenue across the analysis period.
              </p>
            </div>

            <div className="flex h-64 items-end gap-1 rounded-xl bg-slate-50 px-4 pb-6 pt-5">

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
                    title={`${month.month}: ${formatCurrency(
                      month.revenue
                    )}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-slate-900 transition group-hover:bg-slate-700"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                      }}
                    />
                  </div>
                );
              })}

            </div>

            <div className="mt-3 flex justify-between text-[11px] text-slate-400">
              <span>
                {dashboardData.monthlyPerformance[0]?.month}
              </span>

              <span>
                {
                  dashboardData.monthlyPerformance[
                    dashboardData.monthlyPerformance.length - 1
                  ]?.month
                }
              </span>
            </div>

          </div>

          {/* MARKET PERFORMANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="font-semibold">
                Revenue by market
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Where revenue is coming from.
              </p>
            </div>

            <div className="space-y-5">

              {countries.map((country) => (

                <div key={country.name}>

                  <div className="mb-2 flex justify-between text-sm">

                    <span className="font-medium">
                      {country.name}
                    </span>

                    <span className="font-semibold">
                      {formatCompactCurrency(country.revenue)}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${country.sharePct}%`,
                      }}
                    />

                  </div>

                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {country.sharePct.toFixed(1)}% of revenue
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* BUSINESS INTELLIGENCE */}

        {/* BUSINESS INTELLIGENCE */}

<section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

  <div className="mb-6">

    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
      Intelligence
    </p>

    <h2 className="mt-2 text-xl font-semibold">
      What deserves your attention?
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Automatically detected from your business data.
    </p>

  </div>

  <div className="grid gap-4 md:grid-cols-2">

    {businessInsights.insights.map((insight) => {

      const isRisk = insight.type === "risk";

      return (
        <article
          key={insight.title}
          className={`rounded-xl border p-5 ${
            isRisk
              ? "border-rose-200 bg-rose-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >

          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              isRisk
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            {isRisk ? "Risk" : "Opportunity"}
          </p>

          <h3 className="mt-2 font-semibold text-slate-950">
            {insight.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {insight.finding}
          </p>

          <div className="mt-4 rounded-lg bg-white/70 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Recommended action
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {insight.recommendation}
            </p>
          </div>

        </article>
      );
    })}

  </div>

</section>

        {/* TOP PRODUCT */}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Product intelligence
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-semibold">
                {topProduct?.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Highest revenue product in the current dataset.
              </p>

            </div>

            <div className="flex gap-8">

              <div>
                <p className="text-xs text-slate-400">
                  Revenue
                </p>

                <p className="mt-1 font-semibold">
                  {formatCompactCurrency(topProduct?.revenue ?? 0)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Gross margin
                </p>

                <p className="mt-1 font-semibold">
                  {topProduct?.grossMarginPct.toFixed(1)}%
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* ASK TEKETEKE PLACEHOLDER */}

        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            AI Business Analyst
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Ask Teketeke
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Ask questions about your business data and get
            evidence-based answers.
          </p>

          <div className="mt-5 flex gap-3">

            <input
              disabled
              placeholder="Ask why something is happening..."
              className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500"
            />

            <button
              disabled
              className="rounded-xl bg-white px-5 text-sm font-semibold text-slate-950"
            >
              Coming next
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}