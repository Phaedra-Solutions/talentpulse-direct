# TalentPulse Direct — Complete System Features & Capabilities Catalog

**Version:** 1.4.0  
**Last Updated:** November 2026  
**Document Status:** Production Reference  

---

## 1. Executive Summary & Platform Purpose

**TalentPulse Direct** is an enterprise-grade talent intelligence and recruitment platform designed for high-velocity contractual staffing of top-tier software engineers, AI developers, and technical leaders. 

Unlike traditional applicant tracking systems (ATS), TalentPulse operates on an **Editorial Brutalist** paradigm optimized for maximum information density, instant keyboard-driven candidate evaluations, verified timezone overlap, automated AI candidate screening, strict role-based access control (RBAC), and full compliance with international privacy and labor frameworks.

---

## 2. Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TALENTPULSE DIRECT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PUBLIC INTAKE & EXPERIENCE]             [RECRUITER & ADMIN SUITE]         │
│  • Landing & Talent Showcase (/)          • Command Dashboard (/admin/...)  │
│  • Public Candidate Portal (/apply)       • Candidate Pipeline (Kanban)     │
│  • Client Hire Intake (/hire)             • Client Hire Requests Manager    │
│  • Candidate Self-Service (/candidate)   • Dynamic Roles & Tech Admin      │
│  • Privacy Policy (/privacy)              • Administrator Provisioning      │
│  • Terms of Service (/terms)              • Enterprise SEO & Crawler Suite  │
│                                                                             │
│  [SECURITY & COMPLIANCE LAYER]            [CORE DATA & ENGINE]              │
│  • PBKDF2 Password Encryption             • Supabase PostgreSQL Database    │
│  • HMAC-SHA256 Token Auth & Cookies       • Next.js 15+ App Router          │
│  • Dual Affirmative Form Consent          • Google Gemini AI Screening API  │
│  • GDPR / CCPA / PIPEDA Protection        • Native XLSX & CSV Exporters     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Feature Catalog by Functional Domain

### Domain 1: Public Experience & Talent Discovery
*   **1.1 Editorial Brutalist Landing Page (`/`)**:
    *   High-contrast, high-legibility visual aesthetic (`#F8F7F4`, `#111113`, `#FF4D00`).
    *   Real-time metrics strip: 4+ hours guaranteed US timezone overlap, 48-hour matching SLA, contractual-only deployment, zero permanent placement fees.
    *   Interactive candidate showcase spotlighting pre-vetted engineers across Full-Stack, AI Engineering, Mobile Development, and Solutions Architecture.
    *   Curated technology library badges linked to dynamic track filtering.
    *   Social trust markers and Phaedra Solutions attribution.
*   **1.2 Responsive Top Navigation (`components/Navbar.tsx`)**:
    *   3-zone header: Single-line brand wordmark, clean navigation links (`Overview`, `Hire Talent`, `Candidate Portal`), and dual primary CTAs (`Hire Talent` and `Join Talent Pool`).
    *   Technical metadata banner displaying active deployment policies.
*   **1.3 Comprehensive Legal Footers**:
    *   Direct links to legal contracts (`/privacy`, `/terms`).
    *   Global social media channels (LinkedIn, Instagram, Threads, X, GitHub).

---

### Domain 2: Public Candidate Application Portal (`/apply`)
*   **2.1 Multi-Step Intake Engine**:
    *   **Step 1: Identity & Professional Background**: Full Name, Email, Country with international phone code picker (`components/PhoneInputWithCountry.tsx`), LinkedIn profile URL, and GitHub handle.
    *   **Step 2: Track & Technology Stack**: Primary role selection (dynamic from database), years of professional experience, interactive multi-select technology tags with autocomplete (`components/TechAutocomplete.tsx`), and custom skill additions.
    *   **Step 3: Compensation & Logistics**: Target hourly and annual rate in USD, availability status (Immediate, 2 Weeks, 1 Month), home timezone, and daily US working overlap hours.
    *   **Step 4: Pitch & Media Verification**: 300+ character written elevator pitch, public resume document URL or filename, and Loom/YouTube video pitch URL.
    *   **Step 5: Affirmative Legal Consent**:
        *   Separate explicit checkbox for **Terms of Use** acceptance with direct links.
        *   Separate explicit checkbox for **Privacy Policy & International Data Processing** acceptance with direct links.
