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

function buildExecutiveSummary(
  assessment: AutomationAssessment,
  opportunities: AutomationOpportunity[],
  businessCase?: AutomationBusinessCase
): string {
  const organization = assessment.organization.name;
  const opportunityCount = opportunities.length;
  const hours = businessCase?.estimatedAnnualHoursSaved ?? 0;

  if (opportunityCount === 0) {
    return `${organization}: no automation opportunities identified yet.`;
  }

  return `${organization}: ${opportunityCount} automation ${
    opportunityCount === 1 ? "opportunity" : "opportunities"
  } identified${hours > 0 ? `, with an estimated ${formatNumber(hours)} hours/year recoverable` : ""}.`;
}

function buildKeyFindings(
  processMaps: ProcessMap[],
  opportunities: AutomationOpportunity[]
): string[] {
  const findings: string[] = [];

  const manualSteps = processMaps.reduce(
    (total, process) =>
      total + process.steps.filter((step) => step.manual).length,
    0
  );

  const decisionSteps = processMaps.reduce(
    (total, process) =>
      total +
      process.steps.filter((step) => step.requiresDecision).length,
    0
  );

  if (manualSteps > 0) {
    findings.push(`${manualSteps} manual step${manualSteps === 1 ? "" : "s"} identified.`);
  }

  if (decisionSteps > 0) {
    findings.push(
      `${decisionSteps} step${decisionSteps === 1 ? "" : "s"} retain human judgment.`
    );
  }

  const highPriority = opportunities.filter(
    (opportunity) =>
      opportunity.priority === "critical" ||
      opportunity.priority === "high"
  ).length;

  if (highPriority > 0) {
    findings.push(
      `${highPriority} high-priority opportunity${
        highPriority === 1 ? "" : "ies"
      } for the initial roadmap.`
    );
  }

  return findings;
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
    options?.opportunities ?? assessment.automation.opportunities;

  const roadmap = options?.roadmap ?? assessment.automation.roadmap;

  const businessCase =
    options?.businessCase ?? assessment.automation.businessCase;

  return {
    title: `Automation Assessment — ${assessment.organization.name}`,
    executiveSummary: buildExecutiveSummary(
      assessment,
      opportunities,
      businessCase
    ),
    currentState: {
      peopleCount: assessment.discovery.people.length,
      systemCount: assessment.discovery.systems.length,
      processCount: assessment.discovery.processMaps.length,
      painPoints: assessment.discovery.painPoints,
    },
    keyFindings: buildKeyFindings(
      assessment.discovery.processMaps,
      opportunities
    ),
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      priority: opportunity.priority,
      automationScore: opportunity.automationScore,
      impactScore: opportunity.impactScore,
      feasibilityScore: opportunity.feasibilityScore,
      riskScore: opportunity.riskScore,
      estimatedWeeklyHoursSaved:
        opportunity.estimatedWeeklyHoursSaved,
      estimatedAnnualValue: opportunity.estimatedAnnualValue,
      estimatedImplementationDays:
        opportunity.estimatedImplementationDays,
      systemsInvolved: opportunity.systemsInvolved,
      humanDecisionPoints: opportunity.humanDecisionPoints,
      proposedAutomation: opportunity.proposedAutomation,
    })),
    roadmap,
    businessCase,
    recommendedNextSteps:
      opportunities.length > 0
        ? [
            "Review the highest-priority opportunities.",
            "Validate savings, effort, and implementation cost.",
            "Select the first opportunities to implement.",
            "Assign owners and target dates.",
          ]
        : [
            "Complete additional process discovery.",
            "Document the highest-volume repetitive workflows.",
            "Identify systems and integration points.",
          ],
  };
}