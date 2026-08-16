/**
 * MedTwin Testreel Recording Runner
 * 
 * Integrates Testreel with the existing MedTwin Playwright workflow.
 * Renders a cinematic MP4 demo video with macOS window chrome, gradient background,
 * animated cursor movements, click ripples, and dynamic PIN/Patient ID verification.
 * 
 * Target Output: testreel-output/medtwin-demo.mp4
 */

const { chromium } = require("playwright");
const { recordPage } = require("testreel");
const fs = require("fs");
const path = require("path");
const http = require("http");

const BASE_URL = "http://localhost:5173";
const OUTPUT_DIR = path.join(__dirname, "..", "testreel-output");

const PATIENT = {
  email: "patient@medtwin.test",
  password: "Patient123!",
};

const DOCTOR = {
  email: "doctor@medtwin.test",
  password: "Doctor123!",
};

/**
 * Check if local server is reachable
 */
function checkServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Helper to pause and allow video pacing
 */
async function pause(recorder, ms = 1200) {
  await recorder.wait(ms);
}

async function main() {
  console.log("=========================================");
  console.log(" MedTwin Testreel Video Recording Runner ");
  console.log("=========================================\n");

  // 1. Verify frontend availability
  const isFrontendUp = await checkServer(`${BASE_URL}/login`);
  if (!isFrontendUp) {
    console.error(`[ERROR] Frontend server is not responding at ${BASE_URL}.`);
    console.error("Please ensure the frontend dev server is running (npm run dev in frontend/).");
    process.exit(1);
  }

  // 2. Clean previous testreel output
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log(`Cleaning previous recordings in ${OUTPUT_DIR}...`);
    try {
      const files = fs.readdirSync(OUTPUT_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      }
    } catch (e) {
      console.warn("  Warning cleaning output dir:", e.message);
    }
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 3. Launch browser with recordVideo enabled for Testreel
  console.log("Launching browser for video recording...");
  const browser = await chromium.launch({
    headless: true, // Headless ensures crisp, consistent frame capture
  });

  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: {
        width: 1440,
        height: 900,
      },
    },
  });

  const page = await context.newPage();

  // 4. Initialize Testreel PageRecorder with visual styling options
  console.log("Initializing Testreel recorder with window chrome & gradient background...");
  const recorder = await recordPage(page, {
    outputDir: OUTPUT_DIR,
    name: "medtwin-demo",
    outputFormat: "mp4",
    speed: 1.0,
    cursor: {
      enabled: true,
      style: "pointer",
      size: 48,
      rippleColor: "rgba(99, 102, 241, 0.6)",
      rippleSize: 90,
      transitionMs: 400,
    },
    chrome: {
      enabled: true,
      titleBarHeight: 38,
      titleBarColor: "#1e1e2e",
      trafficLights: true,
      url: "https://app.medtwin.health",
    },
    background: {
      enabled: true,
      gradient: {
        from: "#0f172a",
        to: "#1e1b4b",
      },
      padding: 60,
      borderRadius: 16,
    },
  });

  try {
    // ============================================================
    // SEGMENT 1: PATIENT LOGIN (0–15s)
    // ============================================================
    console.log("[1/9] Opening MedTwin Login...");
    await recorder.navigate(`${BASE_URL}/login`);
    await pause(recorder, 1500);

    console.log("[1/9] Patient login...");
    await recorder.type(
      page.getByPlaceholder("you@example.com"),
      PATIENT.email
    );
    await recorder.type(
      page.getByPlaceholder("Your password"),
      PATIENT.password
    );
    await pause(recorder, 500);

    await recorder.click(page.locator('button[type="submit"]'));
    await page.waitForLoadState("networkidle");
    await pause(recorder, 2000);

    // ============================================================
    // SEGMENT 2: PATIENT DASHBOARD & DIGITAL TWIN (15–25s)
    // ============================================================
    console.log("[2/9] Navigating to Digital Twin...");
    await recorder.click(page.locator("#nav-digital-twin"));
    await pause(recorder, 1500);

    // Heart organ
    const heartCard = page.locator('#organ-btn-heart, div:has-text("Heart")').first();
    if (await heartCard.count()) {
      console.log("      Interacting with Heart Twin...");
      await recorder.click(heartCard);
      await pause(recorder, 1000);
    }

    // Lungs organ
    const lungsCard = page.locator('#organ-btn-lungs, div:has-text("Lungs")').first();
    if (await lungsCard.count()) {
      console.log("      Interacting with Lungs Twin...");
      await recorder.click(lungsCard);
      await pause(recorder, 1000);
    }

    // Brain organ
    const brainCard = page.locator('#organ-btn-brain, div:has-text("Brain")').first();
    if (await brainCard.count()) {
      console.log("      Interacting with Brain Twin...");
      await recorder.click(brainCard);
      await pause(recorder, 1200);
    }

    // ============================================================
    // SEGMENT 3: VITALS & MEDICATIONS (25–32s)
    // ============================================================
    console.log("[3/9] Patient Vitals...");
    await recorder.click(page.locator("#nav-vitals"));
    await pause(recorder, 1800);

    console.log("[3/9] Patient Medications...");
    await recorder.click(page.locator("#nav-medications"));
    await pause(recorder, 1800);

    // ============================================================
    // SEGMENT 4: CONSENT & ACCESS PIN GENERATION (32–42s)
    // ============================================================
    console.log("[4/9] Consent & Access...");
    await recorder.click(page.locator('[id="nav-consent-&-access"]'));
    await pause(recorder, 1500);

    await recorder.click(page.getByRole("button", { name: "Grant New Access" }));
    await pause(recorder, 1000);

    // Select duration
    const duration = page.locator("select");
    if (await duration.count()) {
      await duration.selectOption({ label: "1 hour" });
    }

    // Select FULL permission
    const fullButton = page.getByRole("button", { name: "FULL" });
    if (await fullButton.count()) {
      await recorder.click(fullButton);
    }
    await pause(recorder, 500);

    // Generate PIN
    await recorder.click(page.getByRole("button", { name: "Generate PIN" }));
    await pause(recorder, 1500);

    // Dynamically capture generated PIN & Patient ID
    console.log("[4/9] Capturing dynamic PIN and Patient ID from DOM...");
    const pinDigits = await page
      .locator("div.text-2xl.font-black")
      .allInnerTexts();
    const pin = pinDigits.map((d) => d.trim()).join("");

    const patientId = await page
      .locator("span.font-mono.font-bold")
      .innerText();

    console.log("      --------------------------------");
    console.log("      DYNAMIC PATIENT ID:", patientId);
    console.log("      DYNAMIC ACCESS PIN:", pin);
    console.log("      --------------------------------");

    if (!/^\d{6}$/.test(pin)) {
      throw new Error(`Invalid PIN captured: "${pin}"`);
    }
    if (!patientId || patientId.trim().length < 5) {
      throw new Error(`Invalid Patient ID captured: "${patientId}"`);
    }

    await pause(recorder, 2500);

    // ============================================================
    // SEGMENT 5: PATIENT LOGOUT & DOCTOR LOGIN (42–50s)
    // ============================================================
    console.log("[5/9] Logging out patient...");
    await recorder.click(page.locator("aside").getByText("Hardish Sharma"));
    await pause(recorder, 700);

    await recorder.click(page.getByRole("button", { name: "Sign Out" }));
    await pause(recorder, 1500);

    console.log("[5/9] Doctor login...");
    await recorder.navigate(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    await recorder.type(
      page.getByPlaceholder("you@example.com"),
      DOCTOR.email
    );
    await recorder.type(
      page.getByPlaceholder("Your password"),
      DOCTOR.password
    );
    await pause(recorder, 500);

    await recorder.click(page.locator('button[type="submit"]'));
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/doctor")) {
      await recorder.navigate(`${BASE_URL}/doctor`);
      await page.waitForLoadState("networkidle");
    }
    await pause(recorder, 1500);

    // ============================================================
    // SEGMENT 6: DOCTOR AUTHORIZATION WITH DYNAMIC PIN (50–60s)
    // ============================================================
    console.log("[6/9] Doctor entering dynamic Patient ID + PIN...");
    await recorder.type(
      page.getByPlaceholder("Paste Patient User ID"),
      patientId
    );
    await recorder.type(
      page.getByPlaceholder("123456"),
      pin
    );
    await pause(recorder, 700);

    await recorder.click(
      page.getByRole("button", { name: "Verify Access PIN" })
    );
    await pause(recorder, 2500);
    console.log("      Patient authorized successfully.");

    // ============================================================
    // SEGMENT 7: AUTHORIZED DIGITAL TWIN (60–70s)
    // ============================================================
    console.log("[7/9] Doctor Overview...");
    await recorder.click(page.getByRole("button", { name: /overview/i }));
    await pause(recorder, 1500);

    console.log("[7/9] Doctor Vitals...");
    await recorder.click(page.getByRole("button", { name: /vitals/i }));
    await pause(recorder, 1500);

    console.log("[7/9] Doctor Medications...");
    await recorder.click(page.getByRole("button", { name: /meds/i }));
    await pause(recorder, 1500);

    // ============================================================
    // SEGMENT 8: DRUG SAFETY AI (70–80s)
    // ============================================================
    console.log("[8/9] Drug Safety AI Check...");
    await recorder.click(
      page.getByRole("button", { name: "Drug Safety AI" })
    );
    await pause(recorder, 1200);

    await recorder.type(
      page.getByPlaceholder("Proposed medication (e.g. Lisinopril 10mg)"),
      "Lisinopril 10mg"
    );
    await pause(recorder, 800);

    await recorder.click(
      page.getByRole("button", { name: "Run Safety Check" })
    );
    await pause(recorder, 2500);
    console.log("      Drug safety result displayed.");

    // ============================================================
    // SEGMENT 9: CLINICAL NOTE & FINAL BRANDING (80–90s)
    // ============================================================
    console.log("[9/9] Adding Clinical Note...");
    await recorder.click(page.getByRole("button", { name: /notes/i }));
    await pause(recorder, 1000);

    const clinicalNote =
      "Patient evaluated. Blood pressure 120/80 mmHg well controlled. Continue current Amlodipine regimen.";

    await recorder.type(
      page.getByPlaceholder(
        "Enter clinical assessment, diagnostic impression, or treatment plan notes..."
      ),
      clinicalNote
    );
    await pause(recorder, 800);

    await recorder.click(
      page.getByRole("button", { name: "Save Clinical Note" })
    );
    await pause(recorder, 2000);

    console.log("[9/9] Returning to Overview for final MedTwin branding...");
    await recorder.click(page.getByRole("button", { name: /overview/i }));
    await pause(recorder, 3000);

    // ============================================================
    // FINALIZE RECORDING & FFmpeg POST-PROCESSING
    // ============================================================
    console.log("\nFinalizing video recording & running FFmpeg post-processing...");
    const result = await recorder.stop();

    await browser.close();

    console.log("\n=========================================");
    console.log(" MEDTWIN DEMO VIDEO GENERATION COMPLETE  ");
    console.log("=========================================");
    console.log(" Generated Video Path :", result.video);
    console.log(" Dynamic Patient ID   :", patientId);
    console.log(" Dynamic Access PIN   :", pin);
    console.log("=========================================\n");

  } catch (error) {
    console.error("\n[RECORDING FAILED]", error);
    await browser.close();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during recording runner:", err);
  process.exit(1);
});
