export type BusinessInsight = {
  type: "risk" | "opportunity";
  priority: "high" | "medium";
  title: string;
  finding: string;
  recommendation: string;
};

export type BusinessDimension = {
  name: string;
  revenue: number;
  sharePct: number;
};

export type BusinessContext = {
  dataset: {
    fileName: string;
    transactions: number;
    customers: number;
    countries: number;
    products: number;
  };

  financials: {
    revenue: number;
    cost: number;
    grossProfit: number;
    grossMarginPct: number;
  };

  leaders: {
    customer: BusinessDimension | null;
    country: BusinessDimension | null;
    product: BusinessDimension | null;
  };

  markets: BusinessDimension[];
  products: BusinessDimension[];
  customers: BusinessDimension[];

  paymentStatus: Array<{
    status: string;
    revenue: number;
    sharePct: number;
  }>;

  monthlyPerformance: Array<{
    month: string;
    revenue: number;
    grossProfit: number;
  }>;

  insights: BusinessInsight[];

  executiveSummary: string;
};

function numberOrZero(value: unknown): number {
  const valueAsNumber = Number(value);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : 0;
}

function dimension(
  value: unknown
): BusinessDimension | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (!item.name) {
    return null;
  }

  return {
    name: String(item.name),
    revenue: numberOrZero(item.revenue),
    sharePct: numberOrZero(item.sharePct),
  };
}

function dimensions(
  value: unknown
): BusinessDimension[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(dimension)
    .filter(
      (item): item is BusinessDimension =>
        item !== null
    );
}

function insights(
  value: unknown
): BusinessInsight[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        (item.type === "risk" ||
          item.type === "opportunity")
    )
    .map((item) => ({
      type:
        item.type === "risk"
          ? ("risk" as const)
          : ("opportunity" as const),

      priority:
        item.priority === "high"
          ? ("high" as const)
          : ("medium" as const),

      title: String(item.title ?? ""),
      finding: String(item.finding ?? ""),
      recommendation: String(
        item.recommendation ?? ""
      ),
    }));
}

export function buildBusinessContext(
  analysis: unknown
): BusinessContext {
  const source =
    analysis && typeof analysis === "object"
      ? (analysis as Record<string, unknown>)
      : {};

  const metrics =
    source.metrics &&
    typeof source.metrics === "object"
      ? (source.metrics as Record<string, unknown>)
      : {};

  const topCustomer = dimension(
    source.topCustomer
  );

  const topCountry = dimension(
    source.topCountry
  );

  const topProduct = dimension(
    source.topProduct
  );

  const marketData = dimensions(
    source.countries
  );

  const productData = dimensions(
    source.products
  );

  const customerData = dimensions(
    source.customers
  );

  const paymentData = Array.isArray(
    source.paymentStatus
  )
    ? source.paymentStatus
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object"
        )
        .map((item) => ({
          status: String(
            item.status ?? "Unknown"
          ),
          revenue: numberOrZero(item.revenue),
          sharePct: numberOrZero(
            item.sharePct
          ),
        }))
    : [];

  const monthlyData = Array.isArray(
    source.monthlyPerformance
  )
    ? source.monthlyPerformance
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object"
        )
        .map((item) => ({
          month: String(
            item.month ?? ""
          ),
          revenue: numberOrZero(
            item.revenue
          ),
          grossProfit: numberOrZero(
            item.grossProfit
          ),
        }))
    : [];

  const businessInsights =
    insights(source.insights);

  const revenue = numberOrZero(
    metrics.totalRevenue
  );

  const grossProfit = numberOrZero(
    metrics.grossProfit
  );

  const grossMarginPct = numberOrZero(
    metrics.grossMarginPct
  );

  const executiveSummary =
    `The business generated ${formatMoney(
      revenue
    )} in revenue and ${formatMoney(
      grossProfit
    )} in gross profit, producing a ${grossMarginPct.toFixed(
      2
    )}% gross margin across ${numberOrZero(
      metrics.transactions
    ).toLocaleString()} transactions. ` +
    (topCountry
      ? `${topCountry.name} is the leading market. `
      : "") +
    (topProduct
      ? `${topProduct.name} is the leading product. `
      : "") +
    (topCustomer
      ? `${topCustomer.name} is the leading customer by revenue.`
      : "");

  return {
    dataset: {
      fileName: String(
        source.fileName ?? "Uploaded dataset"
      ),
      transactions: numberOrZero(
        metrics.transactions
      ),
      customers: numberOrZero(
        metrics.customers
      ),
      countries: numberOrZero(
        metrics.countries
      ),
      products: numberOrZero(
        metrics.products
      ),
    },

    financials: {
      revenue,
      cost: numberOrZero(
        metrics.totalCost
      ),
      grossProfit,
      grossMarginPct,
    },

    leaders: {
      customer: topCustomer,
      country: topCountry,
      product: topProduct,
    },

    markets: marketData,
    products: productData,
    customers: customerData,
    paymentStatus: paymentData,
    monthlyPerformance: monthlyData,
    insights: businessInsights,
    executiveSummary,
  };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * Converts structured business intelligence into a
 * compact context block suitable for a future AI model.
 *
 * Keeping this separate from the UI means the same
 * business context can later power:
 *
 * - Ask Teketeke
 * - executive summaries
 * - automated reports
 * - client alerts
 * - recommendations
 */
