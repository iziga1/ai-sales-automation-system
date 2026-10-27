
# Error Handling & Monitoring

## Overview

Error Handling & Monitoring is the fifth module of the AI Sales Automation System.

It provides centralized error logging for the project's n8n workflows. When a connected workflow fails during an automatic execution, n8n invokes a dedicated error-handling workflow that records the failure in Google Sheets.

## Architecture

The monitoring workflow consists of three nodes:

1. Error Trigger
2. Format Error Log (JavaScript Code)
3. Save Error Log (Google Sheets)

Workflow:

`Error Trigger → Format Error Log → Save Error Log`

## Monitored Workflows

The following modules are configured to use the central error workflow:

- 01 – Lead Validation
- 02 – AI Call Analysis
- 03 – Automated Follow-Up
- 04 – Sales Automation Dashboard

Each module references `05 - Error Handling & Monitoring` through its n8n Error Workflow setting.

## Error Log Structure

Errors are appended to the `Error_Logs` worksheet.

| Field | Description |
|-------|-------------|
| `error_id` | Generated identifier for the error record |
| `workflow_name` | Name of the workflow that failed |
| `workflow_id` | Identifier of the failed workflow |
| `execution_id` | Identifier of the failed execution, when available |
| `error_message` | Error message provided by n8n |
| `error_node` | Node associated with the failure |
| `timestamp` | UTC timestamp of the log entry |
| `status` | Initial status, set to `new` |

## Error Processing

The JavaScript Code node extracts error information from the Error Trigger payload.

It uses fallback values for missing fields, generates an error identifier, and formats the result as a structured record.

The Google Sheets node uses the `Append Row` operation, preserving each error as a separate log entry.

## Testing

A dedicated test workflow, `TEST - Error Monitoring`, was created with a Schedule Trigger and a Code node that deliberately throws an exception.

The test workflow was connected to the central error handler and executed automatically.

The following behavior was confirmed:

- The test workflow failed as expected.
- The central error workflow was invoked.
- A new record appeared in the `Error_Logs` worksheet.

The test workflow was intended to be unpublished after testing to prevent repeated failures.

## Setup

1. Import the sanitized workflow JSON into n8n.
2. Configure Google Sheets credentials.
3. Select the target spreadsheet and the `Error_Logs` worksheet.
4. Publish the monitoring workflow.
5. Configure the other workflows to use it under Settings → Error Workflow.
6. Test using a separate workflow with an intentional failure.

## Security

The public workflow export excludes Google Sheets document identifiers, credential references, and instance-specific metadata.

The monitoring workflow stores operational error information. In a production environment, error messages should be reviewed to prevent accidental logging of sensitive data.

## Limitations

- Error Trigger behavior depends on n8n execution mode and workflow configuration.
- Manual editor executions do not reliably invoke the configured error workflow.
- Google Sheets availability is required for successful logging.
- No automatic alert notifications or retry mechanism are currently implemented.
- The monitoring workflow itself does not have a separate fallback logging mechanism.

## Future Improvements

- Email or messaging alerts for critical errors
- Error severity classification
- Retry strategies for transient failures
- Error resolution tracking
- Monitoring dashboards and failure-rate reporting
