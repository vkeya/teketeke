import type {
  AutomationOpportunity,
  AutomationOpportunityPriority,
  ProcessMap,
  ProcessStep,
} from "./AutomationAssessment";

export type OpportunityCandidate = {
  processId: string;
  stepId: string;
  title: string;
  rationale: string;
  estimatedWeeklyHoursSaved?: number;
};

function scorePriority(
  automationScore: number
): AutomationOpportunityPriority {
  if (automationScore >= 85) return "critical";
  if (automationScore >= 70) return "high";
  if (automationScore >= 50) return "medium";
  return "low";
}

function scoreStep(step: ProcessStep): {
  impact: number;
  feasibility: number;
  risk: number;
  score: number;
} {
  let impact = 40;
  let feasibility = 50;
  let risk = 20;

  if (step.manual) {
    impact += 20;
    feasibility += 15;
  }

  if (!step.requiresDecision) {
    feasibility += 20;
    risk -= 5;
  } else {
    risk += 15;
  }

  if (step.estimatedMinutes && step.estimatedMinutes >= 15) {
    impact += 15;
  }

  if (step.frequency) {
    const frequency = step.frequency.toLowerCase();

    if (
      frequency.includes("daily") ||
      frequency.includes("several times")
    ) {
      impact += 15;
    } else if (frequency.includes("weekly")) {
      impact += 8;
    }
  }

  impact = Math.min(100, impact);
  feasibility = Math.min(100, feasibility);
  risk = Math.max(0, Math.min(100, risk));

  const score = Math.round(
    impact * 0.45 +
      feasibility * 0.35 +
      (100 - risk) * 0.2
  );

  return {
    impact,
    feasibility,
    risk,
    score,
  };
}

function buildTitle(
  process: ProcessMap,
  step: ProcessStep
): string {
  return `Automate ${step.name} — ${process.name}`;
}

function buildRationale(step: ProcessStep): string {
  if (step.requiresDecision) {
    return `The step is partly manual but still requires human judgment. Automate the repeatable preparation and hand off the decision to the responsible person.`;
  }

  return `The step is manual and does not require a human decision, making it a strong candidate for workflow automation.`;
}

export function discoverAutomationOpportunities(
  processes: ProcessMap[]
): AutomationOpportunity[] {
  const opportunities: AutomationOpportunity[] = [];

  for (const process of processes) {
    for (const step of process.steps) {
      if (!step.manual) {
        continue;
      }

      const scores = scoreStep(step);

      const opportunity: AutomationOpportunity = {
        id: `opportunity_${process.id}_${step.id}`,
        processId: process.id,
        title: buildTitle(process, step),
        currentState: step.description,
        proposedAutomation: step.requiresDecision
          ? `Automate the repeatable preparation around "${step.name}" and retain the human decision point.`
          : `Automate "${step.name}" using a workflow triggered by the process input.`,
        rationale: buildRationale(step),
        priority: scorePriority(scores.score),
        impactScore: scores.impact,
        feasibilityScore: scores.feasibility,
        riskScore: scores.risk,
        automationScore: scores.score,
        estimatedWeeklyHoursSaved:
          step.estimatedMinutes && process.frequency
            ? Math.round(
                (step.estimatedMinutes / 60) *
                  (process.estimatedWeeklyHours
                    ? Math.max(
                        1,
                        process.estimatedWeeklyHours /
                          Math.max(
                            step.estimatedMinutes / 60,
                            1
                          )
                      )
                    : 1) *
                  0.7
              )
            : undefined,
        systemsInvolved: step.system ? [step.system] : [],
        humanDecisionPoints: step.requiresDecision
          ? [step.name]
          : [],
        dependencies: [],
        risks: step.requiresDecision
          ? ["Incorrect automation could bypass a required human decision."]
          : [],
        assumptions: [
          "The process step is performed consistently enough to define repeatable automation rules.",
        ],
      };

      opportunities.push(opportunity);
    }
  }

  return opportunities.sort(
    (a, b) => b.automationScore - a.automationScore
  );
}

export function getTopAutomationOpportunities(
  opportunities: AutomationOpportunity[],
  limit = 10
): AutomationOpportunity[] {
  return [...opportunities]
    .sort(
      (a, b) => b.automationScore - a.automationScore
    )
    .slice(0, limit);
}