/**
 * Canonical Technology Normalization & Multi-Layer Deduplication Engine
 *
 * Prevents duplicates across candidate submissions, CSV/seed imports, and admin updates by combining:
 * 1. Symbol-preserving slugification (keeps C++, C#, .NET distinct)
 * 2. Separator-stripped alphanumeric canonical fingerprints + known alias mapping
 * 3. Optimal String Alignment (Damerau-Levenshtein) typo detection for longer names
 */

export interface TechCandidateLike {
  id: string;
  name: string;
  slug: string;
  status?: string;
  is_featured?: boolean;
  canonical_key?: string;
}

const KNOWN_TECH_ALIASES: Record<string, string> = {
  // Frontend & JS runtimes/frameworks
  reactjs: 'react',
  'react18': 'react',
  'react19': 'react',
  nextjs: 'nextjs',
  next: 'nextjs',
  nodejs: 'nodejs',
  node: 'nodejs',
  vue: 'vuejs',
  vuejs: 'vuejs',
  nuxt: 'nuxtjs',
  nuxtjs: 'nuxtjs',
  express: 'expressjs',
  expressjs: 'expressjs',
  nest: 'nestjs',
  nestjs: 'nestjs',
  sveltejs: 'svelte',
  angular: 'angular',
  angularjs: 'angular',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss',

  // Backend, Systems & Languages
  golang: 'go',
  go: 'go',
  py: 'python',
  python3: 'python',
  cplusplus: 'cplusplus',
  cpp: 'cplusplus',
  csharp: 'csharp',
  fsharp: 'fsharp',
  dotnet: 'dotnet',
  aspnet: 'dotnet',
  aspdotnet: 'dotnet',

  // Databases & Caching
  postgres: 'postgresql',
  postgressql: 'postgresql',
  postgresql: 'postgresql',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  mysql: 'mysql',
  mssql: 'sqlserver',
  sqlserver: 'sqlserver',
  microsoftsqlserver: 'sqlserver',
  redis: 'redis',
  supa: 'supabase',

  // Cloud & DevOps
  amazonwebservices: 'aws',
  aws: 'aws',
  googlecloud: 'gcp',
  googlecloudplatform: 'gcp',
  gcp: 'gcp',
  microsoftazure: 'azure',
  azure: 'azure',
  k8s: 'kubernetes',
  kubernetes: 'kubernetes',
  tf: 'terraform',
  terraform: 'terraform',

  // AI / LLM
  huggingface: 'huggingface',
  langchain: 'langchain',
  llamaindex: 'llamaindex',
  vllm: 'vllm',
  openai: 'openai',
  openaiapi: 'openai',
  anthropic: 'anthropic',
  claude: 'anthropic',
  pytorch: 'pytorch',
  tf2: 'tensorflow',
  tensorflow: 'tensorflow',
  scikit: 'scikitlearn',
  sklearn: 'scikitlearn',
  scikitlearn: 'scikitlearn',
};

/**
 * Generates a URL-safe slug while keeping symbol-bearing languages distinct (C++, C#, .NET).
 */
export function slugifyTech(text: string): string {
  const prepped = text
    .toLowerCase()
    .trim()
    .replace(/\+\+/g, '-plus-plus')
    .replace(/c#/g, 'c-sharp')
    .replace(/f#/g, 'f-sharp')
    .replace(/^\.net\b/g, 'dotnet')
    .replace(/\.js\b/g, 'js')
    .replace(/&/g, '-and-');

  return prepped
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Produces a separator-stripped canonical fingerprint (e.g., "Tailwind CSS" === "TailwindCSS",
 * "React.js" === "ReactJS" === "React", "Postgre SQL" === "Postgres" === "PostgreSQL").
 */
export function canonicalTechKey(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const prepped = text
    .toLowerCase()
    .trim()
    .replace(/\+\+/g, 'plusplus')
    .replace(/#/g, 'sharp')
    .replace(/^\.net\b/g, 'dotnet')
    .replace(/&/g, 'and');

  const compact = prepped.replace(/[^a-z0-9]/g, '');
  if (!compact) return '';

  if (KNOWN_TECH_ALIASES[compact]) {
    return KNOWN_TECH_ALIASES[compact];
  }

  return compact;
}

/**
 * Restricted Damerau-Levenshtein distance (treats adjacent character transpositions as distance 1).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[n][m];
}

export type DuplicateMatchReason = 'exact' | 'canonical_alias' | 'fuzzy';

/**
 * Finds the best existing match for `inputName` from `existingTechs` using:
 * 1. Exact lowercase name / slug match
 * 2. Canonical key + known alias match (Next.js / NextJS / Next JS, React / ReactJS, Postgres / PostgreSQL)
 * 3. High-confidence Damerau-Levenshtein typo match (len >= 5, dist === 1 or len >= 9 & dist <= 2)
 */
export function findBestMatchingTechnology<T extends TechCandidateLike>(
  inputName: string,
  existingTechs: T[],
  options?: { allowFuzzy?: boolean }
): { match: T; reason: DuplicateMatchReason } | null {
  const clean = inputName.trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();
  const slug = slugifyTech(clean);
  const key = canonicalTechKey(clean);

  // Prioritize approved > pending > rejected when multiple legacy entries exist
  const statusRank = (status?: string) =>
    status === 'approved' ? 0 : status === 'pending' ? 1 : 2;
  const sorted = [...existingTechs].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status)
  );

  // Stage 1: Exact name or exact slug
  for (const t of sorted) {
    if (t.name.trim().toLowerCase() === lower || t.slug.trim().toLowerCase() === slug) {
      return { match: t, reason: 'exact' };
    }
  }

  // Stage 2: Canonical fingerprint & alias match
  if (key) {
    for (const t of sorted) {
      const candidateKey = t.canonical_key || canonicalTechKey(t.name);
      if (candidateKey && candidateKey === key) {
        return { match: t, reason: 'canonical_alias' };
      }
    }
  }

  // Stage 3: High-confidence typo check (guarded to avoid false positives on short tech names)
  if (options?.allowFuzzy !== false && key.length >= 5) {
    const maxDist = key.length >= 9 ? 2 : 1;
    let bestMatch: T | null = null;
    let bestDist = Infinity;

    for (const t of sorted) {
      const candidateKey = t.canonical_key || canonicalTechKey(t.name);
      if (!candidateKey || candidateKey.length < 5) continue;
      if (Math.abs(candidateKey.length - key.length) > maxDist) continue;
      // Avoid matching different prefix acronyms that happen to differ by 1 trailing digit/letter if very different
      const dist = damerauLevenshtein(key, candidateKey);
      if (dist <= maxDist && dist < bestDist) {
        const similarity = 1 - dist / Math.max(key.length, candidateKey.length);
        if (similarity >= 0.8) {
          bestDist = dist;
          bestMatch = t;
        }
      }
    }

    if (bestMatch) {
      return { match: bestMatch, reason: 'fuzzy' };
    }
  }

  return null;
}

/**
 * Deduplicates an array of technology names (e.g., candidate `tech_stack`) by canonical key
 * while optionally mapping each item to the canonical spelling from known system technologies.
 */
export function deduplicateTechStack(
  names: string[],
  canonicalLookup?: Map<string, string>
): string[] {
  if (!Array.isArray(names)) return [];
  const seenKeys = new Set<string>();
  const result: string[] = [];

  for (const raw of names) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const key = canonicalTechKey(trimmed) || trimmed.toLowerCase();
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const mappedName = canonicalLookup?.get(key) || trimmed;
    result.push(mappedName);
  }

  return result;
}
