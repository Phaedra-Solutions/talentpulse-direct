# TalentPulse Direct

<div align="center">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![CI Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions)](https://github.com/talentpulse/talentpulse-direct/actions)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square)](CODE_OF_CONDUCT.md)

<p align="center">
  <strong>Open-Source High-Velocity Recruitment & Talent Intelligence Platform</strong>
  <br />
  Tailored for specialized engineering pipelines, Forward Deployed Engineers (FDEs), AI/ML researchers, and technical talent.
</p>

[Explore Features](#key-features) • [Quickstart Guide](#quickstart) • [Database Setup](#database-schema--supabase-setup) • [Contributing](CONTRIBUTING.md) • [Security](SECURITY.md)

</div>

---

## 📌 Overview

**TalentPulse Direct** is a modern, full-stack recruitment platform engineered to replace slow, bloated applicant tracking systems (ATS). Built with an **Editorial Brutalist** design aesthetic (`#F8F7F4`, `#111113`, `#FF4D00`), TalentPulse provides high-density candidate insights, automated AI resume screening, self-service profile updating for candidates, and multi-tenant administrator access control.

### The Problem It Solves
Traditional applicant tracking software is clunky, hides critical technical data behind multiple clicks, and frustrates candidates with lengthy sign-up walls. TalentPulse Direct provides:
1. **Frictionless Candidate Applications:** A lightning-fast, single-page application workflow with client-side resume parsing and role fit indicators.
2. **Candidate Self-Service:** Secure magic-link/OTP authentication allowing candidates to update their availability, hourly/annual compensation, and portfolios on their own.
3. **High-Density Recruiter Pipeline:** An instant, keyboard-friendly candidate management dashboard with real-time status transitions and AI assessments.
4. **Enterprise-Grade Admin Controls:** Role-based access control, 1-click invite link generators, and mandatory password rotation on first login.

---

## ✨ Key Features

| Capability | Description |
| :--- | :--- |
| ⚡ **Public Application Portal** | High-throughput intake form (`/apply`) with real-time validation, role matching, and resume attachment. |
| 🔄 **Candidate Self-Service** | OTP / Magic-link candidate portal (`/candidate/update`) for real-time profile and availability adjustments. |
| 📊 **Recruiter Command Center** | Live Kanban / list pipeline (`/admin/dashboard`) with multi-stage candidate lifecycle tracking and search. |
| 🤖 **Gemini AI Screening** | Server-side AI evaluation providing structured technical scorecards and candidate summaries. |
| 👥 **Admin Team Management** | Team provisioning (`/admin/users`) with role assignment (`Super Admin`, `Admin`, `Recruiter`) and active/inactive status switches. |
| 🔑 **Invite Link Onboarding** | One-click copyable cryptographic invite links (`/admin/setup-password?invite=...`) and automated temporary credentials. |
| 🛡️ **Mandatory First-Login Rotation** | Enforced password change on first login (`/admin/change-password`) secured with PBKDF2 (100,000 iterations). |
| 🗄️ **Supabase Persistence** | Production PostgreSQL integration with Row-Level Security (RLS) and transparent failover handling. |

---

## 🏗️ Architecture & Tech Stack

- **Frontend & Server Framework:** [Next.js 15+ App Router](https://nextjs.org/)
- **Programming Language:** [TypeScript 5.9](https://www.typescriptlang.org/)
- **Design & Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with raw utility design & [Lucide Icons](https://lucide.dev/)
- **Animations:** [Motion](https://motion.dev/)
- **Form Management:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Database & Auth:** [Supabase PostgreSQL](https://supabase.com/) with Row-Level Security (RLS)
- **AI Intelligence:** [Google Gemini API](https://ai.google.dev/) via `@google/genai` (Server-side proxy routes)
- **License:** [GNU General Public License v3.0](LICENSE)

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v22+ (LTS recommended)
- **npm** (v9+), **pnpm**, or **bun**
- A **Supabase** project (Cloud or local via Docker)
- A **Google Gemini API Key** (optional, for AI candidate screening)

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

Populate the required keys:
```env
# Google Gemini API (Server-side only)
GEMINI_API_KEY="your-gemini-api-key"

# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_pub_your_publishable_key"
SUPABASE_SECRET_KEY="sb_sec_your_secret_key"

# Application URL
APP_URL="http://localhost:3000"
```

### 4. Database Schema & Supabase Setup
Open the **SQL Editor** in your Supabase dashboard, copy the contents of [`schema.sql`](schema.sql), and execute it.

This provisions:
- `candidates`: Core talent applicant table with status, ratings, and salary records.
- `admin_users`: Recruiter and administrator accounts with salted PBKDF2 hashes.
- `candidate_audit_logs`: Immutable timeline of candidate status changes.
- Row-Level Security (RLS) policies and performance indexes.

To seed realistic candidate profiles:
```bash
# In the Supabase SQL editor, execute:
supabase/seed.sql
```

The default super admin account is pre-configured as:
- **Email:** `admin@talentpulse.com`
- **Password:** `lahore123$` *(System prompts for password rotation upon first login)*

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application:
- **Candidate Portal:** [http://localhost:3000/apply](http://localhost:3000/apply)
- **Candidate Self-Service:** [http://localhost:3000/candidate/update](http://localhost:3000/candidate/update)
- **Recruiter Admin:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin User Management:** [http://localhost:3000/admin/users](http://localhost:3000/admin/users)

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

Review our **[SECURITY.md](SECURITY.md)** for our private disclosure procedure, encrypted contacts, and 90-day responsible disclosure policy.

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
