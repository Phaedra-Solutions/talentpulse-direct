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

## Security Best Practices for Self-Hosting

When deploying TalentPulse to production:
- **Environment Secrets:** Never commit your `.env` file. Keep `SUPABASE_SECRET_KEY` and `GEMINI_API_KEY` strictly private in server-side secret managers.
- **Row-Level Security (RLS):** Ensure PostgreSQL RLS policies in `schema.sql` are active for all tables.
- **HTTPS:** Always enforce TLS 1.3/HTTPS in production load balancers and reverse proxies.
- **Admin Password Rotation:** Newly provisioned administrators are required to change their temporary passwords on first login. Ensure strong password complexity standards.

Thank you for helping us keep TalentPulse and our community safe!
