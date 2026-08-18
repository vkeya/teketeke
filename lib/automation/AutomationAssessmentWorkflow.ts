import type {
  AutomationAssessment,
  AutomationAssessmentStatus,
  DiscoveryAnswer,
} from "./AutomationAssessment";
import { buildDiscoveryProfile } from "./AutomationDiscoveryEngine";
import type { AutomationAssessmentRepository } from "./AutomationAssessmentRepository";
import { runAutomationAssessment } from "./AutomationAssessmentEngine";

export type WorkflowResult = {
  assessment: AutomationAssessment;
  complete: boolean;
  analysis?: ReturnType<typeof runAutomationAssessment>;
};

function nextStatus(
  complete: boolean
): AutomationAssessmentStatus {
  return complete ? "analysis_ready" : "in_progress";
}

export async function submitDiscoveryAnswer(
  repository: AutomationAssessmentRepository,
  assessment: AutomationAssessment,
  answer: DiscoveryAnswer
): Promise<WorkflowResult | null> {
  const updated =
    await repository.addAnswer(
      assessment.id,
      answer
    );

  if (!updated) {
    return null;
  }

  const profile = buildDiscoveryProfile(
    updated.discovery.answers
  );

  const discoveryUpdated: AutomationAssessment = {
    ...updated,
    updatedAt: new Date().toISOString(),
    status: updated.status,
    discovery: {
      ...updated.discovery,
      people: profile.people,
      systems: profile.systems,
      painPoints: profile.painPoints,
      processMaps: profile.processMaps,
    },
  };

  await repository.update(
    updated.id,
    discoveryUpdated
  );

  return {
    assessment: discoveryUpdated,
    complete: false,
  };
}

export async function completeDiscoveryAndAnalyze(
  repository: AutomationAssessmentRepository,
  assessment: AutomationAssessment
): Promise<WorkflowResult> {
  const result =
    runAutomationAssessment(assessment);

  const updated: AutomationAssessment = {
    ...result.assessment,
    status: "analysis_ready",
    updatedAt: new Date().toISOString(),
  };

  await repository.update(
    assessment.id,
    updated
  );

  return {
    assessment: updated,
    complete: true,
    analysis: result,
  };
}

export async function updateAssessmentStatus(
  repository: AutomationAssessmentRepository,
  assessmentId: string,
  status: AutomationAssessmentStatus
): Promise<AutomationAssessment | null> {
  return repository.setStatus(
    assessmentId,
    status
  );
}