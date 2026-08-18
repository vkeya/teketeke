import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { completeDiscoveryAndAnalyze } from "@/lib/automation/AutomationAssessmentWorkflow";

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
      await completeDiscoveryAndAnalyze(
        repository,
        assessment
      );

    return NextResponse.json({
      completed: result.complete,
      assessmentId: result.assessment.id,
      status: result.assessment.status,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error(
      "Automation assessment completion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to complete the automation assessment.",
      },
      { status: 500 }
    );
  }
}