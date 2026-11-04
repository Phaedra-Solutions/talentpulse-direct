# TalentPulse Direct — Role-Based Permissions & Access Control Matrix

**Version:** 1.4.0  
**Effective Date:** November 2026  
**Document Status:** Security & Authorization Standard  

---

## 1. Role Taxonomy & Clearance Levels

TalentPulse Direct enforces strict Role-Based Access Control (RBAC) across frontend routes, interactive UI components, backend Next.js API routes, and database operations. Every request is verified via cryptographically signed HMAC-SHA256 session tokens or database row ownership.

| Role Identifier | Role Display Title | Clearance Level | Primary Responsibilities & Scope |
| :--- | :--- | :---: | :--- |
| `anonymous` | **Anonymous / Public User** | **Tier 0** | General website visitors, prospective client prospects, and applicant candidates. Can browse public landing pages, search sanitized candidate profiles, submit talent applications, and submit hire requests. |
| `candidate` | **Candidate User** | **Tier 1** | Verified talent profile owners. Authenticated exclusively via time-sensitive Email OTP / Magic-Link tokens. May inspect and modify their own profile data, availability status, compensation expectations, and resumes. Forbidden from accessing recruiter pipelines or other candidates' records. |
| `sales_executive` | **Sales Executive** | **Tier 2** | Enterprise account managers and outbound recruiters. Authorized to review candidate pipelines (`/admin/dashboard`) and manage inbound customer hire requests (`/admin/hire-requests`). **Forbidden** from modifying system taxonomy (`/admin/roles`), managing admin accounts (`/admin/users`), modifying SEO configurations (`/admin/seo`), and downloading bulk candidate exports (`.xlsx`/`.csv`). |
| `hr_executive` | **HR Executive** | **Tier 2** | Technical recruiters and talent acquisition leads. Authorized to review and advance candidates across the pipeline (`/admin/dashboard`), download formatted Excel candidate spreadsheets (`.xlsx`), and manage dynamic engineering tracks and technology taxonomy (`/admin/roles`). **Forbidden** from accessing client hire requests (`/admin/hire-requests`), admin users (`/admin/users`), and SEO configurations (`/admin/seo`). |
| `super_admin` | **Super Admin (Administrator)** | **Tier 3** | System administrators, CTOs, and platform owners. Possesses complete, unrestricted authority across all pages, pipelines, hire requests, roles, user clearance provisioning, audit logs, and SEO configurations. Can generate cryptographic invite tokens and deactivate team accounts. |

---

## 2. Page & Route Access Matrix

This table defines route-level access rules enforced via Next.js client-side authentication gates and server-side middleware:

| Route Path | Description | Anonymous | Candidate | Sales Exec | HR Exec | Super Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `/` | Landing Page & Talent Showcase | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/candidates` | Public Sanitized Candidate Directory | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/candidates/[id]` | Public Candidate Showcase Profile | ✅ **Allowed** *(Sanitized)* | ✅ **Allowed** *(Sanitized)* | ✅ **Allowed** *(Full)* | ✅ **Allowed** *(Full)* | ✅ **Allowed** *(Full)* |
| `/apply` | Candidate Intake Application Form | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/hire` | Client Hire Request Form | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/candidate/update` | Candidate Self-Service Portal | 🔒 *OTP Gated* | ✅ **Allowed** *(Own Record)* | ⛔ *Redirect* | ⛔ *Redirect* | ⛔ *Redirect* |
| `/privacy` | Global Privacy Policy | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/terms` | Commercial Terms of Use | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/login` | Administrator Authentication Gateway | ✅ **Allowed** | ⛔ *Redirect* | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/dashboard` | Recruiter Candidate Command Center | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ✅ **Allowed** | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/hire-requests` | Customer Hire Requests Management | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ✅ **Allowed** | ⛔ *403 -> /admin/dashboard* | ✅ **Allowed** |
| `/admin/roles` | Engineering Tracks & Tech Moderation | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ⛔ *403 -> /admin/dashboard* | ✅ **Allowed** | ✅ **Allowed** |
| `/admin/users` | Administrator Clearance Management | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ⛔ *403 -> /admin/dashboard* | ⛔ *403 -> /admin/dashboard* | ✅ **Allowed** |
| `/admin/seo` | SEO, GTM, Meta & Robots Engine | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ⛔ *403 -> /admin/dashboard* | ⛔ *403 -> /admin/dashboard* | ✅ **Allowed** |
| `/admin/change-password` | Admin Password Rotation Portal | ⛔ *401 -> /admin/login* | ⛔ *401 -> /admin/login* | ✅ **Allowed** *(Own Password)* | ✅ **Allowed** *(Own Password)* | ✅ **Allowed** *(Own Password)* |
| `/admin/setup-password` | Invite Token Account Initialization | 🔒 *Token Gated* | ⛔ *Redirect* | 🔒 *Token Gated* | 🔒 *Token Gated* | 🔒 *Token Gated* |