*   **2.2 Real-time Form Validation & Safety**:
    *   Zod schema validation (`candidateApplicationSchema`) running client and server-side.
    *   Phone number formatting and country flag verification across 200+ territories.
    *   Duplicate email prevention and automated transition into the `new` recruiter pipeline stage.

---

### Domain 3: Client Hire Request Portal (`/hire`)
*   **3.1 Enterprise Staffing Intake**:
    *   Role requirement selection matching dynamic platform tracks.
    *   Estimated budget / rate expectation selector with custom range options.
    *   Timeline to start: Immediate, Within 2 Weeks, Within 30 Days, Flexible Planning.
    *   Client company identification: Client Full Name, Business/Company Name, Corporate Email, Phone Number, and Country of Operation.
    *   Project scope & technical requirements text area for detailed specifications.
*   **3.2 Dual-Consent Commercial Gating**:
    *   Explicit affirmative checkbox for **Client Terms of Service** (covering 2-week risk-free trial, non-circumvention, contractual terms).
    *   Explicit affirmative checkbox for **Client Privacy Policy** (acknowledging enterprise contact data handling and NDA terms).
*   **3.3 Instant Notification & Dispatch**:
    *   Immediate assignment to the Sales Executive inbox (`/admin/hire-requests`).
    *   Confirmation screen displaying request tracking ID and expected recruiter outreach SLA (< 24 hours).

---

### Domain 4: Candidate Self-Service Portal (`/candidate/update`)
*   **4.1 Passwordless Identity Verification**:
    *   Email OTP / Magic-link verification preventing unauthorized profile modifications.
    *   Secure session token bound to the verified candidate record.
*   **4.2 Live Profile Management**:
    *   Availability Status toggle: `available` (green), `placed` (gray), `interviewing` (amber).
    *   Current hourly rate and annual compensation expectation updates.
    *   Timezone overlap schedule adjustment (e.g. 4 hrs/day to 8 hrs/day US overlap).
    *   Portfolio links, resume update, and pitch video refresh.
*   **4.3 Real-Time Database Sync**:
    *   Immediate reflection in the recruiter dashboard and public directory upon save.

---

### Domain 5: Recruiter Command Center & Pipeline (`/admin/dashboard`)
*   **5.1 High-Density Candidate Views**:
    *   **Table View**: High-throughput tabular grid featuring sortable columns, candidate track badges, availability status indicators, overlap hours, English proficiency, and action triggers.
    *   **Kanban Board View**: Drag-and-drop / click-to-move lifecycle stages: `new` -> `screening` -> `technical_review` -> `client_interview` -> `offered` -> `placed` -> `rejected`.
*   **5.2 Candidate Detail Drawer (`components/CandidateDetailDrawer.tsx`)**:
    *   Comprehensive profile overview with direct resume PDF preview and video pitch player.
    *   Internal Recruiter Notes editor with timestamped updates.
    *   Stage transition controls with audit log entries.
*   **5.3 AI Candidate Screening & Structured Evaluations**:
    *   Server-side Gemini AI integration generating automated candidate scorecards.
    *   Analysis of technical stack alignment, communication clarity, and risk factors.
*   **5.4 Bulk Data Exporting**:
    *   **Native Excel (.xlsx)**: Formatted, auto-column-sized spreadsheet export restricted to HR Executives and Super Admins.
    *   **CSV Export**: Comma-separated values backup with sanitized fields.

---

### Domain 6: Customer Hire Requests Manager (`/admin/hire-requests`)
*   **6.1 Sales Pipeline Management**:
    *   Inbound client lead monitoring with status tracking: `new`, `contacted`, `qualified`, `matching`, `closed`, `declined`.
    *   Filter by country, timeline, budget range, and search by company or contact name.
*   **6.2 Lead Review & Outreach Drawer**:
    *   1-click copy for corporate email, phone number, and requirements summary.
    *   Offline recruiter notes editor for tracking client calls and candidate presentations.
    *   Direct link to candidate matches matching the requested track.

---

### Domain 7: Dynamic Roles & Technology Taxonomy (`/admin/roles`)
*   **7.1 Track & Role Management**:
    *   Create, edit, open, or close engineering tracks (e.g., Solutions Architect, AI Engineer, Mobile Developer).
    *   Automatic candidate safety check: Prevents deleting roles associated with active candidates; prompts to mark as `closed` instead.
