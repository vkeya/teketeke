export type SchemaField =
  | "date"
  | "revenue"
  | "cost"
  | "gross_profit"
  | "customer_name"
  | "country"
  | "product"
  | "payment_status";

export type SchemaMapping = Partial<
  Record<SchemaField, string>
>;

const FIELD_ALIASES: Record<SchemaField, string[]> = {
  date: [
    "date",
    "transaction_date",
    "sale_date",
    "order_date",
    "invoice_date",
  ],
  revenue: [
    "revenue",
    "sales",
    "sale",
    "sales_amount",
    "sales_value",
    "weekly_sales",
    "total_sales",
    "amount",
  ],
  cost: [
    "cost",
    "total_cost",
    "cost_amount",
    "unit_cost",
  ],
  gross_profit: [
    "gross_profit",
    "grossprofit",
    "profit",
    "gross_margin",
  ],
  customer_name: [
    "customer_name",
    "customer",
    "client",
    "client_name",
    "account",
    "account_name",
  ],
  country: [
    "country",
    "nation",
    "market",
    "country_name",
  ],
  product: [
    "product",
    "product_name",
    "item",
    "item_name",
    "sku",
  ],
  payment_status: [
    "payment_status",
    "payment_state",
    "payment",
    "status",
  ],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function inferSchemaMapping(
  headers: string[]
): SchemaMapping {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const mapping: SchemaMapping = {};

  for (const [field, aliases] of Object.entries(
    FIELD_ALIASES
  ) as [SchemaField, string[]][]) {
    const match = normalizedHeaders.find(({ normalized }) =>
      aliases.includes(normalized)
    );

    if (match) {
      mapping[field] = match.original;
    }
  }

  return mapping;
}

export function getUnmappedRequiredFields(
  mapping: SchemaMapping
): SchemaField[] {
  return ([
    "date",
    "revenue",
  ] as SchemaField[]).filter(
    (field) => !mapping[field]
  );
}

export function getAvailableAnalysisFields(
  mapping: SchemaMapping
): SchemaField[] {
  return (Object.keys(mapping) as SchemaField[]).filter(
    (field) => Boolean(mapping[field])
  );
}

export function normalizeSchemaHeader(
  header: string
): string {
  return normalizeHeader(header);
}