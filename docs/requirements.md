# System Requirements

> **Project:** AI Sales Automation System  
> **Version:** 1.0 (proposed)  
> **Status:** Specification only — features are not yet implemented  
> **Scope:** Portfolio MVP with synthetic leads and simulated call transcripts

## 1. Purpose

Define testable requirements for an n8n-based B2B sales automation demonstration. The solution will validate lead data, analyze simulated sales calls using OpenAI, route business actions, prepare CRM updates and email drafts, and report processing outcomes. The architecture is described in [`architecture.md`](architecture.md).

## 2. Scope and assumptions

**In scope:** synthetic CSV/Google Sheets leads; manual lead-import trigger; simulated call-event webhook; AI-generated structured analysis; business-rule routing; CRM sandbox or mock adapter; Gmail drafts or controlled mock; processing logs; basic dashboard; tests.

**Out of scope for the MVP:** placing real calls, automatic sending of outbound emails, production-scale deployment, collecting real customer data, and guaranteeing sales outcomes.

The MVP may use mocked external services when trial accounts or credentials are unavailable. A mock must be explicitly identified in the demo and README.

## 3. Priorities and requirement conventions

- **Must:** required for the end-to-end MVP demonstration.
- **Should:** important hardening or portfolio enhancement, implemented after the core flow.
- **Could:** optional enhancement if time permits.
- **FR:** functional requirement; **NFR:** non-functional requirement; **AC:** acceptance criterion.

A requirement is **Done** only when it is implemented, demonstrated with a repeatable test, and documented. This file describes intended behavior, not completed work.

## 4. Functional requirements

### 4.1 Lead management

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-001 | Must | Import lead records from a test CSV or Google Sheet. | A manually triggered workflow reads at least five synthetic leads and returns their IDs. |
| FR-002 | Must | Validate required fields (`lead_id`, `company_name`, `email`) and email syntax. | Missing required values and malformed emails are marked invalid; valid records continue. |
| FR-003 | Must | Normalize emails and identify duplicate lead records. | Emails are compared case-insensitively after trimming; repeated normalized email is flagged as duplicate without overwriting the original record. |
| FR-004 | Must | Persist validation outcomes. | Each input row has a traceable result: valid, invalid, or duplicate, with an explanatory reason. |
| FR-005 | Should | Prevent duplicate lead imports on repeated execution. | Running the import twice does not create duplicate lead records. |

### 4.2 Simulated call ingestion and AI analysis

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-006 | Must | Receive a simulated call event via webhook. | A valid JSON payload containing `event_id`, `lead_id`, `call_id`, `timestamp`, `language`, and `transcript` is accepted. |
| FR-007 | Must | Reject invalid webhook payloads. | Missing IDs, empty transcript, or invalid timestamp produce a controlled validation error and no downstream CRM/email actions. |
| FR-008 | Must | Detect repeated event delivery using `event_id`. | A repeated completed event returns or references the prior result without creating duplicate side effects. |
| FR-009 | Must | Match the call event to an existing validated lead. | An unknown or invalid `lead_id` is logged and routed to review; no CRM/email action occurs. |
| FR-010 | Must | Analyze a German-language simulated transcript using OpenAI. | The workflow returns a summary, interest classification, email/callback flags, and recommended next action. |
| FR-011 | Must | Validate AI output against a defined JSON schema and business rules. | Missing/invalid fields or contradictory results do not trigger external actions. |
| FR-012 | Must | Route uncertain interpretations to manual review. | Ambiguous callback time or insufficient transcript context produces `requires_review=true` and no automatic scheduling. |
| FR-013 | Should | Resolve callback times using event timestamp and timezone. | Relative dates are converted to unambiguous ISO 8601 timestamps only when timezone and reference time are known; otherwise review is required. |

### 4.3 CRM and follow-up

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-014 | Must | Update lead/contact status in a CRM sandbox or documented mock. | A valid processed event updates the corresponding test contact and records the call outcome. |
| FR-015 | Must | Create a follow-up task when requested. | A valid callback request creates exactly one task for that `event_id` and confirmed callback time. |
| FR-016 | Must | Support multiple actions from one call. | An interested lead requesting email and callback triggers all applicable actions, not just one branch. |
| FR-017 | Should | Retry transient CRM failures safely. | A simulated timeout can be retried without creating duplicate records or tasks. |

