
# Automated Follow-Up Workflow

## Overview

This n8n workflow generates personalized German B2B sales follow-up email drafts based on structured sales call analysis.

It uses Google Gemini to generate email content and Google Sheets to store drafts for human review.

**Important:** The workflow does not send emails automatically.

## Workflow Architecture

1. **Webhook** – Receives sales call analysis data via HTTP POST.
2. **Validate Follow-Up Data** – Validates required fields, data types, and email format.
3. **Is Follow-Up Data Valid?** – Rejects invalid requests.
4. **Is Follow-Up Required?** – Skips email generation when no follow-up is needed.
5. **Generate Follow-Up Draft** – Uses Google Gemini to create a personalized German email.
6. **Parse & Validate Email Draft** – Parses the AI-generated JSON and validates the email subject and body.
7. **Save Follow-Up Draft** – Stores the draft in Google Sheets using `call_id` as the matching key.
8. **Return Follow-Up Draft** – Returns the generated draft and a success response.

Dedicated error branches handle validation, AI service, AI parsing, and storage failures.

## Input Data

The webhook expects a JSON payload containing:

- `call_id`
- `lead_id`
- `company`
- `contact_name`
- `email`
- `interest_level`
- `lead_score`
- `summary`
- `next_action`
- `follow_up_required`

## AI Email Generation

Google Gemini generates a professional German-language follow-up email using the call summary and recommended next action.

The prompt instructs the model to:

- Use formal German business communication.
- Personalize the email using the contact and company.
- Reference the actual sales discussion.
- Include a clear, non-pushy call to action.
- Avoid inventing prices, dates, promises, or product features.
- Return structured JSON containing `subject` and `body`.

## Google Sheets Storage

Generated drafts are stored in the `Follow_Up_Drafts` worksheet.

Stored fields include:

`call_id`, `lead_id`, `company`, `contact_name`, `email`, `interest_level`, `lead_score`, `subject`, `body`, `follow_up_required`, `draft_status`, `generated_at`, and `model_provider`.

The workflow uses an append-or-update operation based on `call_id`.

All generated emails are stored with the status `draft`.

## HTTP Responses

| Status | Scenario |
|--------|----------|
| 200 | Follow-up draft generated and saved |
| 200 | Follow-up not required |
| 400 | Invalid input data |
| 502 | Invalid AI-generated response |
| 503 | AI service failure |
| 500 | Google Sheets storage failure |

## Testing

The workflow was tested locally using n8n, PowerShell, synthetic sales call data, Google Gemini, and Google Sheets.

Confirmed test results:

- Invalid email input was rejected.
- Requests with `follow_up_required: false` were skipped.
- A valid request generated a personalized German email.
- The generated draft was processed and saved through the Google Sheets node.

The successful AI execution exceeded the PowerShell client's 120-second timeout. Therefore, successful delivery of the HTTP 200 response to the client was not independently confirmed.

The AI service, AI parsing, and Google Sheets error-response branches were configured but not independently tested.

## Limitations

- Email drafts require human review before sending.
- No automatic email delivery is implemented.
- AI response times may vary.
- The workflow uses synchronous webhook processing, which may exceed client timeout limits.
- Google Sheets and Gemini credentials must be configured after importing the workflow.
- This project uses synthetic demonstration data only.

## Security

The public workflow export excludes environment-specific credential references, spreadsheet identifiers, and n8n instance metadata.

No real customer data or API keys are included.

## Future Improvements

- Asynchronous processing for long-running AI requests.
- Email approval workflow before sending.
- Automated retry handling for temporary API failures.
- Integration with a CRM system.
- Monitoring and execution logging.
