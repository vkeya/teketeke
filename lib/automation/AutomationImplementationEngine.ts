
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
  dependencyIds: string[] = [],
  description?: string
): ImplementationTask {
  return {
    id,
    title,
    description,
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
      options.defaultOwner,
      undefined,
      [],
      "Validate the approved automation scope, the process owner, the systems involved, the expected outcome, and the baseline that will be used to measure success."
    )
  );

  tasks.push(
    createTask(
      "implementation_access",
      "Confirm access to required systems, data, credentials, and integration points.",
      options.defaultOwner,
      undefined,
      ["implementation_requirements"],
      "Confirm the people, credentials, data sources, APIs, permissions, and integration points required to safely build and test the approved automation."
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
        ["implementation_requirements"],
        `Translate the approved opportunity into a practical automation design. Proposed automation: ${opportunity.proposedAutomation}. Validate the workflow, inputs, outputs, exceptions, human decision points, and success criteria before build begins.`
      )
    );

    tasks.push(
      createTask(
        `${safeId}_build`,
        `Build and configure automation: ${opportunity.title}`,
        options.defaultOwner,
        undefined,
        [`${safeId}_design`, "implementation_access"],
        `Build and configure the approved automation for ${opportunity.title}. Implement the agreed workflow, integrations, controls, notifications, and exception handling from the approved design.`
      )
    );

    tasks.push(
      createTask(
        `${safeId}_test`,
        `Test automation and exception handling: ${opportunity.title}`,
        options.defaultOwner,
        undefined,
        [`${safeId}_build`],
        `Validate ${opportunity.title} against normal and exception scenarios. Confirm expected outputs, failure handling, human handoffs, permissions, and readiness for user acceptance testing.`
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
      ),
      "Validate the complete automation with the process owner using representative business scenarios. Capture acceptance issues and resolve them before production release."
    )
  );

  tasks.push(
    createTask(
      "implementation_go_live",
      "Deploy approved automation and confirm production readiness.",
      options.defaultOwner,
      undefined,
      ["implementation_uat"],
      "Move the approved automation into production, confirm monitoring and rollback controls, communicate the operational change, and verify that the process is ready for live use."
    )
  );

  tasks.push(
    createTask(
      "implementation_measurement",
      "Capture baseline and begin post-implementation value measurement.",
      options.defaultOwner,
      undefined,
      ["implementation_go_live"],
      "Record the agreed baseline and begin tracking the measures that will determine whether the automation delivered the expected time, cost, quality, or capacity improvement."
    )
  );

  return {
    projectId: `automation_project_${assessment.id}`,
    status: "planning",
    tasks,
  };
}