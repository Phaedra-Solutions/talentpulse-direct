# TalentPulse Direct — Complete System Features & Capabilities Catalog

**Version:** 1.5.0  
**Last Updated:** November 2026  
**Document Status:** Production Reference  

---

## 1. Executive Summary & Platform Purpose

**TalentPulse Direct** is an enterprise-grade talent intelligence and recruitment platform designed for high-velocity contractual staffing of software engineers, AI engineers, and technical leaders.

Unlike traditional applicant tracking systems (ATS), TalentPulse operates on an **Editorial Brutalist** paradigm (`#F8F7F4`, `#111113`, `#FF4D00`) optimized for maximum information density, keyboard-friendly candidate dossiers, verified timezone overlap, private cloud resume storage in DigitalOcean Spaces, strict role-based access control (RBAC), and compliance with international privacy frameworks.

---

## 2. Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TALENTPULSE DIRECT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PUBLIC INTAKE & EXPERIENCE]             [RECRUITER & ADMIN SUITE]         │
│  • Landing & Talent Showcase (/)          • Command Dashboard (/admin/...)  │
│  • Dynamic Track Pages (/roles/[slug])    • Candidate Table & Kanban        │
│  • Public Candidate Portal (/apply)       • Resume Storage & Migration UI   │
│  • Client Hire Intake (/hire)             • Client Hire Requests Manager    │
│  • Candidate Self-Service (/candidate)    • Dynamic Roles & Tech Admin      │
│  • Legal Suite (/privacy, /terms)         • Users & Enterprise SEO Suite    │
│                                                                             │
│  [SECURITY & STORAGE LAYER]               [CORE DATA & ENGINE]              │
│  • PBKDF2-SHA512 + HMAC-SHA256 Sessions   • Supabase PostgreSQL + RLS       │
│  • AES-256-GCM External Secret Store      • Next.js 15 App Router           │
│  • DigitalOcean Spaces (ACL: private)     • Authenticated Resume Proxy      │
│  • GDPR / CCPA / PIPEDA PII Redaction     • Native XLSX & CSV Exporters     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Feature Catalog by Functional Domain

### Domain 1: Public Experience & Talent Discovery
*   **1.1 Editorial Brutalist Landing Page (`/`)**:
    *   High-contrast visual system (`#F8F7F4`, `#111113`, `#FF4D00`) powered by Tailwind CSS v4 and `motion/react`.
    *   Verified availability & overlap metrics: US/global timezone overlap guarantees, 48-hour matching SLA, contractual-only deployment, and zero permanent placement fees.
    *   Interactive candidate showcase spotlighting vetted engineers with server-side PII redaction (names truncated to first name + initial, direct email/phone/resume hidden).
    *   Dynamic role track links (`/roles/[slug]`) and curated technology taxonomy badges.
*   **1.2 Responsive Top Navigation (`components/Navbar.tsx`)**:
    *   Clean top bar with single-line brand wordmark, primary navigation links, and conversion CTAs (`Hire Talent` and `Join Talent Pool`).
*   **1.3 Legal Footers**:
    *   Direct navigation to `/privacy` and `/terms` plus company communication channels.

---

### Domain 2: Public Candidate Application Portal (`/apply`)
*   **2.1 Multi-Step Intake Engine**:
    *   **Identity & Portfolio**: Full Name, Email, International Phone Picker (`components/PhoneInputWithCountry.tsx` + `libphonenumber-js`), LinkedIn, GitHub, and Portfolio URLs.
    *   **Track & Technology Stack**: Dynamic primary role selection loaded from Supabase, work mode preferences (`remote`, `hybrid`, `onsite`), and interactive technology autocomplete (`components/TechAutocomplete.tsx`) supporting custom tech submissions (`pending` moderation queue).
    *   **Timezone & Availability**: Home timezone selector, target regions (`USA`, `Europe`, `Asia`, `APAC`), daily overlap hours (`2–12`), availability status (`available_now`, `available_soon`, `part_time_only`, `busy`), available-from date, and English proficiency (`native_fluent`, `professional`, `intermediate`).
    *   **Resume Upload & Pitch**: Direct PDF/DOC/DOCX file upload (up to 10 MB with inline validation, no blocking `window.alert` popups), written engineering pitch, and optional Loom/YouTube pitch video URL.
    *   **Dual Affirmative Legal Consent**: Separate explicit checkboxes for Commercial Terms of Use (`terms_accepted`) and Global Privacy Policy (`privacy_accepted`), alongside contractual-only agreement confirmation (`contractual_agreement_accepted`).
