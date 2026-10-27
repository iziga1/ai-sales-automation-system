
# Sales Automation Dashboard

## Overview

The Sales Automation Dashboard is the fourth module of the AI Sales Automation System.

It consolidates data from lead validation, AI call analysis, and automated follow-up workflows into a Google Sheets dashboard.

The reporting workflow is built with n8n and supports manual execution and scheduled daily updates.

## Architecture

The workflow consists of seven nodes:

1. Manual Trigger
2. Schedule Trigger
3. Read Leads (Google Sheets)
4. Read Call Analysis (Google Sheets)
5. Read Follow-Up Drafts (Google Sheets)
6. Calculate Sales KPIs (JavaScript Code)
7. Update Dashboard KPIs (Google Sheets)

Both triggers connect to the same reporting pipeline.

## Data Sources

The workflow reads three worksheets from the existing Google Sheets document:

- `Leads`
- `Call_Analysis`
- `Follow_Up_Drafts`

The calculated results are written to the `Dashboard` worksheet.

## Key Performance Indicators

| KPI | Description |
|-----|-------------|
| Total Leads | Number of lead records |
| Calls Analyzed | Number of stored call analyses |
| Average Lead Score | Average valid lead score from analyzed calls |
| Follow-Up Drafts | Number of records with `draft_status = draft` |
| Last Updated | UTC timestamp of the latest calculation |

## Dashboard Visualization

The Google Sheets dashboard includes:

- Four KPI summary cards
- A Sales Activity Overview column chart
- Formula-based references to the KPI data row
- A timestamp showing the latest report update

The visualization updates when the underlying KPI values change.

## Execution

The workflow supports two execution methods:

**Manual execution:** Run the workflow directly in n8n.

**Scheduled execution:** A Schedule Trigger is configured for daily execution at 08:00 in the `Europe/Sarajevo` time zone.

Scheduled execution requires the workflow to be published/activated and the n8n instance to be running.

## Google Sheets Update Strategy

The workflow uses the `Append or Update Row` operation.

The `report_id` field is used as the matching key, with the fixed value:

`SALES_DASHBOARD`

This allows subsequent executions to update the existing KPI row instead of creating duplicate reports.

## Testing

The workflow was tested locally with synthetic demonstration data.

Confirmed results:

- 30 lead records were retrieved.
- 1 AI call analysis record was retrieved.
- 1 follow-up draft record was retrieved.
- Average lead score was calculated as 85.
- KPI values were written to the Dashboard worksheet.
- Dashboard cards and the chart displayed the expected values.

The manual reporting pipeline was tested successfully.

The scheduled 08:00 execution has been configured but has not yet been independently verified.

## Security

The public workflow export excludes Google Sheets document identifiers, credential references, and instance-specific metadata.

Credentials and spreadsheet selections must be configured after importing the workflow.

The project uses synthetic demonstration data only.

## Limitations

- The dashboard depends on Google Sheets availability.
- The reporting workflow does not currently include dedicated error-handling branches.
- The dashboard is designed for a demonstration dataset, not large-scale analytics.
- Scheduled updates require a running n8n instance.
- The current chart displays activity counts, not conversion rates.

## Future Improvements

- Additional lead qualification and conversion KPIs
- Historical performance tracking
- CRM integration
- Error handling and monitoring
- Automated reporting notifications
