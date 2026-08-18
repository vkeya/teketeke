import type {
  AutomationAssessment,
  AutomationOpportunity,
} from "./AutomationAssessment";

export type AutomationDecision = {
  outcome:
    | "pending"
    | "approved"
    | "declined"
    | "needs_revision";
  selectedOpportunityIds: string[];
  rationale: string;
  decidedAt?: string;
  notes?: string;
};

export type DecisionRecommendation = {
  recommendation:
    | "approve"
    | "review"
    | "defer";
  opportunityIds: string[];
  rationale: string;
};

export function recommendAutomationDecision(
  opportunities: AutomationOpportunity[]
): DecisionRecommendation {
  const highValue = opportunities.filter(
    (opportunity) =>
      (opportunity.priority === "critical" ||
        opportunity.priority === "high") &&
      opportunity.automationScore >= 70
  );

  if (highValue.length === 0) {
    return {
      recommendation: "review",
      opportunityIds: [],
      rationale:
        "No opportunity currently meets the threshold for an automatic implementation recommendation. Review the discovery findings and validate the process assumptions.",
    };
  }

  return {
    recommendation: "approve",
    opportunityIds: highValue.map(
      (opportunity) => opportunity.id
    ),
    rationale:
      "These opportunities combine strong automation potential with high business priority. They should be reviewed with the decision maker as candidates for the first implementation phase.",
  };
}

export function applyAutomationDecision(
  assessment: AutomationAssessment,
  decision: AutomationDecision
): AutomationAssessment {
  return {
    ...assessment,
    updatedAt: new Date().toISOString(),
    status:
      decision.outcome === "approved"
        ? "approved"
        : assessment.status,
    decision: {
      outcome: decision.outcome,
      selectedOpportunityIds:
        decision.selectedOpportunityIds,
      decidedAt:
        decision.decidedAt ??
        new Date().toISOString(),
      notes: decision.notes,
    },
  };
}