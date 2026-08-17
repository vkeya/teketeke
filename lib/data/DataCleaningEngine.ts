export type CleaningSeverity = "critical" | "warning" | "info";

export type CleaningIssueType =
  | "duplicate_rows"
  | "duplicate_transaction_ids"
  | "missing_values"
  | "invalid_numeric_values"
  | "invalid_dates"
  | "negative_values"
  | "gross_profit_mismatch"
  | "inconsistent_categories"
  | "outliers"
  | "empty_columns";

export type DuplicateRecord = {
  rowIndex: number;
  transactionId?: string;
  values: Record<string, string>;
};

export type DuplicateGroup = {
  id: string;
  kind: "exact" | "transaction_id";
  key: string;
  records: DuplicateRecord[];
  exactMatch: boolean;
};

export type CleaningAction =
  | "keep_all"
  | "remove_duplicates"
  | "keep_record"
  | "review_later"
  | "fill_missing_unknown"
  | "exclude_missing_rows";

export type CleaningDecision = {
  issueId: string;
  groupId: string;
  action: CleaningAction;
  selectedRowIndexes?: number[];
  decidedAt: string;
  column?: string;
  replacementValue?: string;
};

export type MissingValueDecision = {
  issueId: string;
  column: string;
  action: "fill_unknown" | "exclude_rows" | "review_later";
  replacementValue?: string;
  decidedAt: string;
};

export type CategoryNormalizationDecision = {
  issueId: string;
  column: string;
  action: "normalize" | "review_later";
  decidedAt: string;
};

export type OutlierDecision = {
  issueId: string;
  column: string;
  action: "keep" | "exclude_rows" | "review_later";
  rowIndexes?: number[];
  decidedAt: string;
};

export type DateQualityDecision = {
  issueId: string;
  column: string;
  action: "exclude_invalid" | "review_later";
  decidedAt: string;
};

export type CleaningDecisionResult = {
  removedRowIndexes: number[];
  keptRowIndexes: number[];
  reviewLaterGroupIds: string[];
};

export type CleaningIssue = {
  id: string;
  type: CleaningIssueType;
  severity: CleaningSeverity;
  title: string;
  description: string;
  affectedRows: number;
  affectedColumns: string[];
  recommendation: string;
  autoFixAvailable: boolean;
  duplicateGroups?: DuplicateGroup[];
  outlierRowIndexes?: number[];
};

export type CleaningProfile = {
  rowCount: number;
  columnCount: number;
  columns: string[];
  issues: CleaningIssue[];
  summary: {
    critical: number;
    warnings: number;
    info: number;
    affectedRows: number;
  };
  readinessScore: number;
};

type DataRow = Record<string, unknown>;