---

## 3. Action & Data Mutation Matrix

| Operation / Capability | Anonymous | Candidate User | Sales Exec | HR Exec | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Submit New Candidate Application** | ✅ Yes | ⚠️ Duplicate Check | ✅ Yes | ✅ Yes | ✅ Yes |
| **Submit Customer Hire Request** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Candidate Phone & Email** | ❌ Redacted | ⚠️ Own Record Only | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **View Internal Recruiter Notes** | ❌ Hidden | ❌ Hidden | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Edit Candidate Pipeline Stage** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit Internal Recruiter Notes** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Update Own Availability Status** | ❌ No | ✅ Yes *(Via OTP)* | ❌ No | ❌ No | ✅ Admin Override |
| **Update Own Hourly / Annual Rates** | ❌ No | ✅ Yes *(Via OTP)* | ❌ No | ❌ No | ✅ Admin Override |
| **View Client Hire Requests & Budgets** | ❌ No | ❌ No | ✅ Full Access | ❌ Forbidden | ✅ Full Access |
| **Update Client Hire Request Notes** | ❌ No | ❌ No | ✅ Yes | ❌ Forbidden | ✅ Yes |
| **Delete Client Hire Request** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Create / Modify Engineering Tracks** | ❌ No | ❌ No | ❌ Forbidden | ✅ Yes | ✅ Yes |
| **Approve / Reject Custom Technologies** | ❌ No | ❌ No | ❌ Forbidden | ✅ Yes | ✅ Yes |
| **Delete Role / Track (Candidate Safety Check)** | ❌ No | ❌ No | ❌ Forbidden | ✅ Safe Delete | ✅ Safe Delete |
| **Export Candidates to Excel (.xlsx)** | ❌ No | ❌ No | ❌ **Forbidden** | ✅ **Authorized** | ✅ **Authorized** |
| **Export Candidates to CSV** | ❌ No | ❌ No | ❌ **Forbidden** | ✅ **Authorized** | ✅ **Authorized** |
| **Export Hire Requests to CSV** | ❌ No | ❌ No | ❌ **Forbidden** | ❌ **Forbidden** | ✅ **Authorized** |
| **Create New Administrator User** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Deactivate / Reactivate Admin User** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Generate Cryptographic Invite Link** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Modify Global SEO & GTM Tracking** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Modify Page-Specific SEO Overrides** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |
| **Edit Robots.txt & Crawler Directives** | ❌ No | ❌ No | ❌ Forbidden | ❌ Forbidden | ✅ Yes |

---

## 4. API Endpoints Protection & Security Rules

All server-side Next.js route handlers enforce `requireAdminAuth(req, permissionCheck)`:

| Endpoint Route | HTTP Method | Target Permission Check | Unauthenticated | Unauthorized Role | Authorized Success |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `/api/candidates` | `GET` | *Public Sanitized / Admin Pipeline* | `200` *(Sanitized PII)* | N/A | `200` *(Full PII)* |
| `/api/candidates` | `POST` | *Public Intake Application* | `201 Created` | N/A | `201 Created` |
| `/api/candidates` | `PATCH` | `canAccessCandidatePipeline` | `401 Unauthorized` | `403 Forbidden` | `200 OK` |
| `/api/candidates/[id]` | `PATCH` | `canAccessCandidatePipeline` | `401 Unauthorized` | `403 Forbidden` | `200 OK` |
| `/api/hire-requests` | `GET` | `canAccessHireRequests` | `401 Unauthorized` | `403 Forbidden` *(HR)* | `200 OK` *(Sales, Super)* |
| `/api/hire-requests` | `POST` | *Public Intake Client Request* | `201 Created` | N/A | `201 Created` |
| `/api/hire-requests/[id]` | `PATCH` | `canAccessHireRequests` | `401 Unauthorized` | `403 Forbidden` *(HR)* | `200 OK` *(Sales, Super)* |
| `/api/hire-requests/[id]` | `DELETE` | `canManageAdminUsers` *(Super)* | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/roles` | `GET` | *Public Open Tracks / Closed Admin* | `200` *(Open Only)* | `200` *(Open Only)* | `200` *(All Tracks)* |
| `/api/roles` | `POST` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `201 Created` |
| `/api/roles/[id]` | `PUT` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200 OK` |
| `/api/roles/[id]` | `DELETE` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200 OK` |
| `/api/technologies` | `GET` | *Public Approved / All Moderation* | `200` *(Approved Only)*| `200` *(Approved Only)*| `200` *(All Techs)* |
| `/api/technologies` | `POST` | *Candidate or Admin Submission* | `201 Created` | N/A | `201 Created` |
| `/api/technologies/[id]` | `PUT` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200 OK` |
| `/api/technologies/[id]` | `DELETE` | `canManageRolesAndTech` | `401 Unauthorized` | `403 Forbidden` *(Sales)* | `200 OK` |
| `/api/admin/users` | `GET` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/users` | `POST` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `201 Created` *(Super)* |
| `/api/admin/users` | `PATCH` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/users` | `DELETE` | `canManageAdminUsers` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/seo` | `GET` | `canManageSeo` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/seo` | `POST` | `canManageSeo` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/seo/pages` | `POST` | `canManageSeo` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |
| `/api/admin/seo/pages` | `DELETE` | `canManageSeo` | `401 Unauthorized` | `403 Forbidden` | `200 OK` *(Super)* |

---

## 5. Field-Level PII Visibility & Redaction

Under our Privacy Policy and GDPR Article 5(1)(c) data minimization principles, Candidate Personally Identifiable Information (PII) is dynamically redacted on the server before dispatching responses to unauthenticated users:

| Candidate Record Attribute | Anonymous User Response | Candidate (Own Profile) | Recruiter / Admin Response |
| :--- | :---: | :---: | :---: |
| `id` | Hashed UUID | Direct UUID | Direct UUID |
| `full_name` | First Name + Initial | Full Legal Name | Full Legal Name |
| `email` | `""` *(Redacted)* | Full Email | Full Email |
| `phone_number` | `""` *(Redacted)* | Full Phone | Full Phone |
| `primary_role` | Visible | Visible | Visible |
| `tech_stack` | Visible | Visible | Visible |
| `overlap_hours_per_day` | Visible | Visible | Visible |
| `availability_status` | Visible | Visible | Visible |
| `hourly_rate_usd` | Visible | Visible | Visible |
| `written_pitch` | Visible | Visible | Visible |
| `resume_url` / `resume_filename` | `""` *(Redacted)* | Direct URL | Direct File Preview |
| `video_pitch_url` | Visible *(Screened)* | Direct URL | Direct Video Player |
| `internal_notes` | `""` *(Redacted)* | `""` *(Hidden)* | Unrestricted Notes |
| `pipeline_stage` | `""` *(Redacted)* | `""` *(Hidden)* | Full Pipeline Stage |

---

## 6. Authentication & Session Security Lifecycle

1. **Password Encryption**:
   - Algorithm: PBKDF2 with SHA-512.
   - Salt: 16 bytes cryptographically secure pseudo-random bytes (`crypto.randomBytes(16)`), stored in database.
   - Iterations: 100,000 rounds.
   - Output: 64-byte key length (128-character hex string).
2. **Session Verification**:
   - Token structure: Encrypted base64 JSON payload containing `userId`, `email`, `role`, `exp` (24h expiry), and random `nonce`, signed via HMAC-SHA256.
   - Transport: Secure, HTTP-Only, SameSite=None, HTTPS-enforced cookie (`admin_session`) and optional `Authorization: Bearer <token>` header for cross-origin API operations.
3. **Password Rotation**:
   - Newly created administrator accounts are flagged with `must_change_password: true`.
   - Any attempt to access protected admin pages redirects to `/admin/change-password`.
   - Passwords must be at least 8 characters long and differ from temporary credentials.
