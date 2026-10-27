# Supabase Database Migrations Workflow

TalentPulse Direct uses official, timestamped Supabase migrations located in `supabase/migrations/`.

---

## 1. How Supabase Tracks Migrations

Whenever migrations are pushed, Supabase tracks applied versions in an internal table:
```sql
supabase_migrations.schema_migrations
```
Each migration is applied **exactly once in chronological order**.

---

## 2. Pushing Migrations Directly from Your Terminal

You don't need to manually paste SQL into the browser every time. You can sync them automatically:

### Step 1: Link your project
```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
```
*(Your project ref is the subdomain from `https://[project-ref].supabase.co`)*

### Step 2: Push pending migrations to remote Supabase
```bash
npx supabase db push
```
This inspects which migrations haven't run yet on your Supabase PostgreSQL database and applies only the new ones!

---

## 3. Pulling Changes Made Directly in Supabase Studio

If you prefer adding columns or editing tables visually in the **Supabase Dashboard (Table Editor)**:
```bash
npx supabase db pull
```
Supabase generates a new `.sql` file in `supabase/migrations/` matching the exact changes made in the web UI!

---

## 4. Creating a New Migration File

To create a new migration for upcoming features:
```bash
npx supabase migration new your_feature_name
```
This generates:
`supabase/migrations/<timestamp>_your_feature_name.sql`

Add your SQL queries there, then run `npx supabase db push`.
