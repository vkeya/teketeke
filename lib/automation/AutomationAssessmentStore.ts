import type {
  AutomationAssessment,
  AutomationAssessmentStatus,
  DiscoveryAnswer,
} from "./AutomationAssessment";

export type AssessmentCreateInput = Pick<
  AutomationAssessment,
  "id" | "publicToken" | "organization" | "decisionMaker"
>;

export type AssessmentStore = {
  create(input: AssessmentCreateInput): AutomationAssessment;
  get(id: string): AutomationAssessment | null;
  getByPublicToken(token: string): AutomationAssessment | null;
  update(
    id: string,
    patch: Partial<AutomationAssessment>
  ): AutomationAssessment | null;
  claimCommunicationDelivery(
    id: string
  ): AutomationAssessment | null;
  releaseCommunicationDelivery(
    id: string
  ): void;
  addAnswer(
    id: string,
    answer: DiscoveryAnswer
  ): AutomationAssessment | null;
  setStatus(
    id: string,
    status: AutomationAssessmentStatus
  ): AutomationAssessment | null;
};

export function createInMemoryAssessmentStore(): AssessmentStore {
  const assessments = new Map<string, AutomationAssessment>();
  const communicationDeliveryClaims = new Set<string>();

  return {
    create(input) {
      const now = new Date().toISOString();

      const assessment: AutomationAssessment = {
        ...input,
        createdAt: now,
        updatedAt: now,
        status: "draft",
        discovery: {
          answers: [],
          people: [],
          systems: [],
          painPoints: [],
          processMaps: [],
        },
        automation: {
          opportunities: [],
          roadmap: [],
        },
      };

      assessments.set(assessment.id, assessment);

      return assessment;
    },

    get(id) {
      return assessments.get(id) ?? null;
    },

    getByPublicToken(token) {
      for (const assessment of assessments.values()) {
        if (assessment.publicToken === token) {
          return assessment;
        }
      }

      return null;
    },

    update(id, patch) {
      const existing = assessments.get(id);

      if (!existing) {
        return null;
      }

      const updated: AutomationAssessment = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      assessments.set(id, updated);

      return updated;
    },

    claimCommunicationDelivery(id) {
      const existing = assessments.get(id);

      if (!existing) {
        return null;
      }

      if (
        existing.communication?.status === "sent" ||
        communicationDeliveryClaims.has(id)
      ) {
        return null;
      }

      communicationDeliveryClaims.add(id);

      return existing;
    },

    releaseCommunicationDelivery(id) {
      communicationDeliveryClaims.delete(id);
    },

    addAnswer(id, answer) {
      const existing = assessments.get(id);

      if (!existing) {
        return null;
      }

      const answers = [
        ...existing.discovery.answers.filter(
          (item) => item.questionId !== answer.questionId
        ),
        answer,
      ];

      const updated: AutomationAssessment = {
        ...existing,
        updatedAt: new Date().toISOString(),
        status:
          existing.status === "draft" || existing.status === "invited"
            ? "in_progress"
            : existing.status,
        discovery: {
          ...existing.discovery,
          answers,
        },
      };

      assessments.set(id, updated);

      return updated;
    },

    setStatus(id, status) {
      const existing = assessments.get(id);

      if (!existing) {
        return null;
      }

      const updated: AutomationAssessment = {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
      };

      assessments.set(id, updated);

      return updated;
    },
  };
}