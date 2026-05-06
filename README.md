# MemberSync

MemberSync is a professional, full-stack membership management platform designed for organizations to streamline their member lifecycles. Built with React, Vite, and Firebase, it provides a robust suite of tools for managing members, tracking payments, automating rules, and generating high-quality reports.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **State & Logic**: React Hooks, Context API
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database**: Cloud Firestore
- **Authentication**: Firebase Authentication (Email/Password & Google)
- **File Storage**: Firebase Storage
- **Backend Logic**: Firebase Cloud Functions v2
- **PDF Generation**: jsPDF & jsPDF-AutoTable
- **Utilities**: date-fns, json2csv, React Hot Toast

## ✨ Core Features

### 🏛️ Admin Portal
- **Global Dashboard**: Real-time analytics, revenue charts, and membership distribution.
- **Member Management**: Full CRUD operations with advanced filtering and search.
- **Approvals Workflow**: Review and approve/reject new member registrations.
- **Payments & Plans**: Manage subscription plans and track individual member payments.
- **Intelligence Engine**: Execute automated maintenance scans to identify risks and expired accounts.
- **Review Tasks**: Manage system-generated tasks for manual administrative action.
- **Audit Logs**: Detailed tracking of all critical system actions for transparency.
- **Reports**: Export comprehensive PDF and CSV reports for members and financial data.

### 👤 Member Portal
- **Digital Membership Card**: Real-time generated QR-enabled digital ID.
- **Profile Management**: Complete onboarding, update personal details, and bio.
- **Photo Uploads**: Profile picture management with secure Firebase Storage.
- **Announcements**: Stay updated with organization-wide news and notifications.
- **Status Tracking**: Monitor membership standing, plan details, and expiry.

## 🧠 Smart Membership Intelligence Engine

The "Smart Membership" engine is the heart of MemberSync, automating the complex logic of membership lifecycle management.

- **Automation**: Checks for membership expiry, grace periods, attendance risks, and repeated offenses.
- **Scheduled Run**: Automatically executes every 24 hours via Firebase Cloud Scheduler.
- **Manual Control**: Admins can trigger a "Preview Scan" (Dry Run) or "Full Scan" from the dashboard.
- **Escalation Logic**:
    - **Expiry**: Moves members to `grace_period` (1-7 days) then to `Expired`.
    - **Attendance**: Flags members as `watchlist` or `at_risk` based on participation.
    - **Offenses**: Automatically suspends members after 3 offenses and triggers termination review after 5.
    - **Payments**: Escalates unpaid dues to `overdue` and suspends after 30 days.
- **Outputs**: Generates system notifications, audit logs, and Admin Review Tasks.

## 📁 Project Structure

```
├── functions/               # Firebase Cloud Functions (Node.js)
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI, layout, and feature components
│   │   ├── auth/            # Protected routes and auth logic
│   │   ├── layout/          # Sidebars, Navbars, and Base Layouts
│   │   └── ui/              # Core design system (Buttons, Cards, Inputs)
│   ├── context/             # AuthContext for global state
│   ├── firebase/            # Firebase Client SDK configuration
│   ├── pages/               
│   │   ├── admin/           # Admin-only dashboard and management pages
│   │   ├── member/          # Member-specific profile and card pages
│   │   └── public/          # Login, Register, and Error pages
│   ├── services/            # API/Firestore service layer
│   └── utils/               # Formatters, role checks, and constants
├── firestore.rules          # Database security rules
└── storage.rules            # Storage security rules
```

## 🛠️ Installation & Setup

### 1. Clone & Install
```bash
# Install dependencies
npm install
```

### 2. Run Locally
```bash
# Start Vite development server
npm run dev
```
The app will typically be available at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

## 🔥 Firebase Configuration

The project requires a Firebase project with the following services enabled:
1.  **Authentication**: Enable Email/Password and Google providers.
2.  **Firestore Database**: Start in production or test mode.
3.  **Storage**: Enable for profile photo uploads.
4.  **Cloud Functions**: Requires the Blaze (pay-as-you-go) plan.

### Environment Setup
Firebase configuration is currently located in `src/firebase/config.js`. Replace the `firebaseConfig` object with your own credentials from the Firebase Console.

## 🗄️ Firestore Collections

- **members**: Core member profiles, roles, and status.
- **payments**: Transaction history for membership fees.
- **notifications**: System and admin-generated alerts for users.
- **announcements**: Public news posts for all members.
- **membershipPlans**: Available subscription tiers (Basic, Standard, Premium).
- **auditLogs**: Immutable trail of administrative and system actions.
- **maintenanceRuns**: Summaries of Membership Intelligence Engine executions.
- **adminReviewTasks**: Flagged items requiring manual admin intervention.

