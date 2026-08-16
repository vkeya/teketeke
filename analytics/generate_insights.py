import json
import sys
from pathlib import Path

import pandas as pd

from insight_engine import InsightEngine


def main():
    csv_path = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "prototype-data/teketeke_sales.csv"
    )

    output_path = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "data/business_insights.json"
    )

    df = pd.read_csv(csv_path)
    result = InsightEngine(df).generate()

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    # allow_nan=False prevents invalid JSON values such as NaN.
    output.write_text(
        json.dumps(result, indent=2, allow_nan=False),
        encoding="utf-8",
    )

    print("TEKETEKE BUSINESS INSIGHTS")
    print("=" * 48)
    print(f"Source: {csv_path}")
    print(f"Output: {output_path}")
    print(f"Total insights: {result['summary']['total_insights']}")
    print(f"High priority: {result['summary']['high_priority']}")
    print(f"Risks: {result['summary']['risks']}")
    print(f"Opportunities: {result['summary']['opportunities']}")
    print("Generation complete.")


if __name__ == "__main__":
    main()
