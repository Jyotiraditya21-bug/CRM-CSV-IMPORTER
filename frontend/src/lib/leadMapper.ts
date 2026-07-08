import { CRMRecord } from "./openai";

/**
 * Programmatic lead quality and conversion probability evaluator.
 */
export function evaluateLeadQuality(status: string | null, remarks: string) {
  let crm_status: string | null = null;
  let lead_relevancy: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let deal_probability = 10;
  let conversion_notes = "";

  const statusLower = (status || "").toLowerCase();
  const remarksLower = (remarks || "").toLowerCase();

  if (statusLower.includes("closed") || statusLower.includes("won") || statusLower.includes("completed") || statusLower.includes("done")) {
    crm_status = "SALE_DONE";
    lead_relevancy = "HIGH";
    deal_probability = 100;
    conversion_notes = "Deal closed successfully.";
  } else if (statusLower.includes("follow") || remarksLower.includes("demo") || remarksLower.includes("pricing") || remarksLower.includes("reschedule") || remarksLower.includes("callback")) {
    crm_status = "GOOD_LEAD_FOLLOW_UP";
    lead_relevancy = "HIGH";
    deal_probability = 75;
    conversion_notes = "Active interest or follow-up requested by the lead.";
  } else if (statusLower.includes("not connect") || statusLower.includes("busy") || remarksLower.includes("busy") || remarksLower.includes("unreachable")) {
    crm_status = "DID_NOT_CONNECT";
    lead_relevancy = "MEDIUM";
    deal_probability = 40;
    conversion_notes = "Temporary communication gap; follow-up is scheduled.";
  } else if (statusLower.includes("bad") || statusLower.includes("junk") || statusLower.includes("spam") || remarksLower.includes("wrong number") || remarksLower.includes("not interested")) {
    crm_status = "BAD_LEAD";
    lead_relevancy = "LOW";
    deal_probability = 0;
    conversion_notes = "Lead is uninterested, unreachable, or marked as a bad contact.";
  } else {
    crm_status = "GOOD_LEAD_FOLLOW_UP";
    lead_relevancy = "MEDIUM";
    deal_probability = 50;
    conversion_notes = "Standard lead; follow-up required.";
  }

  return { crm_status, lead_relevancy, deal_probability, conversion_notes };
}

/**
 * Separates phone country code, cleans punctuation/spaces, and places extra phones into notes.
 */
export function cleanPhone(phoneStr: string, crm_note: string) {
  let country_code = "";
  let mobile_without_country_code = phoneStr;
  let updated_note = crm_note;

  // Split multiple phone numbers
  if (phoneStr.includes("/") || phoneStr.includes(",")) {
    const parts = phoneStr.split(/[\/,]/);
    const firstPhone = parts[0].trim();
    const otherPhones = parts.slice(1).map(p => p.trim()).join(", ");
    mobile_without_country_code = firstPhone;
    updated_note = updated_note ? `${updated_note} | Extra phones: ${otherPhones}` : `Extra phones: ${otherPhones}`;
  }

  // Normalize spaces and dashes
  let cleanNum = mobile_without_country_code.trim().replace(/[\s-]/g, "");

  // Match country code
  if (cleanNum.startsWith("+")) {
    if (cleanNum.startsWith("+91")) {
      country_code = "+91";
      mobile_without_country_code = cleanNum.slice(3);
    } else {
      // General match: + followed by 1 to 3 digits, assuming base number is 7-10 digits
      const match = cleanNum.match(/^(\+\d{1,3})(\d{7,10})$/);
      if (match) {
        country_code = match[1];
        mobile_without_country_code = match[2];
      } else {
        mobile_without_country_code = cleanNum;
      }
    }
  } else if (cleanNum.length === 12 && cleanNum.startsWith("91")) {
    country_code = "+91";
    mobile_without_country_code = cleanNum.slice(2);
  } else if (cleanNum.length === 11 && cleanNum.startsWith("0")) {
    country_code = "";
    mobile_without_country_code = cleanNum.slice(1);
  } else {
    mobile_without_country_code = cleanNum;
  }

  return { country_code, mobile_without_country_code, crm_note: updated_note };
}

/**
 * Separates primary email from secondary emails, placing extras into notes.
 */
export function cleanEmail(emailStr: string, crm_note: string) {
  let primaryEmail = emailStr;
  let updated_note = crm_note;

  if (emailStr.includes(",") || emailStr.includes("/")) {
    const parts = emailStr.split(/[,/]/);
    primaryEmail = parts[0].trim();
    const otherEmails = parts.slice(1).map(e => e.trim()).join(", ");
    updated_note = updated_note ? `${updated_note} | Extra emails: ${otherEmails}` : `Extra emails: ${otherEmails}`;
  }

  return { primaryEmail, crm_note: updated_note };
}

/**
 * Formats date to be standard and parseable in JavaScript.
 */
export function cleanDate(rawCreatedAt: string): Date {
  let validDate = new Date();
  if (rawCreatedAt) {
    const dateClean = String(rawCreatedAt).replace(/-/g, "/");
    const parsed = new Date(dateClean);
    if (!isNaN(parsed.getTime())) {
      validDate = parsed;
    }
  }
  return validDate;
}
