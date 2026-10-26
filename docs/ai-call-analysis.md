
# AI Call Analysis Workflow

## Overview

The AI Call Analysis workflow processes synthetic German B2B sales call transcripts using n8n and Google Gemini.

It validates incoming call data, generates a structured AI analysis, and saves the results to Google Sheets.

This workflow is part of the AI Sales Automation System portfolio project.

## Technology Stack

- n8n — workflow orchestration
- Google Gemini — AI-powered transcript analysis
- Google Sheets — analysis storage
- Webhook API — incoming call data

## Workflow Steps

1. Receive call data through an HTTP POST webhook.
2. Validate required fields and transcript length.
3. Send valid transcripts to Google Gemini.
4. Parse and validate the AI-generated JSON response.
5. Save the structured analysis to Google Sheets.
6. Return an HTTP response to the client.

## AI Analysis Output

Each successful analysis includes:

- `call_id`
- `lead_id`
- `interest_level`
- `lead_score` (0–100)
- `sentiment`
- `summary`
- `next_action`
- `follow_up_required`
- `analyzed_at`
- `model_provider`
- `analysis_status`

## Error Handling

| HTTP Status | Description |
|-------------|-------------|
| 200 | Analysis completed and saved |
| 400 | Invalid incoming call data |
| 500 | Analysis could not be saved |
| 502 | Invalid or incomplete AI response |
| 503 | AI model execution failed |

## Google Sheets Integration

Results are stored in the `Call_Analysis` worksheet.

The workflow uses `call_id` as the matching column for append-or-update operations, helping prevent duplicate analysis records.

## Security

The public workflow export excludes API keys, OAuth tokens, credential references, and environment-specific identifiers.

Users importing the workflow must configure their own Google Gemini credentials and Google Sheets connection.

## Testing

Verified scenarios:

- Successful AI analysis and Google Sheets storage (HTTP 200).
- Invalid transcript rejection with a structured error response (HTTP 400).
- Reprocessing an existing call without creating a duplicate Google Sheets row.

Additional error-handling branches for HTTP 500, 502, and 503 have been configured but not independently tested.

All example leads and call transcripts are synthetic. No real customer data or actual telephone calls are used.

## Current Limitations

- Call transcripts are supplied through a webhook; calls are not placed automatically.
- Google Sheets is used as a demonstration datastore.
- AI output quality depends on the model and transcript quality.
- Production deployment would require additional authentication, monitoring, and operational safeguards.
