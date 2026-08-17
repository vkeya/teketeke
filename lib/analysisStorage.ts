export type UploadedInsight = {
  type: "risk" | "opportunity";
  priority: "high" | "medium";
  title: string;
  finding: string;
  recommendation: string;
};

export type UploadedProduct = {
  name: string;
  revenue: number;
  sharePct: number;
};

export type UploadedAnalysis = {
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
  } | null;

  topProduct: {
    name: string;
    revenue: number;
  } | null;

  /**
   * Full product-level analysis from the uploaded dataset.
   *
   * Optional for backward compatibility with analyses already stored
   * in localStorage before Product Explorer was introduced.
   */
  products?: UploadedProduct[];

  insights: UploadedInsight[];

  summary: {
    totalInsights: number;
    risks: number;
    opportunities: number;
  };
};

const STORAGE_KEY = "teketeke_uploaded_analysis";

export function saveUploadedAnalysis(
  analysis: UploadedAnalysis
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(analysis)
  );
}

export function getUploadedAnalysis(): UploadedAnalysis | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as UploadedAnalysis;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearUploadedAnalysis() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}