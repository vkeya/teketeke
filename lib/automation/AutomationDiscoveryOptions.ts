/**
 * Authoritative option sets for the Automation Discovery experience.
 *
 * Keep these values stable because assessment records should store the
 * option ids, not UI labels. Labels can be refined later without changing
 * the underlying discovery data.
 */

export type DiscoveryOption = {
  id: string;
  label: string;
};

export type AutomationActivityGroup = DiscoveryOption & {
  activities: DiscoveryOption[];
};

export const industryOptions: DiscoveryOption[] = [
  { id: "accounting_finance", label: "Accounting & Finance" },
  { id: "agriculture", label: "Agriculture" },
  { id: "construction", label: "Construction" },
  { id: "education", label: "Education" },
  { id: "energy_utilities", label: "Energy & Utilities" },
  { id: "financial_services", label: "Financial Services" },
  { id: "government_public_sector", label: "Government & Public Sector" },
  { id: "healthcare", label: "Healthcare" },
  { id: "hospitality_tourism", label: "Hospitality & Tourism" },
  { id: "information_technology", label: "Information Technology" },
  { id: "insurance", label: "Insurance" },
  { id: "logistics_transportation", label: "Logistics & Transportation" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "media_communications", label: "Media & Communications" },
  { id: "professional_services", label: "Professional Services" },
  { id: "real_estate_property", label: "Real Estate & Property" },
  { id: "retail_ecommerce", label: "Retail & E-commerce" },
  { id: "telecommunications", label: "Telecommunications" },
  { id: "wholesale_distribution", label: "Wholesale & Distribution" },
  { id: "other", label: "Other" },
];

export const roleOptions: DiscoveryOption[] = [
  { id: "owner_founder", label: "Owner / Founder" },
  { id: "ceo_managing_director", label: "CEO / Managing Director" },
  { id: "coo_operations", label: "COO / Operations" },
  { id: "cfo_finance", label: "CFO / Finance" },
  { id: "cto_it", label: "CTO / IT" },
  { id: "cio", label: "CIO" },
  { id: "hr_people", label: "HR / People" },
  { id: "sales", label: "Sales" },
  { id: "marketing", label: "Marketing" },
  { id: "customer_service", label: "Customer Service" },
  { id: "procurement", label: "Procurement" },
  { id: "administration", label: "Administration" },
  { id: "project_program_management", label: "Project / Program Management" },
  { id: "compliance_risk", label: "Compliance / Risk" },
  { id: "supply_chain", label: "Supply Chain" },
  { id: "branch_store_management", label: "Branch / Store Management" },
  { id: "department_manager", label: "Department Manager" },
  { id: "team_lead_supervisor", label: "Team Lead / Supervisor" },
  { id: "other", label: "Other" },
];

