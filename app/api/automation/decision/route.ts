import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { applyAutomationDecision } from "@/lib/automation/AutomationDecisionEngine";
import type { AutomationDecision } from "@/lib/automation/AutomationDecisionEngine";

const repository =
  getAutomationAssessmentRepository();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      decision?: AutomationDecision;
    };

    if (!body.token || !body.decision) {
      return NextResponse.json(
        {
          error:
            "Assessment token and decision are required.",
        },
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

    if (
      body.decision.outcome === "approved" &&
      body.decision.selectedOpportunityIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one automation opportunity must be selected when approving.",
        },
        { status: 422 }
      );
    }

    const updated =
      applyAutomationDecision(
        assessment,
        body.decision
      );

    const saved = await repository.update(
      assessment.id,
      updated
    );

    if (!saved) {
      return NextResponse.json(
        {
          error:
            "Unable to save the automation decision.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      assessmentId: saved.id,
      status: saved.status,
      decision: saved.decision,
    });
  } catch (error) {
    console.error(
      "Automation decision error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save the automation decision.",
      },
      { status: 500 }
    );
  }
}