export function businessContextToPrompt(
  context: BusinessContext
): string {
  const risks = context.insights
    .filter((item) => item.type === "risk")
    .map(
      (item) =>
        `- ${item.title}: ${item.finding} Action: ${item.recommendation}`
    )
    .join("\n");

  const opportunities = context.insights
    .filter(
      (item) => item.type === "opportunity"
    )
    .map(
      (item) =>
        `- ${item.title}: ${item.finding} Action: ${item.recommendation}`
    )
    .join("\n");

  const markets = context.markets
    .slice(0, 10)
    .map(
      (item) =>
        `- ${item.name}: ${formatMoney(
          item.revenue
        )} (${item.sharePct.toFixed(1)}%)`
    )
    .join("\n");

  const products = context.products
    .slice(0, 10)
    .map(
      (item) =>
        `- ${item.name}: ${formatMoney(
          item.revenue
        )} (${item.sharePct.toFixed(1)}%)`
    )
    .join("\n");

  const customers = context.customers
    .slice(0, 10)
    .map(
      (item) =>
        `- ${item.name}: ${formatMoney(
          item.revenue
        )} (${item.sharePct.toFixed(1)}%)`
    )
    .join("\n");

  const payments = context.paymentStatus
    .map(
      (item) =>
        `- ${item.status}: ${formatMoney(
          item.revenue
        )} (${item.sharePct.toFixed(1)}%)`
    )
    .join("\n");

  const monthly = context.monthlyPerformance
    .slice(-12)
    .map(
      (item) =>
        `- ${item.month}: revenue ${formatMoney(
          item.revenue
        )}; gross profit ${formatMoney(
          item.grossProfit
        )}`
    )
    .join("\n");

  return `
TEKETEKE BUSINESS INTELLIGENCE CONTEXT

DATASET
File: ${context.dataset.fileName}
Transactions: ${context.dataset.transactions.toLocaleString()}
Customers: ${context.dataset.customers.toLocaleString()}
Countries: ${context.dataset.countries.toLocaleString()}
Products: ${context.dataset.products.toLocaleString()}

FINANCIALS
Revenue: ${formatMoney(context.financials.revenue)}
Cost: ${formatMoney(context.financials.cost)}
Gross profit: ${formatMoney(context.financials.grossProfit)}
Gross margin: ${context.financials.grossMarginPct.toFixed(2)}%

EXECUTIVE SUMMARY
${context.executiveSummary}

LEADING CUSTOMER
${
  context.leaders.customer
    ? `${context.leaders.customer.name}: ${formatMoney(
        context.leaders.customer.revenue
      )} (${context.leaders.customer.sharePct.toFixed(
        1
      )}%)`
    : "Not available"
}

LEADING MARKET
${
  context.leaders.country
    ? `${context.leaders.country.name}: ${formatMoney(
        context.leaders.country.revenue
      )} (${context.leaders.country.sharePct.toFixed(
        1
      )}%)`
    : "Not available"
}

LEADING PRODUCT
${
  context.leaders.product
    ? `${context.leaders.product.name}: ${formatMoney(
        context.leaders.product.revenue
      )} (${context.leaders.product.sharePct.toFixed(
        1
      )}%)`
    : "Not available"
}

MARKETS
${markets || "Not available"}

PRODUCTS
${products || "Not available"}

CUSTOMERS
${customers || "Not available"}

PAYMENT STATUS
${payments || "Not available"}

MONTHLY PERFORMANCE
${monthly || "Not available"}

RISKS
${risks || "No risks detected"}

OPPORTUNITIES
${opportunities || "No opportunities detected"}
`.trim();
}