export const countryOptions: DiscoveryOption[] = [
  { id: "afghanistan", label: "Afghanistan" },
  { id: "albania", label: "Albania" },
  { id: "algeria", label: "Algeria" },
  { id: "angola", label: "Angola" },
  { id: "argentina", label: "Argentina" },
  { id: "australia", label: "Australia" },
  { id: "austria", label: "Austria" },
  { id: "bangladesh", label: "Bangladesh" },
  { id: "belgium", label: "Belgium" },
  { id: "botswana", label: "Botswana" },
  { id: "brazil", label: "Brazil" },
  { id: "canada", label: "Canada" },
  { id: "chile", label: "Chile" },
  { id: "china", label: "China" },
  { id: "colombia", label: "Colombia" },
  { id: "czech_republic", label: "Czech Republic" },
  { id: "denmark", label: "Denmark" },
  { id: "egypt", label: "Egypt" },
  { id: "ethiopia", label: "Ethiopia" },
  { id: "finland", label: "Finland" },
  { id: "france", label: "France" },
  { id: "gambia", label: "Gambia" },
  { id: "ghana", label: "Ghana" },
  { id: "greece", label: "Greece" },
  { id: "india", label: "India" },
  { id: "indonesia", label: "Indonesia" },
  { id: "ireland", label: "Ireland" },
  { id: "israel", label: "Israel" },
  { id: "italy", label: "Italy" },
  { id: "ivory_coast", label: "Côte d'Ivoire" },
  { id: "japan", label: "Japan" },
  { id: "kenya", label: "Kenya" },
  { id: "malawi", label: "Malawi" },
  { id: "malaysia", label: "Malaysia" },
  { id: "mauritius", label: "Mauritius" },
  { id: "morocco", label: "Morocco" },
  { id: "mozambique", label: "Mozambique" },
  { id: "namibia", label: "Namibia" },
  { id: "netherlands", label: "Netherlands" },
  { id: "new_zealand", label: "New Zealand" },
  { id: "nigeria", label: "Nigeria" },
  { id: "norway", label: "Norway" },
  { id: "pakistan", label: "Pakistan" },
  { id: "philippines", label: "Philippines" },
  { id: "poland", label: "Poland" },
  { id: "portugal", label: "Portugal" },
  { id: "qatar", label: "Qatar" },
  { id: "rwanda", label: "Rwanda" },
  { id: "saudi_arabia", label: "Saudi Arabia" },
  { id: "senegal", label: "Senegal" },
  { id: "singapore", label: "Singapore" },
  { id: "south_africa", label: "South Africa" },
  { id: "south_korea", label: "South Korea" },
  { id: "south_sudan", label: "South Sudan" },
  { id: "spain", label: "Spain" },
  { id: "sri_lanka", label: "Sri Lanka" },
  { id: "sweden", label: "Sweden" },
  { id: "switzerland", label: "Switzerland" },
  { id: "tanzania", label: "Tanzania" },
  { id: "thailand", label: "Thailand" },
  { id: "tunisia", label: "Tunisia" },
  { id: "uganda", label: "Uganda" },
  { id: "ukraine", label: "Ukraine" },
  { id: "united_arab_emirates", label: "United Arab Emirates" },
  { id: "united_kingdom", label: "United Kingdom" },
  { id: "united_states", label: "United States" },
  { id: "zambia", label: "Zambia" },
  { id: "zimbabwe", label: "Zimbabwe" },
  { id: "other", label: "Other" },
];

