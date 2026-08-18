import type {
  AutomationAssessment,
  ProcessMap,
  ProcessStep,
} from "./AutomationAssessment";

export type ProcessMappingInput = {
  processName: string;
  description: string;
  frequency?: string;
  estimatedWeeklyHours?: number;
  steps: Array<{
    name: string;
    description: string;
    manual?: boolean;
    requiresDecision?: boolean;
    estimatedMinutes?: number;
    system?: string;
  }>;
};

function createProcessId(name: string): string {
  return `process_${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60)}`;
}

function createStepId(
  processId: string,
  name: string,
  index: number
): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return `${processId}_step_${index + 1}_${normalized || "step"}`;
}

export function buildProcessMap(
  input: ProcessMappingInput
): ProcessMap {
  const processId = createProcessId(input.processName);

  const steps: ProcessStep[] = input.steps.map(
  (step, index) => ({
    id: createStepId(
      processId,
      step.name,
      index
    ),
    order: index + 1,
    name: step.name,
    description: step.description,
    manual: step.manual ?? true,
    requiresDecision:
      step.requiresDecision ?? false,
    estimatedMinutes:
      step.estimatedMinutes,
    system: step.system,
  })
);

 return {
  id: processId,
  name: input.processName,
  objective: input.description,
  frequency: input.frequency,
  estimatedWeeklyHours: input.estimatedWeeklyHours,
  systems: [
    ...new Set(
      steps
        .map((step) => step.system)
        .filter(
          (system): system is string =>
            Boolean(system)
        )
    ),
  ],
  painPoints: [],
  steps,
};
}

export function addProcessMap(
  assessment: AutomationAssessment,
  process: ProcessMap
): AutomationAssessment {
  const existing =
    assessment.discovery.processMaps.filter(
      (item) => item.id !== process.id
    );

  return {
    ...assessment,
    updatedAt: new Date().toISOString(),
    discovery: {
      ...assessment.discovery,
      processMaps: [...existing, process],
    },
  };
}

export function addProcessMaps(
  assessment: AutomationAssessment,
  processes: ProcessMap[]
): AutomationAssessment {
  let updated = assessment;

  for (const process of processes) {
    updated = addProcessMap(
      updated,
      process
    );
  }

  return updated;
}