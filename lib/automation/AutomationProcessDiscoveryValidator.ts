import type { ProcessMap, ProcessStep } from "./AutomationAssessment";
import type { StructuredProcessDiscovery } from "./AutomationProcessDiscoveryEngine";

export type ProcessDiscoveryValidationError = {
  field: string;
  message: string;
};

export type ProcessDiscoveryValidationResult = {
  valid: boolean;
  errors: ProcessDiscoveryValidationError[];
};

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateStep(
  step: StructuredProcessDiscovery["steps"][number],
  index: number
): ProcessDiscoveryValidationError[] {
  const errors: ProcessDiscoveryValidationError[] = [];
  const prefix = `steps[${index}]`;

  if (!step.name?.trim()) {
    errors.push({
      field: `${prefix}.name`,
      message: "Step name is required.",
    });
  }

  if (!step.description?.trim()) {
    errors.push({
      field: `${prefix}.description`,
      message: "Step description is required.",
    });
  }

  if (
    step.estimatedMinutes !== undefined &&
    !isPositiveNumber(step.estimatedMinutes)
  ) {
    errors.push({
      field: `${prefix}.estimatedMinutes`,
      message: "Estimated minutes must be a non-negative number.",
    });
  }

  if (step.system !== undefined && !step.system.trim()) {
    errors.push({
      field: `${prefix}.system`,
      message: "System cannot be empty when provided.",
    });
  }

  return errors;
}

export function validateProcessDiscovery(
  input: StructuredProcessDiscovery
): ProcessDiscoveryValidationResult {
  const errors: ProcessDiscoveryValidationError[] = [];

  if (!input.processName?.trim()) {
    errors.push({
      field: "processName",
      message: "Process name is required.",
    });
  }

  if (!input.description?.trim()) {
    errors.push({
      field: "description",
      message: "Process objective or description is required.",
    });
  }

  if (
    input.estimatedWeeklyHours !== undefined &&
    !isPositiveNumber(input.estimatedWeeklyHours)
  ) {
    errors.push({
      field: "estimatedWeeklyHours",
      message: "Weekly hours must be a non-negative number.",
    });
  }

  if (!input.steps?.length) {
    errors.push({
      field: "steps",
      message: "At least one process step is required.",
    });
  } else {
    input.steps.forEach((step, index) => {
      errors.push(...validateStep(step, index));
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateProcessMap(
  process: ProcessMap
): ProcessDiscoveryValidationResult {
  const errors: ProcessDiscoveryValidationError[] = [];

  if (!process.name?.trim()) {
    errors.push({
      field: "name",
      message: "Process name is required.",
    });
  }

  if (!process.objective?.trim()) {
    errors.push({
      field: "objective",
      message: "Process objective is required.",
    });
  }

  if (!process.steps?.length) {
    errors.push({
      field: "steps",
      message: "At least one process step is required.",
    });
  }

  process.steps?.forEach((step, index) => {
    errors.push(...validateProcessStep(step, index));
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateProcessStep(
  step: ProcessStep,
  index: number
): ProcessDiscoveryValidationError[] {
  const errors: ProcessDiscoveryValidationError[] = [];
  const prefix = `steps[${index}]`;

  if (!Number.isInteger(step.order) || step.order < 1) {
    errors.push({
      field: `${prefix}.order`,
      message: "Step order must be a positive integer.",
    });
  }

  if (!step.name?.trim()) {
    errors.push({
      field: `${prefix}.name`,
      message: "Step name is required.",
    });
  }

  if (!step.description?.trim()) {
    errors.push({
      field: `${prefix}.description`,
      message: "Step description is required.",
    });
  }

  if (
    step.estimatedMinutes !== undefined &&
    !isPositiveNumber(step.estimatedMinutes)
  ) {
    errors.push({
      field: `${prefix}.estimatedMinutes`,
      message: "Estimated minutes must be a non-negative number.",
    });
  }

  return errors;
}