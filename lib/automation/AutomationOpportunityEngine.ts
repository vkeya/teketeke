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

type StepScores = {
  impact: number;
  feasibility: number;
  risk: number;
  score: number;
  implementationDays: number;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scorePriority(
  automationScore: number
): AutomationOpportunityPriority {
  if (automationScore >= 85) return "critical";
  if (automationScore >= 70) return "high";
  if (automationScore >= 50) return "medium";
  return "low";
}

function frequencyMultiplier(frequency?: string): number {
  if (!frequency) return 1;

  const value = frequency
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  // Explicit numeric frequencies.
  const numeric = value.match(
    /(\d+(?:\.\d+)?)\s*(?:times|x)\s*(?:per|a)\s*(day|week|month)/
  );

  if (numeric) {
    const count = Number(numeric[1]);
    const unit = numeric[2];

    if (unit === "day") return count * 5;
    if (unit === "week") return count;
    if (unit === "month") return count / 4.33;
  }

  if (
    value.includes("twice") &&
    (value.includes("day") || value.includes("daily"))
  ) {
    return 10;
  }

  if (
    value.includes("twice") &&
    value.includes("week")
  ) {
    return 2;
  }

  if (
    value.includes("several times a day") ||
    value.includes("several times daily")
  ) {
    return 10;
  }

  if (
    value.includes("daily") ||
    value.includes("every day")
  ) {
    return 5;
  }

  if (
    value.includes("several times a week") ||
    value.includes("multiple times a week")
  ) {
    return 3;
  }

  if (
    value.includes("weekly") ||
    value.includes("every week")
  ) {
    return 1;
  }

  if (
    value.includes("monthly") ||
    value.includes("every month")
  ) {
    return 0.25;
  }

  if (
    value.includes("occasionally") ||
    value.includes("less often") ||
    value.includes("rarely")
  ) {
    return 0.125;
  }

  return 1;
}

function estimateWeeklyHours(
  process: ProcessMap,
  step: ProcessStep
): number | undefined {
  if (!step.estimatedMinutes || !process.frequency) {
    return process.estimatedWeeklyHours;
  }

  const weeklyOccurrences = frequencyMultiplier(process.frequency);

  const rawHours =
    (step.estimatedMinutes * weeklyOccurrences) / 60;

  const availableProcessHours =
    process.estimatedWeeklyHours ?? rawHours;

  const recoveredHours = Math.min(
    availableProcessHours,
    rawHours * 0.7
  );

  return Number(recoveredHours.toFixed(2));
}

function estimateImplementationDays(
  process: ProcessMap,
  step: ProcessStep,
  systemsCount: number
): number {
  let days = 2;

  if (step.requiresDecision) {
    days += 2;
  }

  if (step.estimatedMinutes !== undefined) {
    if (step.estimatedMinutes >= 120) {
      days += 3;
    } else if (step.estimatedMinutes >= 60) {
      days += 2;
    } else if (step.estimatedMinutes >= 30) {
      days += 1;
    }
  }

  if (systemsCount >= 2) {
    days += 2;
  }

  if (process.painPoints.length >= 2) {
    days += 1;
  }

  if (step.exceptionNotes?.trim()) {
    days += 2;
  }

  return days;
}

function scoreStep(
  process: ProcessMap,
  step: ProcessStep
): StepScores {
  let impact = 40;
  let feasibility = 50;
  let risk = 20;

  const systemsCount = new Set(
    [
      ...process.systems,
      ...(step.system ? [step.system] : []),
    ]
      .map((system) => system.trim().toLowerCase())
      .filter(Boolean)
  ).size;

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

  if (step.estimatedMinutes !== undefined) {
    if (step.estimatedMinutes >= 60) {
      impact += 20;
    } else if (step.estimatedMinutes >= 30) {
      impact += 15;
    } else if (step.estimatedMinutes >= 15) {
      impact += 10;
    }
  }

  const frequency = process.frequency ?? step.frequency;

  if (frequency) {
    const multiplier = frequencyMultiplier(frequency);

    if (multiplier >= 10) {
      impact += 20;
    } else if (multiplier >= 5) {
      impact += 15;
    } else if (multiplier >= 3) {
      impact += 10;
    } else if (multiplier >= 1) {
      impact += 5;
    }
  }

  // Pain points are currently captured at process level rather than
  // step level, so they provide a modest contextual signal rather
  // than pretending to prove that this exact step causes the pain.
  if (process.painPoints.length > 0) {
    impact += Math.min(
      10,
      process.painPoints.length * 5
    );
  }

  if (systemsCount === 0) {
    feasibility += 5;
  } else if (systemsCount === 1) {
    feasibility += 10;
  } else {
    feasibility -= Math.min(15, (systemsCount - 1) * 5);
    risk += Math.min(15, (systemsCount - 1) * 5);
  }

  if (step.exceptionNotes?.trim()) {
    feasibility -= 10;
    risk += 10;
  }

  if (step.input?.trim() && step.output?.trim()) {
    feasibility += 5;
  }

  impact = clamp(impact);
  feasibility = clamp(feasibility);
  risk = clamp(risk);

  const score = clamp(
    impact * 0.45 +
      feasibility * 0.35 +
      (100 - risk) * 0.2
  );

  return {
    impact,
    feasibility,
    risk,
    score,
    implementationDays: estimateImplementationDays(
      process,
      step,
      systemsCount
    ),
  };
}

function buildTitle(
  process: ProcessMap,
  step: ProcessStep
): string {
  return `Automate ${step.name} — ${process.name}`;
}

function buildRationale(
  process: ProcessMap,
  step: ProcessStep,
  scores: StepScores
): string {
  const reasons: string[] = [];

  if (step.manual) {
    reasons.push("the work is currently manual");
  }

  if (process.frequency) {
    reasons.push(
      `it occurs ${process.frequency.toLowerCase()}`
    );
  }

  if (step.estimatedMinutes !== undefined) {
    reasons.push(
      `each occurrence takes approximately ${step.estimatedMinutes} minutes`
    );
  }

  if (process.painPoints.length > 0) {
    reasons.push(
      `the wider process has ${process.painPoints.length} identified friction ${
        process.painPoints.length === 1
          ? "point"
          : "points"
      }`
    );
  }

  if (process.systems.length > 1) {
    reasons.push(
      `the process spans ${process.systems.length} systems`
    );
  }

  if (step.exceptionNotes?.trim()) {
    reasons.push(
      "known exceptions require controlled handling"
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "the step is currently identified as repeatable manual work"
    );
  }

  if (step.requiresDecision) {
    return `This is better suited to assisted automation because ${reasons.join(
      ", "
    )}. Human judgment should remain at the decision point.`;
  }

  return `This is an automation candidate because ${reasons.join(
    ", "
  )}. The current opportunity score is ${scores.score}/100, based on expected impact, feasibility and risk.`;
}

function buildProposedAutomation(
  process: ProcessMap,
  step: ProcessStep
): string {
  if (step.requiresDecision) {
    return `Automate the repeatable preparation around "${step.name}" while retaining the human decision point.`;
  }

  if (process.systems.length > 1) {
    return `Connect the systems involved in "${process.name}" and automate the repeatable workflow triggered by "${step.name}".`;
  }

  return `Automate "${step.name}" using a workflow triggered by the process input.`;
}

function buildDependencies(
  process: ProcessMap,
  step: ProcessStep
): string[] {
  const dependencies: string[] = [];

  if (process.systems.length > 1) {
    dependencies.push(
      "Confirm integration access between the systems involved."
    );
  }

  if (step.requiresDecision) {
    dependencies.push(
      "Define the human approval or decision point."
    );
  }

  if (step.input?.trim()) {
    dependencies.push(
      `Define the automation input: ${step.input.trim()}.`
    );
  }

  if (step.output?.trim()) {
    dependencies.push(
      `Define the expected automation output: ${step.output.trim()}.`
    );
  }

  return dependencies;
}

function buildRisks(step: ProcessStep): string[] {
  const risks: string[] = [];

  if (step.requiresDecision) {
    risks.push(
      "Incorrect automation could bypass a required human decision."
    );
  }

  if (step.exceptionNotes?.trim()) {
    risks.push(
      "Known exceptions require explicit handling before full automation."
    );
  }

  return risks;
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

      const scores = scoreStep(process, step);
      const weeklyHoursSaved = estimateWeeklyHours(
        process,
        step
      );

      const opportunity: AutomationOpportunity = {
        id: `opportunity_${process.id}_${step.id}`,
        processId: process.id,
        title: buildTitle(process, step),
        currentState: step.description,
        proposedAutomation: buildProposedAutomation(
          process,
          step
        ),
        rationale: buildRationale(
          process,
          step,
          scores
        ),
        priority: scorePriority(scores.score),

        impactScore: scores.impact,
        feasibilityScore: scores.feasibility,
        riskScore: scores.risk,
        automationScore: scores.score,

        estimatedWeeklyHoursSaved:
          weeklyHoursSaved,

        estimatedImplementationDays:
          scores.implementationDays,

        systemsInvolved: [
          ...new Set(
            [
              ...process.systems,
              ...(step.system ? [step.system] : []),
            ].filter(Boolean)
          ),
        ],

        humanDecisionPoints:
          step.requiresDecision
            ? [step.name]
            : [],

        dependencies: buildDependencies(
          process,
          step
        ),

        risks: buildRisks(step),

        assumptions: [
          "The process step is performed consistently enough to define repeatable automation rules.",
          "Estimated time savings represent potential capacity recovery, not guaranteed financial savings.",
          "Implementation effort is an initial planning estimate and should be validated during solution design.",
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
      (a, b) =>
        b.automationScore - a.automationScore
    )
    .slice(0, limit);
}
