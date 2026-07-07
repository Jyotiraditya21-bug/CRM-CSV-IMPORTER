import { Request, Response } from "express";
import { analyzeDatasetSchema, CRMRecord } from "../services/openai";
import { evaluateLeadQuality, cleanPhone, cleanEmail, cleanDate } from "../services/leadMapper";

interface ImportRequestBody {
  records: any[];
}

export async function handleImport(req: Request, res: Response) {
  try {
    const { records } = req.body as ImportRequestBody;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid payload. 'records' must be an array." });
    }

    if (records.length === 0) {
      return res.status(200).json({
        success: true,
        dataset_type: "general",
        dataset_summary: "Empty dataset",
        data: [],
        skipped: [],
        metrics: {
          total_imported: 0,
          total_skipped: 0
        }
      });
    }

    // Get the headers and first 3 sample rows
    const headers = Object.keys(records[0] || {});
    const sampleRows = records.slice(0, 3);

    console.log("Analyzing dataset schema with OpenAI...");
    const analysis = await analyzeDatasetSchema(headers, sampleRows);
    console.log(`Detected dataset type: ${analysis.dataset_type}`);

    if (analysis.dataset_type === "crm_leads") {
      const mapping = analysis.crm_mapping!;
      const mappedRecords: CRMRecord[] = [];
      const skippedRecords: { record: any; reason: string }[] = [];

      // Perform fast programmatic mapping in JavaScript (takes 0-2ms for 200 rows!)
      for (const raw of records) {
        // 1. Extract mapped fields
        const rawName = mapping.name ? raw[mapping.name] || "" : "";
        const rawEmail = mapping.email ? raw[mapping.email] || "" : "";
        const rawPhone = mapping.phone ? raw[mapping.phone] || "" : "";
        const rawCompany = mapping.company ? raw[mapping.company] || "" : "";
        const rawCreatedAt = mapping.created_at ? raw[mapping.created_at] || "" : "";
        const rawCity = mapping.city ? raw[mapping.city] || "" : "";
        const rawState = mapping.state ? raw[mapping.state] || "" : "";
        const rawCountry = mapping.country ? raw[mapping.country] || "" : "";
        const rawLeadOwner = mapping.lead_owner ? raw[mapping.lead_owner] || "" : "";
        const rawStatus = mapping.crm_status ? raw[mapping.crm_status] || "" : "";
        const rawRemarks = mapping.remarks ? raw[mapping.remarks] || "" : "";
        const rawDataSource = mapping.data_source ? raw[mapping.data_source] || "" : "";
        const rawPossession = mapping.possession_time ? raw[mapping.possession_time] || "" : "";
        const rawDescription = mapping.description ? raw[mapping.description] || "" : "";

        // Rule 7: Skip invalid records missing both email and phone details
        const emailStr = String(rawEmail).trim();
        const phoneStr = String(rawPhone).trim();
        if (!emailStr && !phoneStr) {
          skippedRecords.push({
            record: raw,
            reason: "Contains neither email nor mobile number"
          });
          continue;
        }

        // Rule 5: Isolate contacts
        const cleanedPhoneObj = cleanPhone(phoneStr, rawRemarks);
        const cleanedEmailObj = cleanEmail(emailStr, cleanedPhoneObj.crm_note);

        // Rule 3: Date formatting
        const validDate = cleanDate(rawCreatedAt);

        // Evaluate lead quality
        const quality = evaluateLeadQuality(rawStatus, rawRemarks);

        // Normalize data source
        let data_source: string | null = null;
        const dsLower = String(rawDataSource).toLowerCase();
        if (dsLower.includes("demand")) data_source = "leads_on_demand";
        else if (dsLower.includes("meridian")) data_source = "meridian_tower";
        else if (dsLower.includes("eden")) data_source = "eden_park";
        else if (dsLower.includes("varah")) data_source = "varah_swamy";
        else if (dsLower.includes("sarjapur")) data_source = "sarjapur_plots";

        const mapped: CRMRecord = {
          created_at: validDate.toISOString(),
          name: rawName,
          email: cleanedEmailObj.primaryEmail,
          country_code: cleanedPhoneObj.country_code,
          mobile_without_country_code: cleanedPhoneObj.mobile_without_country_code,
          company: rawCompany,
          city: rawCity,
          state: rawState,
          country: rawCountry,
          lead_owner: rawLeadOwner,
          crm_status: quality.crm_status,
          crm_note: cleanedEmailObj.crm_note,
          data_source,
          possession_time: rawPossession,
          description: rawDescription,
          lead_relevancy: quality.lead_relevancy,
          deal_probability: quality.deal_probability,
          conversion_notes: quality.conversion_notes
        };

        mappedRecords.push(mapped);
      }

      return res.status(200).json({
        success: true,
        dataset_type: "crm_leads",
        dataset_summary: analysis.dataset_summary,
        data: mappedRecords,
        skipped: skippedRecords,
        metrics: {
          total_imported: mappedRecords.length,
          total_skipped: skippedRecords.length
        }
      });
    } else {
      // General Dataset: Return raw records + Analysis insights
      return res.status(200).json({
        success: true,
        dataset_type: "general",
        dataset_summary: analysis.dataset_summary,
        data: records,
        skipped: [],
        general_analysis: analysis.general_analysis,
        metrics: {
          total_imported: records.length,
          total_skipped: 0
        }
      });
    }

  } catch (error: any) {
    console.error("Import controller error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
