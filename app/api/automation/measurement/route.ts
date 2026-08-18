import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import {
  buildAutomationMeasurement,
  type MeasurementInput,
} from "@/lib/automation/AutomationMeasurementEngine";

const repository =
  getAutomationAssessmentRepository();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      measurement?: MeasurementInput;
    };

    if (!body.token || !body.measurement) {
      return NextResponse.json(
        {
          error:
            "Assessment token and measurement data are required.",
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

    if (!assessment.implementation) {
      return NextResponse.json(
        {
          error:
            "An implementation plan must exist before value can be measured.",
        },
        { status: 409 }
      );
    }

    if (
      body.measurement.baselineWeeklyHours < 0 ||
      body.measurement.currentWeeklyHours < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Weekly hours cannot be negative.",
        },
        { status: 422 }
      );
    }

    const measurement =
      buildAutomationMeasurement(
        body.measurement
      );

    const updated = {
      ...assessment,
      updatedAt: new Date().toISOString(),
      measurement,
    };

    const saved = await repository.update(
      assessment.id,
      updated
    );

    if (!saved) {
      return NextResponse.json(
        {
          error:
            "Unable to save the automation measurement.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      assessmentId: saved.id,
      measurement: saved.measurement,
    });
  } catch (error) {
    console.error(
      "Automation measurement error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to record automation measurement.",
      },
      { status: 500 }
    );
  }
}