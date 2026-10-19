
const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FIELDS = [
  "company_name",
  "contact_name",
  "email",
  "country",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeLead(lead) {
  return {
    ...lead,
    lead_id: normalizeText(lead.lead_id),
    company_name: normalizeText(lead.company_name),
    contact_name: normalizeText(lead.contact_name),
    email: normalizeEmail(lead.email),
    phone: normalizeText(lead.phone),
    country: normalizeText(lead.country),
    industry: normalizeText(lead.industry),
    status: normalizeText(lead.status),
  };
}

function validateLead(lead) {
  const errors = [];

  if (!lead.lead_id) {
    errors.push("Missing lead_id");
  }

  for (const field of REQUIRED_FIELDS) {
    if (!lead[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (lead.email && !EMAIL_REGEX.test(lead.email)) {
    errors.push("Invalid email format");
  }

  return errors;
}

function processLeads(leads) {
  if (!Array.isArray(leads)) {
    throw new TypeError("Expected an array of leads");
  }

  const seenEmails = new Map();
  const seenIds = new Set();

  const results = leads.map((originalLead) => {
    const lead = normalizeLead(originalLead);
    const errors = validateLead(lead);

    if (seenIds.has(lead.lead_id)) {
      errors.push("Duplicate lead_id");
    }

    if (lead.lead_id) {
      seenIds.add(lead.lead_id);
    }

    let validation_result = "valid";
    let duplicate_of = null;

    // Invalid records take priority over duplicates.
    if (errors.length > 0) {
      validation_result = "invalid";
    } else if (seenEmails.has(lead.email)) {
      validation_result = "duplicate";
      duplicate_of = seenEmails.get(lead.email);
    } else {
      seenEmails.set(lead.email, lead.lead_id);
    }

    return {
      ...lead,
      validation_result,
      duplicate_of,
      validation_errors: errors,
    };
  });

  const counts = {
    valid: 0,
    invalid: 0,
    duplicate: 0,
  };

  for (const lead of results) {
    counts[lead.validation_result]++;
  }

  return {
    total: results.length,
    counts,
    results,
  };
}

// CSV parser supporting quoted fields, commas and escaped quotes.
function parseCSV(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const text = String(content).replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error("Malformed CSV: unclosed quoted field");
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows.shift().map((header) => header.trim());

  return rows
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values, index) => {
      if (values.length !== headers.length) {
        throw new Error(
          `CSV row ${index + 2}: expected ${headers.length} fields, got ${values.length}`
        );
      }

      return Object.fromEntries(
        headers.map((header, i) => [header, values[i]])
      );
    });
}

function readLeadsFromCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return parseCSV(content);
}

module.exports = {
  normalizeText,
  normalizeEmail,
  normalizeLead,
  validateLead,
  processLeads,
  parseCSV,
  readLeadsFromCSV,
};

// Run directly from the command line.
if (require.main === module) {
  const csvPath = path.join(
    __dirname,
    "..",
    "data",
    "sample-leads.csv"
  );

  try {
    const leads = readLeadsFromCSV(csvPath);
    const report = processLeads(leads);

    console.log("\n=== LEAD VALIDATION REPORT ===\n");

    console.log(
      JSON.stringify(
        {
          total: report.total,
          counts: report.counts,
        },
        null,
        2
      )
    );

    const problematicLeads = report.results
      .filter((lead) => lead.validation_result !== "valid")
      .map((lead) => ({
        lead_id: lead.lead_id,
        email: lead.email,
        result: lead.validation_result,
        duplicate_of: lead.duplicate_of,
        errors: lead.validation_errors.join("; "),
      }));

    console.log("\nProblematic leads:");
    console.table(problematicLeads);
  } catch (error) {
    console.error("Validation failed:", error.message);
    process.exitCode = 1;
  }
}
