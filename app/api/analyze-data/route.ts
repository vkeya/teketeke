import { NextResponse } from "next/server";

type Row = Record<string, string>;

type MonthlyMetric = {
  month: string;
  revenue: number;
  grossProfit: number;
};

type DimensionMetric = {
  name: string;
  revenue: number;
  sharePct: number;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): Row[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.replace(/^\uFEFF/, "").trim()
  );

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? "",
      ])
    );
  });
}

function number(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildDimensionMetrics(
  values: Map<string, number>,
  totalRevenue: number
): DimensionMetric[] {
  return [...values.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, revenue]) => ({
      name,
      revenue: rounded(revenue),
      sharePct:
        totalRevenue > 0
          ? rounded((revenue / totalRevenue) * 100)
          : 0,
    }));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No CSV file was uploaded." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported." },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The maximum supported file size is 10 MB." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The CSV contains no analyzable records." },
        { status: 400 }
      );
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let grossProfit = 0;

    const customers = new Map<string, number>();
    const countries = new Map<string, number>();
    const products = new Map<string, number>();
    const payments = new Map<string, number>();
    const monthly = new Map<string, MonthlyMetric>();

    for (const row of rows) {
      const revenue = number(row.revenue);
      const cost = number(row.cost);
      const profit = number(row.gross_profit);

      totalRevenue += revenue;
      totalCost += cost;
      grossProfit += profit;

      const customer = row.customer_name || "Unknown";
      const country = row.country || "Unknown";
      const product = row.product || "Unknown";
      const paymentStatus = row.payment_status || "Unknown";

      customers.set(
        customer,
        (customers.get(customer) ?? 0) + revenue
      );

      countries.set(
        country,
        (countries.get(country) ?? 0) + revenue
      );

      products.set(
        product,
        (products.get(product) ?? 0) + revenue
      );

      payments.set(
        paymentStatus,
        (payments.get(paymentStatus) ?? 0) + revenue
      );

      /*
       * Monthly trend.
       *
       * Expected date format can be YYYY-MM-DD or another
       * JavaScript-compatible date format.
       */
      if (row.date) {
        const parsedDate = new Date(row.date);

        if (!Number.isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(
            parsedDate.getMonth() + 1
          ).padStart(2, "0");

          const monthKey = `${year}-${month}`;

          const existing = monthly.get(monthKey);

          if (existing) {
            existing.revenue += revenue;
            existing.grossProfit += profit;
          } else {
            monthly.set(monthKey, {
              month: monthKey,
              revenue,
              grossProfit: profit,
            });
          }
        }
      }
    }

    const grossMarginPct =
      totalRevenue > 0
        ? (grossProfit / totalRevenue) * 100
        : 0;

    const customersByRevenue =
      buildDimensionMetrics(customers, totalRevenue);

    const countriesByRevenue =
      buildDimensionMetrics(countries, totalRevenue);

    const productsByRevenue =
      buildDimensionMetrics(products, totalRevenue);

    const monthlyPerformance =
      [...monthly.values()]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((item) => ({
          month: item.month,
          revenue: rounded(item.revenue),
          grossProfit: rounded(item.grossProfit),
        }));

    const topCustomer = customersByRevenue[0] ?? null;
    const topCountry = countriesByRevenue[0] ?? null;
    const topProduct = productsByRevenue[0] ?? null;

    const overdueRevenue =
      [...payments.entries()]
        .filter(
          ([status]) =>
            status.toLowerCase() === "overdue"
        )
        .reduce(
          (sum, [, revenue]) => sum + revenue,
          0
        );

    const insights: Array<{
      type: "risk" | "opportunity";
      priority: "high" | "medium";
      title: string;
      finding: string;
      recommendation: string;
    }> = [];

    if (topCustomer && totalRevenue > 0) {
      if (topCustomer.sharePct >= 20) {
        insights.push({
          type: "risk",
          priority: "high",
          title: "Customer concentration risk",
          finding: `${topCustomer.name} contributes ${topCustomer.sharePct.toFixed(
            1
          )}% of total revenue.`,
          recommendation:
            "Protect the account while increasing revenue from secondary customers.",
        });
      }
    }

    if (overdueRevenue > 0 && totalRevenue > 0) {
      const overdueShare =
        (overdueRevenue / totalRevenue) * 100;

      if (overdueShare >= 8) {
        insights.push({
          type: "risk",
          priority: "high",
          title: "Elevated overdue revenue",
          finding: `$${overdueRevenue.toLocaleString(
            "en-US",
            { maximumFractionDigits: 0 }
          )} (${overdueShare.toFixed(
            1
          )}% of revenue) is marked overdue.`,
          recommendation:
            "Prioritize collections, review customer credit exposure and monitor overdue balances.",
        });
      }
    }

    if (topProduct && topProduct.sharePct >= 20) {
      insights.push({
        type: "opportunity",
        priority: "medium",
        title: `Product concentration: ${topProduct.name}`,
        finding: `${topProduct.name} generates ${topProduct.sharePct.toFixed(
          1
        )}% of total revenue.`,
        recommendation:
          "Protect availability and margins while developing adjacent revenue streams.",
      });
    }

    if (countriesByRevenue.length >= 2) {
      const secondMarket = countriesByRevenue[1];

      insights.push({
        type: "opportunity",
        priority: "medium",
        title: `Expansion market: ${secondMarket.name}`,
        finding: `${secondMarket.name} contributes ${secondMarket.sharePct.toFixed(
          1
        )}% of total revenue.`,
        recommendation:
          "Evaluate whether additional sales capacity or customer acquisition could increase share in this market.",
      });
    }

    if (monthlyPerformance.length >= 2) {
      const first = monthlyPerformance[0];
      const last =
        monthlyPerformance[monthlyPerformance.length - 1];

      if (first.revenue > 0) {
        const changePct =
          ((last.revenue - first.revenue) /
            first.revenue) *
          100;

        if (changePct >= 15) {
          insights.push({
            type: "opportunity",
            priority: "high",
            title: "Positive revenue momentum",
            finding: `Revenue increased by ${changePct.toFixed(
              1
            )}% between ${first.month} and ${last.month}.`,
            recommendation:
              "Investigate the drivers of growth and determine where successful sales activity can be scaled.",
          });
        }

        if (changePct <= -15) {
          insights.push({
            type: "risk",
            priority: "high",
            title: "Revenue decline",
            finding: `Revenue decreased by ${Math.abs(
              changePct
            ).toFixed(
              1
            )}% between ${first.month} and ${last.month}.`,
            recommendation:
              "Investigate customer losses, product mix, pricing and sales activity before the decline becomes structural.",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,

      metrics: {
        totalRevenue: rounded(totalRevenue),
        totalCost: rounded(totalCost),
        grossProfit: rounded(grossProfit),
        grossMarginPct: rounded(grossMarginPct),
        transactions: rows.length,
        customers: customers.size,
        countries: countries.size,
        products: products.size,
      },

      topCustomer: topCustomer
        ? {
            name: topCustomer.name,
            revenue: topCustomer.revenue,
            sharePct: topCustomer.sharePct,
          }
        : null,

      topCountry: topCountry
        ? {
            name: topCountry.name,
            revenue: topCountry.revenue,
            sharePct: topCountry.sharePct,
          }
        : null,

      topProduct: topProduct
        ? {
            name: topProduct.name,
            revenue: topProduct.revenue,
            sharePct: topProduct.sharePct,
          }
        : null,

      monthlyPerformance,
      countries: countriesByRevenue,
      products: productsByRevenue,
      customers: customersByRevenue,

      paymentStatus: [...payments.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([status, revenue]) => ({
          status,
          revenue: rounded(revenue),
          sharePct:
            totalRevenue > 0
              ? rounded((revenue / totalRevenue) * 100)
              : 0,
        })),

      insights,

      summary: {
        totalInsights: insights.length,
        risks: insights.filter(
          (insight) => insight.type === "risk"
        ).length,
        opportunities: insights.filter(
          (insight) => insight.type === "opportunity"
        ).length,
      },
    });
  } catch (error) {
    console.error("Business analysis error:", error);

    return NextResponse.json(
      {
        error: "Unable to analyze the uploaded business data.",
      },
      { status: 500 }
    );
  }
}