type ProfileOptions = {
  transactionIdColumn?: string;
  dateColumn?: string;
  revenueColumn?: string;
  costColumn?: string;
  grossProfitColumn?: string;
  numericColumns?: string[];
  categoricalColumns?: string[];
  outlierColumns?: string[];
};

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function numeric(value: unknown): number | null {
  if (value == null || text(value) === "") {
    return null;
  }

  const cleaned = text(value).replace(/[$,%\s,]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function issueId(type: CleaningIssueType, column?: string): string {
  return `${type}:${column ?? "dataset"}`;
}

function createIssue(
  type: CleaningIssueType,
  severity: CleaningSeverity,
  title: string,
  description: string,
  affectedRows: number,
  affectedColumns: string[],
  recommendation: string,
  autoFixAvailable = false
): CleaningIssue {
  return {
    id: issueId(type, affectedColumns[0]),
    type,
    severity,
    title,
    description,
    affectedRows,
    affectedColumns,
    recommendation,
    autoFixAvailable,
  };
}

function detectEmptyColumns(
  rows: DataRow[],
  columns: string[]
): CleaningIssue[] {
  return columns
    .filter((column) =>
      rows.every((row) => text(row[column]) === "")
    )
    .map((column) =>
      createIssue(
        "empty_columns",
        "info",
        `Empty column: ${column}`,
        "This column contains no usable values.",
        rows.length,
        [column],
        "Remove it or leave it unused during analysis.",
        true
      )
    );
}

function detectMissingValues(
  rows: DataRow[],
  columns: string[]
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  for (const column of columns) {
    const missing = rows.filter(
      (row) => text(row[column]) === ""
    ).length;

    if (missing === 0) {
      continue;
    }

    const percentage = (missing / Math.max(rows.length, 1)) * 100;
    const severity: CleaningSeverity =
      percentage >= 40 ? "critical" : "warning";

    issues.push(
      createIssue(
        "missing_values",
        severity,
        `Missing values in ${column}`,
        `${missing.toLocaleString()} row(s) (${percentage.toFixed(
          1
        )}%) have no value for this column.`,
        missing,
        [column],
        percentage >= 40
          ? "Review the source data before relying on this field for analysis."
          : "Review whether missing values should be filled, categorized as Unknown, or excluded.",
        false
      )
    );
  }

  return issues;
}

function detectInvalidNumerics(
  rows: DataRow[],
  numericColumns: string[]
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  for (const column of numericColumns) {
    const invalid = rows.filter((row) => {
      const value = text(row[column]);
      return value !== "" && numeric(value) === null;
    }).length;

    if (invalid > 0) {
      issues.push(
        createIssue(
          "invalid_numeric_values",
          "critical",
          `Invalid numeric values in ${column}`,
          `${invalid.toLocaleString()} non-empty value(s) cannot be interpreted as numbers.`,
          invalid,
          [column],
          "Review or correct these values before using the field in calculations.",
          false
        )
      );
    }
  }

  return issues;
}

function detectInvalidDates(
  rows: DataRow[],
  dateColumn?: string
): CleaningIssue[] {
  if (!dateColumn) {
    return [];
  }

  const invalid = rows.filter((row) => {
    const value = text(row[dateColumn]);

    return (
      value !== "" &&
      Number.isNaN(new Date(value).getTime())
    );
  }).length;

  if (invalid === 0) {
    return [];
  }

  return [
    createIssue(
      "invalid_dates",
      "warning",
      `Invalid dates in ${dateColumn}`,
      `${invalid.toLocaleString()} date value(s) cannot be interpreted as valid dates.`,
      invalid,
      [dateColumn],
      "Review the date format and confirm ambiguous dates before time-based analysis.",
      false
    ),
  ];
}

function rowValues(row: DataRow): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      text(value),
    ])
  );
}

function buildDuplicateGroups(
  rows: DataRow[],
  transactionIdColumn?: string
): {
  exactGroups: DuplicateGroup[];
  transactionGroups: DuplicateGroup[];
} {
  const exact = new Map<
    string,
    DuplicateRecord[]
  >();

  const transactions = new Map<
    string,
    DuplicateRecord[]
  >();

  rows.forEach((row, index) => {
    const values = rowValues(row);
    const signature = JSON.stringify(
      Object.keys(row)
        .sort()
        .map((key) => [key, text(row[key])])
    );

    const exactRecords = exact.get(signature) ?? [];
    exactRecords.push({
      rowIndex: index + 1,
      transactionId: transactionIdColumn
        ? text(row[transactionIdColumn]) || undefined
        : undefined,
      values,
    });
    exact.set(signature, exactRecords);

    if (transactionIdColumn) {
      const transactionId = text(row[transactionIdColumn]);

      if (transactionId) {
        const transactionRecords =
          transactions.get(transactionId) ?? [];

        transactionRecords.push({
          rowIndex: index + 1,
          transactionId,
          values,
        });

        transactions.set(
          transactionId,
          transactionRecords
        );
      }
    }
  });

  const exactGroups: DuplicateGroup[] = [...exact.entries()]
    .filter(([, records]) => records.length > 1)
    .map(([key, records], index) => ({
      id: `exact-${index + 1}`,
      kind: "exact",
      key,
      records,
      exactMatch: true,
    }));

  const transactionGroups: DuplicateGroup[] = [
    ...transactions.entries(),
  ]
    .filter(([, records]) => records.length > 1)
    .map(([key, records], index) => ({
      id: `transaction-${index + 1}`,
      kind: "transaction_id",
      key,
      records,
      exactMatch:
        new Set(
          records.map((record) =>
            JSON.stringify(record.values)
          )
        ).size === 1,
    }));

  return {
    exactGroups,
    transactionGroups,
  };
}

