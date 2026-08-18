import type {
  DiscoveryAnswer,
  DiscoveryQuestionType,
  PersonRole,
  ProcessMap,
  SystemProfile,
} from "./AutomationAssessment";

export type DiscoveryQuestion = {
  id: string;
  section:
    | "organization"
    | "people"
    | "processes"
    | "systems"
    | "pain_points"
    | "automation";
  type: DiscoveryQuestionType;
  question: string;
  required: boolean;
  options?: string[];
  helpText?: string;
};

export type DiscoveryProfile = {
  answers: DiscoveryAnswer[];
  people: PersonRole[];
  systems: SystemProfile[];
  painPoints: string[];
  processMaps: ProcessMap[];
};

export type DiscoveryQuestionContext = {
  answers: DiscoveryAnswer[];
  currentQuestionId?: string;
};

/**
 * The structured discovery experience now captures:
 * - organization context
 * - the work performed
 * - frequency and effort
 * - systems used
 * - pain points
 *
 * The final question set therefore focuses only on intelligence that
 * is not already captured by those structured selections.
 */
const BASE_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "manual_data_entry",
    section: "processes",
    type: "yes_no",
    question:
      "Do any of the activities you selected require people to copy or re-enter information between systems?",
    required: true,
    helpText:
      "For example, copying information from email or a spreadsheet into another system.",
  },
  {
    id: "human_decisions",
    section: "automation",
    type: "long_text",
    question:
      "Which parts of the work still require a person to make a judgment or approval?",
    required: true,
    helpText:
      "Tell us about decisions that should remain with a person, even if other parts of the work are automated.",
  },
  {
    id: "automation_goal",
    section: "automation",
    type: "long_text",
    question:
      "If one part of this work could happen automatically tomorrow, what would you choose first?",
    required: true,
    helpText:
      "Choose the improvement that would make the biggest practical difference to your team.",
  },
];

export function getDiscoveryQuestions(
  context?: DiscoveryQuestionContext
): DiscoveryQuestion[] {
  const answers = context?.answers ?? [];
  const questions = [...BASE_QUESTIONS];

  const manualEntryAnswer = answers.find(
    (answer) => answer.questionId === "manual_data_entry"
  );

  if (
    manualEntryAnswer?.answer === true ||
    manualEntryAnswer?.answer === "yes"
  ) {
    questions.push({
      id: "manual_transfer_frequency",
      section: "processes",
      type: "single_choice",
      question:
        "How often does your team transfer information manually between systems?",
      required: true,
      options: [
        "Several times a day",
        "Daily",
        "Several times a week",
        "Weekly",
        "Less often",
      ],
    });
  }

  return questions;
}

export function getNextDiscoveryQuestion(
  context: DiscoveryQuestionContext
): DiscoveryQuestion | null {
  const questions = getDiscoveryQuestions(context);
  const answered = new Set(
    context.answers.map((answer) => answer.questionId)
  );

  return (
    questions.find(
      (question) =>
        question.required && !answered.has(question.id)
    ) ?? null
  );
}

export function isDiscoveryComplete(
  answers: DiscoveryAnswer[]
): boolean {
  const requiredIds = getDiscoveryQuestions({
    answers,
  })
    .filter((question) => question.required)
    .map((question) => question.id);

  const answered = new Set(
    answers.map((answer) => answer.questionId)
  );

  return requiredIds.every((id) => answered.has(id));
}

export function buildDiscoveryProfile(
  answers: DiscoveryAnswer[]
): DiscoveryProfile {
  return {
    answers,
    people: [],
    systems: [],
    painPoints: [],
    processMaps: [],
  };
}