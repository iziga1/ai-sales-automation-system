# Development Plan

> **Status:** Planned | **Project:** AI Sales Automation System | **Approach:** Incremental, test-driven demonstrations

## 1. Objective

Build a reproducible portfolio MVP demonstrating lead validation, simulated AI call analysis, CRM synchronization, human-reviewed email follow-ups, and operational reporting. Use synthetic data only. Do not claim an integration is complete until it has been tested.

## 2. Working Agreement

- `main` contains reviewed, working changes.
- Create one feature branch per cohesive deliverable; open a pull request (PR) after implementation and testing.
- Commit small, understandable changes within each branch.
- Include sample inputs, expected outputs, test evidence, and documentation updates in each PR.
- Never commit real API keys, OAuth tokens, customer records, or unredacted n8n exports.
- Update README roadmap checkboxes only after verifying the corresponding functionality.

## 3. Delivery Sequence

### Phase 0 — Documentation and Setup

**Branch:** `docs/project-documentation`

**Tasks**
- [x] Initialize repository and basic folder structure.
- [x] Draft `README.md`.
- [x] Draft `docs/architecture.md`.
- [x] Draft `docs/requirements.md`.
- [x] Draft `docs/data-model.md`.
- [x] Draft this development plan.
- [ ] Review cross-document consistency and merge documentation PR.

**Acceptance criteria**
- Markdown renders on GitHub; Mermaid diagrams render correctly.
- All links and file paths resolve.
- Planned versus implemented capabilities are clearly labeled.
- No secrets or private data appear in committed files.

### Phase 1 — Lead Management MVP

**Branch:** `feature/lead-management`

**Deliverables**
- `data/sample-leads.csv`: at least 10 synthetic records including duplicates, missing fields, and malformed emails.
- `scripts/validate-leads.js`: normalization, required-field checks, basic email format validation, deterministic duplicate detection.
- `workflows/01-lead-validation.json`: import/read, transform, and write results.
- Test cases and screenshots or sanitized execution evidence.

**Implementation tasks**
1. Define the canonical lead schema and allowed validation statuses.
2. Prepare synthetic input data with known expected outcomes.
3. Implement validation and deduplication in JavaScript.
4. Configure Google Sheets credentials in n8n (never in Git).
5. Build and test the n8n workflow on sample data.
6. Write validation results to dedicated status fields without overwriting original input unexpectedly.
7. Document setup, manual execution, and troubleshooting.

**Acceptance criteria**
- Invalid emails and missing required fields are flagged.
- Duplicates are identified consistently across repeated runs.
- Running the workflow twice does not create duplicate output rows.
- A test report compares actual and expected statuses for all sample records.

### Phase 2 — AI Call Analysis MVP

**Branch:** `feature/ai-call-analysis`

**Deliverables**
- `data/sample-call-transcripts.json`: synthetic German-language conversations covering multiple outcomes.
- `workflows/02-ai-call-analysis.json`: authenticated or otherwise access-controlled webhook, input validation, AI analysis, output validation, routing to mock outcomes.
- Versioned AI prompt and expected structured output examples.
- Test evidence including malformed input and ambiguous dates.

**Implementation tasks**
1. Define `event_id`, `lead_id`, `call_id`, timestamp, and transcript fields.
2. Reject malformed or unauthorized webhook requests.
3. Check persistent event state before executing side effects.
4. Analyze the transcript with OpenAI and request structured output.
5. Validate the response against the documented schema.
6. Route ambiguous classifications or callback times to manual review.
7. Persist processing state and outcomes for traceability.

**Acceptance criteria**
- Each valid example produces a schema-valid analysis or a review-required result.
- Duplicate events do not repeat downstream actions.
- Invalid input and AI/API errors are logged without exposing credentials.
- Callback times are timezone-aware; uncertain times are not silently invented.

**Design note:** Google Sheets alone does not provide atomic uniqueness for concurrent events. For concurrency-safe idempotency, use a storage mechanism with a unique constraint or atomic insert (for example, PostgreSQL) before enabling parallel production-style webhook processing. A sequential mock demonstration may document this limitation.

### Phase 3 — CRM and Email Automation

**Branch:** `feature/crm-email-automation`

**Deliverables**
- `workflows/03-crm-sync.json` and `workflows/04-email-followup.json` (or clearly named equivalents).
- Mock CRM adapter or sandbox Pipedrive integration.
- Gmail draft creation with human review.
- Mapping documentation and safe retry tests.

