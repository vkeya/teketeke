import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { runAutomationAssessment } from "@/lib/automation/AutomationAssessmentEngine";

const repository =
  getAutomationAssessmentRepository();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
    };

    if (!body.token) {
      return NextResponse.json(
        { error: "Assessment token is required." },
        { status: 400 }
      );
    }

    const assessment =
      await repository.getByPublicToken(body.token);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    const result =
      runAutomationAssessment(assessment);

    await repository.update(
      assessment.id,
      result.assessment
    );

    return NextResponse.json({
      assessmentId: assessment.id,
      status: result.assessment.status,
      opportunities: result.opportunities,
      roadmap: result.roadmap,
      businessCase: result.businessCase,
      timeline: result.timeline,
      report: result.report,
      communication: result.communication,
    });
  } catch (error) {
    console.error(
      "Automation assessment analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyze the automation assessment.",
      },
      { status: 500 }
    );
  }
}