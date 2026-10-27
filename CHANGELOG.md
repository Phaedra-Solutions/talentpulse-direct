# Changelog

All notable changes to **TalentPulse Direct** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
