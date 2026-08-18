import type {
  AutomationAssessment,
  AutomationOpportunity,
  AutomationBusinessCase,
  ProcessMap,
  RoadmapPhase,
} from "./AutomationAssessment";

export type AutomationReport = {
  title: string;
  executiveSummary: string;

  currentState: {
    peopleCount: number;
    systemCount: number;
    processCount: number;
    painPoints: string[];
  };

  keyFindings: string[];

  opportunities: Array<{
    id: string;
    title: string;
    priority: AutomationOpportunity["priority"];
    automationScore: number;
    impactScore: number;
    feasibilityScore: number;
    riskScore: number;
    estimatedWeeklyHoursSaved?: number;
    estimatedAnnualValue?: number;
    estimatedImplementationDays?: number;
    systemsInvolved: string[];
    humanDecisionPoints: string[];
    proposedAutomation: string;
    rationale: string;
  }>;

  roadmap: RoadmapPhase[];

  businessCase?: AutomationBusinessCase;

  recommendedNextSteps: string[];
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function unique(values: string[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

function buildBusinessContext(
  assessment: AutomationAssessment
): string {
  const organization = assessment.organization.name;

  const industry = assessment.organization.industry
    ? ` in ${assessment.organization.industry}`
    : "";

  const department = assessment.organization.department
    ? ` within ${assessment.organization.department}`
    : "";

  return `${organization}${industry}${department}`;
}

function buildExecutiveSummary(
  assessment: AutomationAssessment,
  processMaps: ProcessMap[],
  opportunities: AutomationOpportunity[],
  roadmap: RoadmapPhase[],
  businessCase?: AutomationBusinessCase
): string {
  const organization = buildBusinessContext(
    assessment
  );

  if (opportunities.length === 0) {
    return `${organization}: Teketeke has not identified a sufficiently strong automation opportunity from the information currently available. Additional process discovery is recommended before making an automation recommendation.`;
  }

  const hours =
    businessCase?.estimatedAnnualHoursSaved ?? 0;

  const quickWins =
    roadmap.find(
      (phase) =>
        phase.id === "roadmap_quick_wins"
    )?.opportunityIds.length ?? 0;

  const highPriority = opportunities.filter(
    (opportunity) =>
      opportunity.priority === "critical" ||
      opportunity.priority === "high"
  ).length;

  const manualSteps = processMaps.reduce(
    (total, process) =>
      total +
      process.steps.filter(
        (step) => step.manual
      ).length,
    0
  );

  const valueStatement =
    hours > 0
      ? ` The current discovery indicates approximately ${formatNumber(
          hours
        )} hours/year of potential capacity recovery.`
      : "";

  return `${organization}: Teketeke identified ${opportunities.length} automation ${
    opportunities.length === 1
      ? "opportunity"
      : "opportunities"
  } across ${processMaps.length} mapped process${
    processMaps.length === 1 ? "" : "es"
  }. ${highPriority} ${
    highPriority === 1
      ? "opportunity is"
      : "opportunities are"
  } currently high priority, including ${quickWins} quick win${
    quickWins === 1 ? "" : "s"
  }. ${manualSteps} manual process step${
    manualSteps === 1 ? "" : "s"
  } were identified.${valueStatement}`;
}

function buildKeyFindings(
  processMaps: ProcessMap[],
  opportunities: AutomationOpportunity[],
  roadmap: RoadmapPhase[]
): string[] {
  const findings: string[] = [];

  const manualSteps = processMaps.reduce(
    (total, process) =>
      total +
      process.steps.filter(
        (step) => step.manual
      ).length,
    0
  );

  const decisionSteps = processMaps.reduce(
    (total, process) =>
      total +
      process.steps.filter(
        (step) => step.requiresDecision
      ).length,
    0
  );

  const systems = unique(
    processMaps.flatMap(
      (process) => process.systems
    )
  );

  const painPoints = unique(
    processMaps.flatMap(
      (process) => process.painPoints
    )
  );

  if (manualSteps > 0) {
    findings.push(
      `${manualSteps} manual process ${
        manualSteps === 1 ? "step" : "steps"
      } are currently part of the mapped workflows.`
    );
  }

  if (painPoints.length > 0) {
    findings.push(
      `${painPoints.length} operational ${
        painPoints.length === 1
          ? "friction point"
          : "friction points"
      } were identified during discovery.`
    );
  }

  if (systems.length > 1) {
    findings.push(
      `${systems.length} systems are involved across the mapped processes, creating potential integration opportunities.`
    );
  } else if (systems.length === 1) {
    findings.push(
      `The mapped workflows currently rely on ${systems[0]}, making system-level workflow automation a potential starting point.`
    );
  }

  if (decisionSteps > 0) {
    findings.push(
      `${decisionSteps} process ${
        decisionSteps === 1 ? "step retains" : "steps retain"
      } human judgment and should be approached as assisted automation rather than full automation.`
    );
  }

  const highestImpact = [...opportunities].sort(
    (a, b) =>
      b.impactScore - a.impactScore
  )[0];

  if (highestImpact) {
    findings.push(
      `The strongest impact signal is "${highestImpact.title}" with an impact score of ${highestImpact.impactScore}/100.`
    );
  }

  const easiest = [...opportunities].sort(
    (a, b) =>
      b.feasibilityScore - a.feasibilityScore
  )[0];

  if (
    easiest &&
    easiest.id !== highestImpact?.id
  ) {
    findings.push(
      `"${easiest.title}" currently has the strongest feasibility signal at ${easiest.feasibilityScore}/100.`
    );
  }

  const quickWins =
    roadmap.find(
      (phase) =>
        phase.id === "roadmap_quick_wins"
    )?.opportunityIds.length ?? 0;

  if (quickWins > 0) {
    findings.push(
      `${quickWins} ${
        quickWins === 1
          ? "opportunity qualifies"
          : "opportunities qualify"
      } as an initial quick-win candidate based on value, feasibility, risk and implementation effort.`
    );
  }

  return findings.slice(0, 7);
}

function buildRecommendedNextSteps(
  opportunities: AutomationOpportunity[],
  roadmap: RoadmapPhase[],
  businessCase?: AutomationBusinessCase
): string[] {
  if (opportunities.length === 0) {
    return [
      "Complete additional process discovery.",
      "Document the highest-volume repetitive workflows.",
      "Identify the systems, inputs and outputs involved.",
      "Capture the main operational pain points and exceptions.",
    ];
  }

  const steps: string[] = [];

  const quickWinPhase =
    roadmap.find(
      (phase) =>
        phase.id === "roadmap_quick_wins"
    );

  if (quickWinPhase) {
    steps.push(
      `Validate the ${quickWinPhase.opportunityIds.length} quick-win opportunity${
        quickWinPhase.opportunityIds.length === 1
          ? ""
          : "ies"
      } with the process owner.`
    );
  } else {
    steps.push(
      "Validate the highest-priority opportunity with the process owner."
    );
  }

  steps.push(
    "Confirm the current process baseline, expected outcome and success measure."
  );

  steps.push(
    "Validate system access, integration requirements and exception handling."
  );

  if (
    businessCase?.estimatedAnnualValue ===
      undefined ||
    businessCase?.estimatedImplementationCost ===
      undefined
  ) {
    steps.push(
      "Complete the business-case assumptions before committing implementation budget."
    );
  } else {
    steps.push(
      "Review the estimated value, implementation cost and payback with the decision maker."
    );
  }

  steps.push(
    "Select the first automation, assign an owner and define a target implementation date."
  );

  return steps;
}

export function buildAutomationReport(
  assessment: AutomationAssessment,
  options?: {
    opportunities?: AutomationOpportunity[];
    businessCase?: AutomationBusinessCase;
    roadmap?: RoadmapPhase[];
  }
): AutomationReport {
  const opportunities =
    options?.opportunities ??
    assessment.automation.opportunities;

  const roadmap =
    options?.roadmap ??
    assessment.automation.roadmap;

  const businessCase =
    options?.businessCase ??
    assessment.automation.businessCase;

  const processMaps =
    assessment.discovery.processMaps;

  return {
    title: `Automation Intelligence — ${assessment.organization.name}`,

    executiveSummary:
      buildExecutiveSummary(
        assessment,
        processMaps,
        opportunities,
        roadmap,
        businessCase
      ),

    currentState: {
      peopleCount:
        assessment.discovery.people.length,

      systemCount:
        assessment.discovery.systems.length,

      processCount:
        processMaps.length,

      painPoints:
        unique(
          assessment.discovery.painPoints
        ),
    },

    keyFindings:
      buildKeyFindings(
        processMaps,
        opportunities,
        roadmap
      ),

    opportunities: opportunities.map(
      (opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        priority: opportunity.priority,
        automationScore:
          opportunity.automationScore,
        impactScore:
          opportunity.impactScore,
        feasibilityScore:
          opportunity.feasibilityScore,
        riskScore:
          opportunity.riskScore,

        estimatedWeeklyHoursSaved:
          opportunity.estimatedWeeklyHoursSaved,

        estimatedAnnualValue:
          opportunity.estimatedAnnualValue,

        estimatedImplementationDays:
          opportunity.estimatedImplementationDays,

        systemsInvolved:
          opportunity.systemsInvolved,

        humanDecisionPoints:
          opportunity.humanDecisionPoints,

        proposedAutomation:
          opportunity.proposedAutomation,

        rationale:
          opportunity.rationale,
      })
    ),

    roadmap,

    businessCase,

    recommendedNextSteps:
      buildRecommendedNextSteps(
        opportunities,
        roadmap,
        businessCase
      ),
  };
}
