# Changelog

All notable changes to **TalentPulse Direct** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-16

### Added
- **Client Hire Portal Validations (`/hire`)**: Enforced shared client & server Zod character limits and format guards on Business/Company Name (`2–120` chars), Contact Person Full Name (`2–100` chars, letters/punctuation only), and Contract Scope (`20–3,000` chars when provided, HTML/script tag rejection), paired with `maxLength` attributes and live character counters.
- **Hire Requests Pagination & Lazy Dossier Loading (`/admin/hire-requests`)**: Added server-side SQL pagination (`15–100` rows/page), debounced multi-column search, clickable KPI status counters, summary-column queries with lazy `project_scope` hydration (`GET /api/hire-requests/[id]`), and chunked 500-row CSV exports (`?export=true`).
- **Roles & Technologies Management & Deduplication (`/admin/roles`, `/api/technologies/merge`)**: Added technology Edit, Merge (atomically reassigning `role_technologies` & candidate stacks), and Delete/Force Delete controls, server pagination across roles and technology moderation queues, and multi-layer canonical + Damerau-Levenshtein typo deduplication (`canonical_key`).
- **Database-Backed `robots.txt` & `llms.txt` (`/admin/seo`)**: Added editable textareas in the Robots, Sitemap & LLMs.txt tab persisted in `public.seo_settings` and served dynamically from `/robots.txt` and `/llms.txt`.
- **Application Step 1 Duplicate Email/Phone Guard (`/apply`, `POST /api/candidates/check-exists`)**: Added zero-PII normalized email and international phone uniqueness verification at Step 1 that blocks progression and server submissions (`409 CANDIDATE_ALREADY_EXISTS` before resume upload) while directing returning candidates via CTA to OTP-verified `/candidate/update` (with `?email=` prefill).
- **Supabase Migration Files (`supabase/migrations/`)**: Added missing incremental migrations for candidate performance/resume-transfer indexes (`20261116000001`), collision-safe `technologies.canonical_key` & pagination index (`20261116000002`), and `hire_requests` composite pagination index (`20261116000003`).

### Changed & Fixed
- **Fixed Blank Production Hire Requests Listing (`/admin/hire-requests`)**: Routed admin listing, updates, and deletions through authenticated `/api/hire-requests` endpoints using the server-side Supabase service-role client instead of browser `anon` queries blocked by RLS.
- **Removed Local Resume Cache Fallback**: Enforced strict `DO_SPACES_*` credential validation (returning HTTP `503 DO_SPACES_NOT_CONFIGURED` on empty/placeholder credentials) and added keyset-batched `npm run migrate:resumes` transfers to prevent statement timeouts.
- **Dashboard & Track Listing Performance**: Fixed candidate dashboard pagination/KPI fetching so full production rosters load cleanly without timeouts or memory spikes.

---

## [1.0.0] - 2026-10-26

### Added
- **Public Candidate Portal (`/apply`)**: High-throughput candidate intake application form with instant resume parsing, real-time validation, and interactive role selection.
- **Candidate Self-Service Profile Update (`/candidate/update`)**: Secure OTP / Magic Link candidate portal enabling candidates to update their availability, compensation expectations, GitHub/portfolio links, and resume.
- **Recruiter Admin Pipeline Dashboard (`/admin/dashboard`)**:
  - Live candidate pipeline with multi-stage status management (`New`, `Reviewing`, `Interviewing`, `Offered`, `Hired`, `Rejected`).
  - Search, role filters, seniorities, and sorting controls.
  - Candidate details drawer with resume viewer, evaluation notes, AI fit assessment, and stage transitions.
- **Admin Users Management (`/admin/users`)**:
  - Provision team administrators with Role-Based Access Control (`Super Admin`, `Admin`, `Recruiter`).
  - Real-time Active / Inactive status toggle.
  - Instant 1-click invite link generator (`/admin/setup-password?invite=<token>`) and temporary credential generator.
  - Administrator deletion safeguards protecting the primary root admin.
- **Mandatory First-Login Password Rotation**:
  - Automatic detection of first-time admin logins (`/admin/change-password`).
  - Strict PBKDF2 hashing (100,000 iterations) with cryptographic salt.
  - Dedicated direct invite onboarding landing page (`/admin/setup-password`).
- **AI Candidate Screening**: Server-side Gemini AI integration for resume summarization, role matching, and automated candidate fit scoring.
- **Database Persistence**: Supabase PostgreSQL integration with full relational schema (`candidates`, `admin_users`, `candidate_audit_logs`) and Row Level Security (RLS).
- **Open Source Preparation**:
  - GNU General Public License v3.0 (`LICENSE`).
  - Responsible Vulnerability Disclosure policy (`SECURITY.md`).
  - Contributor Covenant Code of Conduct (`CODE_OF_CONDUCT.md`).
  - Contribution guidelines and Conventional Commits standard (`CONTRIBUTING.md`).
  - Issue templates, Pull Request template, and GitHub Actions CI workflow.
  - Dependabot automated security and dependency monitoring.