export const automationActivityGroups: AutomationActivityGroup[] = [
  {
    id: "customer_sales",
    label: "Customer & Sales",
    activities: [
      { id: "customer_enquiries", label: "Responding to customer enquiries" },
      { id: "lead_follow_up", label: "Following up with leads" },
      { id: "quotation_preparation", label: "Preparing quotations" },
      { id: "proposal_preparation", label: "Preparing proposals" },
      { id: "customer_onboarding", label: "Customer onboarding" },
      { id: "customer_follow_up", label: "Customer follow-ups" },
      { id: "crm_updates", label: "Updating customer / CRM records" },
      { id: "customer_notifications", label: "Sending customer notifications" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    activities: [
      { id: "invoice_creation", label: "Creating invoices" },
      { id: "invoice_delivery", label: "Sending invoices" },
      { id: "payment_follow_up", label: "Following up unpaid invoices" },
      { id: "payment_reconciliation", label: "Reconciling payments" },
      { id: "expense_processing", label: "Processing expenses" },
      { id: "financial_reporting", label: "Preparing financial reports" },
      { id: "management_reporting", label: "Preparing management reports" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    activities: [
      { id: "data_entry", label: "Data entry" },
      { id: "spreadsheet_updates", label: "Updating spreadsheets" },
      { id: "document_preparation", label: "Preparing documents" },
      { id: "document_filing", label: "Filing documents" },
      { id: "information_search", label: "Searching for information" },
      { id: "recurring_reports", label: "Preparing recurring reports" },
      { id: "data_between_systems", label: "Copying data between systems" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    activities: [
      { id: "scheduling", label: "Scheduling work or appointments" },
      { id: "task_assignment", label: "Assigning tasks" },
      { id: "approval_workflows", label: "Managing approvals" },
      { id: "status_reporting", label: "Preparing status reports" },
      { id: "operations_monitoring", label: "Monitoring operational activities" },
      { id: "alerts_notifications", label: "Sending alerts or notifications" },
      { id: "work_tracking", label: "Tracking work progress" },
    ],
  },
  {
    id: "hr_people",
    label: "HR & People",
    activities: [
      { id: "employee_onboarding", label: "Employee onboarding" },
      { id: "leave_requests", label: "Managing leave requests" },
      { id: "attendance_management", label: "Managing attendance" },
      { id: "recruitment_admin", label: "Recruitment administration" },
      { id: "interview_scheduling", label: "Scheduling interviews" },
      { id: "employee_communication", label: "Employee communication" },
      { id: "hr_reporting", label: "Preparing HR reports" },
    ],
  },
  {
    id: "procurement_supply_chain",
    label: "Procurement & Supply Chain",
    activities: [
      { id: "purchase_requests", label: "Managing purchase requests" },
      { id: "purchase_orders", label: "Preparing purchase orders" },
      { id: "supplier_communication", label: "Communicating with suppliers" },
      { id: "supplier_follow_up", label: "Following up with suppliers" },
      { id: "inventory_updates", label: "Updating inventory" },
      { id: "stock_alerts", label: "Monitoring stock levels and alerts" },
      { id: "delivery_tracking", label: "Tracking deliveries" },
    ],
  },
  {
    id: "it_technology",
    label: "IT & Technology",
    activities: [
      { id: "access_requests", label: "Managing user access requests" },
      { id: "account_requests", label: "Handling account requests" },
      { id: "it_support_tickets", label: "Managing IT support tickets" },
      { id: "system_monitoring", label: "Monitoring systems" },
      { id: "incident_notifications", label: "Sending incident notifications" },
      { id: "routine_configuration", label: "Routine system configuration" },
      { id: "data_synchronization", label: "Synchronizing data between systems" },
    ],
  },
  {
    id: "reporting_compliance",
    label: "Reporting & Compliance",
    activities: [
      { id: "data_collection", label: "Collecting information for reports" },
      { id: "report_compilation", label: "Compiling reports" },
      { id: "compliance_checks", label: "Performing compliance checks" },
      { id: "document_review", label: "Reviewing documents" },
      { id: "audit_preparation", label: "Preparing for audits" },
      { id: "deadline_tracking", label: "Tracking compliance deadlines" },
    ],
  },
  {
    id: "custom",
    label: "Something Else",
    activities: [
      { id: "other_activity", label: "Something not listed here" },
    ],
  },
];

export const frequencyOptions: DiscoveryOption[] = [
  { id: "several_times_day", label: "Several times a day" },
  { id: "daily", label: "Daily" },
  { id: "several_times_week", label: "Several times a week" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "occasionally", label: "Occasionally" },
];

export const effortOptions: DiscoveryOption[] = [
  { id: "under_15_minutes", label: "Less than 15 minutes" },
  { id: "15_30_minutes", label: "15–30 minutes" },
  { id: "30_60_minutes", label: "30–60 minutes" },
  { id: "1_2_hours", label: "1–2 hours" },
  { id: "over_2_hours", label: "More than 2 hours" },
];

export const systemOptions: DiscoveryOption[] = [
  { id: "spreadsheet", label: "Spreadsheet" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "paper_manual", label: "Paper / manual process" },
  { id: "crm", label: "CRM" },
  { id: "erp", label: "ERP / accounting system" },
  { id: "multiple_systems", label: "Multiple systems" },
  { id: "other", label: "Other" },
];

export const painPointOptions: DiscoveryOption[] = [
  { id: "takes_too_much_time", label: "Takes too much time" },
  { id: "repetitive_data_entry", label: "Requires repetitive data entry" },
  { id: "frequent_errors", label: "Errors happen frequently" },
  { id: "information_lost", label: "Information gets lost" },
  { id: "too_many_approvals", label: "Requires too many approvals" },
  { id: "customer_waits", label: "Customers have to wait" },
  { id: "repeated_work", label: "Employees repeat the same work" },
  { id: "difficult_to_track", label: "Difficult to track" },
  { id: "difficult_to_report", label: "Difficult to report" },
  { id: "other", label: "Other" },
];

export const companySizeOptions: DiscoveryOption[] = [
  { id: "solo", label: "Just me" },
  { id: "2_10", label: "2–10 employees" },
  { id: "11_50", label: "11–50 employees" },
  { id: "51_200", label: "51–200 employees" },
  { id: "201_500", label: "201–500 employees" },
  { id: "501_1000", label: "501–1,000 employees" },
  { id: "1001_plus", label: "1,001+ employees" },
];

export function findOptionLabel(
  options: DiscoveryOption[],
  id: string
): string | undefined {
  return options.find((option) => option.id === id)?.label;
}

export function findActivity(
  activityId: string
): DiscoveryOption | undefined {
  for (const group of automationActivityGroups) {
    const activity = group.activities.find(
      (item) => item.id === activityId
    );

    if (activity) {
      return activity;
    }
  }

  return undefined;
}