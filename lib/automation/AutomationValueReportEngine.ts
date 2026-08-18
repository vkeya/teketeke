import type { AutomationAssessment } from "./AutomationAssessment";
import { summarizeAutomationValue } from "./AutomationMeasurementEngine";

export type AutomationValueRealizationStatus =
  | "exceeded"
  | "met"
  | "below"
  | "not_comparable";

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

  forecastAnnualHoursSaved?: number;
  annualizedActualHoursRecovered: number;
  hoursRealizationPct?: number;
  realizationStatus: AutomationValueRealizationStatus;
};

export function buildAutomationValueReport(
  assessment: AutomationAssessment
): AutomationValueReport | null {
  const measurement = assessment.measurement;

  if (!measurement) {
    return null;
  }

  const value = summarizeAutomationValue(measurement);

  const weeklyHoursRecovered = value.weeklyHoursRecovered;
  const hoursReductionPct = value.hoursReductionPct;
  const errorReductionPct = value.errorReductionPct;

  const forecastAnnualHoursSaved =
    assessment.automation?.businessCase?.estimatedAnnualHoursSaved;

  const annualizedActualHoursRecovered =
    weeklyHoursRecovered * 52;

  let hoursRealizationPct: number | undefined;
  let realizationStatus: AutomationValueRealizationStatus =
    "not_comparable";

  if (
    typeof forecastAnnualHoursSaved === "number" &&
    Number.isFinite(forecastAnnualHoursSaved) &&
    forecastAnnualHoursSaved > 0
  ) {
    hoursRealizationPct =
      (annualizedActualHoursRecovered /
        forecastAnnualHoursSaved) *
      100;

    if (hoursRealizationPct >= 105) {
      realizationStatus = "exceeded";
    } else if (hoursRealizationPct >= 90) {
      realizationStatus = "met";
    } else {
      realizationStatus = "below";
    }
  }

  const headline =
    realizationStatus === "exceeded"
      ? "Automation exceeded its original hours-saving forecast"
      : realizationStatus === "met"
        ? "Automation met its original hours-saving forecast"
        : realizationStatus === "below"
          ? "Automation is currently below its original hours-saving forecast"
          : weeklyHoursRecovered > 0
            ? `${weeklyHoursRecovered.toFixed(
                1
              )} hours recovered per week`
            : "Automation value measurement completed";

  const summary =
    weeklyHoursRecovered > 0
      ? `Measured results show a reduction from ${
          value.baselineManualSteps ?? "the baseline"
        } manual steps to ${
          value.currentManualSteps ?? "the current"
        } manual steps, with approximately ${weeklyHoursRecovered.toFixed(
          1
        )} working hours recovered each week.`
      : "Measured results are available for review against the original baseline.";

  const nextSteps = [
    "Review the measured results with the process owner.",
  ];

  if (hoursRealizationPct !== undefined) {
    nextSteps.push(
      "Compare the realized hours outcome with the original business-case forecast."
    );
  } else {
    nextSteps.push(
      "Establish an original annual-hours forecast so future measurements can be compared with the business case."
    );
  }

  nextSteps.push(
    "Identify additional improvement opportunities based on the measured outcome."
  );

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
    nextSteps,
    forecastAnnualHoursSaved,
    annualizedActualHoursRecovered,
    hoursRealizationPct,
    realizationStatus,
  };
}
