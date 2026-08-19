import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Color formatting helpers
const reset = '\x1b[0m';
const bold = '\x1b[1m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const red = '\x1b[31m';
const gray = '\x1b[90m';

console.log(`${cyan}${bold}`);
console.log('==============================================================================');
console.log('              🚀 MEDTWIN CLINICAL PATIENT DIGITAL TWIN PLATFORM              ');
console.log('==============================================================================');
console.log(`${reset}`);

// Ensure backend .env exists
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  console.log(`${yellow}⚡ Creating default backend/.env configuration file...${reset}`);
  fs.writeFileSync(
    backendEnvPath,
    `PORT=3001\nNODE_ENV=development\nMONGODB_URI=mongodb://localhost:27017/medtwin\nJWT_SECRET=medtwin_super_secret_jwt_key_2026\nALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000\n`
  );
}

// Ensure frontend .env exists
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  console.log(`${yellow}⚡ Creating default frontend/.env configuration file...${reset}`);
  fs.writeFileSync(frontendEnvPath, `VITE_API_BASE_URL=http://localhost:3001\n`);
}

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${yellow}⏹️  Shutting down MedTwin application services...${reset}`);

  if (backendProcess) {
    backendProcess.kill('SIGINT');
  }
  if (frontendProcess) {
    frontendProcess.kill('SIGINT');
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log(`${magenta}⏳ Step 1/2: Launching MedTwin Backend API & Auto-Seeding Database...${reset}`);

backendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let backendReady = false;

backendProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(`${gray}[Backend] ${output}${reset}`);

  if (!backendReady && output.includes('MedTwin Server running')) {
    backendReady = true;
    startFrontend();
  }
});

backendProcess.stderr.on('data', (data) => {
  process.stderr.write(`${red}[Backend Error] ${data.toString()}${reset}`);
});

function startFrontend() {
  console.log(`\n${magenta}⏳ Step 2/2: Launching MedTwin Frontend (Vite UI)...${reset}`);

  frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(`${cyan}[Frontend] ${output}${reset}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(`${yellow}[Frontend Warning] ${data.toString()}${reset}`);
  });

  setTimeout(() => {
    printDashboard();
  }, 2000);
}

function printDashboard() {
  console.log(`\n${green}${bold}`);
  console.log('==============================================================================');
  console.log('    ✅ MEDTWIN PLATFORM SUCCESSFULLY INITIALIZED AND READY TO USE!');
  console.log('==============================================================================');
  console.log(`${reset}`);
  console.log(`🌐 ${bold}Frontend UI URL:${reset}     ${cyan}http://localhost:5173${reset}`);
  console.log(`🔌 ${bold}Backend API URL:${reset}     ${cyan}http://localhost:3001/api${reset}`);
  console.log(`🗄️  ${bold}Database:${reset}            ${green}MongoDB (Local / Auto-Provisioned In-Memory)${reset}`);
  console.log('');
  console.log(`${bold}👥 DEMO LOGIN CREDENTIALS & PRE-LOADED USER DATA:${reset}`);
  console.log('------------------------------------------------------------------------------');
  console.log(`${bold}PATIENTS:${reset}`);
  console.log(` 1. ${bold}Hardish Sharma${reset} (Hypertension & Type 2 Diabetes)`);
  console.log(`    Email: ${green}patient@medtwin.test${reset}  | Password: ${green}Patient123!${reset} | Doctor PIN: ${yellow}123456${reset}`);
  console.log(` 2. ${bold}Aarav Patel${reset} (Chronic Asthma & Rhinitis)`);
  console.log(`    Email: ${green}patient2@medtwin.test${reset} | Password: ${green}Patient123!${reset} | Doctor PIN: ${yellow}234567${reset}`);
  console.log(` 3. ${bold}Sunita Verma${reset} (CKD Stage 2 & Osteoarthritis)`);
  console.log(`    Email: ${green}patient3@medtwin.test${reset} | Password: ${green}Patient123!${reset} | Doctor PIN: ${yellow}345678${reset}`);
  console.log('');
  console.log(`${bold}DOCTORS:${reset}`);
  console.log(` 1. ${bold}Dr. Priya Sharma${reset} (Cardiology & Internal Medicine)`);
  console.log(`    Email: ${green}doctor@medtwin.test${reset}   | Password: ${green}Doctor123!${reset}`);
  console.log(` 2. ${bold}Dr. Rajesh Kumar${reset} (Nephrology & Renal Care)`);
  console.log(`    Email: ${green}doctor2@medtwin.test${reset}  | Password: ${green}Doctor123!${reset}`);
  console.log(` 3. ${bold}Dr. Ananya Roy${reset} (Pulmonology & Allergy)`);
  console.log(`    Email: ${green}doctor3@medtwin.test${reset}  | Password: ${green}Doctor123!${reset}`);
  console.log('');
  console.log(`${bold}ADMIN:${reset}`);
  console.log(` 1. ${bold}Governance Admin${reset}`);
  console.log(`    Email: ${green}admin@medtwin.test${reset}   | Password: ${green}Admin123!${reset}`);
  console.log('------------------------------------------------------------------------------');
  console.log(`${gray}Press Ctrl+C anytime to stop all MedTwin application services cleanly.${reset}\n`);
}
