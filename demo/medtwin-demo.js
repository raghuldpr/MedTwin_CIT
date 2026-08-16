const { chromium } = require("playwright");

const BASE_URL = "http://localhost:5173";

const PATIENT = {
  email: "patient@medtwin.test",
  password: "Patient123!",
};

const DOCTOR = {
  email: "doctor@medtwin.test",
  password: "Doctor123!",
};

async function pause(page, ms = 1200) {
  await page.waitForTimeout(ms);
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
  });

  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await context.newPage();

  console.log("Starting MedTwin demo...");

  // ============================================================
  // 1. PATIENT LOGIN
  // ============================================================

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  console.log("Patient login");

  await page
    .getByPlaceholder("you@example.com")
    .fill(PATIENT.email);

  await page
    .getByPlaceholder("Your password")
    .fill(PATIENT.password);

  await pause(page, 500);

  await page
    .locator('button[type="submit"]')
    .click();

  await page.waitForTimeout(2000);

  // ============================================================
  // 2. PATIENT DASHBOARD
  // ============================================================

  console.log("Patient dashboard");

  await page.waitForLoadState("networkidle");
  await pause(page, 1500);

  // ============================================================
  // 3. DIGITAL TWIN
  // ============================================================

  console.log("Digital Twin");

  await page.locator("#nav-digital-twin").click();

  await page.waitForTimeout(1500);

  // Show Heart
  const heartCard = page.locator('#organ-btn-heart, div:has-text("Heart")').first();
  if (await heartCard.count()) {
    await heartCard.click();
    await pause(page, 1000);
  }

  // Show Lungs
  const lungsCard = page.locator('#organ-btn-lungs, div:has-text("Lungs")').first();
  if (await lungsCard.count()) {
    await lungsCard.click();
    await pause(page, 1000);
  }

  // Show Brain
  const brainCard = page.locator('#organ-btn-brain, div:has-text("Brain")').first();
  if (await brainCard.count()) {
    await brainCard.click();
    await pause(page, 1200);
  }

  // ============================================================
  // 4. VITALS
  // ============================================================

  console.log("Vitals");

  await page.locator("#nav-vitals").click();

  await page.waitForTimeout(1500);
  await pause(page, 1500);

  // ============================================================
  // 5. MEDICATIONS
  // ============================================================

  console.log("Medications");

  await page.locator("#nav-medications").click();

  await page.waitForTimeout(1500);
  await pause(page, 1500);

  // ============================================================
  // 6. CONSENT & ACCESS
  // ============================================================

  console.log("Consent & Access");

  await page.locator('[id="nav-consent-&-access"]').click();

  await page.waitForTimeout(1500);

  await page
    .getByRole("button", { name: "Grant New Access" })
    .click();

  await pause(page, 1000);

  // Duration
  const duration = page.locator("select");

  if (await duration.count()) {
    await duration.selectOption({ label: "1 hour" });
  }

  // FULL permission
  const fullButton = page.getByRole("button", {
    name: "FULL",
  });

  if (await fullButton.count()) {
    await fullButton.click();
  }

  await pause(page, 500);

  await page
    .getByRole("button", { name: "Generate PIN" })
    .click();

  // Wait for generated PIN banner
  await page.waitForTimeout(1500);

  // ============================================================
  // 7. CAPTURE DYNAMIC PIN
  // ============================================================

  console.log("Capturing dynamic PIN...");

  const pinDigits = await page
    .locator("div.text-2xl.font-black")
    .allInnerTexts();

  const pin = pinDigits
    .map((digit) => digit.trim())
    .join("");

  // Capture Patient ID
  const patientId = await page
    .locator("span.font-mono.font-bold")
    .innerText();

  console.log("--------------------------------");
  console.log("PATIENT ID:", patientId);
  console.log("ACCESS PIN:", pin);
  console.log("--------------------------------");

  if (!/^\d{6}$/.test(pin)) {
    throw new Error(
      `Invalid PIN captured: "${pin}"`
    );
  }

  if (!patientId || patientId.trim().length < 5) {
    throw new Error(
      `Invalid Patient ID captured: "${patientId}"`
    );
  }

  console.log("PIN capture successful.");

  await pause(page, 2500);

  // ============================================================
  // 8. LOGOUT PATIENT
  // ============================================================

  console.log("Logging out patient");

  await page
    .locator("aside")
    .getByText("Hardish Sharma")
    .click();

  await pause(page, 700);

  await page
    .getByRole("button", { name: "Sign Out" })
    .click();

  await page.waitForTimeout(1500);

  // ============================================================
  // 9. DOCTOR LOGIN
  // ============================================================

  console.log("Doctor login");

  await page.goto(`${BASE_URL}/login`);

  await page.waitForLoadState("networkidle");

  await page
    .getByPlaceholder("you@example.com")
    .fill(DOCTOR.email);

  await page
    .getByPlaceholder("Your password")
    .fill(DOCTOR.password);

  await pause(page, 500);

  await page
    .locator('button[type="submit"]')
    .click();

  await page.waitForTimeout(2000);

  // ============================================================
  // 10. DOCTOR PORTAL
  // ============================================================

  console.log("Doctor portal");

  await page.waitForLoadState("networkidle");

  // Make sure we're on doctor portal
  if (!page.url().includes("/doctor")) {
    await page.goto(`${BASE_URL}/doctor`);
    await page.waitForLoadState("networkidle");
  }

  await pause(page, 1500);

  // ============================================================
  // 11. VERIFY PATIENT ACCESS
  // ============================================================

  console.log("Verifying patient authorization");

  await page
    .getByPlaceholder("Paste Patient User ID")
    .fill(patientId);

  await page
    .getByPlaceholder("123456")
    .fill(pin);

  await pause(page, 700);

  await page
    .getByRole("button", {
      name: "Verify Access PIN",
    })
    .click();

  await page.waitForTimeout(2500);

  console.log("Patient authorized successfully.");

  // ============================================================
  // 12. DOCTOR OVERVIEW
  // ============================================================

  await page
    .getByRole("button", {
      name: /overview/i,
    })
    .click();

  await pause(page, 1500);

  // ============================================================
  // 13. DOCTOR VITALS
  // ============================================================

  await page
    .getByRole("button", {
      name: /vitals/i,
    })
    .click();

  await pause(page, 1500);

  // ============================================================
  // 14. DOCTOR MEDICATIONS
  // ============================================================

  await page
    .getByRole("button", {
      name: /meds/i,
    })
    .click();

  await pause(page, 1500);

  // ============================================================
  // 15. AI DRUG SAFETY
  // ============================================================

  console.log("Drug Safety AI");

  await page
    .getByRole("button", {
      name: "Drug Safety AI",
    })
    .click();

  await pause(page, 1200);

  await page
    .getByPlaceholder(
      "Proposed medication (e.g. Lisinopril 10mg)"
    )
    .fill("Lisinopril 10mg");

  await pause(page, 800);

  await page
    .getByRole("button", {
      name: "Run Safety Check",
    })
    .click();

  await page.waitForTimeout(2500);

  console.log("Drug safety result displayed.");

  await pause(page, 2000);

  // ============================================================
  // 16. CLINICAL NOTE
  // ============================================================

  console.log("Adding clinical note");

  await page
    .getByRole("button", {
      name: /notes/i,
    })
    .click();

  await pause(page, 1000);

  const clinicalNote =
    "Patient evaluated. Blood pressure 120/80 mmHg well controlled. Continue current Amlodipine regimen.";

  await page
    .getByPlaceholder(
      "Enter clinical assessment, diagnostic impression, or treatment plan notes..."
    )
    .fill(clinicalNote);

  await pause(page, 800);

  await page
    .getByRole("button", {
      name: "Save Clinical Note",
    })
    .click();

  await page.waitForTimeout(2000);

  console.log("Clinical note saved.");

  // ============================================================
  // 17. FINAL OVERVIEW
  // ============================================================

  await page
    .getByRole("button", {
      name: /overview/i,
    })
    .click();

  await pause(page, 3000);

  console.log("");
  console.log("================================");
  console.log("MEDTWIN DEMO COMPLETE");
  console.log("Patient ID:", patientId);
  console.log("PIN:", pin);
  console.log("================================");
  console.log("");

  // Keep browser open for inspection
  await page.waitForTimeout(5000);

  await browser.close();
}

main().catch((error) => {
  console.error("");
  console.error("DEMO FAILED");
  console.error(error);
  process.exit(1);
});