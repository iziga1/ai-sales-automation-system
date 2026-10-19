# Lead Management — Validation Workflow

## Overview

This module demonstrates a reproducible B2B lead-validation workflow built with **n8n**, **Google Sheets**, and **JavaScript**. It reads synthetic lead records, normalizes and validates them, detects duplicate email addresses, and writes validation outcomes back to the existing spreadsheet rows.

The workflow is intended for a **portfolio demonstration**, not unattended production processing or real-world outreach.

## Repository files

| File | Purpose |
| --- | --- |
| `data/sample-leads.csv` | Synthetic B2B lead dataset with positive and negative test cases |
| `scripts/validate-leads.js` | Standalone Node.js validation logic and CLI report |
| `scripts/validate-leads.test.js` | Automated tests using the built-in Node.js test runner |
| `workflows/01-lead-validation.json` | Public, sanitized n8n workflow export |
| `docs/lead-management.md` | Setup, behavior, verification, and limitations |

## Data contract

The source sheet must be named `Leads` and contain these columns in its header row:

| Column | Required for validation? | Notes |
| --- | --- | --- |
| `lead_id` | Yes | Unique row identifier; also used to match updates |
| `company_name` | Yes | Non-empty after trimming |
| `contact_name` | Yes | Non-empty after trimming |
| `email` | Yes | Normalized and format-checked |
| `phone` | No | Empty values are accepted |
| `country` | Yes | Non-empty after trimming |
| `industry` | No | Empty values are accepted |
| `status` | No | Source/business status, not the validation result |
| `validation_result` | Output | `valid`, `invalid`, or `duplicate` |
| `duplicate_of` | Output | `lead_id` of the first valid record with the same normalized email, when applicable |
| `processed_at` | Output | ISO 8601 processing timestamp |
| `validation_errors` | Output | Semicolon-separated reasons for invalid records |

The spreadsheet is populated from `data/sample-leads.csv`, with the four output columns added separately. Use synthetic data only.

## Validation rules

1. Trim surrounding whitespace from text fields.
2. Normalize email addresses to lowercase.
3. Require `lead_id`, `company_name`, `contact_name`, `email`, and `country`.
4. Apply a basic email-format check. This does **not** verify that an email address or mailbox exists.
5. Reject repeated `lead_id` values as invalid within the current batch.
6. Mark a record `invalid` before attempting email deduplication when required fields or formats are invalid.
7. Among otherwise valid records, the first occurrence of a normalized email is `valid`; later occurrences are `duplicate` and reference the first record's `lead_id`.
8. Preserve the original business `status` and update only the validation-related columns in Google Sheets.

**Ordering matters:** email deduplication is performed within a single batch, in the order returned by Google Sheets. Reordering the input can change which record is treated as the original.

## Local validation and tests

Requirements: Node.js 18 or newer. No additional npm packages are required for the local scripts.

From the repository root:

```bash
node scripts/validate-leads.js
node --test scripts/validate-leads.test.js
```

For the current 30-row synthetic dataset, the expected validation summary is:

```json
{
  "total": 30,
  "counts": {
    "valid": 21,
    "invalid": 6,
    "duplicate": 3
  }
}
```

The test suite contains 11 checks, including normalization, required and optional fields, duplicate detection, CSV parsing, input immutability, and the dataset summary. These counts are dataset-specific; they are not universal business rules.

## n8n workflow

The exported workflow has four nodes:

1. **Manual Trigger** — starts an on-demand validation run.
2. **Google Sheets: Get Row(s)** — reads rows from the `Leads` sheet.
3. **Code: Validate & Deduplicate Leads** — runs once for all input items and produces normalized records with validation outputs.
4. **Google Sheets: Update Row** — matches on `lead_id` and writes `validation_result`, `duplicate_of`, `processed_at`, and `validation_errors`.

The n8n Code node contains an adapted version of the local validation logic. It does not import the local `scripts/validate-leads.js` file. Keep both implementations aligned if validation rules change.

### Setup after importing the public workflow

1. Start an n8n instance and import `workflows/01-lead-validation.json`.
2. Create a Google Sheets OAuth2 credential in n8n using a Google account with edit access to the test spreadsheet. Never commit OAuth secrets or tokens.
3. In **both** Google Sheets nodes, select your own spreadsheet and the `Leads` tab. The public export intentionally does not contain the original spreadsheet ID or credential binding.
4. Confirm that the **Get Row(s)** node returns all expected records.
5. In the Code node, select **JavaScript** and **Run Once for All Items**.
6. In the update node, set **Column to match on** to `lead_id`. Map only:

   | Target column | n8n expression |
   | --- | --- |
   | `lead_id` (matching value) | `{{ $json.lead_id }}` |
   | `validation_result` | `{{ $json.validation_result }}` |
   | `duplicate_of` | `{{ $json.duplicate_of }}` |
   | `processed_at` | `{{ $json.processed_at }}` |
   | `validation_errors` | `{{ $json.validation_errors }}` |

7. Save the workflow, then execute it manually and inspect the output sheet.

Avoid mapping original contact fields in the update node unless you intentionally want to overwrite them.

## Acceptance checks

| Check | Expected result |
| --- | --- |
| Read the sample dataset | 30 items |
| Run validation | 21 `valid`, 6 `invalid`, 3 `duplicate` |
| Duplicate references | `L016 → L001`, `L017 → L002`, `L027 → L001` |
| Invalid records | `validation_errors` describes the reason |
| Write results | Existing sheet rows receive validation output fields |
| Execute again | Row count remains 30; statuses remain consistent; `processed_at` changes |
| Local tests | All 11 tests pass |

A successful second run demonstrates safe repeated **updates for this sample dataset**. It does not prove transactional idempotency, concurrent-run safety, or exactly-once processing.

## Error handling and operational notes

- Configure nodes to **Stop Workflow** on errors rather than silently continue.
- Keep automatic retries disabled until transient failures and retry safety are explicitly designed.
- Review n8n execution history for failed runs; centralized alerting and error logging are not implemented in this MVP.
- Keep a backup of the test sheet before experimenting with write operations.
- Google OAuth credentials are stored in the n8n instance, not in the Git repository.
- The public workflow export must not include live spreadsheet identifiers, OAuth credentials, execution data, or private contact information.

## Known limitations and next improvements

- The email check is syntactic and intentionally lightweight.
- Duplicate detection is batch-local and order-dependent; it does not query a durable global lead registry.
- Matching updates by `lead_id` assumes unique IDs in the sheet. Repeated IDs can make updates ambiguous even though the validator flags them.
- The workflow reads and processes the complete input batch; pagination and high-volume scaling have not been tested.
- n8n and local JavaScript implementations can drift without shared source or parity tests.
- There is no automatic retry policy, dedicated error workflow, concurrency control, or audit database yet.
- CRM sync, AI call analysis, email drafting, and reporting belong to later development phases.

## Security and reproducibility

Use only synthetic leads in this repository. Do not commit real contact lists, personal email addresses, API keys, Client Secrets, access/refresh tokens, or credential exports. A sanitized workflow must be reconnected to the importer's own Google Sheets credential and spreadsheet before execution.
