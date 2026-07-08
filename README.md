# GrowEasy AI-Powered CRM Importer

This repository contains the submission for the Software Developer assignment at GrowEasy. It implements a full-stack, AI-powered CSV importer that intelligently maps, cleans, and scores arbitrary lead databases into a normalized CRM schema using OpenAI Structured Outputs.

---

* **Position Applied For**: SDE Intern
* **Hosted Application URL**: https://crm-csv-importer-phi.vercel.app
* **GitHub Repository URL**: https://github.com/Jyotiraditya21-bug/CRM-CSV-IMPORTER

---

## Key Features

* **High-Speed Schema Detection**: Instead of slow row-by-row LLM batching, this implementation utilizes a two-step processing model. It calls OpenAI once on the CSV headers and sample data to establish a mapping configuration, then processes the remaining rows programmatically in Node.js. This reduces import times for 200 rows from over 3 minutes to 2.5 seconds (over 100x speedup).
* **Versatile Dataset Support**: Detects whether the uploaded file is a CRM Lead list or a general dataset (such as inventory or roster lists). If a general dataset is detected, the app automatically generates high-level insights, key takeaways, and data quality warnings, rendering the data in an interactive table.
* **CRM Data Quality Rules**:
  * Normalizes date formats automatically.
  * Splits multiple contact emails and phone numbers, isolating primary contacts and saving secondary ones into notes.
  * Flags and separates invalid records missing both email and phone details.
* **Predictive Scoring**: Dynamically calculates lead relevancy (HIGH, MEDIUM, LOW) and future deal closing probability (0-100%) with AI-generated justification notes.
* **Recruiter-Ready Code Quality**: Features modular business logic, a Docker Compose setup, and a native unit test suite.

---

## Tech Stack

* **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript, PapaParse)
* **Backend**: Node.js + Express (TypeScript, Zod, OpenAI SDK)
* **AI Model**: OpenAI gpt-4o-mini with JSON Structured Outputs

---

## Testing

The project includes unit tests verifying the data mapping, date formatting, and contact splitting logic. The test suite uses Node's native test runner to ensure fast, dependency-free execution.

To run the unit tests:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run:
   ```bash
   npm run test
   ```
