import type {
  AutomationOpportunity,
  RoadmapPhase,
} from "./AutomationAssessment";

export type RoadmapPlanningOptions = {
  quickWinMaxDays?: number;
  nearTermMaxDays?: number;
};

function phaseForOpportunity(
  opportunity: AutomationOpportunity,
  options: Required<RoadmapPlanningOptions>
): string {
  const days = opportunity.estimatedImplementationDays ?? 10;

  if (
    opportunity.priority === "critical" ||
    opportunity.priority === "high" &&
      days <= options.quickWinMaxDays
  ) {
    return "quick_wins";
  }

  if (days <= options.nearTermMaxDays) {
    return "near_term";
  }

  if (opportunity.priority === "low") {
    return "strategic";
  }

  return "medium_term";
}

function phaseName(id: string): string {
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

function phaseObjective(id: string): string {
  switch (id) {
    case "quick_wins":
      return "Deliver high-value, low-complexity automations that demonstrate immediate value.";
    case "near_term":
      return "Implement the next group of practical automations after the initial wins.";
    case "medium_term":
      return "Address broader workflows that require more integration, testing, or process change.";
    default:
      return "Plan larger or lower-priority transformations once the foundational automations are established.";
  }
}

export function buildAutomationRoadmap(
  opportunities: AutomationOpportunity[],
  options: RoadmapPlanningOptions = {}
): RoadmapPhase[] {
  const resolved: Required<RoadmapPlanningOptions> = {
    quickWinMaxDays: options.quickWinMaxDays ?? 5,
    nearTermMaxDays: options.nearTermMaxDays ?? 15,
  };

  const phaseIds = [
    "quick_wins",
    "near_term",
    "medium_term",
    "strategic",
  ];

  const grouped = new Map<string, AutomationOpportunity[]>(
    phaseIds.map((id) => [id, []])
  );

  for (const opportunity of opportunities) {
    const phase = phaseForOpportunity(opportunity, resolved);
    grouped.get(phase)?.push(opportunity);
  }

  const phases: RoadmapPhase[] = [];

  for (const phaseId of phaseIds) {
    const items = grouped.get(phaseId) ?? [];

    if (items.length === 0) {
      continue;
    }

    items.sort(
      (a, b) => b.automationScore - a.automationScore
    );

    const estimatedDays = items.reduce(
      (total, item) =>
        total + (item.estimatedImplementationDays ?? 10),
      0
    );

    const dependencies = [
      ...new Set(
        items.flatMap((item) => item.dependencies)
      ),
    ];

    phases.push({
      id: `roadmap_${phaseId}`,
      name: phaseName(phaseId),
      objective: phaseObjective(phaseId),
      opportunityIds: items.map((item) => item.id),
      estimatedDays,
      dependencies,
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
      (total, phase) => total + phase.estimatedDays,
      0
    ),
    quickWins:
      phases.find((phase) => phase.id === "roadmap_quick_wins")
        ?.opportunityIds.length ?? 0,
  };
}