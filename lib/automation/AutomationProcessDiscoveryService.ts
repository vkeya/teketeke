import type { AutomationAssessment } from "./AutomationAssessment";
import {
  createProcessMapFromDiscovery,
  type StructuredProcessDiscovery,
} from "./AutomationProcessDiscoveryEngine";
import {
  validateProcessDiscovery,
  validateProcessMap,
  type ProcessDiscoveryValidationResult,
} from "./AutomationProcessDiscoveryValidator";
import { addProcessMap } from "./AutomationProcessMappingEngine";

export type ProcessDiscoveryServiceResult = {
  assessment: AutomationAssessment;
  processMap?: ReturnType<typeof createProcessMapFromDiscovery>;
  validation: ProcessDiscoveryValidationResult;
};

export function addValidatedProcessDiscovery(
  assessment: AutomationAssessment,
  input: StructuredProcessDiscovery
): ProcessDiscoveryServiceResult {
  const validation =
    validateProcessDiscovery(input);

  if (!validation.valid) {
    return {
      assessment,
      validation,
    };
  }

  const processMap =
    createProcessMapFromDiscovery(input);

  const processValidation =
    validateProcessMap(processMap);

  if (!processValidation.valid) {
    return {
      assessment,
      processMap,
      validation: processValidation,
    };
  }

  const updatedAssessment =
    addProcessMap(
      assessment,
      processMap
    );

  return {
    assessment: updatedAssessment,
    processMap,
    validation: processValidation,
  };
}