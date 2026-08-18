import type { AutomationAssessment } from "./AutomationAssessment";
import { summarizeAutomationValue } from "./AutomationMeasurementEngine";

export type AutomationValueReport = {
  headline: string;
  summary: string;
  weeklyHoursRecovered: number;
  hoursReductionPct: number;
  errorReductionPct: number;
  baselineWeeklyHours: number;
  currentWeeklyHours: number;
  measuredAt?: string;
  nextSteps: string[];
};

export function buildAutomationValueReport(
  assessment: AutomationAssessment
): AutomationValueReport | null {
  const measurement = assessment.measurement;

  if (!measurement) {
    return null;
  }

  const value =
    summarizeAutomationValue(measurement);

  const weeklyHoursRecovered =
    value.weeklyHoursRecovered;

  const hoursReductionPct =
    value.hoursReductionPct;

  const errorReductionPct =
    value.errorReductionPct;

  const headline =
    weeklyHoursRecovered > 0
      ? `${weeklyHoursRecovered.toFixed(1)} hours recovered per week`
      : "Automation value measurement completed";

  const summary =
    weeklyHoursRecovered > 0
      ? `Measured results show a reduction from ${value.baselineManualSteps ?? "the baseline"} manual steps to ${value.currentManualSteps ?? "the current"} manual steps, with approximately ${weeklyHoursRecovered.toFixed(1)} working hours recovered each week.`
      : "Measured results are available for review against the original baseline.";

  return {
    headline,
    summary,
    weeklyHoursRecovered,
    hoursReductionPct,
    errorReductionPct,
    baselineWeeklyHours:
      measurement.baseline?.weeklyHours ?? 0,
    currentWeeklyHours:
      measurement.current?.weeklyHours ?? 0,
    measuredAt: measurement.measuredAt,
    nextSteps: [
      "Review the measured results with the process owner.",
      "Compare realized value with the original business-case assumptions.",
      "Identify additional improvement opportunities based on the measured outcome.",
    ],
  };
}