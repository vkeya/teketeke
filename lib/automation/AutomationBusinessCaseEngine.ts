import type {
  AutomationBusinessCase,
  AutomationOpportunity,
} from "./AutomationAssessment";

/**
 * Business-case inputs supplied by the user or by a trusted assessment source.
 *
 * Financial assumptions are never invented by the engine.
 * Missing inputs leave the corresponding financial result undefined.
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

  if (
    !Number.isFinite(weeklyHours) ||
    weeklyHours <= 0
  ) {
    return 0;
  }

  return weeklyHours * 52;
}

function calculateAnnualHoursSaved(
  opportunities: AutomationOpportunity[]
): number {
  return opportunities.reduce(
    (total, opportunity) =>
      total + annualHoursSaved(opportunity),
    0
  );
}

function resolveTotalImplementationCost(
  opportunities: AutomationOpportunity[],
  inputs: BusinessCaseInputs
): number | undefined {
  /*
   * A directly supplied implementation cost is treated as the
   * total project cost, not a cost that should be repeated for
   * every opportunity.
   */
  if (
    inputs.implementationCost !== undefined &&
    Number.isFinite(inputs.implementationCost) &&
    inputs.implementationCost >= 0
  ) {
    return inputs.implementationCost;
  }

  /*
   * If no total cost was supplied, calculate one from total
   * implementation days × rate/day.
   */
  if (
    inputs.implementationDays !== undefined &&
    inputs.implementationRatePerDay !== undefined &&
    Number.isFinite(inputs.implementationDays) &&
    Number.isFinite(inputs.implementationRatePerDay) &&
    inputs.implementationDays >= 0 &&
    inputs.implementationRatePerDay >= 0
  ) {
    return (
      inputs.implementationDays *
      inputs.implementationRatePerDay
    );
  }

  /*
   * Fall back to opportunity-level implementation costs only
   * when every opportunity has a known cost.
   */
  if (opportunities.length === 0) {
    return undefined;
  }

  const costs = opportunities.map(
    (opportunity) =>
      opportunity.estimatedImplementationCost
  );

  const allKnown = costs.every(
    (cost) =>
      cost !== undefined &&
      Number.isFinite(cost) &&
      cost >= 0
  );

  if (!allKnown) {
    return undefined;
  }

  return costs.reduce<number>(
    (total, cost) =>
      total + (cost ?? 0),
    0
  );
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

function calculatePaybackMonths(
  annualValue?: number,
  implementationCost?: number
): number | undefined {
  if (
    annualValue === undefined ||
    annualValue <= 0 ||
    implementationCost === undefined ||
    implementationCost < 0
  ) {
    return undefined;
  }

  if (implementationCost === 0) {
    return 0;
  }

  return (
    (implementationCost / annualValue) *
    12
  );
}

function calculateRoiPct(
  annualValue?: number,
  implementationCost?: number
): number | undefined {
  if (
    annualValue === undefined ||
    implementationCost === undefined ||
    implementationCost <= 0
  ) {
    return undefined;
  }

  return (
    ((annualValue - implementationCost) /
      implementationCost) *
    100
  );
}

function buildAssumptions(
  inputs: BusinessCaseInputs,
  annualHoursSavedValue: number,
  implementationCost?: number
): string[] {
  const assumptions: string[] = [];

  if (inputs.hourlyValue !== undefined) {
    assumptions.push(
      `Time value: ${inputs.hourlyValue} per hour.`
    );
  }

  if (inputs.implementationCost !== undefined) {
    assumptions.push(
      `Total implementation cost entered: ${inputs.implementationCost}.`
    );
  } else if (
    inputs.implementationDays !== undefined &&
    inputs.implementationRatePerDay !==
      undefined
  ) {
    assumptions.push(
      `Implementation: ${inputs.implementationDays} days at ${inputs.implementationRatePerDay} per day.`
    );
  } else if (
    implementationCost !== undefined
  ) {
    assumptions.push(
      "Implementation cost is based on opportunity-level estimates."
    );
  }

  if (annualHoursSavedValue > 0) {
    assumptions.push(
      "Time savings are estimates based on the discovery information available."
    );
  } else {
    assumptions.push(
      "No measurable time recovery has been estimated from the current discovery data."
    );
  }

  if (
    implementationCost !== undefined ||
    inputs.hourlyValue !== undefined
  ) {
    assumptions.push(
      "Financial estimates should be validated with the decision maker before implementation."
    );
  }

  return assumptions;
}

export function buildAutomationBusinessCase(
  opportunities: AutomationOpportunity[],
  inputs: BusinessCaseInputs = {}
): AutomationBusinessCase {
  const estimatedAnnualHoursSaved =
    calculateAnnualHoursSaved(
      opportunities
    );

  const estimatedAnnualValue =
    calculateAnnualValue(
      estimatedAnnualHoursSaved,
      inputs.hourlyValue
    );

  const estimatedImplementationCost =
    resolveTotalImplementationCost(
      opportunities,
      inputs
    );

  const estimatedPaybackMonths =
    calculatePaybackMonths(
      estimatedAnnualValue,
      estimatedImplementationCost
    );

  const estimatedYearOneRoiPct =
    calculateRoiPct(
      estimatedAnnualValue,
      estimatedImplementationCost
    );

  const assumptions =
    buildAssumptions(
      inputs,
      estimatedAnnualHoursSaved,
      estimatedImplementationCost
    );

  return {
    /*
     * Keep currentAnnualHours for backwards compatibility.
     * It represents the currently estimated annual capacity
     * associated with the discovered automation opportunities.
     */
    currentAnnualHours:
      estimatedAnnualHoursSaved,

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
  const annualHours =
    annualHoursSaved(opportunity);

  const annualValue =
    calculateAnnualValue(
      annualHours,
      inputs.hourlyValue
    );

  const implementationCost =
    inputs.implementationCost ??
    (inputs.implementationDays !== undefined &&
    inputs.implementationRatePerDay !==
      undefined
      ? inputs.implementationDays *
        inputs.implementationRatePerDay
      : opportunity.estimatedImplementationCost);

  const paybackMonths =
    calculatePaybackMonths(
      annualValue,
      implementationCost
    );

  const roiPct =
    calculateRoiPct(
      annualValue,
      implementationCost
    );

  return {
    annualHoursSaved: annualHours,
    annualValue,
    implementationCost,
    paybackMonths,
    roiPct,
  };
}
