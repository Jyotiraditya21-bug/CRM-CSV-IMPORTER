import dotenv from "dotenv";
const envResult = dotenv.config();
console.log("Dotenv load result:", envResult);
console.log("Loaded API key prefix:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) : "undefined");

import express from "express";
import cors from "cors";
import { handleImport } from "./controllers/import";

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS
app.use(cors());

// Parse JSON payloads (increase size limit to support large CSVs)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check API
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "groweasy-crm-importer-backend" });
});

// Import API endpoint
app.post("/api/import", handleImport);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
