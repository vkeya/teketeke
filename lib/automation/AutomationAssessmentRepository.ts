import type {
  AssessmentCreateInput,
  AssessmentStore,
} from "./AutomationAssessmentStore";
import type {
  AutomationAssessment,
  AutomationAssessmentStatus,
  DiscoveryAnswer,
} from "./AutomationAssessment";

/**
 * Persistence boundary for automation assessments.
 */
export interface AutomationAssessmentRepository {
  create(input: AssessmentCreateInput): Promise<AutomationAssessment>;
  get(id: string): Promise<AutomationAssessment | null>;
  getByPublicToken(
    token: string
  ): Promise<AutomationAssessment | null>;
  update(
    id: string,
    patch: Partial<AutomationAssessment>
  ): Promise<AutomationAssessment | null>;
  claimCommunicationDelivery(
    id: string
  ): Promise<AutomationAssessment | null>;
  releaseCommunicationDelivery(
    id: string
  ): Promise<void>;
  addAnswer(
    id: string,
    answer: DiscoveryAnswer
  ): Promise<AutomationAssessment | null>;
  setStatus(
    id: string,
    status: AutomationAssessmentStatus
  ): Promise<AutomationAssessment | null>;
}

/**
 * Adapter that exposes the current development store through the
 * asynchronous repository contract used by the API.
 *
 * The claim/release operations are intentionally part of the repository
 * boundary so a future durable implementation can replace the in-memory
 * claim with an atomic database transaction without changing API routes.
 */
export function createRepositoryFromStore(
  store: AssessmentStore
): AutomationAssessmentRepository {
  return {
    async create(input) {
      return store.create(input);
    },

    async get(id) {
      return store.get(id);
    },

    async getByPublicToken(token) {
      return store.getByPublicToken(token);
    },

    async update(id, patch) {
      return store.update(id, patch);
    },

    async claimCommunicationDelivery(id) {
      return store.claimCommunicationDelivery(id);
    },

    async releaseCommunicationDelivery(id) {
      store.releaseCommunicationDelivery(id);
    },

    async addAnswer(id, answer) {
      return store.addAnswer(id, answer);
    },

    async setStatus(id, status) {
      return store.setStatus(id, status);
    },
  };
}