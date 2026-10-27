# Contributing to TalentPulse Direct

Thank you for your interest in contributing to **TalentPulse Direct**! We are committed to building an exceptional, high-velocity open-source recruitment platform, and we welcome contributions from engineers, designers, technical writers, and recruiters.

Please take a moment to review this guide before submitting an issue or pull request.

---

## Code of Conduct

All contributors and participants are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any violations to `admin@talentpulse.com`.

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed locally:
- **Node.js**: v18.17+ or v20+ (recommended)
- **Package Manager**: `npm` (v9+), `pnpm`, or `bun`
- **Git**: v2.30+
- **Supabase Account / CLI**: Local Docker-based Supabase or a free cloud project

### 2. Fork and Clone
```bash
# Clone your fork
git clone https://github.com/<your-username>/talentpulse-direct.git
cd talentpulse-direct

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a local `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_pub_..."
SUPABASE_SECRET_KEY="sb_sec_..."
```

### 4. Database Setup
Execute the complete schema and seed data in your Supabase SQL Editor:
- Load `/schema.sql` into your Supabase SQL editor and execute.
- (Optional) Seed realistic candidates using `/supabase/seed.sql`.

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Standards

### Architecture & Framework
- **Framework**: Next.js 15+ App Router (`app/`)
- **Language**: Strict TypeScript (`tsconfig.json`)
- **Styling**: Tailwind CSS v4 (`app/globals.css`), styled with raw utility classes following the Editorial Brutalist design language (`#F8F7F4`, `#111113`, `#FF4D00`).
- **Icons**: Always import icons from `lucide-react`.
- **Animations**: Import from `motion/react`.
- **Forms & Validation**: `react-hook-form` + `zod`.

### Code Quality & Validation
Before submitting any changes, make sure your code passes both linting and production build checks:
```bash
# 1. Run ESLint checks
npm run lint

# 2. Verify Next.js production build
npm run build
```

---

## Git Workflow & Commit Guidelines

We enforce the **Conventional Commits** standard to generate clear changelogs and automate semantic version releases.

### Commit Format
```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types
| Type | Description |
| ---- | ----------- |
| `feat` | A new user-facing feature |
| `fix` | A bug fix |
| `docs` | Documentation updates (README, guides, API specs) |
| `style` | Formatting, whitespace, visual alignment (no code logic changes) |
| `refactor` | Code refactoring without changing user-facing behavior |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependency bumps, build configurations |
| `ci` | CI/CD workflow updates |

### Examples
- `feat(admin): add admin user management and invite link generator`
- `fix(auth): enforce password rotation on initial admin login`
- `docs(readme): add installation guide and architectural overview`
- `refactor(supabase): optimize candidate pipeline query with index`

---

## Branching & Pull Request Process

1. **Create a Topic Branch:**
   ```bash
   git checkout -b feat/candidate-filtering
   ```
2. **Commit Your Work:** Write clear, concise conventional commit messages.
3. **Verify Locally:** Run `npm run lint` and `npm run build`.
4. **Push and Open a Pull Request:**
   - Push to your fork: `git push origin feat/candidate-filtering`
   - Open a PR against the `main` branch of the upstream repository.
   - Fill out the provided **Pull Request Template**.

### Branch Protection Rules
The `main` branch is protected:
- Direct pushes to `main` are disabled.
- All code changes require at least one code review approval.
- All GitHub Actions CI checks (linting, type-checking, building) must pass.
- Branch must be rebased or up-to-date with `main` before merging.

---

## Releases & Versioning

TalentPulse uses [Semantic Versioning (SemVer)](https://semver.org/):
- **MAJOR** (`1.0.0`): Incompatible API or breaking database schema changes.
- **MINOR** (`0.1.0`): New backward-compatible functionality.
- **PATCH** (`0.0.1`): Backward-compatible bug fixes and performance tweaks.

Maintainers tag releases using GitHub Releases with attached release changelogs.

---

## Questions and Help

Have questions or need assistance?
- Open a GitHub Discussion under the **Q&A** category.
- Join our community discussions on GitHub Issues.
- Email the maintainers at `admin@talentpulse.com`.
