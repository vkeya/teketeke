import { dashboardData } from "../../data/teketeke_dashboard_data";

export default function DashboardPage() {
  const { executive } = dashboardData;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Teketeke Intelligence
        </h1>

        <p className="mt-2 text-slate-500">
          Executive Business Intelligence
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Revenue
            </p>
            <p className="mt-2 text-2xl font-bold">
              ${executive.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Gross Profit
            </p>
            <p className="mt-2 text-2xl font-bold">
              ${executive.grossProfit.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Gross Margin
            </p>
            <p className="mt-2 text-2xl font-bold">
              {executive.grossMarginPct}%
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}