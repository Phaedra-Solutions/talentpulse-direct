# TalentPulse Direct — Role-Based Permissions & Access Control Matrix

**Version:** 1.5.0  
**Effective Date:** November 2026  
**Document Status:** Security & Authorization Standard  

---

## 1. Role Taxonomy & Clearance Levels

TalentPulse Direct enforces Role-Based Access Control (RBAC) across frontend pages, UI controls, Next.js API route handlers (`lib/auth/permissions.ts` & `lib/auth/server-auth.ts`), and Supabase Row-Level Security (RLS). Administrator requests are verified via HMAC-SHA256 signed `admin_session` cookies, `Authorization: Bearer <token>`, `x-admin-token`, or scoped query tokens where supported.

Legacy role aliases (`admin` → `super_admin`; `recruiter` / `hr_lead` → pipeline/export access) are supported in permission helpers for backward compatibility.

| Role Identifier | Role Display Title | Clearance Level | Primary Responsibilities & Scope |
| :--- | :--- | :---: | :--- |
| `anonymous` | **Anonymous / Public User** | **Tier 0** | Website visitors, prospective clients, and applicants. Can browse `/` and `/roles/[slug]`, view PII-redacted candidate showcases, submit candidate applications (`/apply`), and submit client hire requests (`/hire`). |
| `candidate` | **Candidate User** | **Tier 1** | Verified profile owners authenticating via OTP on `/candidate/update`. May update their own availability, timezone overlap, portfolio links, and resume object. Forbidden from accessing admin dashboards or other candidates' records. |
| `sales_executive` | **Sales Executive** | **Tier 2** | Account managers and client-facing recruiters. Authorized for the candidate pipeline (`/admin/dashboard`) and customer hire requests (`/admin/hire-requests`). **Forbidden** from bulk candidate exports (`.xlsx`/`.csv`), roles/tech administration (`/admin/roles`), admin user management (`/admin/users`), storage credential configuration (`/api/admin/storage-config`), and SEO settings (`/admin/seo`). |
| `hr_executive` | **HR Executive** | **Tier 2** | Technical recruiters and talent acquisition leads. Authorized for the candidate pipeline (`/admin/dashboard`), bulk candidate exports (`.xlsx`/`.csv`), resume migration (`/api/admin/migrate-resumes`), and engineering tracks/technology moderation (`/admin/roles`). **Forbidden** from client hire requests (`/admin/hire-requests`), admin user management (`/admin/users`), storage credential management (`/api/admin/storage-config`), and SEO settings (`/admin/seo`). |
| `super_admin` | **Super Admin** | **Tier 3** | Platform owners and system administrators. Full authority across all pipelines, hire requests (including deletion/CSV export), roles/tech taxonomy, user provisioning & invite tokens (`/admin/users`), DigitalOcean Spaces credentials (`/api/admin/storage-config`), resume migrations, and SEO settings (`/admin/seo`). |

---

## 2. Page & Route Access Matrix

| Route Path | Description | Anonymous | Candidate | Sales Exec | HR Exec | Super Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `/` | Landing Page & Sanitized Talent Showcase | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/roles/[slug]` | Engineering Track Showcase Page | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/apply` | Candidate Application Portal | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/hire` | Client Hire Request Form | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/candidate/update` | Candidate Self-Service Portal | 🔒 *OTP Gated* | ✅ **Allowed** *(Own Record)* | ⛔ *OTP Gated* | ⛔ *OTP Gated* | ⛔ *OTP Gated* |
| `/privacy` | Global Privacy Policy | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/terms` | Commercial Terms of Use | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/login` | Administrator Authentication Gateway | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/setup-password` | Invite Token Account Initialization | 🔒 *Token Gated* | 🔒 *Token Gated* | 🔒 *Token Gated* | 🔒 *Token Gated* | 🔒 *Token Gated* |
| `/admin/change-password` | Admin Password Rotation Portal | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ✅ **Allowed** *(Own)* | ✅ **Allowed** *(Own)* | ✅ **Allowed** *(Own)* |
| `/admin/dashboard` | Recruiter Pipeline, Resume Vault & Migration | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ✅ **Allowed** *(No Export / Config)* | ✅ **Allowed** *(No Storage Config)* | ✅ **Allowed** |
| `/admin/hire-requests` | Customer Hire Requests Manager | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ✅ **Allowed** | ⛔ *-> /admin/dashboard* | ✅ **Allowed** |
| `/admin/roles` | Engineering Tracks & Tech Moderation | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ⛔ *-> /admin/dashboard* | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/users` | Administrator Clearance Management | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ⛔ *-> /admin/dashboard* | ⛔ *-> /admin/dashboard* | ✅ **Allowed** |
| `/admin/seo` | SEO, GTM, Meta & Crawler Engine | ⛔ *-> /admin/login* | ⛔ *-> /admin/login* | ⛔ *-> /admin/dashboard* | ⛔ *-> /admin/dashboard* | ✅ **Allowed** |

