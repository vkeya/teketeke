import type { AutomationMeasurement } from "./AutomationAssessment";

export type MeasurementInput = {
  baselineWeeklyHours: number;
  currentWeeklyHours: number;
  baselineManualSteps?: number;
  currentManualSteps?: number;
  baselineErrorRatePct?: number;
  currentErrorRatePct?: number;
  measuredAt?: string;
  notes?: string[];
};

function percentageReduction(
  baseline: number | undefined,
  current: number | undefined
): number | undefined {
  if (
    baseline === undefined ||
    current === undefined ||
    baseline <= 0
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.min(100, ((baseline - current) / baseline) * 100)
  );
}

export function buildAutomationMeasurement(
  input: MeasurementInput
): AutomationMeasurement {
  return {
    baseline: {
      weeklyHours: input.baselineWeeklyHours,
      manualSteps: input.baselineManualSteps,
      errorRatePct: input.baselineErrorRatePct,
    },
    current: {
      weeklyHours: input.currentWeeklyHours,
      manualSteps: input.currentManualSteps,
      errorRatePct: input.currentErrorRatePct,
    },
    hoursReductionPct: percentageReduction(
      input.baselineWeeklyHours,
      input.currentWeeklyHours
    ),
    errorReductionPct: percentageReduction(
      input.baselineErrorRatePct,
      input.currentErrorRatePct
    ),
    measuredAt:
      input.measuredAt ?? new Date().toISOString(),
    notes: input.notes ?? [],
  };
}

export function summarizeAutomationValue(
  measurement: AutomationMeasurement
) {
  const baselineHours =
    measurement.baseline?.weeklyHours ?? 0;
  const currentHours =
    measurement.current?.weeklyHours ?? 0;

  return {
    weeklyHoursRecovered: Math.max(
      0,
      baselineHours - currentHours
    ),
    hoursReductionPct:
      measurement.hoursReductionPct ?? 0,
    errorReductionPct:
      measurement.errorReductionPct ?? 0,
    baselineManualSteps:
      measurement.baseline?.manualSteps,
    currentManualSteps:
      measurement.current?.manualSteps,
  };
}