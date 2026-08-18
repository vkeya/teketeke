import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { buildAssessmentCommunication } from "@/lib/automation/AutomationCommunicationEngine";
import { buildAutomationReport } from "@/lib/automation/AutomationReportEngine";

const repository =
  getAutomationAssessmentRepository();

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

    const report = buildAutomationReport(
      assessment
    );

    const generated =
      buildAssessmentCommunication(
        assessment,
        report
      );

    const communication = {
      ...generated,
      status:
        assessment.communication?.status ??
        "not_sent",
    };

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        organization: assessment.organization,
        decisionMaker: assessment.decisionMaker,
        status: assessment.status,
      },
      communication,
    });
  } catch (error) {
    console.error(
      "Automation communication preview error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate the automation communication.",
      },
      { status: 500 }
    );
  }
}