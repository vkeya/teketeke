import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import {
  getNextDiscoveryQuestion,
  isDiscoveryComplete,
} from "@/lib/automation/AutomationDiscoveryEngine";
import type {
  AutomationAssessment,
  AutomationDiscoveryProfile,
  DiscoveryAnswer,
} from "@/lib/automation/AutomationAssessment";

const repository =
  getAutomationAssessmentRepository();

type CreateAssessmentBody = {
  organization: AutomationAssessment["organization"];
  decisionMaker: AutomationAssessment["decisionMaker"];
};

type UpdateDiscoveryProfileBody = {
  token?: string;
  discoveryProfile?: AutomationDiscoveryProfile;
};

type BusinessCaseInputs = {
  hourlyValue?: number;
  implementationCost?: number;
  implementationDays?: number;
  implementationRatePerDay?: number;
};

type UpdateBusinessCaseInputsBody = {
  token?: string;
  businessCaseInputs?: BusinessCaseInputs;
};

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isValidDiscoveryProfile(
  profile: AutomationDiscoveryProfile
) {
  return (
    Array.isArray(profile.activityIds) &&
    Array.isArray(profile.customActivities) &&
    Array.isArray(profile.activityDetails)
  );
}

function isValidBusinessCaseInputs(
  inputs: BusinessCaseInputs
) {
  const values = [
    inputs.hourlyValue,
    inputs.implementationCost,
    inputs.implementationDays,
    inputs.implementationRatePerDay,
  ];

  return values.every(
    (value) =>
      value === undefined ||
      (typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0)
  );
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateAssessmentBody;

    if (
      !body.organization?.name ||
      !body.decisionMaker?.name ||
      !body.decisionMaker?.role ||
      !body.decisionMaker?.email
    ) {
      return NextResponse.json(
        {
          error:
            "Organization name and decision-maker name, role, and email are required.",
        },
        { status: 400 }
      );
    }

    const assessment = await repository.create({
      id: createId("assessment"),
      publicToken: crypto.randomUUID(),
      organization: body.organization,
      decisionMaker: body.decisionMaker,
    });

    return NextResponse.json({
      assessmentId: assessment.id,
      publicToken: assessment.publicToken,
      status: assessment.status,
    });
  } catch (error) {
    console.error(
      "Create automation assessment error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create automation assessment.",
      },
      { status: 500 }
    );
  }
}

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

  const nextQuestion =
    getNextDiscoveryQuestion({
      answers: assessment.discovery.answers,
    });

  return NextResponse.json({
    assessment: {
      id: assessment.id,
      organization: assessment.organization,
      decisionMaker: assessment.decisionMaker,
      status: assessment.status,
      discovery: assessment.discovery,
      businessCaseInputs:
        assessment.businessCaseInputs,
    },
    nextQuestion,
    complete: isDiscoveryComplete(
      assessment.discovery.answers
    ),
  });
}

export async function PUT(request: Request) {
  try {
    const body =
      (await request.json()) as
        | {
            token?: string;
            answer?: DiscoveryAnswer;
          }
        | UpdateDiscoveryProfileBody
        | UpdateBusinessCaseInputsBody;

    if (!body.token) {
      return NextResponse.json(
        {
          error:
            "Assessment token is required.",
        },
        { status: 400 }
      );
    }

    const assessment =
      await repository.getByPublicToken(
        body.token
      );

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    if (
      "businessCaseInputs" in body &&
      body.businessCaseInputs
    ) {
      if (
        !isValidBusinessCaseInputs(
          body.businessCaseInputs
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Business case values must be valid non-negative numbers.",
          },
          { status: 400 }
        );
      }

      const updated =
        await repository.update(
          assessment.id,
          {
            businessCaseInputs:
              body.businessCaseInputs,
          }
        );

      if (!updated) {
        return NextResponse.json(
          {
            error:
              "Unable to save business case inputs.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        saved: true,
        businessCaseInputs:
          updated.businessCaseInputs,
      });
    }

    if (
      "discoveryProfile" in body &&
      body.discoveryProfile
    ) {
      if (
        !isValidDiscoveryProfile(
          body.discoveryProfile
        )
      ) {
        return NextResponse.json(
          {
            error:
              "A valid discovery profile is required.",
          },
          { status: 400 }
        );
      }

      const updated =
        await repository.update(
          assessment.id,
          {
            discovery: {
              ...assessment.discovery,
              profile:
                body.discoveryProfile,
            },
          }
        );

      if (!updated) {
        return NextResponse.json(
          {
            error:
              "Unable to save discovery profile.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        saved: true,
        discovery: updated.discovery,
      });
    }

    const answer =
      "answer" in body ? body.answer : undefined;

    if (!answer?.questionId) {
      return NextResponse.json(
        {
          error:
            "Assessment token and answer are required.",
        },
        { status: 400 }
      );
    }

    const updated =
      await repository.addAnswer(
        assessment.id,
        answer
      );

    if (!updated) {
      return NextResponse.json(
        {
          error:
            "Unable to save assessment answer.",
        },
        { status: 500 }
      );
    }

    const complete =
      isDiscoveryComplete(
        updated.discovery.answers
      );

    return NextResponse.json({
      saved: true,
      complete,
      nextQuestion: complete
        ? null
        : getNextDiscoveryQuestion({
            answers:
              updated.discovery.answers,
          }),
    });
  } catch (error) {
    console.error(
      "Save automation assessment data error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save assessment data.",
      },
      { status: 500 }
    );
  }
}