## 📁 Firebase Storage

- **Path**: `member-profile-photos/{uid}/profile.{ext}`
- **Rules**: Owners can upload/update their own photos; authenticated users can view.
- **Note**: The system stores a `profilePhotoBase64` string in Firestore to ensure high reliability for PDF generation (avoiding CORS issues).

## ⚡ Cloud Functions

- **populateDatabase**: Resets and populates the database with 30+ demo members, payments, and rule-engine scenarios.
- **runMembershipRulesEngineNow**: Manually triggers the intelligence engine for an organization.
- **dailyMembershipRulesEngine**: A scheduled task that runs every 24 hours.

### Deployment Commands
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:runMembershipRulesEngineNow

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🧪 Creating Test Accounts

### Demo Admin Account
1.  Create a user in **Firebase Auth** (e.g., `admin@membersync.com`).
2.  Copy the **UID**.
3.  Create a document in the `members` collection with that **UID** as the ID.
4.  Set `role: "admin"` and `status: "active"`.
5.  Set `organizationId: "default"`.

### Demo Member Account
- Register directly through the application's `/register` page.
- New registrations default to `role: "member"` and `status: "Pending"`.

## 📊 Populate Demo Data
Admins can click the **"Populate Database"** button in the Admin Settings/Dashboard. This will:
- Clear existing demo data (marked with `isDemo: true`).
- Create a diverse set of members with various statuses (Active, Expired, At Risk).
- Generate payment history and notifications.

## 📝 PDF Export Notes
- **Reliability**: Profile photos are converted to Base64 before being added to PDFs to prevent Firebase Storage CORS blocks.
- **Fallback**: If no photo exists, the PDF generator uses a colored placeholder with the member's initials.

# 📖 User Operation Guide

MemberSync is designed with a high-performance administrative interface and a clean, user-centric member portal. Below is a guide on how to navigate and operate the system effectively.

## 🏛️ Admin Guide

Admins have full oversight of the organization. The sidebar provides access to all management tools.

### Platform Pulse (Admin Dashboard)
The primary cockpit for system health and real-time analytics.
- **Acquisition Trends**: Visualizes member growth and total revenue collections.
- **Stat Cards**: Real-time counters for **Active**, **Pending**, **Expiring**, and **Restricted** members.
- **Member Health**: A pie chart analysis comparing healthy accounts vs. restricted ones.
- **Intelligence Engine Control**: Centrally manage the automation rules.

**Key Buttons:**
- **Run Intelligence Scan**: Executes the lifecycle automation logic immediately.
- **Preview Scan**: Performs a "Dry Run" to see potential changes without saving.
- **Review Tasks**: Opens the queue for members flagged as "At Risk" or having "Repeated Offenses."
- **Reports**: Quick access to the analytics and export hub.

### Members Directory
The central database for all member records.
- **Search & Filter**: Find members by name, ID, status (Active, Pending, Expired, etc.), or subscription plan.
- **Add New Member**: Manually create a profile for a new member.
- **Bulk Export**: Generate high-fidelity PDF audits of the entire directory or filtered subsets.

**Member Actions:**
- **View Details**: Open the full 360° profile of a member.
- **PDF Export (Single)**: Generate a professional profile report for a specific individual.
- **Populate Database**: (Available in Dev mode) Seed the system with demo data.

### Approvals Queue
Manage new registrations awaiting validation.
- **Review Applicants**: Inspect the credentials and payment status of pending users.
- **Approve**: Activates the member and grants access to the portal.
- **Reject**: Blocks the application if credentials are invalid.

### Revenue Center (Payments)
Track financial health and individual settlements.
- **Transaction History**: An immutable audit of all payments received.
- **Unpaid Table**: Lists members who are pending payment or have overdue balances.
- **Record Payment**: Manually settle a member's dues using Credit Card, Cash, or Bank Transfer.

### Membership Plans
Define the tiers available for the organization.
- **Plan Management**: Create tiers like Basic, Standard, or Premium.
- **Configuration**: Set pricing, duration (months), and bulleted benefits/features.

### Enterprise Intelligence Hub (Reports)
Advanced analytics and multi-format exports.
- **Metrics Dashboard**: High-level view of Active Rate, Gross Revenue, and Pending Counts.
- **Report Types**: Generate specialized PDFs or CSVs for:
    - Membership Overview
    - Revenue Analytics
    - Plan Distribution
    - Expired/Suspended Audits

