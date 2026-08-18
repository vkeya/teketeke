import type {
  AutomationAssessment,
  AutomationImplementation,
  AutomationOpportunity,
  ImplementationTask,
} from "./AutomationAssessment";

export type ImplementationPlanOptions = {
  defaultOwner?: string;
  defaultTaskDays?: number;
};

function createTask(
  id: string,
  title: string,
  owner?: string,
  dueDate?: string,
  dependencyIds: string[] = []
): ImplementationTask {
  return {
    id,
    title,
    status: "pending",
    owner,
    dueDate,
    dependencyIds,
  };
}

export function buildImplementationPlan(
  assessment: AutomationAssessment,
  opportunities: AutomationOpportunity[],
  options: ImplementationPlanOptions = {}
): AutomationImplementation {
  const selectedIds =
    assessment.decision?.selectedOpportunityIds ?? [];

  const selected = opportunities.filter(
    (opportunity) =>
      selectedIds.length === 0 ||
      selectedIds.includes(opportunity.id)
  );

  const tasks: ImplementationTask[] = [];

  tasks.push(
    createTask(
      "implementation_requirements",
      "Confirm implementation requirements, scope, systems, and success criteria.",
      options.defaultOwner
    )
  );

  tasks.push(
    createTask(
      "implementation_access",
      "Confirm access to required systems, data, credentials, and integration points.",
      options.defaultOwner,
      undefined,
      ["implementation_requirements"]
    )
  );

  for (const opportunity of selected) {
    const safeId = opportunity.id.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    tasks.push(
      createTask(
        `${safeId}_design`,
        `Design automation: ${opportunity.title}`,
        options.defaultOwner,
        undefined,
        ["implementation_requirements"]
      )
    );

    tasks.push(
      createTask(
        `${safeId}_build`,
        `Build and configure automation: ${opportunity.title}`,
        options.defaultOwner,
        undefined,
        [`${safeId}_design`, "implementation_access"]
      )
    );

    tasks.push(
      createTask(
        `${safeId}_test`,
        `Test automation and exception handling: ${opportunity.title}`,
        options.defaultOwner,
        undefined,
        [`${safeId}_build`]
      )
    );
  }

  tasks.push(
    createTask(
      "implementation_uat",
      "Complete user acceptance testing with the process owner.",
      options.defaultOwner,
      undefined,
      selected.map(
        (opportunity) =>
          `${opportunity.id.replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          )}_test`
      )
    )
  );

  tasks.push(
    createTask(
      "implementation_go_live",
      "Deploy approved automation and confirm production readiness.",
      options.defaultOwner,
      undefined,
      ["implementation_uat"]
    )
  );

  tasks.push(
    createTask(
      "implementation_measurement",
      "Capture baseline and begin post-implementation value measurement.",
      options.defaultOwner,
      undefined,
      ["implementation_go_live"]
    )
  );

  return {
    projectId: `automation_project_${assessment.id}`,
    status: "planning",
    tasks,
  };
}