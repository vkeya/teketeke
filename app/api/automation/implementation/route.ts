import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { buildImplementationPlan } from "@/lib/automation/AutomationImplementationEngine";

const repository =
  getAutomationAssessmentRepository();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      owner?: string;
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

    if (assessment.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "An implementation plan can only be created for an approved assessment.",
        },
        { status: 409 }
      );
    }

    const implementation =
      buildImplementationPlan(
        assessment,
        assessment.automation.opportunities,
        {
          defaultOwner: body.owner,
        }
      );

    const updated = {
      ...assessment,
      updatedAt: new Date().toISOString(),
      implementation,
    };

    const saved = await repository.update(
      assessment.id,
      updated
    );

    if (!saved) {
      return NextResponse.json(
        {
          error:
            "Unable to save the implementation plan.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      assessmentId: saved.id,
      status: saved.status,
      implementation: saved.implementation,
    });
  } catch (error) {
    console.error(
      "Automation implementation planning error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create the implementation plan.",
      },
      { status: 500 }
    );
  }
}