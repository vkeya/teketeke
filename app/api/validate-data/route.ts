import { NextResponse } from "next/server";

const REQUIRED_COLUMNS = [
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
];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());

  return values;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          valid: false,
          errors: ["No CSV file was uploaded."],
          warnings: [],
        },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        {
          valid: false,
          errors: ["Only CSV files are supported."],
          warnings: [],
        },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          valid: false,
          errors: ["The maximum supported file size is 10 MB."],
          warnings: [],
        },
        { status: 400 }
      );
    }

    const text = await file.text();

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({
        valid: false,
        errors: ["The CSV must contain a header row and at least one data row."],
        warnings: [],
        rowCount: 0,
      });
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
      header.replace(/^\uFEFF/, "").trim()
    );

    const missingColumns = REQUIRED_COLUMNS.filter(
      (column) => !headers.includes(column)
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    if (missingColumns.length > 0) {
      errors.push(
        `Missing required columns: ${missingColumns.join(", ")}`
      );
    }

    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);

      return Object.fromEntries(
        headers.map((header, index) => [
          header,
          values[index] ?? "",
        ])
      );
    });

    const transactionIds = new Set<string>();
    let duplicateTransactions = 0;

    for (const row of rows) {
      const transactionId = row.transaction_id;

      if (!transactionId) {
        continue;
      }

      if (transactionIds.has(transactionId)) {
        duplicateTransactions++;
      }

      transactionIds.add(transactionId);
    }

    if (duplicateTransactions > 0) {
      errors.push(
        `Found ${duplicateTransactions} duplicate transaction ID(s).`
      );
    }

    const numericColumns = [
      "quantity",
      "unit_price",
      "unit_cost",
      "revenue",
      "cost",
      "gross_profit",
    ];

    for (const column of numericColumns) {
      let invalidValues = 0;

      for (const row of rows) {
        const value = row[column];

        if (value === undefined || value === "") {
          continue;
        }

        if (!Number.isFinite(Number(value))) {
          invalidValues++;
        }
      }

      if (invalidValues > 0) {
        errors.push(
          `${column} contains ${invalidValues} non-numeric value(s).`
        );
      }
    }

    let revenueMismatch = 0;
    let profitMismatch = 0;

    for (const row of rows) {
      const quantity = Number(row.quantity);
      const unitPrice = Number(row.unit_price);
      const revenue = Number(row.revenue);

      const cost = Number(row.cost);
      const grossProfit = Number(row.gross_profit);

      if (
        Number.isFinite(quantity) &&
        Number.isFinite(unitPrice) &&
        Number.isFinite(revenue)
      ) {
        if (
          Math.abs(quantity * unitPrice - revenue) > 0.01
        ) {
          revenueMismatch++;
        }
      }

      if (
        Number.isFinite(revenue) &&
        Number.isFinite(cost) &&
        Number.isFinite(grossProfit)
      ) {
        if (
          Math.abs(revenue - cost - grossProfit) > 0.01
        ) {
          profitMismatch++;
        }
      }
    }

    if (revenueMismatch > 0) {
      errors.push(
        `Revenue calculation mismatch in ${revenueMismatch} row(s).`
      );
    }

    if (profitMismatch > 0) {
      errors.push(
        `Gross profit calculation mismatch in ${profitMismatch} row(s).`
      );
    }

    let missingCells = 0;

    for (const row of rows) {
      for (const column of headers) {
        if (!row[column]) {
          missingCells++;
        }
      }
    }

    if (missingCells > 0) {
      warnings.push(
        `Dataset contains ${missingCells} missing cell(s).`
      );
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
      warnings,
      rowCount: rows.length,
      columns: headers,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Data validation error:", error);

    return NextResponse.json(
      {
        valid: false,
        errors: ["Unable to process the uploaded CSV."],
        warnings: [],
      },
      { status: 500 }
    );
  }
}