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

## Setup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* An [OpenAI API Key](https://platform.openai.com/)

---

### Local Setup (Using npm/yarn)

#### 1. Clone the Repository
```bash
git clone https://github.com/Jyotiraditya21-bug/CRM-CSV-IMPORTER.git
cd CRM-CSV-IMPORTER
```

#### 2. Configure Environment Variables
* **Backend**: Create a `.env` file in the `backend/` directory:
  ```env
  PORT=5001
  OPENAI_API_KEY=your_actual_openai_key_here
  ```
* **Frontend**: Create a `.env.local` file in the `frontend/` directory:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5001
  ```
  *(Note: If you run the frontend locally and hit the Vercel-hosted backend, set `NEXT_PUBLIC_API_URL=https://crm-csv-importer-phi.vercel.app` or your production backend URL).*

#### 3. Run the Backend
```bash
cd backend
npm install
npm run dev
```
The backend server will run on `http://localhost:5001`.

#### 4. Run the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Next.js app will run on `http://localhost:3000`.

---

### Docker Setup (Docker Compose)
A `docker-compose.yml` is provided to run both backend and frontend services together.

1. Create the environment files (`backend/.env` and `frontend/.env.local`) as described above.
2. In the project root, run:
   ```bash
   docker-compose up --build
   ```
3. The frontend is accessible at `http://localhost:3000` and the backend at `http://localhost:5001`.

---

### Vercel Deployment Settings (Monorepo)
To host this Next.js app in a monorepo setup on Vercel:
1. In the **Vercel Project Dashboard**, go to **Project Settings**.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Next.js`.
4. Add `NEXT_PUBLIC_API_URL` under **Environment Variables** (pointing to your live backend server).
5. Click **Save** and trigger a **Redeploy**.

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
