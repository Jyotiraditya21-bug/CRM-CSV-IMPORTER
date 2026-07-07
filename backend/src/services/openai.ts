import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    throw new Error("OpenAI API key is missing. Please configure OPENAI_API_KEY in the backend/.env file.");
  }
  return new OpenAI({ apiKey });
};

// CRM leads structure type
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string | null;
  crm_note: string;
  data_source: string | null;
  possession_time: string;
  description: string;
  lead_relevancy: "HIGH" | "MEDIUM" | "LOW";
  deal_probability: number;
  conversion_notes: string;
}

// Zod Schema for Dataset Schema Mapping & Analysis
const DatasetAnalysisSchema = z.object({
  dataset_type: z.enum(["crm_leads", "general"]).describe("Determine if the dataset contains sales/marketing CRM leads (crm_leads) or another general type of data (general)."),
  dataset_summary: z.string().describe("A short 1-2 sentence description of what this dataset contains and its apparent purpose."),
  crm_mapping: z.object({
    created_at: z.string().nullable().describe("Source column name containing lead creation date/timestamp."),
    name: z.string().nullable().describe("Source column name containing lead name or full name."),
    email: z.string().nullable().describe("Source column name containing email addresses."),
    phone: z.string().nullable().describe("Source column name containing phone numbers or mobile details."),
    company: z.string().nullable().describe("Source column name containing company or employer name."),
    city: z.string().nullable().describe("Source column name containing city."),
    state: z.string().nullable().describe("Source column name containing state/province."),
    country: z.string().nullable().describe("Source column name containing country."),
    lead_owner: z.string().nullable().describe("Source column name containing lead owner or assigned agent."),
    crm_status: z.string().nullable().describe("Source column name containing lead status/current state."),
    remarks: z.string().nullable().describe("Source column name containing comments, remarks, or notes."),
    data_source: z.string().nullable().describe("Source column name containing lead source/channel."),
    possession_time: z.string().nullable().describe("Source column name containing property possession time."),
    description: z.string().nullable().describe("Source column name containing additional descriptions.")
  }).nullable().describe("Column mapping dictionary. Provide null if dataset_type is 'general'."),
  general_analysis: z.object({
    normalized_headers: z.array(z.string()).describe("Normalized clean header names matching the input columns."),
    key_takeaways: z.array(z.string()).describe("3 key takeaways or insights from scanning the sample data."),
    data_quality_warnings: z.array(z.string()).describe("Any warnings about missing data, formatting errors, or issues in the sample.")
  }).nullable().describe("General analysis metadata. Provide null if dataset_type is 'crm_leads'.")
});

export type DatasetAnalysis = z.infer<typeof DatasetAnalysisSchema>;

/**
 * Analyzes the headers and a small sample of rows using OpenAI to detect the dataset type and mapping schema.
 */
export async function analyzeDatasetSchema(headers: string[], sampleRows: any[]): Promise<DatasetAnalysis> {
  const maxRetries = 3;
  let delayMs = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const openai = getOpenAIClient();

      const systemPrompt = `You are an expert AI data schema analyst.
Your task is to analyze a dataset's columns and sample data, determine if it contains sales/marketing CRM leads or is a general dataset, and map the headers accordingly.

If it is a sales/marketing CRM lead dataset (contains contact details like name, email, phone, status, company, etc.):
- Set dataset_type to 'crm_leads'.
- Map raw column names to the target CRM fields in crm_mapping. Set null for fields that cannot be mapped.

If it is a general dataset (e.g. products, classes, transactions, inventories, feedback):
- Set dataset_type to 'general'.
- Set crm_mapping to null.
- Fill general_analysis with clean normalized headers, 3 key takeaways/insights from the sample, and any data quality warnings.`;

      const userPrompt = `Headers: ${JSON.stringify(headers)}
Sample rows (up to 3): ${JSON.stringify(sampleRows, null, 2)}`;

      const response = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: zodResponseFormat(DatasetAnalysisSchema, "dataset_analysis"),
        temperature: 0.1,
      });

      const parsed = response.choices[0].message.parsed;
      if (!parsed) {
        throw new Error("Failed to parse dataset analysis from OpenAI");
      }

      return parsed;
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} to analyze dataset schema failed: ${error.message || error}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error("Dataset schema analysis failed after retries");
}