function detectDuplicates(
  rows: DataRow[],
  transactionIdColumn?: string
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];
  const {
    exactGroups,
    transactionGroups,
  } = buildDuplicateGroups(rows, transactionIdColumn);

  const duplicateRows = exactGroups.reduce(
    (total, group) => total + group.records.length - 1,
    0
  );

  if (duplicateRows > 0) {
    issues.push({
      ...createIssue(
        "duplicate_rows",
        "warning",
        "Exact duplicate rows detected",
        `${duplicateRows.toLocaleString()} duplicate row(s) have an identical set of values.`,
        duplicateRows,
        [],
        "Review duplicates and remove only records confirmed to be accidental duplicates.",
        true
      ),
      duplicateGroups: exactGroups,
    });
  }

  const duplicateIds = transactionGroups.reduce(
    (total, group) => total + group.records.length - 1,
    0
  );

  if (duplicateIds > 0) {
    issues.push({
      ...createIssue(
        "duplicate_transaction_ids",
        "warning",
        "Duplicate transaction IDs detected",
        `${duplicateIds.toLocaleString()} row(s) share a transaction ID with another record.`,
        duplicateIds,
        transactionIdColumn ? [transactionIdColumn] : [],
        "Review repeated transaction IDs because they may represent duplicates, amendments, or legitimate line items.",
        false
      ),
      duplicateGroups: transactionGroups,
    });
  }

  return issues;
}

function detectNegativeValues(
  rows: DataRow[],
  numericColumns: string[]
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  for (const column of numericColumns) {
    const negative = rows.filter((row) => {
      const value = numeric(row[column]);
      return value !== null && value < 0;
    }).length;

    if (negative > 0) {
      issues.push(
        createIssue(
          "negative_values",
          "warning",
          `Negative values in ${column}`,
          `${negative.toLocaleString()} row(s) contain negative values.`,
          negative,
          [column],
          "Review whether these represent refunds, credits, reversals, losses, or data errors. Do not automatically convert them to positive values.",
          false
        )
      );
    }
  }

  return issues;
}

function detectGrossProfitMismatch(
  rows: DataRow[],
  revenueColumn?: string,
  costColumn?: string,
  grossProfitColumn?: string
): CleaningIssue[] {
  if (!revenueColumn || !costColumn || !grossProfitColumn) {
    return [];
  }

  let mismatches = 0;

  for (const row of rows) {
    const revenue = numeric(row[revenueColumn]);
    const cost = numeric(row[costColumn]);
    const profit = numeric(row[grossProfitColumn]);

    if (
      revenue !== null &&
      cost !== null &&
      profit !== null &&
      Math.abs(revenue - cost - profit) > 0.01
    ) {
      mismatches++;
    }
  }

  if (mismatches === 0) {
    return [];
  }

  return [
    createIssue(
      "gross_profit_mismatch",
      "warning",
      "Gross profit calculation mismatch",
      `${mismatches.toLocaleString()} row(s) do not satisfy Revenue − Cost = Gross Profit.`,
      mismatches,
      [revenueColumn, costColumn, grossProfitColumn],
      "Review the source calculation. If Gross Profit is not supplied, Teketeke can derive it from Revenue − Cost.",
      false
    ),
  ];
}