---

## 3. Action & Data Mutation Matrix

| Operation / Capability | Anonymous | Candidate User | Sales Exec | HR Exec | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Submit New Candidate Application** | ✅ Yes | ⚠️ Duplicate Email Check | ✅ Yes | ✅ Yes | ✅ Yes |
| **Submit Customer Hire Request** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Candidate Phone & Email** | ❌ Redacted | ⚠️ Own Record Only | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **View / Stream Private Candidate Resume** | ❌ `403 Forbidden` | ✅ Own Record Only | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Update Own Availability, Overlap & Resume** | ❌ No | ✅ Yes *(OTP Gated)* | ❌ No | ❌ No | ✅ Admin Override |
| **Edit Candidate Pipeline Stage & Notes** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Configure & Test DO Spaces Credentials** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ **Authorized** |
| **Run Legacy Resume Migration to Spaces** | ❌ No | ❌ No | ✅ Authorized | ✅ Authorized | ✅ Authorized |
| **Export Candidates to Excel (`.xlsx`) / CSV** | ❌ No | ❌ No | ❌ **Forbidden** | ✅ **Authorized** | ✅ **Authorized** |
| **View & Update Client Hire Requests** | ❌ No | ❌ No | ✅ Yes | ❌ Forbidden | ✅ Yes |
| **Delete / Export Client Hire Requests** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ **Authorized** |
| **Manage Engineering Tracks & Tech Queue** | ❌ No | ❌ No | ❌ Forbidden | ✅ Yes | ✅ Yes |
| **Manage Admin Users & Invite Links** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ **Authorized** |
| **Manage Global & Page SEO / Crawlers** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ **Authorized** |

---

## 4. API Endpoints Protection & Security Rules

Server-side route handlers enforce `requireAdminAuth(req, permissionCheck)` from `lib/auth/server-auth.ts`:

