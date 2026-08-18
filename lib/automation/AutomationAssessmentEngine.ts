import type {
  AutomationAssessment,
  AutomationBusinessCase,
  AutomationOpportunity,
  ProcessMap,
  ProcessStep,
  DiscoveryActivityDetail,
} from "./AutomationAssessment";
import {
  findActivity,
  type DiscoveryOption,
  findOptionLabel,
  frequencyOptions,
  effortOptions,
  systemOptions,
  painPointOptions,
  roleOptions,
} from "./AutomationDiscoveryOptions";
import { discoverAutomationOpportunities } from "./AutomationOpportunityEngine";
import { buildAutomationRoadmap } from "./AutomationRoadmapEngine";
import { buildAutomationBusinessCase } from "./AutomationBusinessCaseEngine";
import { buildAutomationReport } from "./AutomationReportEngine";
import {
  buildAutomationTimeline,
  type AutomationTimeline,
} from "./AutomationTimelineEngine";
import { buildAssessmentCommunication } from "./AutomationCommunicationEngine";

export type AutomationAnalysisResult = {
  assessment: AutomationAssessment;
  opportunities: AutomationOpportunity[];
  roadmap: AutomationAssessment["automation"]["roadmap"];
  businessCase: AutomationBusinessCase;
  timeline: AutomationTimeline;
  report: ReturnType<typeof buildAutomationReport>;
  communication: ReturnType<typeof buildAssessmentCommunication>;
};

const effortMinutes: Record<string, number> = {
  under_15_minutes: 10,
  "15_30_minutes": 22,
  "30_60_minutes": 45,
  "1_2_hours": 90,
  over_2_hours: 150,
};

const weeklyOccurrences: Record<string, number> = {
  several_times_day: 10,
  daily: 5,
  several_times_week: 3,
  weekly: 1,
  monthly: 1 / 4,
  occasionally: 1 / 8,
};

const decisionHeavyActivities = new Set([
  "approval_workflows",
  "compliance_checks",
  "document_review",
  "audit_preparation",
  "payment_reconciliation",
  "purchase_requests",
  "purchase_orders",
  "leave_requests",
  "access_requests",
  "account_requests",
]);

function labelOrId(
  options: DiscoveryOption[],
  id: string
): string {
  return findOptionLabel(options, id) ?? id.replaceAll("_", " ");
}

function frequencyLabel(id?: string): string | undefined {
  return id
    ? labelOrId(frequencyOptions, id)
    : undefined;
}

function estimateMinutes(effortId?: string): number | undefined {
  if (!effortId) return undefined;
  return effortMinutes[effortId];
}

function estimateWeeklyHours(
  frequencyId?: string,
  effortId?: string
): number | undefined {
  const minutes = estimateMinutes(effortId);
  if (!minutes || !frequencyId) return undefined;

  const occurrences = weeklyOccurrences[frequencyId];
  if (!occurrences) return undefined;

  return Number(((minutes * occurrences) / 60).toFixed(2));
}

function buildSystems(
  detail?: DiscoveryActivityDetail
): string[] {
  if (!detail) return [];

  const systems = (detail.systemIds ?? []).map((id) =>
    labelOrId(systemOptions, id)
  );

  if (detail.customSystem?.trim()) {
    systems.push(detail.customSystem.trim());
  }

  return [...new Set(systems)];
}

function buildPainPoints(
  detail?: DiscoveryActivityDetail
): string[] {
  if (!detail) return [];

  const painPoints = (detail.painPointIds ?? []).map((id) =>
    labelOrId(painPointOptions, id)
  );

  if (detail.customPainPoint?.trim()) {
    painPoints.push(detail.customPainPoint.trim());
  }

  return [...new Set(painPoints)];
}

function buildProcessStep(
  activityId: string,
  activityName: string,
  detail?: DiscoveryActivityDetail,
  order = 1
): ProcessStep {
  const frequency = frequencyLabel(detail?.frequencyId);
  const estimatedMinutes = estimateMinutes(detail?.effortId);

  return {
    id: `profile_step_${activityId}`,
    order,
    name: activityName,
    description: frequency
      ? `${activityName} is currently performed ${frequency.toLowerCase()}.`
      : `${activityName} is currently performed as part of the workplace workflow.`,
    owner: undefined,
    system: buildSystems(detail)[0],
    frequency,
    estimatedMinutes,
    manual: true,
    requiresDecision: decisionHeavyActivities.has(activityId),
    input: undefined,
    output: undefined,
    exceptionNotes: undefined,
  };
}

