# Backend Documentation

This document describes the structure and execution flow of the Express backend service.

## Core Files

* **src/index.ts**
  * Launches the Express server on port 5001.
  * Configures CORS policy, JSON request parsing, and error-handling middlewares.
  * Registers the HTTP POST endpoint at `/api/import`.

* **src/controllers/import.ts**
  * Serves as the primary controller for data ingestion.
  * Receives raw rows from the client.
  * Initiates OpenAI schema detection using sample rows.
  * Invokes the mapping service to process, clean, and score lead records.
  * Returns JSON payloads classifying the dataset type, summary, and clean records.

* **src/services/openai.ts**
  * Connects to OpenAI API using the Node.js SDK and `gpt-4o-mini` model.
  * Performs schema detection using a strict Zod output format.
  * Implements an automatic retry loop (up to 3 attempts) with exponential backoff for network resilience.

* **src/services/leadMapper.ts**
  * Contains pure utility functions for data transformation:
    * `evaluateLeadQuality`: Identifies crm_status, lead_relevancy (HIGH/MEDIUM/LOW), and deal_probability (0-100) using keyword-matching rules.
    * `cleanPhone`: Separates country code from phone numbers and isolates additional contacts.
    * `cleanEmail`: Separates primary email address and moves secondary ones to notes.
    * `cleanDate`: Normalizes date string formatting.

* **src/test/leadMapper.test.ts**
  * Contains unit tests using Node's native testing framework (`node:test`).
  * Asserts the accuracy of phone splitting, email splitting, date formatting, and lead scoring.

## Step-by-Step Execution Flow

1. **Request Ingestion**: The backend receives a list of raw records at the `/api/import` endpoint.
2. **Sample Scanning**: The controller extracts the column headers and the first 3 sample rows.
3. **AI Schema Detection**: OpenAI evaluates the sample to determine the dataset type:
   * **CRM Leads**: Maps the headers to target CRM fields.
   * **General**: Identifies key takeaways, data summaries, and quality warnings.
4. **Programmatic Processing**:
   * For CRM Leads: Runs the programmatic mapping and cleaning loops. Validates date formats, splits contacts, evaluates lead quality, and filters invalid rows.
   * For General: Keeps the raw columns but applies basic sanitization.
5. **JSON Return**: Sends the structured results, metrics, and warnings back to the frontend.
