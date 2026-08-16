import OpenAI from "openai";
import { NextResponse } from "next/server";

import businessContext from "../../../data/ai_business_context.json";
import businessInsights from "../../../data/business_insights.json";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are Teketeke Business Analyst.

You help business owners understand their business performance.

Your answers must be grounded ONLY in the supplied Teketeke business data
and generated business insights.

Rules:

1. Never invent financial figures.
2. Never invent customers, markets, products or trends.
3. When making an important conclusion, explain the evidence.
4. Clearly distinguish FACTS from RECOMMENDATIONS.
5. If the available data cannot answer the question, say so.
6. Do not present assumptions as facts.
7. Keep the answer concise and executive-friendly.
8. Give practical actions where appropriate.

Preferred response structure:

ANSWER
A direct answer to the question.

EVIDENCE
The important numbers or findings supporting the answer.

RECOMMENDED ACTION
What the business owner should consider doing next.
`;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        {
          error: "Please provide a business question.",
        },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        {
          error: "Question must be 500 characters or fewer.",
        },
        { status: 400 }
      );
    }

    const context = {
      businessData: businessContext,
      generatedInsights: businessInsights,
    };

    const response = await client.responses.create({
      model: "gpt-5.6",
      instructions: SYSTEM_INSTRUCTION,
      input: [
        {
          role: "user",
          content: `
Here is the trusted Teketeke business context:

${JSON.stringify(context)}

Executive question:

${question}
          `,
        },
      ],
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error: "Teketeke could not generate an answer.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("Ask Teketeke error:", error);

    return NextResponse.json(
      {
        error: "Unable to process the business question.",
      },
      { status: 500 }
    );
  }
}