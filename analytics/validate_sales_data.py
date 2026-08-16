import sys
import pandas as pd


REQUIRED_COLUMNS = [
    "transaction_id",
    "date",
    "country",
    "region",
    "customer_name",
    "customer_type",
    "sales_rep",
    "product_category",
    "product",
    "quantity",
    "unit_price",
    "unit_cost",
    "revenue",
    "cost",
    "gross_profit",
    "payment_status",
    "sales_channel",
]


def validate_sales_data(file_path: str):
    errors = []
    warnings = []

    try:
        df = pd.read_csv(file_path)
    except Exception as exc:
        return {
            "valid": False,
            "errors": [f"Unable to read CSV: {exc}"],
            "warnings": [],
            "row_count": 0,
            "columns": [],
        }

    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]

    if missing:
        errors.append(
            "Missing required columns: " + ", ".join(missing)
        )

    if "transaction_id" in df.columns:
        duplicates = int(df["transaction_id"].duplicated().sum())
        if duplicates:
            errors.append(
                f"Found {duplicates} duplicate transaction ID(s)."
            )

    if "date" in df.columns:
        parsed_dates = pd.to_datetime(df["date"], errors="coerce")
        invalid_dates = int(parsed_dates.isna().sum())

        if invalid_dates:
            errors.append(
                f"Found {invalid_dates} invalid date value(s)."
            )

    numeric_columns = [
        "quantity",
        "unit_price",
        "unit_cost",
        "revenue",
        "cost",
        "gross_profit",
    ]

    for column in numeric_columns:
        if column in df.columns:
            numeric = pd.to_numeric(df[column], errors="coerce")
            invalid = int(numeric.isna().sum())

            if invalid:
                errors.append(
                    f"{column} contains {invalid} non-numeric value(s)."
                )

            negative = int((numeric < 0).sum())

            if negative:
                warnings.append(
                    f"{column} contains {negative} negative value(s)."
                )

    if all(column in df.columns for column in ["quantity", "unit_price", "revenue"]):
        quantity = pd.to_numeric(df["quantity"], errors="coerce")
        unit_price = pd.to_numeric(df["unit_price"], errors="coerce")
        revenue = pd.to_numeric(df["revenue"], errors="coerce")

        mismatch = int(
            ((quantity * unit_price).round(2) != revenue.round(2))
            .fillna(False)
            .sum()
        )

        if mismatch:
            errors.append(
                f"Revenue calculation mismatch in {mismatch} row(s)."
            )

    if all(column in df.columns for column in ["revenue", "cost", "gross_profit"]):
        revenue = pd.to_numeric(df["revenue"], errors="coerce")
        cost = pd.to_numeric(df["cost"], errors="coerce")
        gross_profit = pd.to_numeric(df["gross_profit"], errors="coerce")

        mismatch = int(
            ((revenue - cost).round(2) != gross_profit.round(2))
            .fillna(False)
            .sum()
        )

        if mismatch:
            errors.append(
                f"Gross profit calculation mismatch in {mismatch} row(s)."
            )

    missing_values = int(df.isna().sum().sum())

    if missing_values:
        warnings.append(
            f"Dataset contains {missing_values} missing cell(s)."
        )

    if len(df) == 0:
        errors.append("Dataset contains no rows.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "row_count": int(len(df)),
        "columns": list(df.columns),
    }


if __name__ == "__main__":
    file_path = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "prototype-data/teketeke_sales.csv"
    )

    result = validate_sales_data(file_path)

    print("TEKETEKE DATA VALIDATION")
    print("=" * 48)
    print(f"File: {file_path}")
    print(f"Rows: {result['row_count']}")
    print(f"Valid: {result['valid']}")
    print()

    if result["errors"]:
        print("ERRORS:")
        for error in result["errors"]:
            print(f"  - {error}")

    if result["warnings"]:
        print("WARNINGS:")
        for warning in result["warnings"]:
            print(f"  - {warning}")

    if not result["errors"] and not result["warnings"]:
        print("No validation issues detected.")
