import type { AutomationAssessment } from "./AutomationAssessment";
import type { AutomationReport } from "./AutomationReportEngine";
import type { AutomationTimeline } from "./AutomationTimelineEngine";

export type CommunicationChannel =
  | "email"
  | "in_app"
  | "public_link";

export type AutomationCommunication = {
  subject: string;
  headline: string;
  message: string;
  channel: CommunicationChannel;
  callToAction: string;
  reportToken: string;
  timelineSummary?: string;
};

function formatValue(value?: number): string {
  if (value === undefined) {
    return "to be validated";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

export function buildAssessmentCommunication(
  assessment: AutomationAssessment,
  report: AutomationReport,
  timeline?: AutomationTimeline,
  channel: CommunicationChannel = "email"
): AutomationCommunication {
  const opportunityCount = report.opportunities.length;
  const annualHours =
    report.businessCase?.estimatedAnnualHoursSaved;

  const timelineSummary = timeline
    ? `${formatValue(
        timeline.estimatedWorkingDays
      )} working days estimated, with first value expected after approximately ${formatValue(
        timeline.startToFirstValueDays
      )} working days.`
    : undefined;

  return {
    subject: `Your Automation Assessment — ${assessment.organization.name}`,
    headline: `We identified ${opportunityCount} automation opportunit${
      opportunityCount === 1 ? "y" : "ies"
    }.`,
    message: `${report.executiveSummary}${
      annualHours !== undefined
        ? ` The current estimate indicates approximately ${formatValue(
            annualHours
          )} hours of annual work could potentially be recovered.`
        : ""
    }${
      timelineSummary
        ? ` ${timelineSummary}`
        : ""
    }`,
    channel,
    callToAction: "Review your automation assessment",
    reportToken: assessment.publicToken,
    timelineSummary,
  };
}

export function buildAssessmentInvitation(
  assessment: AutomationAssessment
): AutomationCommunication {
  return {
    subject: `Automation Discovery — ${assessment.organization.name}`,
    headline:
      "Help us understand how your workplace operates today.",
    message:
      "We have created an automation discovery assessment to understand your current processes, systems, repetitive work, and improvement opportunities. Your answers will be used to prepare a tailored automation assessment.",
    channel: "email",
    callToAction: "Start the assessment",
    reportToken: assessment.publicToken,
  };
}