import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { buildAutomationValueReport } from "@/lib/automation/AutomationValueReportEngine";

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

    const report =
      buildAutomationValueReport(assessment);

    if (!report) {
      return NextResponse.json(
        {
          error:
            "A completed measurement is required before the realized-value report can be generated.",
        },
        { status: 409 }
      );
    }

    const updatedAssessment =
      assessment.status === "implementation"
        ? await repository.update(assessment.id, {
            status: "completed",
            communication: {
              ...assessment.communication,
              reportGeneratedAt:
                new Date().toISOString(),
            },
          })
        : assessment;

    return NextResponse.json({
      assessmentId: assessment.id,
      organization: assessment.organization,
      report,
      workflow: {
        status:
          updatedAssessment?.status ??
          assessment.status,
        completed:
          updatedAssessment?.status === "completed",
      },
    });
  } catch (error) {
    console.error(
      "Automation value report error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate the realized-value report.",
      },
      { status: 500 }
    );
  }
}