| Endpoint Route | HTTP Method | Permission Helper / Rule | Unauthenticated | Unauthorized Role | Authorized Success |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `/api/candidates` | `GET` | Public PII-Redacted / Admin Full | `200` *(Redacted)* | N/A | `200` *(Full PII)* |
| `/api/candidates` | `POST` | Public Intake Application *(Spaces upload required)* | `201 Created` | N/A | `201 Created` |
| `/api/candidates` | `PATCH` | `canAccessCandidatePipeline` or Self-Service Email Match | `401` *(or Self-Update)* | `403 Forbidden` | `200 OK` |
| `/api/candidates/[id]` | `GET` / `PATCH` | `canAccessCandidatePipeline` | `401 Unauthorized` | `403 Forbidden` | `200 OK` |
| `/api/candidates/resume` | `GET` | Admin Session, Candidate Owner Email, Query Token, or Internal Referer | `403 Forbidden` | `403 Forbidden` | `200 OK` *(`no-store` stream)* |
| `/api/hire-requests` | `GET` | `canAccessHireRequests` | `401 Unauthorized` | `403 Forbidden` *(HR)* | `200 OK` *(Sales, Super)* |
| `/api/hire-requests` | `POST` | Public Client Hire Intake | `201 Created` | N/A | `201 Created` |
| `/api/hire-requests/[id]` | `PATCH` | `canAccessHireRequests` | `401 Unauthorized` | `403 Forbidden` *(HR)* | `200 OK` *(Sales, Super)* |
| `/api/hire-requests/[id]` | `DELETE` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/roles` | `GET` | Public Open Tracks / Admin All | `200` *(Open Only)* | `200` *(Open Only)* | `200` *(All)* |
| `/api/roles` / `/api/roles/[id]` | `POST` / `PUT` / `DELETE` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200` / `201` |
| `/api/technologies` | `GET` / `POST` | Public Approved / Admin All; Open Submission | `200` / `201` | N/A | `200` / `201` |
| `/api/technologies/[id]` | `PUT` / `DELETE` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200 OK` |
| `/api/admin/storage-config` | `GET` / `POST` | `canManageAdminUsers` *(Tests connection BEFORE saving)* | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/migrate-resumes` | `GET` / `POST` | `canAccessCandidatePipeline` | `401 Unauthorized` | `403 Forbidden` | `200 OK` |
| `/api/admin/users` | `GET` / `POST` / `PATCH` / `DELETE` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `200` / `201` *(Super)* |
| `/api/admin/seo` & `/api/admin/seo/pages` | `GET` / `POST` / `DELETE` | `canManageSeo` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/login` / `logout` / `change-password` / `setup-password` | `POST` / `GET` | Password / Invite Token Verification | `401` / `400` | N/A | `200 OK` |
| `/api/seo` | `GET` | Public Read-Only SEO Config | `200 OK` | N/A | `200 OK` |

---

## 5. Field-Level PII Visibility & Storage Redaction

Under our Privacy Policy and GDPR Article 5(1)(c) data minimization principles, Candidate PII is redacted on the server before dispatching public responses:

| Candidate Record Attribute | Anonymous User Response | Candidate (Own Profile) | Recruiter / Admin Response |
| :--- | :---: | :---: | :---: |
| `id` | Redacted / Masked | Direct UUID | Direct UUID |
| `full_name` | First Name + Initial | Full Legal Name | Full Legal Name |
| `email` | `""` *(Redacted)* | Full Email | Full Email |
| `phone_number` | `""` *(Redacted)* | Full Phone | Full Phone |
| `primary_role` / `tech_stack` | Visible | Visible | Visible |
| `overlap_hours_per_day` / `availability_status` | Visible | Visible | Visible |
| `written_pitch` | Visible | Visible | Visible |
| `resume_url` / `resume_filename` | `""` *(Redacted)* | Proxy Stream (`Talent Pulse/...`) | Proxy Stream (`Talent Pulse/...`) |
| `video_pitch_url` | Visible *(Screened)* | Direct URL | Direct Video Player |
| `internal_notes` / `pipeline_stage` | `""` *(Redacted)* | `""` *(Hidden)* | Unrestricted Access |

**Storage Credential Redaction (`GET /api/admin/storage-config`)**:
- Never returns `secretKey` or full `accessKey`.
- Returns only `endpoint`, `region`, `bucket`, `accessKeyMasked` (`first4...last4`), `hasAccessKey`, and `hasSecretKey`.

---

## 6. Authentication & Secret Lifecycle

1. **Password Encryption**:
   - Algorithm: PBKDF2 with SHA-512, 100,000 iterations, 64-byte derived key.
   - Salt: 16 random bytes (`crypto.randomBytes(16)`), stored per admin user.
2. **Session Verification**:
   - Payload: Base64url JSON (`userId`, `email`, `role`, `exp` 24h expiry, random `nonce`) signed with HMAC-SHA256.
   - Transport: HTTP-Only, `SameSite=None`, `Secure` cookie (`admin_session`) plus `Authorization: Bearer <token>` / `x-admin-token` header support.
3. **Password Rotation**:
   - Newly provisioned or password-reset admin accounts are flagged `must_change_password: true` and forced onto `/admin/change-password` before accessing dashboard tools.
4. **Encrypted Object Storage Secrets**:
   - DigitalOcean Spaces keys submitted via `/admin/dashboard` are verified against Spaces first and then encrypted via AES-256-GCM outside the repository in `~/.talentpulse/do-spaces.enc.json` (`0600` permissions), using an `scryptSync` key derived from `getSigningSecret()`.
