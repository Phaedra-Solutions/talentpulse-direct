# TalentPulse Direct

<div align="center">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![DO Spaces](https://img.shields.io/badge/Object%20Storage-DigitalOcean%20Spaces-0080FF?style=flat-square&logo=digitalocean&logoColor=white)](https://www.digitalocean.com/products/spaces)
[![CI Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions)](https://github.com/talentpulse/talentpulse-direct/actions)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square)](CODE_OF_CONDUCT.md)

<p align="center">
  <strong>Open-Source High-Velocity Recruitment & Talent Intelligence Platform</strong>
  <br />
  Tailored for specialized engineering pipelines, Forward Deployed Engineers (FDEs), AI/ML engineers, and technical leaders.
</p>

[System Features](docs/FEATURES.md) • [Permissions Matrix](docs/PERMISSIONS_MATRIX.md) • [Privacy Policy](docs/PRIVACY_POLICY.md) • [Terms of Use](docs/TERMS_OF_USE.md) • [Contributing](CONTRIBUTING.md) • [Security](SECURITY.md)

</div>

---

## 📌 Overview

**TalentPulse Direct** is a modern, full-stack recruitment platform engineered to replace slow, bloated applicant tracking systems (ATS). Built with an **Editorial Brutalist** design aesthetic (`#F8F7F4`, `#111113`, `#FF4D00`), TalentPulse provides high-density candidate insights, private DigitalOcean Spaces resume storage, candidate self-service updates, and multi-tier administrator access control.

### The Problem It Solves
Traditional applicant tracking software is clunky, hides critical technical data behind multiple clicks, and frustrates candidates with lengthy sign-up walls. TalentPulse Direct provides:
1. **Frictionless Candidate Applications:** A fast multi-step intake workflow (`/apply`) with direct PDF/DOC/DOCX resume upload, dynamic role tracks, and dual affirmative legal consent.
2. **Private Resume Storage & Streaming:** Resumes are stored as private objects in DigitalOcean Spaces (`Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}`) and served exclusively through an authenticated server-side proxy (`/api/candidates/resume`).
3. **Candidate Self-Service:** Secure OTP verification (`/candidate/update`) allowing candidates to update availability, timezone overlap, and replace their resume (automatically deleting the previous object).
4. **Enterprise-Grade Admin Controls:** Role-based access control (`Super Admin`, `Sales Executive`, `HR Executive`), 1-click cryptographic invite links, mandatory first-login password rotation, and bulk `.xlsx`/`.csv` exports.

---

## 📚 System Documentation & Governance Suite

TalentPulse Direct maintains comprehensive architecture, security, and legal documentation in the [`/docs`](docs/) directory:

| Document | Purpose | Key Standards Covered |
| :--- | :--- | :--- |
| 📖 **[System Feature Catalog](docs/FEATURES.md)** | Complete capability & architectural catalog | Functional domains, Next.js 15 App Router, DigitalOcean Spaces resume vault |
| 🛡️ **[Permissions Matrix](docs/PERMISSIONS_MATRIX.md)** | Role-Based Access Control (RBAC) standard | Anonymous, Candidate, Sales Executive, HR Executive, and Super Admin clearance |
| 🌐 **[Global Privacy Policy](docs/PRIVACY_POLICY.md)** | Regulatory privacy standard (`/privacy`) | GDPR (EU/UK), CCPA/CPRA (California), PIPEDA (Canada), Server-Side PII redaction |
| ⚖️ **[Commercial Terms of Use](docs/TERMS_OF_USE.md)** | Commercial service agreement (`/terms`) | Contractual exclusivity, 4+ hr overlap guarantee, 2-week trial, 12-mo non-circumvention |

---

## ✨ Key Features

| Capability | Description |
| :--- | :--- |
| ⚡ **Public Application Portal** | High-throughput intake form (`/apply`) with Zod validation, direct resume upload (up to 10 MB), dynamic role tracks (`/roles/[slug]`), and dual legal consent. |
| 💼 **Client Hire Portal** | Enterprise staffing intake form (`/hire`) with project scoping, budget bands, and dual terms/privacy consent. |
| 🔄 **Candidate Self-Service** | OTP-verified candidate portal (`/candidate/update`) for real-time availability, timezone overlap adjustments, and live resume replacement. |
| ☁️ **Private DO Spaces Resume Vault** | Stores resumes privately under `Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}` with regional endpoint normalization, test-before-save validation, AES-256-GCM external secret encryption (`~/.talentpulse/do-spaces.enc.json`), and one-click legacy resume migration (`npm run migrate:resumes`). |
| 📊 **Recruiter Command Center** | High-density table & Kanban pipeline (`/admin/dashboard`) with candidate dossiers displaying live `DO SPACES [PRIVATE]` keys, cache-busted PDF previews, and stage audit notes. |
| 📥 **Bulk Excel & CSV Export** | Formatted `.xlsx` and `.csv` candidate exports with dynamic column sizing, restricted to HR Executives and Super Admins. |
| 👥 **Granular Admin RBAC** | Multi-tier clearance (`Super Admin`, `Sales Executive`, `HR Executive`) enforced via HMAC-SHA256 `admin_session` cookies and Bearer tokens. |
| 🔑 **Invite Link Onboarding** | One-click copyable cryptographic invite links (`/admin/setup-password?invite=...`) and automated temporary credentials. |
| 🛡️ **Mandatory First-Login Rotation** | Enforced password change on first login (`/admin/change-password`) secured with salted PBKDF2 SHA-512 (100,000 iterations). |
| 🌐 **SEO & Crawler Engine** | Complete management suite (`/admin/seo`) with GTM, GA4, social card simulator, Schema.org JSON-LD, `/sitemap.xml`, `/llms.txt`, and `robots.txt` directives. |
| 🗄️ **Supabase Persistence** | Production PostgreSQL integration with Row-Level Security (RLS) and server-side PII redaction for unauthenticated views. |

---

## 🏗️ Architecture & Tech Stack

- **Frontend & Server Framework:** [Next.js 15 App Router](https://nextjs.org/)
- **Programming Language:** [TypeScript 5.9](https://www.typescriptlang.org/)
- **Design & Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with utility-first brutalist styling & [Lucide Icons](https://lucide.dev/)
- **Animations:** [Motion](https://motion.dev/)
- **Form Management & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Database & Auth:** [Supabase PostgreSQL](https://supabase.com/) with Row-Level Security (RLS)
- **Private Resume Storage:** [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) via `@aws-sdk/client-s3` (`WHEN_REQUIRED` checksum mode + private authenticated proxy)
- **Spreadsheets:** SheetJS (`xlsx`) for `.xlsx` pipeline exports
- **License:** [GNU General Public License v3.0](LICENSE)

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v22+ (LTS recommended)
- **npm** (v9+), **pnpm**, or **bun**
- A **Supabase** project (Cloud or local)
- A **DigitalOcean Spaces** bucket & Spaces Access Key pair (for cloud private resume storage)

### 1. Clone the Repository
```bash
git clone https://github.com/talentpulse/talentpulse-direct.git
cd talentpulse-direct
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` into `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required keys (never commit `.env.local`, `data/storage-config.json`, or `data/.jwt_secret`):
```env
# Application URL
APP_URL="http://localhost:3000"

# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_pub_your_publishable_key"
SUPABASE_SECRET_KEY="sb_sec_your_secret_key"

# Server-side HMAC & Encryption Signing Secret (set a strong random string in production)
JWT_SECRET="your-32-byte-random-secret"

# DigitalOcean Spaces (Optional via env — or configure via Admin Dashboard)
DO_SPACES_ENDPOINT="https://sgp1.digitaloceanspaces.com"
DO_SPACES_REGION="sgp1"
DO_SPACES_BUCKET="your-spaces-bucket"
DO_SPACES_KEY="your-spaces-access-key"
DO_SPACES_SECRET="your-spaces-secret-key"
```

### 4. Database Schema & Supabase Setup
Open the **SQL Editor** in your Supabase dashboard, copy the contents of [`schema.sql`](schema.sql) (or apply the ordered migrations in [`supabase/migrations`](supabase/migrations/)), and execute it.

This provisions:
- `candidates`: Core talent records, consent timestamps, pipeline stages, and canonical `resume_url` keys.
- `admin_users`: Recruiter and administrator accounts with salted PBKDF2 hashes.
- `roles` & `technologies`: Dynamic engineering tracks and curated tech taxonomy.
- `hire_requests`: Enterprise client staffing inquiries.
- `seo_settings` & `page_seo_overrides`: Global and per-route SEO metadata.
- Row-Level Security (RLS) policies and indexes.

The initial super admin account is seeded as `admin@talentpulse.com`. **Rotate this password immediately** via the Admin UI or helper script before deploying:
```bash
npm run reset-admin
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application:
- **Public Talent Overview:** [http://localhost:3000](http://localhost:3000)
- **Candidate Application Portal:** [http://localhost:3000/apply](http://localhost:3000/apply)
- **Client Hire Portal:** [http://localhost:3000/hire](http://localhost:3000/hire)
- **Candidate Self-Service:** [http://localhost:3000/candidate/update](http://localhost:3000/candidate/update)
- **Recruiter Admin Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin Dashboard & Resume Storage:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
- **Admin User Management:** [http://localhost:3000/admin/users](http://localhost:3000/admin/users)

### 6. Migrate Legacy Resumes to DigitalOcean Spaces (Optional)
After verifying your Spaces credentials in **Admin Dashboard → Resume Storage Settings**, click **Execute Resume Transfer** or run the CLI migration script:
```bash
npm run migrate:resumes
```

---

## 🧪 Testing & Verification

Ensure your codebase adheres to all linting and build standards before submitting changes:

```bash
# Run ESLint validation
npm run lint

# Run Next.js production build check
npm run build
```

---

## 🔐 Security & Vulnerability Reporting

Security and privacy of applicant data are paramount. Please do not submit vulnerability reports to public GitHub issues.

Review **[SECURITY.md](SECURITY.md)** for our private disclosure procedure, encrypted Spaces secret storage architecture, and 90-day responsible disclosure policy.

---

## 🤝 Contributing

We welcome community contributions! Please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** guide to get started with:
- Conventional commit conventions
- Branch protection standards
- PR review process

All participants are expected to adhere to our **[Code of Conduct](CODE_OF_CONDUCT.md)**.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for the full legal text.

```
TalentPulse Direct - HR Talent Pipeline & Management Platform
Copyright (C) 2026 TalentPulse Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