*   **2.2 Atomic Cloud Resume Persistence (`POST /api/candidates`)**:
    *   Uploaded resumes are stored immediately in DigitalOcean Spaces (`ACL: private`) under `Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}` and persisted in PostgreSQL as the canonical object key (failing cleanly with HTTP `502` rather than writing raw base64 payloads into the database if upload fails).

---

### Domain 3: Client Hire Request Portal (`/hire`)
*   **3.1 Enterprise Staffing Intake**:
    *   Role requirement selection mapped to active engineering tracks.
    *   Budget / expected monthly or project cost band selector and target start timeline.
    *   Client identification: Contact Name, Business/Company Name, Corporate Email, Phone Number, Country, and detailed Project Scope.
*   **3.2 Dual-Consent Commercial Gating**:
    *   Separate explicit checkboxes for Terms of Use and Privacy Policy with persisted consent timestamps.
*   **3.3 Instant Dispatch (`POST /api/hire-requests`)**:
    *   Routes leads directly into `/admin/hire-requests` for Sales Executive and Super Admin triage.

---

### Domain 4: Candidate Self-Service Portal (`/candidate/update`)
*   **4.1 OTP-Gated Profile Access**:
    *   Email lookup + OTP verification gate preventing unauthorized edits to candidate profiles.
*   **4.2 Live Availability & Resume Replacement**:
    *   Update `availability_status`, `available_from`, `overlap_hours_per_day`, target regions, work modes, portfolio links, and video pitch URL.
    *   **Resume Replacement (`PATCH /api/candidates`)**: Uploading a new resume uploads the new private object to DigitalOcean Spaces, deletes the previous Spaces object and local cache (`oldResumeKey`), updates `resume_url` and `updated_at`, and exposes a cache-busted `View Current PDF` link.

---

### Domain 5: Recruiter Command Center & Resume Storage (`/admin/dashboard`)
*   **5.1 High-Density Candidate Views**:
    *   **Table View (`components/CandidateTable.tsx`)**: Sortable, searchable pipeline grid displaying role track badges, availability, overlap hours, English proficiency, and cache-busted `PDF` actions.
    *   **Kanban Pipeline View**: Lifecycle stage tracking across `new`, `vetted`, `interviewing`, `assigned`, and `on_hold`.
*   **5.2 Candidate Detail Dossier (`components/CandidateDetailDrawer.tsx`)**:
    *   Synchronized stage transitions and internal evaluation notes (`PATCH /api/candidates/[id]` with signed admin headers).
    *   **Technical Resume / Artifact Status**: Clearly distinguishes canonical DigitalOcean Spaces objects (`[SPACES PRIVATE OBJECT]` + `DO SPACES [PRIVATE]: Talent Pulse/...`) from unmigrated legacy URLs (`[LEGACY URL ATTACHED]`), paired with a cache-busted `View PDF` link (`&v={updated_at}`).
    *   Embedded YouTube/Loom video pitch preview and quick-copy email/contact actions.
*   **5.3 Private DigitalOcean Spaces Storage & Proxy (`/api/admin/storage-config`, `/api/candidates/resume`)**:
    *   **Endpoint Normalization**: Automatically strips accidental bucket prefixes from Spaces Origin URLs so S3 requests target regional endpoints (`https://{region}.digitaloceanspaces.com`) without TLS certificate altname mismatches, with automatic path-style fallback and `WHEN_REQUIRED` checksum configuration for `@aws-sdk/client-s3` compatibility.
    *   **Test-Before-Save Validation**: `POST /api/admin/storage-config` verifies credentials (rejecting masked placeholders and mismatched single-half key updates) against DigitalOcean Spaces **before** persisting anything, returning `saved: false` on failure so working keys are never overwritten.
    *   **External AES-256-GCM Secret Storage**: Keys are encrypted outside the repository at `~/.talentpulse/do-spaces.enc.json` (`0600` permissions), leaving only `{ endpoint, region, bucket }` in gitignored `data/storage-config.json`.
    *   **Private Proxy Streaming (`/api/candidates/resume`)**: Streams private PDF/DOC/DOCX objects using `Cache-Control: private, no-store, no-cache, must-revalidate` and `Pragma: no-cache`, returning `403` to unauthorized external requests.