*   **7.2 Technology Moderation & Curation**:
    *   Three-tier moderation library: `pending`, `approved`, `rejected`.
    *   Crowdsourced technology approval: When candidates apply with novel tools, recruiters review and approve them globally with 1 click.
    *   Associated candidate counts displayed on each technology pill.

---

### Domain 8: Administrator Team & Clearance Management (`/admin/users`)
*   **8.1 Team Provisioning**:
    *   Create new administrator accounts with designated clearance (`super_admin`, `sales_executive`, `hr_executive`).
    *   Deactivate / reactivate administrator accounts with instant session revocation.
    *   Protected master super admin account (`admin@talentpulse.com`) with anti-deletion safeguards.
*   **8.2 Cryptographic One-Click Invite Links**:
    *   HMAC-SHA256 signed, time-limited invite tokens (`/admin/setup-password?invite=...`).
    *   Copies full onboarding URL with pre-filled clearance and email.
*   **8.3 Mandatory Password Rotation on First Login**:
    *   New users or admin-reset accounts are automatically flagged with `must_change_password: true`.
    *   Immediate redirect to `/admin/change-password` requiring an 8+ character password different from temporary credentials.
    *   PBKDF2 SHA-512 hashing with unique 16-byte cryptographically secure random salts and 100,000 iterations.

---

### Domain 9: Enterprise SEO, Analytics & Crawlers Suite (`/admin/seo`)
*   **9.1 Global Meta & Verification**:
    *   Site title template, default meta descriptions, primary keywords, and canonical base URL.
    *   Google Tag Manager (GTM) and Google Analytics 4 (GA4) injection with 1-click enable/disable toggle.
*   **9.2 Social Media Cards & OpenGraph Simulator**:
    *   OpenGraph (Facebook, LinkedIn, Slack) and Twitter Large Image Card previews.
    *   Dynamic live simulator previewing search engine snippets across Google, X, and Facebook.
*   **9.3 Granular Page Overrides Engine**:
    *   Per-page custom titles, meta descriptions, canonical URLs, noindex/nofollow flags, and H1/H2 overrides.
    *   Dedicated pre-configured entries for `/`, `/candidates`, `/hire-request`, `/privacy`, and `/terms`.
*   **9.4 Structured Data (Schema.org / JSON-LD)**:
    *   Automated injection of `Organization`, `WebSite`, `CollectionPage`, `ProfilePage`, `ContactPage`, and `Article` structured data.
    *   Dynamic FAQPage schema generator based on active FAQ items.
*   **9.5 Search Engine & AI Crawler Directives**:
    *   Custom `robots.txt` generator with rules for Googlebot, Bingbot, GPTBot, PerplexityBot, and ClaudeBot.
    *   Automated `/llms.txt` and `/sitemap.xml` endpoint generation.

---

### Domain 10: Legal & Compliance Suite (`/privacy`, `/terms`)
*   **10.1 Global Privacy Policy (`/privacy`)**:
    *   Comprehensive legal document adhering to GDPR, CCPA/CPRA, and PIPEDA.
    *   High-legibility editorial view with sticky Table of Contents, reading progress, and print functionality.
    *   Clear disclosures on candidate resume storage, video evaluations, recruiter PII access, and Data Subject Rights.
*   **10.2 Commercial Terms of Use (`/terms`)**:
    *   Commercial terms governing contractual placements, 4-hour timezone overlap, 2-week trial terms, non-solicitation, and liability limits.
    *   Interactive navigation, printable format, and legal contact channels.

---

## 4. Technical Specifications Summary

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ App Router | Server Components by default; Client Components at leaf nodes. |
| **Language** | TypeScript 5.9 | Strict type checking with zero `any` leakages. |
| **Styling** | Tailwind CSS v4 | Raw utility classes; custom Brutalist design tokens (`#F8F7F4`, `#111113`, `#FF4D00`). |
| **Icons** | Lucide React | Unified SVG icons across all views. |
| **Database** | Supabase PostgreSQL | Tables: `candidates`, `admin_users`, `roles`, `technologies`, `hire_requests`, `seo_settings`, `page_seo_overrides`. |
| **Authentication** | Cryptographic HMAC / PBKDF2 | HTTP-only session cookies + Bearer token support; no plaintext secrets. |
| **AI Integration** | Google Gemini API | Server-side proxy evaluations via `@google/genai`. |
| **Spreadsheets** | SheetJS (XLSX) | Formatted candidate pipeline exports with automatic column width calculation. |
