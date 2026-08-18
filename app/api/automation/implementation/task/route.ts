import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";

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

    if (!assessment.implementation) {
      return NextResponse.json(
        {
          error:
            "An implementation plan has not been created for this assessment.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        organization: assessment.organization,
        status: assessment.status,
      },
      implementation: assessment.implementation,
    });
  } catch (error) {
    console.error(
      "Automation implementation retrieval error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the implementation plan.",
      },
      { status: 500 }
    );
  }
}