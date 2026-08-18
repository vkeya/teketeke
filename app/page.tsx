"use client";

import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "See what is happening",
    description:
      "Transform raw business data into clear revenue, profitability, customer, product and market intelligence.",
  },
  {
    number: "02",
    title: "Understand why",
    description:
      "Automatically surface patterns, risks, concentration, performance changes and emerging opportunities.",
  },
  {
    number: "03",
    title: "Know what to do next",
    description:
      "Turn business intelligence into practical recommendations that help leadership make better decisions.",
  },
];

const signals = [
  "Revenue performance",
  "Profitability",
  "Customer concentration",
  "Market performance",
  "Product intelligence",
  "Cash & collections",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111F] text-white">

      {/* Ambient background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-[#19D3C5]/10 blur-3xl" />
        <div className="absolute right-[5%] top-[18%] h-96 w-96 rounded-full bg-[#7C5CFC]/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[40%] h-80 w-80 rounded-full bg-[#19D3C5]/5 blur-3xl" />
      </div>

      {/* NAVIGATION */}

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#19D3C5]/30 bg-[#0D1B2A] text-sm font-bold text-[#19D3C5] shadow-[0_0_30px_rgba(25,211,197,0.08)]">
            T
          </div>

          <div>
            <p className="text-base font-bold tracking-[0.12em]">
              TEKETEKE
            </p>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">
              Business Intelligence
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a
            href="#platform"
            className="transition hover:text-white"
          >
            Platform
          </a>

          <a
            href="#intelligence"
            className="transition hover:text-white"
          >
            Intelligence
          </a>

          <a
            href="#approach"
            className="transition hover:text-white"
          >
            Approach
          </a>

          <Link
            href="/automation/assessment/new"
            className="transition hover:text-white"
          >
            Automation
          </Link>
        </div>

        <Link
          href="/upload"
          className="rounded-xl border border-[#19D3C5]/30 bg-[#19D3C5]/10 px-4 py-2.5 text-sm font-semibold text-[#19D3C5] transition hover:border-[#19D3C5]/60 hover:bg-[#19D3C5]/15"
        >
          Analyze Data
        </Link>

      </nav>

      {/* HERO */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">

        <div className="max-w-4xl">

          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#19D3C5]/20 bg-[#0D1B2A]/70 px-3.5 py-2 backdrop-blur">

            <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5] shadow-[0_0_10px_rgba(25,211,197,0.8)]" />

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8FE8DF]">
              AI-powered business intelligence
            </span>

          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">

            Turn business data into{" "}

            <span className="bg-gradient-to-r from-[#19D3C5] via-[#6DE7DC] to-[#7C5CFC] bg-clip-text text-transparent">
              decisive action.
            </span>

          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
            Teketeke transforms your business data into clear
            intelligence — revealing what is happening, why it
            matters and what you should do next.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/upload"
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#19D3C5] px-6 py-3.5 text-sm font-bold text-[#07111F] shadow-[0_0_40px_rgba(25,211,197,0.15)] transition hover:bg-[#6DE7DC]"
            >
              Analyze your data

              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              View intelligence dashboard
            </Link>

          </div>

          <p className="mt-5 text-xs text-slate-600">
            Start with CSV data. No AI API required for the
            current intelligence engine.
          </p>

        </div>

      </section>

      {/* PLATFORM PREVIEW */}

      <section
        id="platform"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-28 lg:px-8"
      >

        <div className="rounded-3xl border border-white/10 bg-[#0D1B2A]/80 p-2 shadow-2xl shadow-black/20 backdrop-blur">

          <div className="rounded-[22px] border border-white/5 bg-[#091625]">

            {/* Fake application header */}

            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-7">

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#19D3C5]/10 text-xs font-bold text-[#19D3C5]">
                  T
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Executive Intelligence
                  </p>

                  <p className="text-[10px] text-slate-600">
                    Live business overview
                  </p>
                </div>

              </div>

              <div className="hidden items-center gap-2 sm:flex">

                <span className="rounded-lg bg-[#19D3C5]/10 px-3 py-1.5 text-[10px] font-semibold text-[#19D3C5]">
                  AI READY
                </span>

                <span className="rounded-lg border border-white/5 px-3 py-1.5 text-[10px] text-slate-500">
                  Executive View
                </span>

              </div>

            </div>

            {/* Dashboard preview */}

            <div className="p-5 sm:p-7">

              <div className="mb-6">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  Business overview
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Know what matters.
                </h2>

              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {[
                  ["Revenue", "$113.4M", "+12.4%"],
                  ["Gross Profit", "$44.1M", "+8.7%"],
                  ["Margin", "38.9%", "+2.1%"],
                  ["Customers", "80", "+6.3%"],
                ].map(([label, value, change]) => (

                  <div
                    key={label}
                    className="rounded-2xl border border-white/5 bg-[#0D1B2A] p-5"
                  >

                    <p className="text-xs text-slate-500">
                      {label}
                    </p>

                    <p className="mt-3 text-xl font-semibold">
                      {value}
                    </p>

                    <p className="mt-2 text-[11px] font-medium text-[#19D3C5]">
                      ↑ {change}
                    </p>

                  </div>

                ))}

              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">

                {/* Chart */}

                <div className="rounded-2xl border border-white/5 bg-[#0D1B2A] p-5">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-semibold">
                        Revenue performance
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        Monthly trend
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-[#19D3C5]">
                      +12.4%
                    </span>

                  </div>

                  <div className="mt-8 flex h-32 items-end gap-2">

                    {[35, 44, 39, 53, 48, 61, 57, 72, 68, 82, 76, 94].map(
                      (height, index) => (

                        <div
                          key={index}
                          className="flex h-full flex-1 items-end"
                        >

                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-[#19D3C5]/30 to-[#19D3C5]"
                            style={{
                              height: `${height}%`,
                              opacity:
                                0.45 + index * 0.04,
                            }}
                          />

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* Signals */}

                <div className="rounded-2xl border border-white/5 bg-[#0D1B2A] p-5">

                  <p className="text-xs font-semibold">
                    Executive signals
                  </p>

                  <div className="mt-5 space-y-3">

                    <div className="rounded-xl border border-rose-400/10 bg-rose-400/5 p-3">

                      <div className="flex items-center gap-2">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B6B]" />

                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF8A8A]">
                          Risk
                        </span>

                      </div>

                      <p className="mt-2 text-xs font-medium">
                        Customer concentration
                      </p>

                    </div>

                    <div className="rounded-xl border border-[#19D3C5]/10 bg-[#19D3C5]/5 p-3">

                      <div className="flex items-center gap-2">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#19D3C5]" />

                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#19D3C5]">
                          Opportunity
                        </span>

                      </div>

                      <p className="mt-2 text-xs font-medium">
                        Market growth accelerating
                      </p>

                    </div>

                    <div className="rounded-xl border border-[#7C5CFC]/10 bg-[#7C5CFC]/5 p-3">

                      <div className="flex items-center gap-2">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC]" />

                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#A993FF]">
                          Intelligence
                        </span>

                      </div>

                      <p className="mt-2 text-xs font-medium">
                        Ask Teketeke
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* VALUE PROPOSITION */}

      <section
        id="intelligence"
        className="relative z-10 border-y border-white/5 bg-[#091625]/70"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          <div className="max-w-2xl">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
              Intelligence, not just reporting
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your data already knows a lot.
              <br />
              Teketeke helps you listen.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400">
              Traditional reporting tells leadership what
              happened. Teketeke is designed to go further:
              identify the signal, explain its significance and
              recommend the next action.
            </p>

          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">

            {capabilities.map((capability) => (

              <div
                key={capability.number}
                className="group rounded-2xl border border-white/7 bg-[#0D1B2A] p-7 transition hover:-translate-y-1 hover:border-[#19D3C5]/20"
              >

                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold tracking-[0.15em] text-[#19D3C5]">
                    {capability.number}
                  </span>

                  <span className="text-slate-700 transition group-hover:text-[#7C5CFC]">
                    ↗
                  </span>

                </div>

                <h3 className="mt-10 text-lg font-semibold">
                  {capability.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {capability.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* AUTOMATION INTELLIGENCE */}

      <section
        id="automation"
        className="relative z-10 border-y border-white/5 bg-[#07111F]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
                Automation Intelligence
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Find the work your business
                <br />
                should stop doing manually.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                Teketeke maps how your teams work, identifies repetitive
                processes and automation opportunities, and helps you
                understand the potential time and financial impact before
                you invest.
              </p>

              <Link
                href="/automation/assessment/new"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#19D3C5] px-5 py-3.5 text-sm font-bold text-[#07111F] transition hover:bg-[#6DE7DC]"
              >
                Start Automation Assessment
                <span>→</span>
              </Link>

              <p className="mt-4 text-xs text-slate-600">
                No technical knowledge required.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["01", "Discover", "Map the work that consumes time."],
                ["02", "Identify", "Find practical automation opportunities."],
                ["03", "Quantify", "Estimate time and financial impact."],
                ["04", "Prioritize", "Know what to automate first."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-white/7 bg-[#0D1B2A] p-6 transition hover:-translate-y-1 hover:border-[#19D3C5]/20"
                >
                  <span className="text-xs font-bold tracking-[0.15em] text-[#19D3C5]">
                    {number}
                  </span>

                  <h3 className="mt-8 text-lg font-semibold">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIGNALS */}

      <section
        id="approach"
        className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >

        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C5CFC]">
              One intelligence layer
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              From raw transactions to executive decisions.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400">
              Upload the data you already have. Teketeke
              organizes it into the signals that matter to
              leadership.
            </p>

            <Link
              href="/upload"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#07111F] transition hover:bg-slate-200"
            >
              Start with your data
              <span>→</span>
            </Link>

          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            {signals.map((signal, index) => (

              <div
                key={signal}
                className="flex items-center gap-4 rounded-xl border border-white/7 bg-[#0D1B2A] p-5"
              >

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    index % 3 === 0
                      ? "bg-[#19D3C5]/10 text-[#19D3C5]"
                      : index % 3 === 1
                        ? "bg-[#7C5CFC]/10 text-[#A993FF]"
                        : "bg-[#F4C95D]/10 text-[#F4C95D]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <span className="text-sm font-medium">
                  {signal}
                </span>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-8">

        <div className="relative overflow-hidden rounded-3xl border border-[#19D3C5]/15 bg-gradient-to-br from-[#0D2730] via-[#0D1B2A] to-[#15112E] p-8 sm:p-12">

          <div className="absolute right-[-10%] top-[-50%] h-96 w-96 rounded-full bg-[#19D3C5]/10 blur-3xl" />

          <div className="relative max-w-2xl">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19D3C5]">
              Start with intelligence
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop staring at spreadsheets.
              <br />
              Start making decisions.
            </h2>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Upload your business data and see what Teketeke
              can uncover.
            </p>

            <Link
              href="/upload"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#19D3C5] px-6 py-3.5 text-sm font-bold text-[#07111F] transition hover:bg-[#6DE7DC]"
            >
              Analyze your business
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="relative z-10 border-t border-white/5">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B2A] text-xs font-bold text-[#19D3C5]">
              T
            </div>

            <span className="text-xs font-semibold tracking-[0.14em]">
              TEKETEKE
            </span>

          </div>

          <p className="text-xs text-slate-600">
            AI-powered business & automation intelligence.
          </p>

        </div>

      </footer>

    </main>
  );
}