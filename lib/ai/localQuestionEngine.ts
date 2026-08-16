import type {
  AIResponse,
  AIResponsePriority,
} from "./responseContract";
import type { BusinessContext } from "./businessContext";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function priorityFromCount(
  count: number
): AIResponsePriority {
  return count > 0 ? "high" : "low";
}

/**
 * Deterministic business-question engine.
 *
 * This is the no-cost intelligence layer used while the paid
 * generative AI provider is disabled. It deliberately answers
 * only from the structured BusinessContext.
 */
export function answerBusinessQuestion(
  question: string,
  context: BusinessContext
): AIResponse {
  const q = question.toLowerCase().trim();

  if (
    q.includes("risk") ||
    q.includes("problem") ||
    q.includes("danger") ||
    q.includes("concern")
  ) {
    const risks = context.insights.filter(
      (item) => item.type === "risk"
    );

    return {
      title:
        risks.length > 0
          ? `${risks.length} business risk${
              risks.length === 1 ? "" : "s"
            } require attention`
          : "No material risks detected",
      type: "risk",
      priority: priorityFromCount(
        risks.length
      ),
      answer:
        risks.length > 0
          ? risks
              .map(
                (risk) =>
                  `${risk.title}: ${risk.finding}`
              )
              .join(" ")
          : "The current intelligence engine has not detected a material risk in the available business signals.",
      keyPoints: risks
        .slice(0, 5)
        .map((risk) => risk.finding),
      recommendedActions: risks
        .slice(0, 5)
        .map(
          (risk) => risk.recommendation
        ),
      supportingSignals: risks
        .slice(0, 5)
        .map((risk) => risk.title),
      confidence: risks.length > 0 ? "high" : "medium",
    };
  }

  if (
    q.includes("opportun") ||
    q.includes("growth") ||
    q.includes("grow") ||
    q.includes("potential")
  ) {
    const opportunities =
      context.insights.filter(
        (item) => item.type === "opportunity"
      );

    return {
      title:
        opportunities.length > 0
          ? `${opportunities.length} growth opportunit${
              opportunities.length === 1
                ? "y"
                : "ies"
            } identified`
          : "No material growth opportunities detected",
      type: "opportunity",
      priority:
        opportunities.length > 0
          ? "high"
          : "low",
      answer:
        opportunities.length > 0
          ? opportunities
              .map(
                (item) =>
                  `${item.title}: ${item.finding}`
              )
              .join(" ")
          : "The current intelligence engine has not identified a material growth opportunity from the available signals.",
      keyPoints: opportunities
        .slice(0, 5)
        .map((item) => item.finding),
      recommendedActions: opportunities
        .slice(0, 5)
        .map(
          (item) => item.recommendation
        ),
      supportingSignals: opportunities
        .slice(0, 5)
        .map((item) => item.title),
      confidence:
        opportunities.length > 0
          ? "high"
          : "medium",
    };
  }

  if (
    q.includes("market") ||
    q.includes("country") ||
    q.includes("region")
  ) {
    const market = context.leaders.country;

    if (!market) {
      return unavailable(
        "Market intelligence",
        "Market-level revenue data is not available in the current business context."
      );
    }

    return {
      title: `Leading market: ${market.name}`,
      type: "answer",
      priority: "medium",
      answer:
        `${market.name} is the leading market, generating ${money(
          market.revenue
        )} or ${market.sharePct.toFixed(
          1
        )}% of total revenue.`,
      keyPoints: [
        `${market.name} leads revenue contribution.`,
        `${market.sharePct.toFixed(
          1
        )}% of total revenue comes from this market.`,
      ],
      recommendedActions: [
        `Understand the drivers behind ${market.name}'s performance.`,
        "Assess whether the successful market model can be replicated elsewhere.",
      ],
      supportingSignals: [
        "Market revenue",
        "Market revenue share",
      ],
      confidence: "high",
    };
  }

  if (
    q.includes("customer") ||
    q.includes("client") ||
    q.includes("account")
  ) {
    const customer = context.leaders.customer;

    if (!customer) {
      return unavailable(
        "Customer intelligence",
        "Customer-level revenue data is not available in the current business context."
      );
    }

    return {
      title: `Leading customer: ${customer.name}`,
      type: "answer",
      priority:
        customer.sharePct >= 20
          ? "high"
          : "medium",
      answer:
        `${customer.name} contributes ${customer.sharePct.toFixed(
          1
        )}% of revenue, representing ${money(
          customer.revenue
        )}.`,
      keyPoints: [
        `${customer.name} is the largest customer by revenue.`,
        `Customer concentration is ${customer.sharePct.toFixed(
          1
        )}% of total revenue.`,
      ],
      recommendedActions: [
        "Protect the strategic customer relationship.",
        "Develop secondary accounts to reduce concentration exposure.",
      ],
      supportingSignals: [
        "Customer revenue",
        "Customer revenue share",
      ],
      confidence: "high",
    };
  }

  if (
    q.includes("product") ||
    q.includes("portfolio")
  ) {
    const product = context.leaders.product;

    if (!product) {
      return unavailable(
        "Product intelligence",
        "Product-level revenue data is not available in the current business context."
      );
    }

    return {
      title: `Leading product: ${product.name}`,
      type: "answer",
      priority:
        product.sharePct >= 25
          ? "high"
          : "medium",
      answer:
        `${product.name} generates ${money(
          product.revenue
        )}, representing ${product.sharePct.toFixed(
          1
        )}% of total revenue.`,
      keyPoints: [
        `${product.name} is the leading product by revenue.`,
        `Its revenue share is ${product.sharePct.toFixed(
          1
        )}%.`,
      ],
      recommendedActions: [
        "Protect product availability and margins.",
        "Develop adjacent offerings to diversify product concentration.",
      ],
      supportingSignals: [
        "Product revenue",
        "Product revenue share",
      ],
      confidence: "high",
    };
  }

  if (
    q.includes("payment") ||
    q.includes("cash") ||
    q.includes("overdue") ||
    q.includes("collection")
  ) {
    const overdue =
      context.paymentStatus.find(
        (item) =>
          item.status.toLowerCase() ===
          "overdue"
      );

    if (!overdue) {
      return unavailable(
        "Collections",
        "No overdue payment category was detected in the available payment-status data."
      );
    }

    return {
      title: "Collections deserve attention",
      type: "risk",
      priority:
        overdue.sharePct >= 5
          ? "high"
          : "medium",
      answer:
        `${money(
          overdue.revenue
        )} is marked overdue, representing ${overdue.sharePct.toFixed(
          1
        )}% of total revenue.`,
      keyPoints: [
        "Overdue revenue creates collection and cash-flow exposure.",
        `Overdue balance represents ${overdue.sharePct.toFixed(
          1
        )}% of revenue.`,
      ],
      recommendedActions: [
        "Prioritize collection of overdue balances.",
        "Review credit exposure for customers with overdue revenue.",
      ],
      supportingSignals: [
        "Overdue revenue",
        "Overdue revenue share",
      ],
      confidence: "high",
    };
  }

  if (
    q.includes("margin") ||
    q.includes("profit") ||
    q.includes("profitable")
  ) {
    return {
      title: "Profitability overview",
      type: "summary",
      priority: "medium",
      answer:
        `The business generated ${money(
          context.financials.grossProfit
        )} in gross profit from ${money(
          context.financials.revenue
        )} in revenue, producing a ${context.financials.grossMarginPct.toFixed(
          2
        )}% gross margin.`,
      keyPoints: [
        `Revenue: ${money(
          context.financials.revenue
        )}`,
        `Gross profit: ${money(
          context.financials.grossProfit
        )}`,
        `Gross margin: ${context.financials.grossMarginPct.toFixed(
          2
        )}%`,
      ],
      recommendedActions: [
        "Compare margins across customers, products and markets.",
        "Protect high-margin revenue while investigating low-margin segments.",
      ],
      supportingSignals: [
        "Revenue",
        "Gross profit",
        "Gross margin",
      ],
      confidence: "high",
    };
  }

  if (
    q.includes("revenue") ||
    q.includes("sales") ||
    q.includes("performance")
  ) {
    return {
      title: "Revenue performance",
      type: "summary",
      priority: "medium",
      answer:
        `The dataset contains ${context.dataset.transactions.toLocaleString()} transactions generating ${money(
          context.financials.revenue
        )} in revenue and ${money(
          context.financials.grossProfit
        )} in gross profit.`,
      keyPoints: [
        `${context.dataset.transactions.toLocaleString()} transactions`,
        `${money(
          context.financials.revenue
        )} total revenue`,
        `${context.financials.grossMarginPct.toFixed(
          2
        )}% gross margin`,
      ],
      recommendedActions: [
        "Review the strongest revenue contributors.",
        "Investigate the largest negative signals before making growth investments.",
      ],
      supportingSignals: [
        "Transaction volume",
        "Revenue",
        "Gross margin",
      ],
      confidence: "high",
    };
  }

  return {
    title: "Executive business overview",
    type: "summary",
    priority: "medium",
    answer: context.executiveSummary,
    keyPoints: [
      `Revenue: ${money(
        context.financials.revenue
      )}`,
      `Gross profit: ${money(
        context.financials.grossProfit
      )}`,
      `Gross margin: ${context.financials.grossMarginPct.toFixed(
        2
      )}%`,
    ],
    recommendedActions: [
      "Ask about risks to identify the most important exposures.",
      "Ask about opportunities to identify potential growth areas.",
    ],
    supportingSignals: [
      "Financial performance",
      "Business dimensions",
      "Detected insights",
    ],
    confidence: "high",
  };
}

function unavailable(
  title: string,
  answer: string
): AIResponse {
  return {
    title,
    type: "answer",
    priority: "low",
    answer,
    keyPoints: [],
    recommendedActions: [],
    supportingSignals: [],
    confidence: "low",
  };
}