*   **5.4 One-Click Legacy Resume Transfer (`POST /api/admin/migrate-resumes`, `npm run migrate:resumes`)**:
    *   Scans candidates, skips records already normalized to `Talent Pulse/...`, transfers external/base64 resumes into private Spaces objects, deletes superseded legacy keys, verifies Supabase row updates affected the record, and surfaces partial-error warning banners if any candidate failed.
*   **5.5 Bulk Data Exporting**:
    *   **Native Excel (`.xlsx`) & CSV**: Formatted candidate exports with dynamic column widths, restricted to HR Executives and Super Admins.

---

### Domain 6: Customer Hire Requests Manager (`/admin/hire-requests`)
*   **6.1 Sales Pipeline Management**:
    *   Inbound client lead monitoring (`new`, `contacted`, `qualified`, `matching`, `closed`, `declined`) with search, status filtering, and offline notes tracking.
*   **6.2 Super Admin Controls**:
    *   Lead deletion (`DELETE /api/hire-requests/[id]`) and CSV export restricted to `super_admin`.

---

### Domain 7: Dynamic Roles & Technology Taxonomy (`/admin/roles`)
*   **7.1 Track & Role Management**:
    *   Create, edit, open, or close engineering tracks (`/roles/[slug]`) with single-fetch in-memory candidate counting (eliminating N+1 queries) and safe deletion guards.
*   **7.2 Technology Moderation & Curation**:
    *   Approve, reject, or add technologies across `pending`, `approved`, and `rejected` queues with live candidate usage counts.

---

### Domain 8: Administrator Team & Clearance Management (`/admin/users`)
*   **8.1 Team Provisioning**:
    *   Create, activate, deactivate, or delete administrator accounts (`super_admin`, `sales_executive`, `hr_executive`), with master account protections on `admin@talentpulse.com`.
*   **8.2 Cryptographic One-Click Invite Links**:
    *   HMAC-SHA256 signed, 7-day time-limited invite tokens (`/admin/setup-password?invite=...`).
*   **8.3 Mandatory Password Rotation**:
    *   First-time and password-reset accounts (`must_change_password: true`) redirect to `/admin/change-password`, hashing passwords with PBKDF2 SHA-512 (100,000 iterations, 16-byte random salt).

---

### Domain 9: Enterprise SEO, Analytics & Crawlers Suite (`/admin/seo`)
*   **9.1 Global Meta & Analytics**:
    *   Site title templates, meta descriptions, canonical base URLs, and toggleable GTM / GA4 tracking.
*   **9.2 Social Cards & Page Overrides**:
    *   OpenGraph / Twitter card simulator and granular per-route overrides (`title`, `description`, `keywords`, `canonical_url`, `no_index`, `no_follow`, `h1_heading`, `schema_type`).
*   **9.3 Structured Data & Crawler Endpoints**:
    *   Dynamic JSON-LD injection plus `/robots.txt`, `/sitemap.xml`, and `/llms.txt` generation.

---

### Domain 10: Legal & Compliance Suite (`/privacy`, `/terms`)
*   **10.1 Global Privacy Policy (`/privacy`)**:
    *   GDPR, CCPA/CPRA, and PIPEDA disclosures covering resume object storage, PII redaction, and Data Subject Requests.
*   **10.2 Commercial Terms of Use (`/terms`)**:
    *   Contractual staffing terms, overlap SLAs, trial windows, non-circumvention, and printable layout.

---

## 4. Technical Specifications Summary

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 App Router | Server Components by default; Client Components at interactive leaves |
| **Language** | TypeScript 5.9 | Shared Zod validation schemas across client and API handlers |
| **Styling** | Tailwind CSS v4 | Editorial Brutalist palette (`#F8F7F4`, `#111113`, `#FF4D00`) |
| **Icons** | Lucide React | Consistent icon system across public and admin UI |
| **Database** | Supabase PostgreSQL | `candidates`, `admin_users`, `roles`, `technologies`, `hire_requests`, `seo_settings`, `page_seo_overrides` |
| **Object Storage** | DigitalOcean Spaces (`@aws-sdk/client-s3`) | Private ACL (`Talent Pulse/{Month-Year}/candidate/...`), AES-256-GCM external secret file, authenticated streaming proxy |
| **Authentication** | PBKDF2 SHA-512 + HMAC-SHA256 | HttpOnly `admin_session` cookie + Bearer header verification |
| **Spreadsheets** | SheetJS (`xlsx`) | Formatted `.xlsx` candidate exports |
