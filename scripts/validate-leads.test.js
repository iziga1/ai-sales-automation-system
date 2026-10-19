
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  normalizeEmail,
  normalizeLead,
  validateLead,
  processLeads,
  parseCSV,
  readLeadsFromCSV,
} = require("./validate-leads");

function makeLead(overrides = {}) {
  return {
    lead_id: "L001",
    company_name: "Example GmbH",
    contact_name: "Max Mustermann",
    email: "max@example.com",
    phone: "+49301234567",
    country: "Germany",
    industry: "IT",
    status: "new",
    ...overrides,
  };
}

test("1. Normalizes email to lowercase", () => {
  assert.equal(
    normalizeEmail("  MAX@EXAMPLE.COM  "),
    "max@example.com"
  );
});

test("2. Trims text fields", () => {
  const lead = normalizeLead(
    makeLead({
      company_name: "  Example GmbH  ",
      contact_name: "  Max Mustermann  ",
    })
  );

  assert.equal(lead.company_name, "Example GmbH");
  assert.equal(lead.contact_name, "Max Mustermann");
});

test("3. Accepts a valid lead", () => {
  const errors = validateLead(makeLead());

  assert.deepEqual(errors, []);
});

test("4. Rejects invalid email format", () => {
  const errors = validateLead(
    makeLead({ email: "invalid-email" })
  );

  assert.ok(errors.includes("Invalid email format"));
});

test("5. Rejects missing required fields", () => {
  const errors = validateLead(
    makeLead({
      company_name: "",
      email: "",
    })
  );

  assert.ok(
    errors.includes("Missing required field: company_name")
  );

  assert.ok(
    errors.includes("Missing required field: email")
  );
});

test("6. Allows missing optional fields", () => {
  const errors = validateLead(
    makeLead({
      phone: "",
      industry: "",
    })
  );

  assert.deepEqual(errors, []);
});

test("7. Detects duplicate normalized emails", () => {
  const leads = [
    makeLead({
      lead_id: "L001",
      email: "max@example.com",
    }),
    makeLead({
      lead_id: "L002",
      email: "  MAX@EXAMPLE.COM  ",
    }),
  ];

  const report = processLeads(leads);

  assert.equal(report.counts.valid, 1);
  assert.equal(report.counts.duplicate, 1);
  assert.equal(report.results[1].duplicate_of, "L001");
});

test("8. Invalid records take priority over duplicates", () => {
  const leads = [
    makeLead({
      lead_id: "L001",
      email: "max@example.com",
    }),
    makeLead({
      lead_id: "L002",
      email: "max@example.com",
      company_name: "",
    }),
  ];

  const report = processLeads(leads);

  assert.equal(
    report.results[1].validation_result,
    "invalid"
  );
});

test("9. Does not mutate original input", () => {
  const original = makeLead({
    email: "  MAX@EXAMPLE.COM  ",
  });

  const before = structuredClone(original);

  processLeads([original]);

  assert.deepEqual(original, before);
});

test("10. Parses CSV with quoted commas", () => {
  const csv =
    'lead_id,company_name,email\n' +
    'L001,"Example, GmbH",max@example.com\n';

  const rows = parseCSV(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].company_name, "Example, GmbH");
});

test("11. Processes the complete sample dataset", () => {
  const csvPath = path.join(
    __dirname,
    "..",
    "data",
    "sample-leads.csv"
  );

  const leads = readLeadsFromCSV(csvPath);
  const report = processLeads(leads);

  assert.equal(report.total, 30);

  assert.deepEqual(report.counts, {
    valid: 21,
    invalid: 6,
    duplicate: 3,
  });
});
