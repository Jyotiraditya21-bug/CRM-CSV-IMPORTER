# GrowEasy AI-Powered CRM Importer

An intelligent, full-stack CSV importer that maps arbitrarily structured lead databases (Facebook leads, Google ads, Excel spreadsheets, marketing agency exports, etc.) into a normalized GrowEasy CRM layout using OpenAI's Structured Outputs.

## 🚀 Key Features

* **AI-Powered Field Mapping**: Maps raw columns dynamically using `gpt-4o-mini` with strict Zod schema validation (Structured JSON outputs).
* **Multi-Step Modal Flow**:
  1. **Upload**: Drag-and-drop CSV upload.
  2. **Preview**: View parsed raw data instantly in a scrollable, responsive layout with sticky headers (processed locally using PapaParse).
  3. **Confirm**: Confirm data upload, trigger concurrent batch processing on the backend.
  4. **Display**: View mapped leads side-by-side with skipped rows, detailed metrics, and color-coded status badges.
* **Complex Data Cleaning Rules**:
  * Automatically isolates the first phone number/email and moves additional ones into a normalized `crm_note`.
  * Verifies and formats raw dates so they are instantly parseable by JavaScript `new Date()`.
  * Skips invalid rows missing both phone and email.
  * Standardizes lead source and status columns into strict CRM enums.
* **Premium Dark UI**: Built with a sleek, premium dark interface matching the GrowEasy dashboard theme, featuring smooth hover states and transition animations.
* **Docker Support**: Containerized services using multi-stage builds.

---

## 🛠 Tech Stack

* **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript, Lucide Icons, PapaParse)
* **Backend**: Node.js + Express (TypeScript, Zod, OpenAI SDK)
* **AI Model**: OpenAI `gpt-4o-mini` with JSON Structured Outputs

---

## 📦 Getting Started

### Prerequisites

* Node.js (v18+)
* npm (v9+)
* An OpenAI API key

---

### Method A: Running Locally

#### 1. Setup the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables:
   * Copy `.env.example` to `.env`
   * Insert your OpenAI API key in `backend/.env`:
     ```env
     PORT=5001
     OPENAI_API_KEY=sk-your-openai-api-key
     ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *The server runs on [http://localhost:5001](http://localhost:5001).*

#### 2. Setup the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npm run dev
   ```
   *The frontend runs on [http://localhost:3000](http://localhost:3000).*

---

### Method B: Running with Docker Compose

1. Clone or navigate to the project root directory.
2. Build and start the containers using Docker Compose:
   ```bash
   OPENAI_API_KEY="your-openai-key-here" docker-compose up --build
   ```
3. Access the web app at [http://localhost:3000](http://localhost:3000) (Backend API connects on [http://localhost:5001](http://localhost:5001)).

---

## 📊 Testing with Mock Data

We've provided a dummy CSV template for testing at:
👉 [mock_leads.csv](file:///Users/jimmycodes/SDE_Project/mock_leads.csv)

This template includes various columns representing raw inputs (e.g. `Lead Date`, `Full Name`, `Contact Email`, `Phone Details`, `Company`, `Current Status`, `Remarks`).
* It includes rows with valid details.
* It includes a row with no contacts, which the backend will intelligently skip, updating the dashboard's "Skipped Records" counter.
* You can also download this template directly from the upload step in the dashboard UI.
