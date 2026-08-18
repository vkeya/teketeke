export type AutomationAssessmentStatus =
  | "draft"
  | "invited"
  | "in_progress"
  | "analysis_ready"
  | "report_ready"
  | "presented"
  | "approved"
  | "implementation"
  | "completed"
  | "archived";

export type DiscoveryQuestionType =
  | "text"
  | "long_text"
  | "number"
  | "single_choice"
  | "multi_choice"
  | "yes_no";

export type DiscoveryAnswer = {
  questionId: string;
  question: string;
  answer: string | number | boolean | string[];
  answeredAt: string;
};

export type PersonRole = {
  role: string;
  team?: string;
  headcount?: number;
  responsibilities: string[];
};

export type SystemProfile = {
  name: string;
  category:
    | "communication"
    | "crm"
    | "erp"
    | "finance"
    | "hr"
    | "operations"
    | "productivity"
    | "database"
    | "custom"
    | "other";
  purpose?: string;
  integrationAvailable?: boolean;
};

export type ProcessStep = {
  id: string;
  order: number;
  name: string;
  description: string;
  owner?: string;
  system?: string;
  frequency?: string;
  estimatedMinutes?: number;
  manual: boolean;
  requiresDecision: boolean;
  input?: string;
  output?: string;
  exceptionNotes?: string;
};

export type ProcessMap = {
  id: string;
  name: string;
  objective: string;
  trigger?: string;
  owner?: string;
  frequency?: string;
  steps: ProcessStep[];
  systems: string[];
  painPoints: string[];
  estimatedWeeklyHours?: number;
};

export type AutomationOpportunityPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type AutomationOpportunity = {
  id: string;
  processId: string;
  title: string;
  currentState: string;
  proposedAutomation: string;
  rationale: string;
  priority: AutomationOpportunityPriority;

  impactScore: number;
  feasibilityScore: number;
  riskScore: number;
  automationScore: number;

  estimatedWeeklyHoursSaved?: number;
  estimatedAnnualValue?: number;
  estimatedImplementationDays?: number;
  estimatedImplementationCost?: number;

  systemsInvolved: string[];
  humanDecisionPoints: string[];
  dependencies: string[];
  risks: string[];
  assumptions: string[];
};

export type RoadmapPhase = {
  id: string;
  name: string;
  objective: string;
  opportunityIds: string[];
  estimatedDays: number;
  dependencies: string[];
};

export type AutomationBusinessCase = {
  currentAnnualHours?: number;
  estimatedAnnualHoursSaved?: number;
  estimatedAnnualValue?: number;
  estimatedImplementationCost?: number;
  estimatedPaybackMonths?: number;
  estimatedYearOneRoiPct?: number;
  assumptions: string[];
};

export type AutomationBusinessCaseInputs = {
  hourlyValue?: number;
  implementationCost?: number;
  implementationDays?: number;
  implementationRatePerDay?: number;
};

export type ImplementationTask = {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "blocked" | "completed";
  owner?: string;
  dueDate?: string;
  dependencyIds?: string[];
};

export type AutomationImplementation = {
  projectId: string;
  status:
    | "not_started"
    | "planning"
    | "building"
    | "testing"
    | "user_acceptance"
    | "live"
    | "paused"
    | "completed";
  startDate?: string;
  targetDate?: string;
  tasks: ImplementationTask[];
};

export type AutomationMeasurement = {
  baseline?: {
    weeklyHours: number;
    manualSteps?: number;
    errorRatePct?: number;
  };
  current?: {
    weeklyHours: number;
    manualSteps?: number;
    errorRatePct?: number;
  };
  hoursReductionPct?: number;
  errorReductionPct?: number;
  measuredAt?: string;
  notes?: string[];
};

export type DiscoveryActivityDetail = {
  activityId: string;
  customLabel?: string;
  frequencyId?: string;
  effortId?: string;
  systemIds?: string[];
  customSystem?: string;
  painPointIds?: string[];
  customPainPoint?: string;
};

export type AutomationDiscoveryProfile = {
  industryId?: string;
  countryId?: string;
  roleId?: string;
  companySizeId?: string;
  activityIds: string[];
  customActivities: string[];
  activityDetails: DiscoveryActivityDetail[];
};

export type AutomationAssessment = {
  id: string;
  publicToken: string;
  createdAt: string;
  updatedAt: string;

  status: AutomationAssessmentStatus;

  organization: {
    name: string;
    industry?: string;
    location?: string;
    department?: string;
    objective?: string;
  };

  decisionMaker: {
    name: string;
    role: string;
    email: string;
  };

  discovery: {
    answers: DiscoveryAnswer[];
    people: PersonRole[];
    systems: SystemProfile[];
    painPoints: string[];
    processMaps: ProcessMap[];
    profile?: AutomationDiscoveryProfile;
  };

  automation: {
    opportunities: AutomationOpportunity[];
    roadmap: RoadmapPhase[];
    businessCase?: AutomationBusinessCase;
  };

  businessCaseInputs?: AutomationBusinessCaseInputs;

  decision?: {
    outcome: "pending" | "approved" | "declined" | "needs_revision";
    selectedOpportunityIds: string[];
    decidedAt?: string;
    notes?: string;
  };

  implementation?: AutomationImplementation;

  measurement?: AutomationMeasurement;

  communication?: {
    status?: "not_sent" | "sent" | "delivery_failed";
    invitationSentAt?: string;
    reportGeneratedAt?: string;
    reportSentAt?: string;
    lastCommunicationAt?: string;
  };
};

export function createEmptyAutomationAssessment(
  input: Pick<
    AutomationAssessment,
    "id" | "publicToken" | "organization" | "decisionMaker"
  >
): AutomationAssessment {
  const now = new Date().toISOString();

  return {
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
      profile: {
        activityIds: [],
        customActivities: [],
        activityDetails: [],
      },
    },
    automation: {
      opportunities: [],
      roadmap: [],
    },
  };
}