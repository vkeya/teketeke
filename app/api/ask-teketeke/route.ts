import { NextResponse } from "next/server";
import businessContext from "../../../data/ai_business_context.json";

type AskRequest = {
  question?: string;
};

const SYSTEM_INSTRUCTION = `
You are Teketeke Business Analyst.

Your job is to help a business executive understand their business data.

STRICT RULES:
1. Use only the supplied Teketeke business context.
2. Never invent financial figures, customers, markets, trends, or facts.
3. When making an important conclusion, cite the relevant metric or evidence in plain language.
4. Clearly distinguish FACTS from RECOMMENDATIONS.
5. If the supplied data cannot answer the question, say that the available data is insufficient.
6. Keep answers concise, practical, and executive-friendly.
7. When useful, structure the answer as:
   - Answer
   - Evidence
   - Recommended action
`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskRequest;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "A business question is required." },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6",
        input: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTION,
          },
          {
            role: "user",
            content: [
              "Business context:",
              JSON.stringify(businessContext),
              "",
              `Executive question: ${question}`,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Teketeke OpenAI API error:", errorText);

      return NextResponse.json(
        { error: "The AI Business Analyst could not complete the request." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer =
      typeof data.output_text === "string" ? data.output_text.trim() : "";

    if (!answer) {
      return NextResponse.json(
        { error: "The AI Business Analyst returned no answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
      intent: "business_analysis",
    });
  } catch (error) {
    console.error("Teketeke Ask API error:", error);

    return NextResponse.json(
      { error: "Unable to process the business question." },
      { status: 500 }
    );
  }
}