function buildProfileProcessMaps(
  assessment: AutomationAssessment
): ProcessMap[] {
  const profile = assessment.discovery.profile;
  if (!profile) return [];

  const detailsByActivity = new Map(
    profile.activityDetails.map((detail) => [detail.activityId, detail])
  );

  const processes: ProcessMap[] = [];

  for (const activityId of profile.activityIds) {
    const activity = findActivity(activityId);
    const detail = detailsByActivity.get(activityId);
    const name = activity?.label ?? activityId.replaceAll("_", " ");
    const systems = buildSystems(detail);
    const painPoints = buildPainPoints(detail);

    processes.push({
      id: `profile_process_${activityId}`,
      name,
      objective: `Improve and automate the repeatable work involved in ${name.toLowerCase()}.`,
      trigger: frequencyLabel(detail?.frequencyId),
      owner: profile.roleId
        ? labelOrId(roleOptions, profile.roleId)
        : assessment.decisionMaker.role,
      frequency: frequencyLabel(detail?.frequencyId),
      steps: [buildProcessStep(activityId, name, detail)],
      systems,
      painPoints,
      estimatedWeeklyHours: estimateWeeklyHours(
        detail?.frequencyId,
        detail?.effortId
      ),
    });
  }

  for (const customActivity of profile.customActivities) {
    const trimmed = customActivity.trim();
    if (!trimmed) continue;

    const existing = processes.some(
      (process) => process.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) continue;

    processes.push({
      id: `profile_process_custom_${processes.length + 1}`,
      name: trimmed,
      objective: `Understand and automate the repeatable work involved in ${trimmed.toLowerCase()}.`,
      owner: profile.roleId
        ? labelOrId(roleOptions, profile.roleId)
        : assessment.decisionMaker.role,
      steps: [
        buildProcessStep(
          `custom_${processes.length + 1}`,
          trimmed
        ),
      ],
      systems: [],
      painPoints: [],
    });
  }

  return processes;
}

function deriveProcessMaps(
  assessment: AutomationAssessment
): ProcessMap[] {
  const profileProcesses = buildProfileProcessMaps(assessment);

  if (profileProcesses.length === 0) {
    return assessment.discovery.processMaps;
  }

  const profileProcessIds = new Set(
    profileProcesses.map((process) => process.id)
  );

  const legacyProcesses = assessment.discovery.processMaps.filter(
    (process) => !profileProcessIds.has(process.id)
  );

  return [...profileProcesses, ...legacyProcesses];
}

function deriveDiscoveryState(
  assessment: AutomationAssessment,
  processes: ProcessMap[]
): AutomationAssessment["discovery"] {
  const existingSystems = assessment.discovery.systems;
  const derivedSystemNames = processes.flatMap(
    (process) => process.systems
  );

  const systemByName = new Map(
    existingSystems.map((system) => [
      system.name.toLowerCase(),
      system,
    ])
  );

  for (const name of derivedSystemNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (!systemByName.has(key)) {
      systemByName.set(key, {
        name: trimmed,
        category: "other",
      });
    }
  }

  const uniquePainPoints = Array.from(
    new Set(
      [
        ...assessment.discovery.painPoints,
        ...processes.flatMap((process) => process.painPoints),
      ]
        .map((painPoint) => painPoint.trim())
        .filter(Boolean)
    )
  );

  return {
    ...assessment.discovery,
    systems: Array.from(systemByName.values()),
    painPoints: uniquePainPoints,
    processMaps: processes,
  };
}

export function runAutomationAssessment(
  assessment: AutomationAssessment
): AutomationAnalysisResult {
  const processes = deriveProcessMaps(assessment);
  const discovery = deriveDiscoveryState(assessment, processes);

  const analysisInput: AutomationAssessment = {
    ...assessment,
    discovery,
  };

  const opportunities =
    discoverAutomationOpportunities(processes);

  const roadmap = buildAutomationRoadmap(opportunities);

  const businessCase = buildAutomationBusinessCase(
    opportunities
  );

  const timeline = buildAutomationTimeline(
    roadmap,
    opportunities
  );

  const analyzedAssessment: AutomationAssessment = {
    ...analysisInput,
    updatedAt: new Date().toISOString(),
    status:
      opportunities.length > 0
        ? "analysis_ready"
        : analysisInput.status,
    automation: {
      ...analysisInput.automation,
      opportunities,
      roadmap,
      businessCase,
    },
  };

  const report = buildAutomationReport(
    analyzedAssessment,
    {
      opportunities,
      roadmap,
      businessCase,
    }
  );

  const communication = buildAssessmentCommunication(
    analyzedAssessment,
    report,
    timeline
  );

  return {
    assessment: analyzedAssessment,
    opportunities,
    roadmap,
    businessCase,
    timeline,
    report,
    communication,
  };
}