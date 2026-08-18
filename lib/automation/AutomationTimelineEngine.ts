import type {
  AutomationOpportunity,
  RoadmapPhase,
} from "./AutomationAssessment";

export type AutomationTimeline = {
  estimatedWorkingDays: number;
  estimatedWeeks: number;
  startToFirstValueDays: number;
  phases: Array<{
    phaseId: string;
    name: string;
    startDay: number;
    endDay: number;
    estimatedDays: number;
    opportunityIds: string[];
  }>;
  assumptions: string[];
};

export type TimelineOptions = {
  workingDaysPerWeek?: number;
  parallelPhaseLimit?: number;
  startBufferDays?: number;
};

export function buildAutomationTimeline(
  roadmap: RoadmapPhase[],
  opportunities: AutomationOpportunity[],
  options: TimelineOptions = {}
): AutomationTimeline {
  const workingDaysPerWeek =
    options.workingDaysPerWeek ?? 5;
  const parallelPhaseLimit =
    Math.max(1, options.parallelPhaseLimit ?? 1);
  const startBufferDays =
    Math.max(0, options.startBufferDays ?? 0);

  const opportunityMap = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      opportunity,
    ])
  );

  let currentDay = startBufferDays;
  const phases: AutomationTimeline["phases"] = [];

  for (
    let index = 0;
    index < roadmap.length;
    index += parallelPhaseLimit
  ) {
    const batch = roadmap.slice(
      index,
      index + parallelPhaseLimit
    );

    const estimatedDays = Math.max(
      ...batch.map((phase) =>
        Math.max(1, phase.estimatedDays)
      )
    );

    const startDay = currentDay + 1;
    const endDay = currentDay + estimatedDays;

    for (const phase of batch) {
      phases.push({
        phaseId: phase.id,
        name: phase.name,
        startDay,
        endDay,
        estimatedDays: Math.max(1, phase.estimatedDays),
        opportunityIds: phase.opportunityIds.filter(
          (id) => opportunityMap.has(id)
        ),
      });
    }

    currentDay = endDay;
  }

  const estimatedWorkingDays = Math.max(
    0,
    currentDay - startBufferDays
  );

  const estimatedWeeks =
    estimatedWorkingDays / workingDaysPerWeek;

  const firstValuePhase =
    phases.find(
      (phase) => phase.opportunityIds.length > 0
    );

  return {
    estimatedWorkingDays,
    estimatedWeeks,
    startToFirstValueDays:
      firstValuePhase?.endDay ?? estimatedWorkingDays,
    phases,
    assumptions: [
      `${workingDaysPerWeek} working days are assumed per week.`,
      `${parallelPhaseLimit} roadmap phase${parallelPhaseLimit === 1 ? "" : "s"} can be worked on in parallel.`,
      "Timeline estimates depend on access to required systems, data, approvals, and technical resources.",
      "Complex integrations and external dependencies may extend the timeline.",
    ],
  };
}