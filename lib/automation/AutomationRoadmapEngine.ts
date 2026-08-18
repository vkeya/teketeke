import type {
  AutomationOpportunity,
  RoadmapPhase,
} from "./AutomationAssessment";

export type RoadmapPlanningOptions = {
  quickWinMaxDays?: number;
  nearTermMaxDays?: number;
};

type RoadmapBucket =
  | "quick_wins"
  | "near_term"
  | "medium_term"
  | "strategic";

const PHASE_IDS: RoadmapBucket[] = [
  "quick_wins",
  "near_term",
  "medium_term",
  "strategic",
];

function effectiveDays(
  opportunity: AutomationOpportunity
): number {
  return opportunity.estimatedImplementationDays ?? 10;
}

function hasMeaningfulRisk(
  opportunity: AutomationOpportunity
): boolean {
  return opportunity.riskScore >= 60 || opportunity.risks.length >= 2;
}

function hasDependencies(
  opportunity: AutomationOpportunity
): boolean {
  return opportunity.dependencies.length > 0;
}

function phaseForOpportunity(
  opportunity: AutomationOpportunity,
  options: Required<RoadmapPlanningOptions>
): RoadmapBucket {
  const days = effectiveDays(opportunity);
  const score = opportunity.automationScore;
  const impact = opportunity.impactScore;
  const feasibility = opportunity.feasibilityScore;
  const risk = opportunity.riskScore;

  /*
   * Quick wins should be genuinely attractive:
   * high value, feasible, relatively low risk and short to implement.
   *
   * Critical opportunities can still require more planning if their
   * implementation effort or risk is significant.
   */
  const qualifiesAsQuickWin =
    days <= options.quickWinMaxDays &&
    score >= 70 &&
    impact >= 60 &&
    feasibility >= 60 &&
    risk < 60;

  if (qualifiesAsQuickWin) {
    return "quick_wins";
  }

  /*
   * Near-term opportunities are strong candidates that need more
   * implementation effort, dependencies or validation.
   */
  const qualifiesAsNearTerm =
    days <= options.nearTermMaxDays &&
    score >= 55 &&
    feasibility >= 45;

  if (qualifiesAsNearTerm) {
    return "near_term";
  }

  /*
   * Medium-term work is usually valuable but requires more integration,
   * process change, risk management or implementation effort.
   */
  if (
    score >= 50 ||
    impact >= 60 ||
    hasDependencies(opportunity) ||
    hasMeaningfulRisk(opportunity)
  ) {
    return "medium_term";
  }

  return "strategic";
}

function phaseName(id: RoadmapBucket): string {
  switch (id) {
    case "quick_wins":
      return "Quick Wins";
    case "near_term":
      return "Near Term";
    case "medium_term":
      return "Medium Term";
    default:
      return "Strategic";
  }
}

function phaseObjective(id: RoadmapBucket): string {
  switch (id) {
    case "quick_wins":
      return "Deliver high-value, low-risk automations that demonstrate measurable value quickly.";

    case "near_term":
      return "Implement strong automation candidates that require modest integration, validation, or process preparation.";

    case "medium_term":
      return "Address broader workflows that require deeper integration, testing, decision design, or process change.";

    default:
      return "Plan larger, lower-readiness, higher-risk, or transformation-level opportunities once the foundations are established.";
  }
}

function phaseDependencies(
  opportunities: AutomationOpportunity[]
): string[] {
  return [
    ...new Set(
      opportunities.flatMap(
        (opportunity) => opportunity.dependencies
      )
    ),
  ];
}

function sortOpportunities(
  opportunities: AutomationOpportunity[]
): AutomationOpportunity[] {
  return [...opportunities].sort((a, b) => {
    const scoreDifference =
      b.automationScore - a.automationScore;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const impactDifference =
      b.impactScore - a.impactScore;

    if (impactDifference !== 0) {
      return impactDifference;
    }

    return effectiveDays(a) - effectiveDays(b);
  });
}

export function buildAutomationRoadmap(
  opportunities: AutomationOpportunity[],
  options: RoadmapPlanningOptions = {}
): RoadmapPhase[] {
  const resolved: Required<RoadmapPlanningOptions> = {
    quickWinMaxDays:
      options.quickWinMaxDays ?? 5,

    nearTermMaxDays:
      options.nearTermMaxDays ?? 15,
  };

  const grouped = new Map<
    RoadmapBucket,
    AutomationOpportunity[]
  >(
    PHASE_IDS.map((id) => [id, []])
  );

  for (const opportunity of opportunities) {
    const phase = phaseForOpportunity(
      opportunity,
      resolved
    );

    grouped.get(phase)?.push(opportunity);
  }

  const phases: RoadmapPhase[] = [];

  for (const phaseId of PHASE_IDS) {
    const items = sortOpportunities(
      grouped.get(phaseId) ?? []
    );

    if (items.length === 0) {
      continue;
    }

    const estimatedDays = items.reduce(
      (total, opportunity) =>
        total + effectiveDays(opportunity),
      0
    );

    phases.push({
      id: `roadmap_${phaseId}`,
      name: phaseName(phaseId),
      objective: phaseObjective(phaseId),
      opportunityIds: items.map(
        (opportunity) => opportunity.id
      ),
      estimatedDays,
      dependencies:
        phaseDependencies(items),
    });
  }

  return phases;
}

export function getRoadmapSummary(
  phases: RoadmapPhase[]
) {
  return {
    phaseCount: phases.length,

    opportunityCount: phases.reduce(
      (total, phase) =>
        total + phase.opportunityIds.length,
      0
    ),

    estimatedDays: phases.reduce(
      (total, phase) =>
        total + phase.estimatedDays,
      0
    ),

    quickWins:
      phases.find(
        (phase) =>
          phase.id === "roadmap_quick_wins"
      )?.opportunityIds.length ?? 0,

    nearTerm:
      phases.find(
        (phase) =>
          phase.id === "roadmap_near_term"
      )?.opportunityIds.length ?? 0,

    mediumTerm:
      phases.find(
        (phase) =>
          phase.id === "roadmap_medium_term"
      )?.opportunityIds.length ?? 0,

    strategic:
      phases.find(
        (phase) =>
          phase.id === "roadmap_strategic"
      )?.opportunityIds.length ?? 0,
  };
}
