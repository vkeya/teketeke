import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";

const repository =
  getAutomationAssessmentRepository();

type WorkflowStatus =
  | "created"
  | "in_discovery"
  | "analyzed"
  | "reported"
  | "awaiting_decision"
  | "approved"
  | "implementation"
  | "measurement"
  | "value_measured";

const statusLabels: Record<WorkflowStatus, string> = {
  created: "Assessment created",
  in_discovery: "Discovery in progress",
  analyzed: "Analysis complete",
  reported: "Report ready",
  awaiting_decision: "Awaiting decision",
  approved: "Approved",
  implementation: "Implementation",
  measurement: "Measurement",
  value_measured: "Realized value measured",
};

function deriveWorkflowStatus(
  assessmentStatus: string,
  implementationComplete: boolean,
  measurementComplete: boolean
): WorkflowStatus {
  if (measurementComplete) {
    return "value_measured";
  }

  switch (assessmentStatus) {
    case "implementation":
      return implementationComplete
        ? "measurement"
        : "implementation";

    case "approved":
      return "approved";

    case "presented":
      return "awaiting_decision";

    case "report_ready":
      return "reported";

    case "analysis_ready":
      return "analyzed";

    case "invited":
    case "in_progress":
      return "in_discovery";

    case "completed":
      return "measurement";

    case "archived":
      return "created";

    case "draft":
    default:
      return "created";
  }
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get(
      "token"
    );

    if (!token) {
      return NextResponse.json(
        { error: "Assessment token is required." },
        { status: 400 }
      );
    }

    const assessment =
      await repository.getByPublicToken(token);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    const tasks = assessment.implementation?.tasks ?? [];

    const implementationComplete =
      tasks.length > 0 &&
      tasks.every(
        (task) => task.status === "completed"
      );

    const measurementComplete =
      Boolean(assessment.measurement);

    const workflowStatus = deriveWorkflowStatus(
      assessment.status,
      implementationComplete,
      measurementComplete
    );

    return NextResponse.json({
      assessmentId: assessment.id,
      organization: assessment.organization,
      status: assessment.status,
      workflowStatus,
      statusLabel: statusLabels[workflowStatus],
      implementationComplete,
      measurementComplete,
      communication: {
        status:
          assessment.communication?.status ??
          "not_sent",
        reportGenerated:
          Boolean(
            assessment.communication?.reportGeneratedAt
          ),
        reportSent:
          Boolean(
            assessment.communication?.reportSentAt
          ),
        lastCommunicationAt:
          assessment.communication?.lastCommunicationAt ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Automation status retrieval error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve the automation assessment status.",
      },
      { status: 500 }
    );
  }
}