### Announcements & Broadcasts
Communicate with the entire community.
- **Publish Update**: Create news posts that appear in the Member Portal.
- **Pinning**: Keep critical updates at the top of the feed.
- **Targeting**: Choose to broadcast to all members or specific status groups (e.g., Active only).

### Administrative Review Tasks
The "To-Do" list generated by the Intelligence Engine.
- **Flagged Issues**: Lists members with low attendance, payment defaults, or termination triggers.
- **Resolve/Dismiss**: Take action on system-generated tasks and clear them from the queue.

### System Audit Trail
A security-first log of every critical action.
- **Actor Tracking**: See exactly which admin or system process performed an action.
- **Context**: View the reason behind status changes or manual overrides.

### Settings
- **Demo Mode**: Use the **"Populate Database"** button to create a test environment with 30+ varied records.

---

## 👤 Member Guide

The Member Portal is optimized for mobile and desktop access, providing a high-end digital identity.

### Member Dashboard
- **Overview**: View current status, plan tier, and expiry countdown.
- **Profile Completion**: Tracks how much of the personal profile is finalized.
- **Announcements**: Stay updated with organization-wide news.

### Digital Membership Card
- **Verification**: A sleek, QR/Barcode enabled digital ID card.
- **PDF Download**: Members can download a high-resolution version of their card for physical use.

### Profile Management
- **Photo Upload**: Use the **Camera Icon** on the dashboard to instantly upload or change your profile picture.
- **Edit Details**: Update personal info, address, bio, and emergency contacts.

---

## 🔔 Notifications System

### In-App Notifications
- Accessed via the **Bell Icon** in the navigation bar.
- Triggers: New announcements, membership status changes, approval alerts, and payment reminders.
- **Real-Time**: Updates instantly when new events occur.

### ✉️ Email Notifications
> [!NOTE]
> Email/Gmail delivery via `emailService.js` is currently in the **Integration Phase**. While the service logic for Expiry Warnings, Payment Receipts, and Approvals is implemented, it is currently running in **Mock Mode** for development. Full Gmail integration requires configuring `MAIL_USER` and `MAIL_PASS` environment variables in Firebase.

---

## 🔄 Common User Workflows

### Admin: Resolving an At-Risk Member
1. Navigate to **Review Tasks**.
2. Identify a member flagged for "Low Attendance" or "Payment Overdue."
3. Click **View Member** to inspect their history.
4. If resolved manually, return to the queue and click **Resolve**.

### Admin: Running a Monthly Audit
1. Go to **Reports**.
2. Click **Generate PDF** under "Membership Overview."
3. Click **Export CSV** under "Revenue Analytics" for accounting.

### Member: Activating Your Profile
1. Log in for the first time.
2. Complete the mandatory **Complete Your Profile** flow.
3. Upload a professional headshot using the dashboard camera button.
4. View your **Digital Card** to confirm it is active.

## 🔘 Button Reference

| Button | Location | Purpose |
| :--- | :--- | :--- |
| **Run Intelligence Scan** | Admin Dashboard | Manually triggers the automated membership rules engine. |
| **Preview Scan** | Admin Dashboard | Simulates a scan without modifying database records. |
| **Review Tasks** | Admin Dashboard / Sidebar | Accesses the queue of flagged members needing attention. |
| **Add New Member** | Members Page | Opens a modal to manually register a new individual. |
| **PDF Export** | Members / Member Details | Generates a formatted PDF report/profile. |
| **Approve / Reject** | Approvals Page | Activates or blocks pending membership applications. |
| **Record Payment** | Payments Page | Manually logs a transaction and updates member status. |
| **Post Update** | Announcements | Broadcasts a message to the member portal. |
| **Digital Card** | Member Dashboard | Generates the member's digital identity card. |
| **Populate Database** | Settings / Members | Seeds the system with demo data for testing. |




## 🔑 Demo Credentials

To explore the system as an administrator, use the following credentials (ensure the record exists in Firestore):

- **Role**: Administrator
- **Email**: `demo.admin@membersync.com`
- **Password**: `Admin@123456`

## 🤝 Git Workflow

- **Branching**: Use `main` for stable releases and `dev-improvements` for active development.
- **Commits**: Use descriptive messages like `git commit -m "feat: added automated membership rules"`.

---
*Built for the future of organization management.*
