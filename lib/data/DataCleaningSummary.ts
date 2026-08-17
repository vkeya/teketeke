export type DataCleaningSummary = {
  originalRows: number;
  analyzedRows: number;
  rowsRemoved: number;
  duplicatesRemoved: number;
  missingValuesFilled: number;
  missingRowsRemoved: number;
  categoriesNormalized: number;
  outlierRowsRemoved: number;
  invalidDatesRemoved: number;
  keptRows: number;
  reviewLaterGroups: number;
  reviewLaterColumns: number;
};

export type DataCleaningSummaryInput = {
  originalRows: number;
  analyzedRows: number;

  duplicateRemovedRows?: number[];
  missingValuesFilled?: number;
  missingRowsRemoved?: number[];

  normalizedCategoryCells?: number;

  outlierRemovedRows?: number[];

  dateQualityRemovedRows?: number[];

  keptRows?: number[];
  reviewLaterGroupIds?: string[];

  reviewLaterMissingColumns?: string[];
  reviewLaterCategoryColumns?: string[];
  reviewLaterOutlierColumns?: string[];
  reviewLaterDateColumns?: string[];
};

function uniqueNumberCount(values: number[] = []) {
  return new Set(values).size;
}

function uniqueStringCount(values: string[] = []) {
  return new Set(values).size;
}

export function buildDataCleaningSummary(
  input: DataCleaningSummaryInput
): DataCleaningSummary {
  const duplicatesRemoved = uniqueNumberCount(
    input.duplicateRemovedRows
  );

  const missingRowsRemoved = uniqueNumberCount(
    input.missingRowsRemoved
  );

  const outlierRowsRemoved = uniqueNumberCount(
    input.outlierRemovedRows
  );

  const invalidDatesRemoved = uniqueNumberCount(
    input.dateQualityRemovedRows
  );

  const rowsRemoved = Math.max(
    0,
    input.originalRows - input.analyzedRows
  );

  return {
    originalRows: input.originalRows,
    analyzedRows: input.analyzedRows,
    rowsRemoved,
    duplicatesRemoved,
    missingValuesFilled: input.missingValuesFilled ?? 0,
    missingRowsRemoved,
    categoriesNormalized:
      input.normalizedCategoryCells ?? 0,
    outlierRowsRemoved,
    invalidDatesRemoved,
    keptRows: uniqueNumberCount(input.keptRows),
    reviewLaterGroups: uniqueStringCount(
      input.reviewLaterGroupIds
    ),
    reviewLaterColumns: new Set([
      ...(input.reviewLaterMissingColumns ?? []),
      ...(input.reviewLaterCategoryColumns ?? []),
      ...(input.reviewLaterOutlierColumns ?? []),
      ...(input.reviewLaterDateColumns ?? []),
    ]).size,
  };
}