### 4.4 Email automation

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-018 | Must | Generate a German-language follow-up email based on validated call context. | The generated draft reflects the request and does not invent offers, prices, or commitments. |
| FR-019 | Must | Create a Gmail draft or documented mock draft for review. | A test email request produces one reviewable draft and records its identifier/status. |
| FR-020 | Must | Require human approval before any outbound sending. | The MVP cannot send an email automatically as part of call processing. |

### 4.5 Reporting and operations

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-021 | Must | Record processing outcomes and failures. | Each event has a traceable status, timestamp, and non-sensitive error information when applicable. |
| FR-022 | Must | Produce basic campaign metrics. | A report shows processed leads, invalid/duplicate leads, call classifications, draft counts, follow-up counts, and failures from the test dataset. |
| FR-023 | Should | Retry transient API errors and isolate permanent errors. | A temporary failure is retried within a configured limit; an invalid payload is not retried indefinitely. |
| FR-024 | Should | Surface failures for operator review. | A failed event appears in an error log or review queue with enough context for manual reprocessing. |
| FR-025 | Could | Add a Looker Studio dashboard. | Visualizations match counts in the underlying test dataset. |

## 5. Non-functional requirements

| ID | Priority | Requirement | Verification |
|---|---|---|---|
| NFR-001 | Must | No secrets in Git or exported n8n workflows. | Inspect staged changes and workflow exports before each push; `.env` is ignored. |
| NFR-002 | Must | Use synthetic test data only. | Repository contains no real customer contact information or real call recordings. |
| NFR-003 | Must | AI must not directly perform external business actions. | CRM and email actions are gated by n8n validation and deterministic business rules. |
| NFR-004 | Must | Avoid duplicate effects from webhook redelivery. | Replaying the same completed `event_id` does not add a second CRM task or email draft. |
| NFR-005 | Must | Preserve auditable processing outcomes. | A test event can be traced through validation, analysis, action results, and final status. |
| NFR-006 | Must | Use explicit timezones for scheduled callbacks. | No callback task is scheduled from an ambiguous date/time expression. |
| NFR-007 | Should | Restrict webhook access and validate requests. | Invalid authentication/signature (when configured) and malformed payloads are rejected. |
| NFR-008 | Should | Keep modules independently testable. | Each workflow can be exercised with documented sample inputs and expected outputs. |
| NFR-009 | Should | Fail safely when third-party services are unavailable. | Failure is logged; events remain retryable or require review, with no false success status. |
| NFR-010 | Should | Document setup and reproducibility. | Another developer can follow the setup guide using example variables and synthetic fixtures. |

## 6. Acceptance test scenarios

| Test | Related requirements | Input / action | Expected result |
|---|---|---|---|
| AC-001 | FR-001–004 | Import five leads including one malformed email and one duplicate. | Three valid, one invalid, one duplicate. |
| AC-002 | FR-006–011 | Submit a valid German-language call event for an existing lead. | Structured, schema-valid analysis is stored. |
| AC-003 | FR-008, NFR-004 | Submit the same completed `event_id` twice. | No duplicate CRM task or email draft. |
| AC-004 | FR-012–013, NFR-006 | Submit a transcript with an ambiguous callback date. | Manual review; no scheduled callback. |
| AC-005 | FR-014–016, FR-018–020 | Submit an interested call requesting both email and callback. | CRM updated, one follow-up task created, one draft created, no email sent. |
| AC-006 | FR-007, FR-011 | Submit malformed payload or invalid AI response. | Controlled failure/review and no downstream external action. |
| AC-007 | FR-021–024 | Simulate an external API timeout. | Failure recorded; bounded retry or review path; no false completion. |
| AC-008 | FR-022, NFR-005 | Generate report from known fixtures. | Metrics match the fixture outcomes and can be traced to source events. |

## 7. MVP definition of done

The MVP is complete when:

- [ ] FR requirements marked **Must** are implemented or explicitly documented as mock-backed demonstrations.
- [ ] AC-001 through AC-008 have reproducible results and evidence.
- [ ] Workflow JSON exports are sanitized and committed to `workflows/`.
- [ ] Synthetic sample data and expected outputs are committed to `data/`.
- [ ] `README.md` reflects actual implementation status and clearly labels mocked integrations.
- [ ] The end-to-end demo shows one successful multi-action event, one duplicate event, and one failure/review case.

## 8. Traceability and change control

Architecture: [`architecture.md`](architecture.md). Detailed data schemas: [`data-model.md`](data-model.md) (planned). Development phases: [`development-plan.md`](development-plan.md) (planned).

When a requirement changes, update its acceptance criteria and affected tests in the same feature pull request. Avoid claiming that a planned integration is live until it has been exercised successfully.