# Security Policy

The TalentPulse team takes the security of our open-source software and the integrity of user recruitment data extremely seriously. We appreciate the responsible disclosure of security vulnerabilities by security researchers, contributors, and the broader community.

---

## Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

**DO NOT report security vulnerabilities via public GitHub issues, discussions, or pull requests.**

If you believe you have discovered a security vulnerability in TalentPulse, please report it privately:

1. **Email Disclosure:**
   Send an encrypted or detailed report to our dedicated security contact:
   **`admin@talentpulse.com`**

2. **GitHub Private Security Advisory:**
   Alternatively, you may report the vulnerability through the GitHub Security Advisory tab:
   `https://github.com/talentpulse/talentpulse-direct/security/advisories/new`

### What to Include in Your Report

To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- The affected component, file path, endpoint, or configuration.
- Any suggested mitigations or patches (if available).
- Your preferred name/handle for attribution in our release notes (optional).

---

## Response & Disclosure Process

When a report is received, the TalentPulse maintainers follow these steps:

1. **Acknowledgment:** We will acknowledge receipt of your vulnerability report within **48 hours**.
2. **Verification & Assessment:** We will investigate and verify the findings within **5 business days**, determining its severity and impact.
3. **Remediation & Patching:** A fix will be developed in a private security fork. We will coordinate with you to test the fix.
4. **Coordinated Disclosure:** We adhere to a **90-day responsible disclosure window**. Once a security release is tagged and deployed, we publish a formal security advisory detailing the CVE (if applicable) and giving credit to the reporter.

---

## Data Protection & Privacy Rights

TalentPulse adheres to strict global data protection standards (GDPR, CCPA/CPRA, and PIPEDA). For full specifications on data minimization, processing grounds, and retention cycles, refer to [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md).

### Data Subject Requests (DSR) & PII Protection
- **DSR Requests**: Candidates or clients exercising rights of access, rectification, portability, or erasure ("Right to Be Forgotten") may submit requests directly to **`privacy@talentpulse.dev`** or **`legal@talentpulse.dev`**. All verified DSRs are fulfilled within statutory deadlines (30 days GDPR/PIPEDA, 45 days CCPA).
- **Candidate Anonymity & PII Redaction**: Unauthenticated/anonymous traffic is prohibited from accessing full candidate contact information (phone numbers, full addresses, un-redacted contact details). Public candidate views redact PII, displaying only verified technical credentials, role, timezone, and portfolio work.
- **Access Control & Permissions**: All administrative actions, hiring pipelines, storage configuration, and candidate reviews are strictly governed by the 5-tier role-based access control (RBAC) model defined in [`docs/PERMISSIONS_MATRIX.md`](docs/PERMISSIONS_MATRIX.md).

---

## Private Resume Storage & Credential Security

- **Private DigitalOcean Spaces Objects (`ACL: private`)**: Candidate resumes are uploaded under `Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}` with private access control. Direct bucket URLs are never relied on for unauthenticated public access.
- **Authenticated Proxy Streaming (`/api/candidates/resume`)**: Resumes are streamed server-side exclusively to authorized administrators, matching candidate owners, or verified internal app contexts with `Cache-Control: private, no-store, no-cache, must-revalidate` and `Pragma: no-cache`. Unauthorized external requests receive `403 Forbidden`.
- **No Raw SDK Secret/Signature Leakage**: Storage endpoints return only masked previews (`first4...last4`) and boolean status flags; connection diagnostics sanitize SDK errors to prevent leaking keys or request signatures.

---

## Security Best Practices for Self-Hosting

When deploying TalentPulse to production:
- **Environment Secrets:** Never commit `.env`, `.env.local`, `data/storage-config.json`, `data/.jwt_secret`, or `data/resumes/`. Store `SUPABASE_SECRET_KEY`, `JWT_SECRET`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, and `GEMINI_API_KEY` strictly in server-side secret managers.
- **Signing Secret (`JWT_SECRET`):** Set a dedicated high-entropy `JWT_SECRET` in production so HMAC-SHA256 admin sessions and AES-256-GCM encrypted storage credentials remain consistent across container restarts.
- **Cryptographic Authentication:** Admin and staff authentication utilizes PBKDF2 SHA-512 with 100,000 iterations and per-user 16-byte cryptographic salts. Passwords are never stored in plaintext.
- **Row-Level Security (RLS):** Ensure PostgreSQL RLS policies in `schema.sql` are active for all tables.
- **HTTPS & Transport Security:** Always enforce TLS 1.3 / HTTPS in production load balancers and reverse proxies. Set `Strict-Transport-Security` headers.
- **Admin Password Rotation:** Rotate the initial seeded `admin@talentpulse.com` password immediately (`npm run reset-admin` or Admin Dashboard password rotation). Ensure strong password complexity standards (minimum 8 characters).
- **Dual Affirmative Consent:** Verify that candidate application and enterprise hire flows retain explicit consent audit trails for Terms of Use and Privacy Policy.

Thank you for helping us keep TalentPulse and our community safe!