function detectCategoricalInconsistencies(
  rows: DataRow[],
  categoricalColumns: string[]
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  for (const column of categoricalColumns) {
    const variants = new Map<string, Set<string>>();

    for (const row of rows) {
      const raw = text(row[column]);

      if (!raw) {
        continue;
      }

      const normalized = raw
        .toLowerCase()
        .replace(/\s+/g, " ");

      const values = variants.get(normalized) ?? new Set<string>();
      values.add(raw);
      variants.set(normalized, values);
    }

    const inconsistentGroups = [...variants.values()].filter(
      (values) => values.size > 1
    );

    if (inconsistentGroups.length > 0) {
      issues.push(
        createIssue(
          "inconsistent_categories",
          "info",
          `Inconsistent category labels in ${column}`,
          `${inconsistentGroups.length.toLocaleString()} group(s) contain values that differ only by casing or spacing.`,
          inconsistentGroups.reduce(
            (total, values) => total + values.size,
            0
          ),
          [column],
          "Review suggested category normalization before grouping or comparing this dimension.",
          true
        )
      );
    }
  }

  return issues;
}

function detectOutliers(
  rows: DataRow[],
  columns: string[]
): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  for (const column of columns) {
    const numericRows = rows
      .map((row, index) => ({
        rowIndex: index + 1,
        value: numeric(row[column]),
      }))
      .filter(
        (
          item
        ): item is { rowIndex: number; value: number } =>
          item.value !== null
      );

    if (numericRows.length < 8) {
      continue;
    }

    const sorted = numericRows
      .map((item) => item.value)
      .sort((a, b) => a - b);

    const q1 =
      sorted[Math.floor((sorted.length - 1) * 0.25)];
    const q3 =
      sorted[Math.floor((sorted.length - 1) * 0.75)];
    const iqr = q3 - q1;

    if (iqr === 0) {
      continue;
    }

    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    const outlierRowIndexes = numericRows
      .filter(
        (item) => item.value < lower || item.value > upper
      )
      .map((item) => item.rowIndex);

    if (outlierRowIndexes.length > 0) {
      issues.push({
        ...createIssue(
          "outliers",
          "info",
          `Potential outliers in ${column}`,
          `${outlierRowIndexes.length.toLocaleString()} value(s) fall outside the standard IQR outlier range.`,
          outlierRowIndexes.length,
          [column],
          "Review unusual records. Do not automatically remove them because they may represent legitimate business events.",
          false
        ),
        outlierRowIndexes,
      });
    }
  }

  return issues;
}


export function profileDataset(
  rows: DataRow[],
  options: ProfileOptions = {}
): CleaningProfile {
  const columns = [
    ...new Set(rows.flatMap((row) => Object.keys(row))),
  ];

  const issues: CleaningIssue[] = [];

  issues.push(...detectEmptyColumns(rows, columns));
  issues.push(...detectMissingValues(rows, columns));
  issues.push(
    ...detectInvalidNumerics(
      rows,
      options.numericColumns ?? []
    )
  );
  issues.push(
    ...detectInvalidDates(
      rows,
      options.dateColumn
    )
  );
  issues.push(
    ...detectDuplicates(
      rows,
      options.transactionIdColumn
    )
  );
  issues.push(
    ...detectNegativeValues(
      rows,
      options.numericColumns ?? []
    )
  );
  issues.push(
    ...detectGrossProfitMismatch(
      rows,
      options.revenueColumn,
      options.costColumn,
      options.grossProfitColumn
    )
  );
  issues.push(
    ...detectCategoricalInconsistencies(
      rows,
      options.categoricalColumns ?? []
    )
  );
  issues.push(
    ...detectOutliers(
      rows,
      options.outlierColumns ??
        options.numericColumns ??
        []
    )
  );

  const critical = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;

  const warnings = issues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  const info = issues.filter(
    (issue) => issue.severity === "info"
  ).length;

  const affectedRows = new Set(
    issues.flatMap((issue) =>
      Array.from(
        { length: issue.affectedRows },
        (_, index) => `${issue.id}:${index}`
      )
    )
  ).size;

  const penalty =
    critical * 20 +
    warnings * 8 +
    Math.min(info * 2, 10);

  const readinessScore = Math.max(
    0,
    Math.min(100, 100 - penalty)
  );

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    issues,
    summary: {
      critical,
      warnings,
      info,
      affectedRows,
    },
    readinessScore,
  };
}

