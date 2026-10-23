# AICTE SecureDeposit 🏛️
### Centralized Security Deposit & Fixed Deposit Receipts (FDR) Management System
**Smart India Hackathon (SIH 2026)**

---

## 📌 Executive Summary
**AICTE SecureDeposit** is a modern government-tech web application engineered for the All India Council for Technical Education (AICTE) to automate, secure, and monitor collateral security deposits and Fixed Deposit Receipts (FDRs) submitted by technical education institutions across India.

Under statutory AICTE regulations (Section 10(k) of the AICTE Act), institutions must maintain unencumbered security deposits with mandatory joint lien in favor of **Member Secretary, AICTE New Delhi**. AICTE SecureDeposit replaces error-prone physical paperwork with automated reconciliation, simulated Core Banking System (CBS) / SFMS gateway integration, proactive discrepancy detection, statutory maturity reminders, and multi-tier refund workflows.

---

## 🚀 Key Working Features

1. **Role-Based Interactive Dashboards**:
   - **Institution Perspective**: View active deposit portfolio, monitor maturity countdowns, submit new FDR registrations, and apply for renewals or deposit releases.
   - **AICTE Scrutiny Officer**: Verification queue, automated discrepancy flags, simulated CBS/SFMS gateway cross-examination, and recommendation forwarding.
   - **Competent Approver (Financial Adviser)**: Financial oversight, executive sanction queue, and digital sign-off with cryptographic tokens (`DIGI-SIGN-AICTE-...`).
   - Seamless live role switcher in the header for hackathon demonstrations.

2. **FDR Registration & Document Ingestion**:
   - Comprehensive form: Technical Institution, FDR Certificate Number, Approved Bank, Branch, IFSC code, Principal Amount (with automated Indian words converter), Interest Rate, Issue Date, Tenure (3 to 10 years), and calculated Maturity Date.
   - Pre-filled mandatory joint clause: *"Member Secretary, AICTE New Delhi"* and irrevocable lien confirmation certificate.
   - Document upload with automated drag-and-drop file ingestion (PDF, PNG, JPG).
   - Real-time duplicate FDR number detection across technical institutions.

3. **FDR Central Repository**:
   - Master ledger with tabs: *All Deposits, Active & Verified, Expiring (<90 Days), Matured, Pending Verification, Discrepancy Flagged, Renewal In Review, Release In Review, and Released/Refunded*.
   - Filter by bank and instant full-text search across FDR numbers, college names, and branches.
   - Export filtered registry directly to CSV.
   - Detailed modal preview with printable certificate format.

4. **Side-by-Side Verification Engine**:
   - Directly displays **Institution-Submitted Information** on the left and **Bank-Confirmed Information (SFMS / CBS)** on the right.
   - Visual highlighting of matching and mismatched parameters.

5. **Automated Discrepancy Detection & Scrutiny**:
   - Rules engine detects:
     - Amount variance (e.g. institution claimed ₹45,00,000 vs bank confirmed ₹40,00,000).
     - Maturity date variance and tenure mismatch.
     - Missing AICTE lien endorsement in bank CBS account master.
     - Missing mandatory IFSC or branch details.
     - Duplicate FDR numbers registered across institutions.
   - Dedicated Resolution modal for AICTE Officers to record audit notes and resolve items.
   - **Statutory Notice**: Clearly highlights that *OCR document extraction assists preliminary data entry and does NOT prove legal authenticity.*

6. **Maturity Reminders & Renewal Tracking**:
   - Real-time maturity tracking with color-coded countdown chips (amber for <90 days, red for overdue).
   - Automated AICTE statutory notice generator for 90-day, 60-day, 30-day, and urgent overdue alerts.
   - Renewal application submission and review queue (updates FDR number and maturity upon approval).

7. **Multi-Tier Release & Refund Workflow**:
   - **Stage 1 (Institution)**: Submits release application with reason (e.g. 10-year lock-in completion, closure NOC) and designated refund account credentials.
   - **Stage 2 (AICTE Officer)**: Scrutinizes academic compliance, verifies university NOC, and enters recommendation.
   - **Stage 3 (Financial Approver)**: Authorizes release with digital signature token and generates an official printable Sanction Order.

8. **Immutable Audit Trail**:
   - Complete historical ledger of every state change, document upload, simulated bank check, discrepancy resolution, and approver sanction.
   - Filter by entity type and actor role; export to CSV or JSON.

