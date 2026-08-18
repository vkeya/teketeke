import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { buildAutomationReport } from "@/lib/automation/AutomationReportEngine";

const repository =
  getAutomationAssessmentRepository();

export async function GET(request: Request) {
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
    buildAutomationReport(assessment);

  return NextResponse.json({
    assessment: {
      id: assessment.id,
      organization: assessment.organization,
      status: assessment.status,
    },
    report,
  });
}