export function createCleaningDecision(
  issueId: string,
  groupId: string,
  action: CleaningAction,
  selectedRowIndexes: number[] = []
): CleaningDecision {
  return {
    issueId,
    groupId,
    action,
    selectedRowIndexes:
      selectedRowIndexes.length > 0
        ? [...new Set(selectedRowIndexes)]
        : undefined,
    decidedAt: new Date().toISOString(),
  };
}

export function applyCleaningDecisions(
  decisions: CleaningDecision[]
): CleaningDecisionResult {
  const removed = new Set<number>();
  const kept = new Set<number>();
  const reviewLater = new Set<string>();

  for (const decision of decisions) {
    const selected = new Set(
      decision.selectedRowIndexes ?? []
    );

    switch (decision.action) {
      case "remove_duplicates":
        for (const rowIndex of selected) {
          removed.add(rowIndex);
          kept.delete(rowIndex);
        }
        break;

      case "keep_record":
        for (const rowIndex of selected) {
          kept.add(rowIndex);
          removed.delete(rowIndex);
        }
        break;

      case "review_later":
        reviewLater.add(decision.groupId);
        break;

      case "keep_all":
        for (const rowIndex of selected) {
          kept.add(rowIndex);
          removed.delete(rowIndex);
        }
        break;
    }
  }

  return {
    removedRowIndexes: [...removed].sort((a, b) => a - b),
    keptRowIndexes: [...kept].sort((a, b) => a - b),
    reviewLaterGroupIds: [...reviewLater],
  };
}

export function applyDateQualityDecisions(
  rows: DataRow[],
  decisions: DateQualityDecision[]
): {
  rows: DataRow[];
  removedRowIndexes: number[];
  reviewLaterColumns: string[];
} {
  const removed = new Set<number>();
  const reviewLaterColumns = new Set<string>();

  for (const decision of decisions) {
    if (decision.action === "review_later") {
      reviewLaterColumns.add(decision.column);
      continue;
    }

    if (decision.action === "exclude_invalid") {
      rows.forEach((row, index) => {
        const value = text(row[decision.column]);

        if (value && Number.isNaN(Date.parse(value))) {
          removed.add(index + 1);
        }
      });
    }
  }

  return {
    rows: rows.filter(
      (_, index) => !removed.has(index + 1)
    ),
    removedRowIndexes: [...removed].sort(
      (a, b) => a - b
    ),
    reviewLaterColumns: [...reviewLaterColumns],
  };
}

export function applyOutlierDecisions(
  rows: DataRow[],
  decisions: OutlierDecision[]
): {
  rows: DataRow[];
  removedRowIndexes: number[];
  reviewLaterColumns: string[];
} {
  const removed = new Set<number>();
  const reviewLaterColumns = new Set<string>();

  for (const decision of decisions) {
    if (decision.action === "review_later") {
      reviewLaterColumns.add(decision.column);
      continue;
    }

    if (decision.action === "exclude_rows") {
      for (const rowIndex of decision.rowIndexes ?? []) {
        removed.add(rowIndex);
      }
    }
  }

  return {
    rows: rows.filter(
      (_, index) => !removed.has(index + 1)
    ),
    removedRowIndexes: [...removed].sort(
      (a, b) => a - b
    ),
    reviewLaterColumns: [...reviewLaterColumns],
  };
}

