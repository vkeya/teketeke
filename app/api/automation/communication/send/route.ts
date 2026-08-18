import { NextResponse } from "next/server";
import { getAutomationAssessmentRepository } from "@/lib/automation/AutomationAssessmentRepositoryProvider";
import { buildAssessmentCommunication } from "@/lib/automation/AutomationCommunicationEngine";
import { buildAutomationReport } from "@/lib/automation/AutomationReportEngine";

const repository =
  getAutomationAssessmentRepository();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

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

    const claimed =
      await repository.claimCommunicationDelivery(
        assessment.id
      );

    if (!claimed) {
      const current =
        await repository.get(assessment.id);

      if (current?.communication?.status === "sent") {
        return NextResponse.json({
          sent: false,
          alreadySent: true,
          recipient: current.decisionMaker.email,
          assessmentId: current.id,
          communication: current.communication,
        });
      }

      return NextResponse.json(
        {
          error:
            "Communication delivery is already in progress.",
        },
        { status: 409 }
      );
    }

    const recipient = claimed.decisionMaker.email;

    if (!recipient) {
      await repository.releaseCommunicationDelivery(
        claimed.id
      );

      return NextResponse.json(
        {
          error:
            "The assessment does not have a decision-maker email address.",
        },
        { status: 409 }
      );
    }

    try {
      const report = buildAutomationReport(
        claimed
      );

      const communication =
        buildAssessmentCommunication(
          claimed,
          report
        );

      const origin = new URL(request.url).origin;
      const reportUrl =
        `${origin}/automation/assessment/` +
        `${encodeURIComponent(claimed.publicToken)}/report`;

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:680px;margin:0 auto;">
          <h2>${escapeHtml(communication.headline)}</h2>
          <p>${escapeHtml(communication.message)}</p>
          ${
            communication.timelineSummary
              ? `<p><strong>Timeline:</strong> ${escapeHtml(
                  communication.timelineSummary
                )}</p>`
              : ""
          }
          <p style="margin:28px 0;">
            <a
              href="${escapeHtml(reportUrl)}"
              style="display:inline-block;padding:12px 18px;border-radius:8px;background:#19D3C5;color:#050B14;text-decoration:none;font-weight:700;"
            >
              ${escapeHtml(communication.callToAction)}
            </a>
          </p>
        </div>
      `;

      const emailResponse = await fetch(
        `${origin}/api/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: recipient,
            subject: communication.subject,
            html,
          }),
        }
      );

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(
          emailResult?.error ??
            "The communication could not be delivered."
        );
      }

      const now = new Date().toISOString();

      const updated =
        await repository.update(claimed.id, {
          communication: {
            ...claimed.communication,
            status: "sent",
            reportSentAt:
              claimed.communication?.reportSentAt ??
              now,
            lastCommunicationAt: now,
          },
        });

      return NextResponse.json({
        sent: true,
        alreadySent: false,
        recipient,
        assessmentId: claimed.id,
        status: "sent",
        communication: updated?.communication ?? {
          status: "sent",
          reportSentAt: now,
          lastCommunicationAt: now,
        },
      });
    } catch (error) {
      await repository.releaseCommunicationDelivery(
        claimed.id
      );

      const now = new Date().toISOString();

      const updated =
        await repository.update(claimed.id, {
          communication: {
            ...claimed.communication,
            status: "delivery_failed",
            lastCommunicationAt: now,
          },
        });

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "The communication could not be delivered.",
          status: "delivery_failed",
          communication: updated?.communication,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error(
      "Automation communication send error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process the automation communication.",
      },
      { status: 500 }
    );
  }
}