---

## 🛠️ Technology Stack
- **Frontend**: React.js 19, Tailwind CSS v4, Lucide React icons, Vite 8.
- **Backend**: Python 3.14+, FastAPI, SQLAlchemy, Pydantic, Uvicorn.
- **Database**: PostgreSQL (configurable via `DATABASE_URL`) or automatic SQLite fallback (`aicte_securedeposit.db`).
- **Architecture**: RESTful API with automated database schema migration, seed data auto-population, and static asset handling.

---

## 🏃 Quick Start Guide

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js 18+ and npm

### 1. Start the Backend API Server
Open a terminal in the project directory:
```bash
# Navigate to backend directory
cd d:\FDR\backend

# Install backend dependencies (if not already installed)
py -m pip install fastapi uvicorn sqlalchemy pydantic python-multipart psycopg2-binary

# Start FastAPI Uvicorn Server
py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be available at:
- **API Root**: `http://localhost:8000`
- **Swagger Interactive Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

### 2. Start the Frontend Development Server
Open a second terminal:
```bash
# Navigate to frontend directory
cd d:\FDR\frontend

# Install dependencies (if not already installed)
npm install

# Start Vite Development Server
npm run dev
```
The frontend portal will be accessible at:
- **Web App**: `http://localhost:5173`

---

## ⚙️ Environment Configuration (Optional PostgreSQL)
By default, the backend runs seamlessly out-of-the-box using local SQLite (`sqlite:///./aicte_securedeposit.db`). To connect to a live PostgreSQL database:
Set the environment variable before starting the backend:
```powershell
$env:DATABASE_URL="postgresql://username:password@localhost:5432/aicte_securedeposit"
```
Or define it in a `.env` file in `d:\FDR\backend\.env`.

---

## 🧪 SIH 2026 Live Demo Script

1. **Explore the Dashboard**:
   - Observe live custody value (₹4.50 Cr), active deposits, expiring count, and discrepancy alerts.
   - Examine the status breakdown and bank distribution bar chart.
2. **Switch Roles**:
   - In the top header bar, click between **Institution**, **AICTE Officer**, and **Approver** to see contextual views and permissions.
3. **Inspect the Side-by-Side Verification Engine**:
   - Click **Verification & Discrepancy** in the sidebar.
   - Select FDR `FDR-SBIN-30192847` (Amount Mismatch scenario).
   - Observe the side-by-side comparison: Institution claimed ₹45,00,000, while Bank CBS ledger confirmed only ₹40,00,000.
   - Notice the highlighted critical variance and resolution button.
   - Test the **Simulated Bank Gateway**: Switch scenario to *Exact Match* and click **Execute Bank Verification** to observe real-time status update.
4. **Register a New FDR**:
   - Switch role to **Institution** and click **Register New FDR**.
   - Enter details or click **Auto-Populate Sample Values** to test automated number-to-words conversion and document attachment.
   - Try typing an existing FDR number like `FDR-SBIN-89410294` to see duplicate detection warnings.
5. **Maturity & Notice Dispatch**:
   - Navigate to **Maturity & Renewals**.
   - Click **Dispatch Statutory Notices** to generate formal AICTE renewal reminder letters.
   - Click **View Notice** to inspect formal government advisory wording.
6. **Release & Refund Sanction**:
   - Switch role to **Approver** and go to **Release & Refund Workflow**.
   - Find application `REL-AICTE-2026-0011` (recommended by Officer).
   - Click **Sanction Release** and submit approval.
   - Click **Sanction Order** to view and print the formal AICTE release order with cryptographic digital signature token.
7. **Resetting Demo Data**:
   - Click **Reset Demo** in the top navigation bar at any time to return the system to pristine presentation state.

---

## 🏛️ AICTE Vigilance Protocol & Legal Disclaimers
1. **Simulated Bank Verification**: Bank verification is executed against a simulated Core Banking System / SFMS test gateway for demonstration purposes. In production, this interfaces directly with the RBI SFMS/NEFT gateway leased line.
2. **Authenticity Notice**: In accordance with AICTE vigilance standards, *Optical Character Recognition (OCR) is an automated assistive tool for preliminary visual cross-referencing only and does NOT prove legal authenticity.* Legal authenticity is established strictly through CBS/SFMS bank verification.