**Implementation tasks**
1. Match leads by stable identifiers and search existing CRM records.
2. Create or update records without duplicates.
3. Record call outcomes and schedule follow-up tasks where requested.
4. Generate German-language email drafts from validated context.
5. Require manual approval before sending any external email.
6. Log external action IDs and outcomes for safe retries.

**Acceptance criteria**
- Reprocessing the same event does not create duplicate CRM records, activities, or email drafts.
- Interested, email-requested, and callback-requested actions can coexist.
- A failed API call is recoverable and visible in logs.
- No email is automatically sent during the MVP demo.

### Phase 4 — Reporting and Monitoring

**Branch:** `feature/reporting-monitoring`

**Deliverables**
- `workflows/05-reporting.json` (if reporting is automated).
- KPI data table and Looker Studio dashboard or documented equivalent.
- Centralized error reporting and sanitized execution logs.

**Implementation tasks**
1. Record lead validation, AI analysis, and downstream action outcomes.
2. Define numerator and denominator for every KPI.
3. Avoid double counting repeated events.
4. Display processed leads, validation outcomes, call outcomes, follow-ups, drafts, and failures.
5. Exercise transient and permanent failure paths.

**Acceptance criteria**
- Dashboard values match a manually calculated synthetic test dataset.
- Duplicate events do not inflate KPIs.
- Failures are discoverable and actionable.
- Screenshots contain no secrets or real customer information.

### Phase 5 — End-to-End Demo and Release

**Branch:** `feature/end-to-end-demo` (if changes are needed)

**Deliverables**
- End-to-end test scenario and reproducible setup guide.
- Sanitized workflow screenshots and a short demo recording.
- Updated README with actual implementation status and limitations.

**Acceptance criteria**
- A synthetic lead and call event can be traced from input to final logged outcome.
- At least one positive, one negative, one ambiguous, one duplicate, and one failure scenario are demonstrated.
- A reviewer can reproduce the demo using the instructions and their own credentials.

## 4. Suggested PR Checklist

Use this checklist for each implementation PR:

- [ ] Scope and acceptance criteria are documented.
- [ ] New or changed data contracts match `docs/data-model.md`.
- [ ] Tests and sample data are included.
- [ ] n8n workflow exports are sanitized.
- [ ] Secrets and personal data are absent.
- [ ] Failure and repeat-execution behavior is verified.
- [ ] Documentation and roadmap are updated.
- [ ] PR diff is reviewed before merge.

## 5. Test Matrix

| ID | Scenario | Expected outcome | Target phase |
|---|---|---|---|
| T-01 | Valid lead | Accepted and normalized | 1 |
| T-02 | Malformed email | Flagged invalid | 1 |
| T-03 | Duplicate lead | Marked duplicate without extra output row | 1 |
| T-04 | Interested caller requesting email and callback | All applicable actions selected | 2–3 |
| T-05 | Ambiguous callback date | Manual review required | 2 |
| T-06 | Duplicate `event_id` | No duplicate side effects | 2–3 |
| T-07 | CRM/API transient failure | Logged and safely retried | 3–4 |
| T-08 | KPI recalculation | Matches expected values without double counting | 4 |
| T-09 | Complete synthetic demo | Traceable input-to-output execution | 5 |

## 6. Dependencies and Risks

| Risk or dependency | Mitigation |
|---|---|
| n8n Cloud trial expires | Consider self-hosted n8n; document version and setup |
| No Pipedrive sandbox | Start with a mock adapter and label it clearly |
| API usage costs | Use small synthetic datasets, test limits, and manual triggers |
| AI output uncertainty | Validate schema and require review for ambiguity |
| Duplicate concurrent webhook delivery | Use atomic event reservation before real parallel processing |
| Sensitive information in exports or logs | Sanitize exports and inspect Git diffs before pushing |
| Provider API or UI changes | Record tested versions and update setup documentation |

## 7. Definition of Done

A phase is complete only when its acceptance criteria pass, the changes are reproducible, test evidence is available, the documentation reflects actual behavior, and the PR is reviewed and merged into `main`.

## 8. Immediate Next Action

Finish the documentation PR, then create `feature/lead-management` from the updated `main` branch. Begin with synthetic CSV data and a JavaScript validator before configuring the Google Sheets integration in n8n.
