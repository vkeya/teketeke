import json
import sys
import pandas as pd


class BusinessIntelligenceEngine:
    REQUIRED_COLUMNS = [
        "transaction_id", "date", "country", "region", "customer_name",
        "customer_type", "sales_rep", "product_category", "product",
        "quantity", "unit_price", "unit_cost", "revenue", "cost",
        "gross_profit", "payment_status", "sales_channel",
    ]

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.df = pd.read_csv(file_path)
        self.df["date"] = pd.to_datetime(self.df["date"])

    def validate(self):
        missing = [c for c in self.REQUIRED_COLUMNS if c not in self.df.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        checks = {
            "row_count": len(self.df),
            "missing_values": int(self.df[self.REQUIRED_COLUMNS].isna().sum().sum()),
            "negative_quantity": int((self.df["quantity"] < 0).sum()),
            "invalid_dates": int(self.df["date"].isna().sum()),
            "revenue_calculation_errors": int(
                ((self.df["quantity"] * self.df["unit_price"]).round(2)
                 != self.df["revenue"].round(2)).sum()
            ),
            "cost_calculation_errors": int(
                ((self.df["quantity"] * self.df["unit_cost"]).round(2)
                 != self.df["cost"].round(2)).sum()
            ),
            "profit_calculation_errors": int(
                ((self.df["revenue"] - self.df["cost"]).round(2)
                 != self.df["gross_profit"].round(2)).sum()
            ),
        }

        checks["passed"] = all(
            value == 0 for key, value in checks.items() if key != "row_count"
        )
        return checks

    def executive_metrics(self):
        d = self.df
        revenue = d["revenue"].sum()
        cost = d["cost"].sum()
        profit = d["gross_profit"].sum()

        return {
            "total_revenue": round(revenue, 2),
            "total_cost": round(cost, 2),
            "gross_profit": round(profit, 2),
            "gross_margin_pct": round(profit / revenue * 100, 2) if revenue else 0,
            "transactions": int(len(d)),
            "customers": int(d["customer_name"].nunique()),
            "units_sold": int(d["quantity"].sum()),
        }

    def monthly_performance(self):
        d = self.df.copy()
        d["month"] = d["date"].dt.to_period("M").astype(str)

        out = (
            d.groupby("month", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                cost=("cost", "sum"),
                gross_profit=("gross_profit", "sum"),
            )
        )
        out["gross_margin_pct"] = out["gross_profit"] / out["revenue"] * 100
        out["growth_pct"] = out["revenue"].pct_change() * 100
        return out.round(2)

    def revenue_by_country(self):
        return (
            self.df.groupby("country")["revenue"]
            .sum()
            .sort_values(ascending=False)
            .round(2)
        )

    def profit_by_product(self):
        out = (
            self.df.groupby("product", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                cost=("cost", "sum"),
                gross_profit=("gross_profit", "sum"),
            )
        )
        out["gross_margin_pct"] = out["gross_profit"] / out["revenue"] * 100
        return out.sort_values("gross_profit", ascending=False).round(2)

    def customer_concentration(self):
        out = (
            self.df.groupby("customer_name", as_index=False)["revenue"]
            .sum()
        )
        total = out["revenue"].sum()
        out["revenue_share_pct"] = out["revenue"] / total * 100
        return out.sort_values("revenue", ascending=False).head(10).round(2)

    def payment_summary(self):
        return (
            self.df.groupby("payment_status")["revenue"]
            .sum()
            .sort_values(ascending=False)
            .round(2)
        )

    def generate_report(self):
        return {
            "validation": self.validate(),
            "executive_metrics": self.executive_metrics(),
            "monthly_performance": self.monthly_performance().to_dict("records"),
            "revenue_by_country": self.revenue_by_country().to_dict(),
            "profit_by_product": self.profit_by_product().to_dict("records"),
            "top_customers": self.customer_concentration().to_dict("records"),
            "payment_summary": self.payment_summary().to_dict(),
        }


if __name__ == "__main__":
    file_path = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "prototype-data/teketeke_sales.csv"
    )

    engine = BusinessIntelligenceEngine(file_path)
    report = engine.generate_report()

    print("TEKETEKE BUSINESS INTELLIGENCE")
    print("=" * 48)
    print(f"Source: {file_path}")
    print(f"Validation passed: {report['validation']['passed']}")
    print()

    metrics = report["executive_metrics"]
    print(f"Revenue:       ${metrics['total_revenue']:,.2f}")
    print(f"Cost:          ${metrics['total_cost']:,.2f}")
    print(f"Gross profit:  ${metrics['gross_profit']:,.2f}")
    print(f"Gross margin:  {metrics['gross_margin_pct']:.2f}%")
    print(f"Transactions:  {metrics['transactions']:,}")
    print(f"Customers:     {metrics['customers']:,}")
    print(f"Units sold:    {metrics['units_sold']:,}")
    print()

    print("Revenue by country:")
    for country, value in report["revenue_by_country"].items():
        print(f"  {country}: ${value:,.2f}")

    print()
    print("Payment summary:")
    for status, value in report["payment_summary"].items():
        print(f"  {status}: ${value:,.2f}")
