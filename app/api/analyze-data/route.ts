import { NextResponse } from "next/server";
import { buildDataCleaningSummary } from "@/lib/data/DataCleaningSummary";
import {
  applyCategoryNormalizationDecisions,
  applyCleaningDecisionsToRows,
  applyDateQualityDecisions,
  applyMissingValueDecisions,
  applyOutlierDecisions,
  profileDataset,
  type CategoryNormalizationDecision,
  type CleaningDecision,
  type DateQualityDecision,
  type MissingValueDecision,
  type OutlierDecision,
} from "@/lib/data/DataCleaningEngine";

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

type MappingField =
  | "date"
  | "revenue"
  | "cost"
  | "gross_profit"
  | "customer_name"
  | "country"
  | "product"
  | "payment_status";

const DEFAULT_MAPPING: Record<MappingField, string> = {
  date: "date",
  revenue: "revenue",
  cost: "cost",
  gross_profit: "gross_profit",
  customer_name: "customer_name",
  country: "country",
  product: "product",
  payment_status: "payment_status",
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

function normalizeRows(
  rows: Row[],
  mapping: Record<MappingField, string>
): Row[] {
  return rows.map((row) => {
    const normalized: Row = { ...row };

    (Object.keys(DEFAULT_MAPPING) as MappingField[]).forEach((field) => {
      const sourceColumn = mapping[field] || DEFAULT_MAPPING[field];

      if (sourceColumn && sourceColumn in row) {
        normalized[field] = row[sourceColumn] ?? "";
      }
    });

    return normalized;
  });
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
    const parsedRows = parseCsv(text);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: "The CSV contains no analyzable records." },
        { status: 400 }
      );
    }

    let mapping: Record<MappingField, string> = {
      ...DEFAULT_MAPPING,
    };

    const mappingValue = formData.get("mapping");

    if (typeof mappingValue === "string" && mappingValue.trim()) {
      try {
        const submitted = JSON.parse(mappingValue) as Partial<
          Record<MappingField, string>
        >;

        (Object.keys(DEFAULT_MAPPING) as MappingField[]).forEach(
          (field) => {
            if (typeof submitted[field] === "string") {
              mapping[field] = submitted[field];
            }
          }
        );
      } catch {
        return NextResponse.json(
          { error: "The supplied column mapping is invalid." },
          { status: 400 }
        );
      }
    }

    const rows = normalizeRows(parsedRows, mapping);
    const originalRowCount = rows.length;

    let cleaningDecisions: CleaningDecision[] = [];

    const cleaningDecisionsValue =
      formData.get("cleaningDecisions");

    if (typeof cleaningDecisionsValue === "string" &&
        cleaningDecisionsValue.trim() !== "") {
      try {
        const parsedDecisions = JSON.parse(
          cleaningDecisionsValue
        );

        if (!Array.isArray(parsedDecisions)) {
          return NextResponse.json(
            { error: "The supplied cleaning decisions are invalid." },
            { status: 400 }
          );
        }

        cleaningDecisions = parsedDecisions.filter(
          (decision): decision is CleaningDecision =>
            decision &&
            typeof decision === "object" &&
            typeof decision.issueId === "string" &&
            typeof decision.groupId === "string" &&
            typeof decision.action === "string"
        );
      } catch {
        return NextResponse.json(
          { error: "The supplied cleaning decisions are invalid." },
          { status: 400 }
        );
      }
    }

    let missingValueDecisions: MissingValueDecision[] = [];

    const missingValueDecisionsValue =
      formData.get("missingValueDecisions");

    if (
      typeof missingValueDecisionsValue === "string" &&
      missingValueDecisionsValue.trim() !== ""
    ) {
      try {
        const parsedMissingDecisions = JSON.parse(
          missingValueDecisionsValue
        );

        if (!Array.isArray(parsedMissingDecisions)) {
          return NextResponse.json(
            { error: "The supplied missing-value decisions are invalid." },
            { status: 400 }
          );
        }

        missingValueDecisions =
          parsedMissingDecisions.filter(
            (decision): decision is MissingValueDecision =>
              decision &&
              typeof decision === "object" &&
              typeof decision.issueId === "string" &&
              typeof decision.column === "string" &&
              typeof decision.action === "string"
          );
      } catch {
        return NextResponse.json(
          { error: "The supplied missing-value decisions are invalid." },
          { status: 400 }
        );
      }
    }

    let categoryNormalizationDecisions:
      CategoryNormalizationDecision[] = [];

    const categoryNormalizationValue =
      formData.get("categoryNormalizationDecisions");

    if (
      typeof categoryNormalizationValue === "string" &&
      categoryNormalizationValue.trim() !== ""
    ) {
      try {
        const parsedCategoryDecisions = JSON.parse(
          categoryNormalizationValue
        );

        if (!Array.isArray(parsedCategoryDecisions)) {
          return NextResponse.json(
            {
              error:
                "The supplied category-normalization decisions are invalid.",
            },
            { status: 400 }
          );
        }

        categoryNormalizationDecisions =
          parsedCategoryDecisions.filter(
            (decision): decision is CategoryNormalizationDecision =>
              decision &&
              typeof decision === "object" &&
              typeof decision.issueId === "string" &&
              typeof decision.column === "string" &&
              typeof decision.action === "string"
          );
      } catch {
        return NextResponse.json(
          {
            error:
              "The supplied category-normalization decisions are invalid.",
          },
          { status: 400 }
        );
      }
    }

    const duplicateCleaningResult =
      applyCleaningDecisionsToRows(
        rows,
        cleaningDecisions
      );

    const missingCleaningResult =
      applyMissingValueDecisions(
        duplicateCleaningResult.rows,
        missingValueDecisions
      );

    let outlierDecisions: OutlierDecision[] = [];

    const outlierDecisionsValue =
      formData.get("outlierDecisions");

    if (
      typeof outlierDecisionsValue === "string" &&
      outlierDecisionsValue.trim() !== ""
    ) {
      try {
        const parsedOutlierDecisions = JSON.parse(
          outlierDecisionsValue
        );

        if (!Array.isArray(parsedOutlierDecisions)) {
          return NextResponse.json(
            { error: "The supplied outlier decisions are invalid." },
            { status: 400 }
          );
        }

        outlierDecisions = parsedOutlierDecisions.filter(
          (decision): decision is OutlierDecision =>
            decision &&
            typeof decision === "object" &&
            typeof decision.issueId === "string" &&
            typeof decision.column === "string" &&
            typeof decision.action === "string"
        );
      } catch {
        return NextResponse.json(
          { error: "The supplied outlier decisions are invalid." },
          { status: 400 }
        );
      }
    }

    const categoryCleaningResult =
      applyCategoryNormalizationDecisions(
        missingCleaningResult.rows,
        categoryNormalizationDecisions
      );

    let dateQualityDecisions: DateQualityDecision[] = [];

    const dateQualityDecisionsValue =
      formData.get("dateQualityDecisions");

    if (
      typeof dateQualityDecisionsValue === "string" &&
      dateQualityDecisionsValue.trim() !== ""
    ) {
      try {
        const parsedDateDecisions = JSON.parse(
          dateQualityDecisionsValue
        );

        if (!Array.isArray(parsedDateDecisions)) {
          return NextResponse.json(
            { error: "The supplied date-quality decisions are invalid." },
            { status: 400 }
          );
        }

        dateQualityDecisions = parsedDateDecisions.filter(
          (decision): decision is DateQualityDecision =>
            decision &&
            typeof decision === "object" &&
            typeof decision.issueId === "string" &&
            typeof decision.column === "string" &&
            typeof decision.action === "string"
        );
      } catch {
        return NextResponse.json(
          { error: "The supplied date-quality decisions are invalid." },
          { status: 400 }
        );
      }
    }

    const outlierCleaningResult =
      applyOutlierDecisions(
        categoryCleaningResult.rows,
        outlierDecisions
      );

    const dateQualityResult =
      applyDateQualityDecisions(
        outlierCleaningResult.rows,
        dateQualityDecisions
      );

    const cleanedRows =
      dateQualityResult.rows as unknown as Row[];

    const cleaningProfile = profileDataset(cleanedRows, {
      transactionIdColumn:
        "transaction_id" in mapping &&
        typeof (mapping as Record<string, unknown>).transaction_id === "string"
          ? (mapping as Record<string, unknown>).transaction_id as string
          : undefined,
      dateColumn: "date",
      revenueColumn: "revenue",
      costColumn: "cost",
      grossProfitColumn: "gross_profit",
      numericColumns: [
        "revenue",
        "cost",
        "gross_profit",
      ],
      categoricalColumns: [
        "customer_name",
        "country",
        "product",
        "payment_status",
      ],
      outlierColumns: [
        "revenue",
        "cost",
      ],
    });

    // Validate the normalized business fields before calculations.
    // This keeps non-standard source column names safe while ensuring
    // Teketeke is actually working with usable business values.
    const dataQualityWarnings: string[] = [];
    const dataQualityErrors: string[] = [];

    const mappedRequiredFields: MappingField[] = [
      "date",
      "revenue",
      "cost",
      "customer_name",
      "country",
      "product",
    ];

    for (const field of mappedRequiredFields) {
      const populated = cleanedRows.filter(
        (row) => row[field] !== undefined && row[field].trim() !== ""
      ).length;

      if (populated === 0) {
        dataQualityErrors.push(
          `No usable values were found for ${field.replaceAll("_", " ")}.`
        );
      } else if (populated < cleanedRows.length) {
        dataQualityWarnings.push(
          `${cleanedRows.length - populated} row(s) have no value for ${field.replaceAll(
            "_",
            " "
          )}.`
        );
      }
    }

    const numericFields: MappingField[] = ["revenue", "cost"];

    for (const field of numericFields) {
      let invalid = 0;

      for (const row of cleanedRows) {
        const value = row[field];

        if (value === undefined || value.trim() === "") {
          continue;
        }

        if (!Number.isFinite(Number(value))) {
          invalid++;
        }
      }

      if (invalid > 0) {
        dataQualityErrors.push(
          `${field.replaceAll(
            "_",
            " "
          )} contains ${invalid} non-numeric value(s).`
        );
      }
    }

    const invalidDates = cleanedRows.filter((row) => {
      const value = row.date;

      return (
        value !== undefined &&
        value.trim() !== "" &&
        Number.isNaN(new Date(value).getTime())
      );
    }).length;

    if (invalidDates > 0) {
      dataQualityWarnings.push(
        `${invalidDates} row(s) contain an invalid date and will be excluded from time-based analysis.`
      );
    }

    if (dataQualityErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The mapped dataset needs attention before it can be analyzed.",
          dataQuality: {
            errors: dataQualityErrors,
            warnings: dataQualityWarnings,
            cleanedRows: cleanedRows.length,
          },
          mapping,
        },
        { status: 422 }
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

    for (const row of cleanedRows) {
      const revenue = number(row.revenue);
      const cost = number(row.cost);

      // Gross profit may not exist as a source column. When it is absent
      // (or maps to no source field), derive it from revenue - cost.
      const sourceGrossProfit =
        row.gross_profit !== undefined &&
        row.gross_profit.trim() !== ""
          ? number(row.gross_profit)
          : revenue - cost;

      const profit = sourceGrossProfit;

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
        transactions: cleanedRows.length,
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

      dataQuality: {
        errors: dataQualityErrors,
        warnings: [
          ...dataQualityWarnings,
          ...cleaningProfile.issues
            .filter((issue) => issue.severity !== "critical")
            .map((issue) => issue.description),
        ],
        cleanedRows: cleanedRows.length,
        readinessScore: cleaningProfile.readinessScore,
        issueCount: cleaningProfile.issues.length,
        criticalIssues: cleaningProfile.summary.critical,
        warningIssues: cleaningProfile.summary.warnings,
        infoIssues: cleaningProfile.summary.info,
        issues: cleaningProfile.issues,
        originalRows: originalRowCount,
        removedRows: [
          ...new Set([
            ...duplicateCleaningResult.removedRowIndexes,
            ...missingCleaningResult.removedRowIndexes,
          ]),
        ].sort((a, b) => a - b),
        keptRows: duplicateCleaningResult.keptRowIndexes,
        reviewLaterGroupIds:
          duplicateCleaningResult.reviewLaterGroupIds,
        filledMissingCells:
          missingCleaningResult.filledCells,
        reviewLaterMissingColumns:
          missingCleaningResult.reviewLaterColumns,
        normalizedCategoryCells:
          categoryCleaningResult.normalizedCells,
        reviewLaterCategoryColumns:
          categoryCleaningResult.reviewLaterColumns,
        outlierRemovedRows:
          outlierCleaningResult.removedRowIndexes,
        reviewLaterOutlierColumns:
          outlierCleaningResult.reviewLaterColumns,
        dateQualityRemovedRows:
          dateQualityResult.removedRowIndexes,
        reviewLaterDateColumns:
          dateQualityResult.reviewLaterColumns,
      },

      cleaningSummary: buildDataCleaningSummary({
        originalRows: originalRowCount,
        analyzedRows: cleanedRows.length,
        duplicateRemovedRows:
          duplicateCleaningResult.removedRowIndexes,
        missingValuesFilled:
          missingCleaningResult.filledCells,
        missingRowsRemoved:
          missingCleaningResult.removedRowIndexes,
        normalizedCategoryCells:
          categoryCleaningResult.normalizedCells,
        outlierRemovedRows:
          outlierCleaningResult.removedRowIndexes,
        dateQualityRemovedRows:
          dateQualityResult.removedRowIndexes,
        keptRows:
          duplicateCleaningResult.keptRowIndexes,
        reviewLaterGroupIds:
          duplicateCleaningResult.reviewLaterGroupIds,
        reviewLaterMissingColumns:
          missingCleaningResult.reviewLaterColumns,
        reviewLaterCategoryColumns:
          categoryCleaningResult.reviewLaterColumns,
        reviewLaterOutlierColumns:
          outlierCleaningResult.reviewLaterColumns,
        reviewLaterDateColumns:
          dateQualityResult.reviewLaterColumns,
      }),

      summary: {
        totalInsights: insights.length,
        risks: insights.filter(
          (insight) => insight.type === "risk"
        ).length,
        opportunities: insights.filter(
          (insight) => insight.type === "opportunity"
        ).length,
      },

      mapping,
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