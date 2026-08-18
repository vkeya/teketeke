import type { ProcessMap } from "./AutomationAssessment";
import {
  addProcessMap,
  buildProcessMap,
  type ProcessMappingInput,
} from "./AutomationProcessMappingEngine";

export type ProcessDiscoveryQuestion = {
  id:
    | "process_name"
    | "process_description"
    | "process_frequency"
    | "process_weekly_hours"
    | "process_steps";
  question: string;
  required: boolean;
};

export const PROCESS_DISCOVERY_QUESTIONS: ProcessDiscoveryQuestion[] = [
  {
    id: "process_name",
    question: "What is the name of the process you want us to map?",
    required: true,
  },
  {
    id: "process_description",
    question: "What is the main objective of this process?",
    required: true,
  },
  {
    id: "process_frequency",
    question: "How often does this process happen?",
    required: true,
  },
  {
    id: "process_weekly_hours",
    question:
      "Approximately how many hours per week does the team spend on this process?",
    required: false,
  },
  {
    id: "process_steps",
    question:
      "List the steps in order, including who performs each step, whether it is manual, how long it takes, and which system is used.",
    required: true,
  },
];

export type ProcessStepDiscoveryInput = {
  name: string;
  description: string;
  manual?: boolean;
  requiresDecision?: boolean;
  estimatedMinutes?: number;
  system?: string;
};

export type StructuredProcessDiscovery = {
  processName: string;
  description: string;
  frequency?: string;
  estimatedWeeklyHours?: number;
  steps: ProcessStepDiscoveryInput[];
};

export function createProcessMapFromDiscovery(
  input: StructuredProcessDiscovery
): ProcessMap {
  const mappingInput: ProcessMappingInput = {
    processName: input.processName,
    description: input.description,
    frequency: input.frequency,
    estimatedWeeklyHours: input.estimatedWeeklyHours,
    steps: input.steps,
  };

  return buildProcessMap(mappingInput);
}

export function addDiscoveredProcess(
  assessment: Parameters<typeof addProcessMap>[0],
  input: StructuredProcessDiscovery
) {
  const process = createProcessMapFromDiscovery(input);

  return addProcessMap(assessment, process);
}