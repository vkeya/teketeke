import {
  createInMemoryAssessmentStore,
  type AssessmentStore,
} from "./AutomationAssessmentStore";
import {
  createRepositoryFromStore,
  type AutomationAssessmentRepository,
} from "./AutomationAssessmentRepository";

declare global {
  // eslint-disable-next-line no-var
  var __teketekeAutomationAssessmentStore:
    | AssessmentStore
    | undefined;
}

function getDevelopmentStore(): AssessmentStore {
  if (!globalThis.__teketekeAutomationAssessmentStore) {
    globalThis.__teketekeAutomationAssessmentStore =
      createInMemoryAssessmentStore();
  }

  return globalThis.__teketekeAutomationAssessmentStore;
}

/**
 * Development repository provider.
 *
 * All automation API routes must obtain their repository from this
 * provider instead of creating a new in-memory store per request.
 *
 * This keeps the assessment lifecycle coherent while the platform is
 * still using the development store. It is not a replacement for durable
 * production persistence; that will be introduced behind the same
 * repository interface.
 */
export function getAutomationAssessmentRepository():
  AutomationAssessmentRepository {
  return createRepositoryFromStore(
    getDevelopmentStore()
  );
}