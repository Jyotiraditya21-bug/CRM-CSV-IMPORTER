import test from "node:test";
import assert from "node:assert";
import { evaluateLeadQuality, cleanPhone, cleanEmail, cleanDate } from "../services/leadMapper";

test("evaluateLeadQuality should map statuses and calculate probability correctly", () => {
  // Test SALE_DONE
  const q1 = evaluateLeadQuality("Deal closed", "onboarding started");
  assert.strictEqual(q1.crm_status, "SALE_DONE");
  assert.strictEqual(q1.lead_relevancy, "HIGH");
  assert.strictEqual(q1.deal_probability, 100);

  // Test GOOD_LEAD_FOLLOW_UP
  const q2 = evaluateLeadQuality("Interested", "Client is asking to reschedule demo");
  assert.strictEqual(q2.crm_status, "GOOD_LEAD_FOLLOW_UP");
  assert.strictEqual(q2.lead_relevancy, "HIGH");
  assert.strictEqual(q2.deal_probability, 75);

  // Test DID_NOT_CONNECT
  const q3 = evaluateLeadQuality("Did not connect", "busy, call later");
  assert.strictEqual(q3.crm_status, "DID_NOT_CONNECT");
  assert.strictEqual(q3.lead_relevancy, "MEDIUM");
  assert.strictEqual(q3.deal_probability, 40);

  // Test BAD_LEAD
  const q4 = evaluateLeadQuality("Junk Lead", "Wrong number, not interested");
  assert.strictEqual(q4.crm_status, "BAD_LEAD");
  assert.strictEqual(q4.lead_relevancy, "LOW");
  assert.strictEqual(q4.deal_probability, 0);
});

test("cleanPhone should split multiple phones and parse country code", () => {
  const p1 = cleanPhone("+919876543210 / +919876543219", "Original remarks");
  assert.strictEqual(p1.country_code, "+91");
  assert.strictEqual(p1.mobile_without_country_code, "9876543210");
  assert.ok(p1.crm_note.includes("Extra phones: +919876543219"));

  const p2 = cleanPhone("9876543210", "");
  assert.strictEqual(p2.country_code, "");
  assert.strictEqual(p2.mobile_without_country_code, "9876543210");
});

test("cleanEmail should split multiple emails", () => {
  const e1 = cleanEmail("test@example.com, test.work@example.com", "Original remarks");
  assert.strictEqual(e1.primaryEmail, "test@example.com");
  assert.ok(e1.crm_note.includes("Extra emails: test.work@example.com"));
});

test("cleanDate should format valid and default date values", () => {
  const d1 = cleanDate("2026-05-13 14:20:48");
  assert.ok(!isNaN(d1.getTime()));
  assert.strictEqual(d1.getFullYear(), 2026);
  assert.strictEqual(d1.getMonth(), 4); // May (0-indexed)
  assert.strictEqual(d1.getDate(), 13);
});
