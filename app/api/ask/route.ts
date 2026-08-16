import { NextResponse } from "next/server";
import {
  normalizeAIResponse,
  type AIResponse,
} from "../../../lib/ai/responseContract";

/**
 * Teketeke AI boundary.
 *
 * IMPORTANT:
 * The paid AI provider is deliberately disabled until explicitly
 * activated. The absence of a provider call means the API must
 * never return a fake "AI answer".
 *
 * The local intelligence engine in AskTeketeke remains responsible
 * for answering business questions while the provider is disabled.
 */

type AskRequest = {
  question?: string;
  businessContext?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskRequest;

    const question = body.question?.trim();
    const businessContext =
      body.businessContext?.trim();

    if (!question) {
      return NextResponse.json(
        {
          error: "A business question is required.",
        },
        { status: 400 }
      );
    }

    if (!businessContext) {
      return NextResponse.json(
        {
          error:
            "Business context is required before asking Teketeke.",
        },
        { status: 400 }
      );
    }

    /*
     * Provider activation is intentionally explicit.
     *
     * Do NOT infer that AI is active merely because an API key
     * exists in the environment. This prevents the UI from
     * displaying a misleading placeholder as a business answer.
     *
     * When we are ready to activate the provider, set:
     *
     * TEKETEKE_AI_ENABLED=true
     *
     * and implement the provider call below.
     */
    const providerEnabled =
      process.env.TEKETEKE_AI_ENABLED === "true";

    if (!providerEnabled) {
      return NextResponse.json({
        success: true,
        mode: "local",
        provider: "disabled",
        response: null,
      });
    }

    /*
     * Provider boundary.
     *
     * This is intentionally not calling a paid provider yet.
     * When activated, the provider response MUST be normalized
     * through normalizeAIResponse() before reaching the UI.
     */
    const providerResponse: AIResponse | null =
      null;

    if (!providerResponse) {
      return NextResponse.json({
        success: true,
        mode: "local",
        provider: "disabled",
        response: null,
      });
    }

    return NextResponse.json({
      success: true,
      mode: "provider",
      provider: "configured",
      response: normalizeAIResponse(
        providerResponse
      ),
    });
  } catch (error) {
    console.error(
      "Teketeke AI request error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Teketeke could not process the business question.",
      },
      { status: 500 }
    );
  }
}