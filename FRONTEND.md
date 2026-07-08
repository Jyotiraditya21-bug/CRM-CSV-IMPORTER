# Frontend Documentation

This document describes the structure and execution flow of the Next.js frontend application.

## Core Files

* **src/app/page.tsx**
  * The main Admin Dashboard dashboard.
  * Manages UI state, modal flow, file uploading, API requests, and result tables.
  * Displays Admin KPI statistics, rule centers, audit logs, and diagnostic telemetry.

* **src/app/globals.css**
  * Imports Tailwind CSS.
  * Configures dark mode backgrounds, font variables, and premium styling tokens.

* **src/lib/leadMapper.ts & src/lib/openai.ts**
  * Replicates the backend service mapping and OpenAI client helper code.
  * Enables Next.js serverless API routing for zero-config Vercel deployments.

* **src/app/api/import/route.ts**
  * Next.js serverless route handler for `/api/import`.
  * Runs backend tasks (schema detection and programmatic mapping) on Vercel without requiring a separate Express server.

## Step-by-Step Execution Flow

1. **Dashboard Entry**: User logs onto the Admin Portal and views operational KPIs (API Latency, accuracy, active rules).
2. **File Selection**: User launches the importer modal and uploads a CSV file using drag-and-drop or file picker.
3. **Local Parsing**: The browser parses the CSV into a JSON array locally using `PapaParse`.
4. **Data Preview**: Displays the raw column layout and first 100 rows in a responsive, sticky-header table.
5. **Import Confirmation**: User clicks "Confirm Import". The frontend fires a POST request to `/api/import` and renders a visual progress bar.
6. **Result Classification**:
   * **CRM Leads**: Displays mapped leads in a table showing color-coded relevancy badges, deal closing progress bars, and skipped metrics.
   * **General Dataset**: Renders the AI Insights panel (dataset summaries, takeaways, quality warnings) and binds raw rows to a dynamic data table.
