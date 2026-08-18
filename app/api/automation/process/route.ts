import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import {
  addValidatedProcessDiscovery,
} from "@/lib/automation/AutomationProcessDiscoveryService";
import type { StructuredProcessDiscovery } from "@/lib/automation/AutomationProcessDiscoveryEngine";

const repository =
  getAutomationAssessmentRepository();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      process?: StructuredProcessDiscovery;
    };

    if (!body.token || !body.process) {
      return NextResponse.json(
        {
          error:
            "Assessment token and process discovery data are required.",
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

    const result =
      addValidatedProcessDiscovery(
        assessment,
        body.process
      );

    if (!result.validation.valid) {
      return NextResponse.json(
        {
          saved: false,
          error:
            "Process discovery validation failed.",
          validation: result.validation,
        },
        { status: 422 }
      );
    }

    if (!result.processMap) {
      return NextResponse.json(
        {
          saved: false,
          error: "Unable to create process map.",
        },
        { status: 500 }
      );
    }

    await repository.update(
      assessment.id,
      result.assessment
    );

    return NextResponse.json({
      saved: true,
      processMap: result.processMap,
      processCount:
        result.assessment.discovery.processMaps.length,
      assessmentStatus:
        result.assessment.status,
    });
  } catch (error) {
    console.error(
      "Automation process discovery error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save process discovery.",
      },
      { status: 500 }
    );
  }
}