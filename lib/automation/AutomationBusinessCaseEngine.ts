import type {
  AutomationBusinessCase,
  AutomationOpportunity,
} from "./AutomationAssessment";

/**
 * Business-case inputs supplied by the user or by a trusted assessment source.
 *
 * No financial assumptions are hidden in the engine. If an input is not
 * supplied, the corresponding financial result remains undefined rather
 * than falling back to a hardcoded value.
 */
export type BusinessCaseInputs = {
  hourlyValue?: number;
  implementationCost?: number;
  implementationDays?: number;
  implementationRatePerDay?: number;
};

function annualHoursSaved(
  opportunity: AutomationOpportunity
): number {
  const weeklyHours =
    opportunity.estimatedWeeklyHoursSaved ?? 0;

  return weeklyHours * 52;
}

function resolveImplementationCost(
  opportunity: AutomationOpportunity,
  inputs?: BusinessCaseInputs
): number | undefined {
  if (
    opportunity.estimatedImplementationCost !==
    undefined
  ) {
    return opportunity.estimatedImplementationCost;
  }

  if (inputs?.implementationCost !== undefined) {
    return inputs.implementationCost;
  }

  if (
    inputs?.implementationDays !== undefined &&
    inputs?.implementationRatePerDay !== undefined
  ) {
    return (
      inputs.implementationDays *
      inputs.implementationRatePerDay
    );
  }

  return undefined;
}

function calculateAnnualValue(
  annualHours: number,
  hourlyValue?: number
): number | undefined {
  if (
    hourlyValue === undefined ||
    !Number.isFinite(hourlyValue) ||
    hourlyValue < 0
  ) {
    return undefined;
  }

  return annualHours * hourlyValue;
}

export function buildAutomationBusinessCase(
  opportunities: AutomationOpportunity[],
  inputs: BusinessCaseInputs = {}
): AutomationBusinessCase {
  const currentAnnualHours =
    opportunities.reduce(
      (total, opportunity) =>
        total + annualHoursSaved(opportunity),
      0
    );

  const estimatedAnnualHoursSaved =
    currentAnnualHours;

  const estimatedAnnualValue =
    calculateAnnualValue(
      estimatedAnnualHoursSaved,
      inputs.hourlyValue
    );

  const opportunityCosts = opportunities.map(
    (opportunity) =>
      resolveImplementationCost(
        opportunity,
        inputs
      )
  );

  const hasCompleteImplementationCosts =
    opportunityCosts.every(
      (cost) =>
        cost !== undefined &&
        Number.isFinite(cost) &&
        cost >= 0
    );

  let estimatedImplementationCost: number | undefined;

  if (hasCompleteImplementationCosts) {
    let totalImplementationCost = 0;

    for (const cost of opportunityCosts) {
      if (cost !== undefined) {
        totalImplementationCost += cost;
      }
    }

    estimatedImplementationCost =
      totalImplementationCost;
  }

  const estimatedPaybackMonths =
    estimatedAnnualValue !== undefined &&
    estimatedAnnualValue > 0 &&
    estimatedImplementationCost !== undefined
      ? (estimatedImplementationCost /
          estimatedAnnualValue) *
        12
      : undefined;

  const estimatedYearOneRoiPct =
    estimatedAnnualValue !== undefined &&
    estimatedImplementationCost !== undefined &&
    estimatedImplementationCost > 0
      ? ((estimatedAnnualValue -
          estimatedImplementationCost) /
          estimatedImplementationCost) *
        100
      : undefined;

  const assumptions: string[] = [];

  if (inputs.hourlyValue !== undefined) {
    assumptions.push(
      `Time value: ${inputs.hourlyValue} per hour.`
    );
  }

  if (inputs.implementationCost !== undefined) {
    assumptions.push(
      `Implementation cost entered: ${inputs.implementationCost}.`
    );
  } else if (
    inputs.implementationDays !== undefined &&
    inputs.implementationRatePerDay !==
      undefined
  ) {
    assumptions.push(
      `Implementation: ${inputs.implementationDays} days at ${inputs.implementationRatePerDay} per day.`
    );
  }

  assumptions.push(
    "Time savings are estimates based on the discovery information available."
  );

  if (
    estimatedAnnualValue !== undefined ||
    estimatedImplementationCost !== undefined
  ) {
    assumptions.push(
      "Financial estimates should be validated with the decision maker before implementation."
    );
  }

  return {
    currentAnnualHours,
    estimatedAnnualHoursSaved,
    estimatedAnnualValue,
    estimatedImplementationCost,
    estimatedPaybackMonths,
    estimatedYearOneRoiPct,
    assumptions,
  };
}

export function buildOpportunityBusinessCase(
  opportunity: AutomationOpportunity,
  inputs: BusinessCaseInputs = {}
) {
  const annualHours = annualHoursSaved(opportunity);

  const annualValue = calculateAnnualValue(
    annualHours,
    inputs.hourlyValue
  );

  const implementationCost =
    resolveImplementationCost(
      opportunity,
      inputs
    );

  const paybackMonths =
    annualValue !== undefined &&
    annualValue > 0 &&
    implementationCost !== undefined
      ? (implementationCost / annualValue) * 12
      : undefined;

  const roiPct =
    annualValue !== undefined &&
    implementationCost !== undefined &&
    implementationCost > 0
      ? ((annualValue - implementationCost) /
          implementationCost) *
        100
      : undefined;

  return {
    annualHoursSaved: annualHours,
    annualValue,
    implementationCost,
    paybackMonths,
    roiPct,
  };
}