import pandas as pd


class InsightEngine:
    """Detect prioritized business risks and opportunities from validated BI data."""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.df["date"] = pd.to_datetime(self.df["date"])
        self.df["month"] = self.df["date"].dt.to_period("M").astype(str)

    @staticmethod
    def _change_pct(current: float, previous: float):
        if previous == 0:
            return None
        return (current - previous) / previous * 100

    def generate(self):
        df = self.df
        total_revenue = df["revenue"].sum()
        insights = []

        # Customer concentration
        customers = df.groupby("customer_name")["revenue"].sum().sort_values(ascending=False)
        top_customer = customers.index[0]
        top_share = customers.iloc[0] / total_revenue * 100

        if top_share >= 20:
            insights.append({
                "type": "risk",
                "priority": "high",
                "title": "Customer concentration risk",
                "finding": f"{top_customer} contributes {top_share:.1f}% of total revenue.",
                "recommendation": "Protect the account while increasing revenue from secondary customers.",
            })
        elif top_share >= 15:
            insights.append({
                "type": "risk",
                "priority": "medium",
                "title": "Customer concentration",
                "finding": f"{top_customer} contributes {top_share:.1f}% of total revenue.",
                "recommendation": "Monitor concentration and diversify the customer base.",
            })

        # Market movement: first six months vs last six months
        months = sorted(df["month"].unique())
        first_six = months[:6]
        last_six = months[-6:]

        country_period = df.groupby(["country", "month"])["revenue"].sum()

        for country in sorted(df["country"].unique()):
            early = country_period.loc[(country, first_six)].sum()
            late = country_period.loc[(country, last_six)].sum()
            change = self._change_pct(late, early)

            if change is None:
                continue

            if change <= -10:
                insights.append({
                    "type": "risk",
                    "priority": "high",
                    "title": f"Revenue decline in {country}",
                    "finding": f"{country} revenue changed by {change:.1f}% between the first and last six months.",
                    "recommendation": f"Investigate customer losses, product mix and sales activity in {country}.",
                })
            elif change >= 20:
                insights.append({
                    "type": "opportunity",
                    "priority": "high",
                    "title": f"High-growth market: {country}",
                    "finding": f"{country} revenue increased by {change:.1f}% between the first and last six months.",
                    "recommendation": f"Evaluate additional sales capacity, inventory and customer acquisition investment in {country}.",
                })

        # Product margin deterioration
        product_period = df.groupby(["product", "month"]).agg(
            revenue=("revenue", "sum"),
            gross_profit=("gross_profit", "sum"),
        )

        for product in sorted(df["product"].unique()):
            try:
                early = product_period.loc[(product, first_six)]
                late = product_period.loc[(product, last_six)]

                early_margin = early["gross_profit"].sum() / early["revenue"].sum() * 100
                late_margin = late["gross_profit"].sum() / late["revenue"].sum() * 100
                margin_change = late_margin - early_margin

                if margin_change <= -3:
                    insights.append({
                        "type": "risk",
                        "priority": "medium",
                        "title": f"Margin deterioration: {product}",
                        "finding": f"Gross margin declined by {abs(margin_change):.1f} percentage points.",
                        "recommendation": f"Review pricing, supplier costs and discounting for {product}.",
                    })
            except (KeyError, ZeroDivisionError):
                continue

        # Payment risk
        payment = df.groupby("payment_status")["revenue"].sum()
        overdue = float(payment.get("Overdue", 0))
        overdue_share = overdue / total_revenue * 100 if total_revenue else 0

        if overdue_share >= 8:
            insights.append({
                "type": "risk",
                "priority": "high",
                "title": "Elevated overdue revenue",
                "finding": f"${overdue:,.0f} ({overdue_share:.1f}% of revenue) is marked overdue.",
                "recommendation": "Prioritize collections, review customer credit exposure and monitor overdue balances.",
            })

        # Product revenue concentration
        product_revenue = df.groupby("product")["revenue"].sum().sort_values(ascending=False)
        top_product = product_revenue.index[0]
        top_product_share = product_revenue.iloc[0] / total_revenue * 100

        if top_product_share >= 15:
            insights.append({
                "type": "opportunity",
                "priority": "medium",
                "title": f"Product concentration: {top_product}",
                "finding": f"{top_product} generates {top_product_share:.1f}% of total revenue.",
                "recommendation": "Protect availability and margins while developing adjacent revenue streams.",
            })

        priority_order = {"high": 0, "medium": 1, "low": 2}
        insights.sort(key=lambda item: priority_order.get(item["priority"], 9))

        return {
            "summary": {
                "total_insights": len(insights),
                "high_priority": sum(i["priority"] == "high" for i in insights),
                "risks": sum(i["type"] == "risk" for i in insights),
                "opportunities": sum(i["type"] == "opportunity" for i in insights),
            },
            "insights": insights,
        }


if __name__ == "__main__":
    import json
    import sys

    csv_path = sys.argv[1] if len(sys.argv) > 1 else "prototype-data/teketeke_sales.csv"
    data = pd.read_csv(csv_path)

    result = InsightEngine(data).generate()

    print(json.dumps(result, indent=2))