export function applyCategoryNormalizationDecisions(
  rows: DataRow[],
  decisions: CategoryNormalizationDecision[]
): {
  rows: DataRow[];
  normalizedCells: number;
  reviewLaterColumns: string[];
} {
  const nextRows = rows.map((row) => ({ ...row }));
  let normalizedCells = 0;
  const reviewLaterColumns = new Set<string>();

  for (const decision of decisions) {
    if (decision.action === "review_later") {
      reviewLaterColumns.add(decision.column);
      continue;
    }

    const canonicalValues = new Map<string, string>();

    for (const row of nextRows) {
      const raw = text(row[decision.column]);

      if (!raw) {
        continue;
      }

      const key = raw.toLowerCase().replace(/\s+/g, " ");

      if (!canonicalValues.has(key)) {
        canonicalValues.set(key, raw.trim());
      }
    }

    for (const row of nextRows) {
      const raw = text(row[decision.column]);

      if (!raw) {
        continue;
      }

      const key = raw.toLowerCase().replace(/\s+/g, " ");
      const canonical = canonicalValues.get(key);

      if (canonical && raw !== canonical) {
        row[decision.column] = canonical;
        normalizedCells++;
      }
    }
  }

  return {
    rows: nextRows,
    normalizedCells,
    reviewLaterColumns: [...reviewLaterColumns],
  };
}

export function applyMissingValueDecisions(
  rows: DataRow[],
  decisions: MissingValueDecision[]
): {
  rows: DataRow[];
  filledCells: number;
  removedRowIndexes: number[];
  reviewLaterColumns: string[];
} {
  const nextRows = rows.map((row) => ({ ...row }));
  let filledCells = 0;
  const removedRowIndexes = new Set<number>();
  const reviewLaterColumns = new Set<string>();

  for (const decision of decisions) {
    if (decision.action === "review_later") {
      reviewLaterColumns.add(decision.column);
      continue;
    }

    if (decision.action === "fill_unknown") {
      const replacement =
        decision.replacementValue?.trim() || "Unknown";

      nextRows.forEach((row, index) => {
        const value = row[decision.column];

        if (
          value === undefined ||
          value === null ||
          text(value) === ""
        ) {
          row[decision.column] = replacement;
          filledCells++;
        }
      });

      continue;
    }

    if (decision.action === "exclude_rows") {
      nextRows.forEach((row, index) => {
        const value = row[decision.column];

        if (
          value === undefined ||
          value === null ||
          text(value) === ""
        ) {
          removedRowIndexes.add(index + 1);
        }
      });
    }
  }

  const filteredRows = nextRows.filter(
    (_, index) => !removedRowIndexes.has(index + 1)
  );

  return {
    rows: filteredRows,
    filledCells,
    removedRowIndexes: [...removedRowIndexes].sort(
      (a, b) => a - b
    ),
    reviewLaterColumns: [...reviewLaterColumns],
  };
}

export function applyCleaningDecisionsToRows(
  rows: DataRow[],
  decisions: CleaningDecision[]
): {
  rows: DataRow[];
  removedRowIndexes: number[];
  keptRowIndexes: number[];
  reviewLaterGroupIds: string[];
} {
  const result = applyCleaningDecisions(decisions);
  const removed = new Set(result.removedRowIndexes);
  const kept = new Set(result.keptRowIndexes);

  const cleanedRows = rows.filter((_, index) => {
    const rowNumber = index + 1;

    // An explicit removal decision always wins.
    if (removed.has(rowNumber)) {
      return false;
    }

    // Keep decisions are explicit and therefore preserved.
    if (kept.has(rowNumber)) {
      return true;
    }

    // Rows without a removal decision remain untouched.
    return true;
  });

  return {
    rows: cleanedRows,
    removedRowIndexes: result.removedRowIndexes,
    keptRowIndexes: result.keptRowIndexes,
    reviewLaterGroupIds: result.reviewLaterGroupIds,
  };
}

export function getCleaningRecommendations(
  profile: CleaningProfile
): CleaningIssue[] {
  return [...profile.issues].sort((a, b) => {
    const severityRank: Record<CleaningSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };

    return severityRank[a.severity] - severityRank[b.severity];
  });
}