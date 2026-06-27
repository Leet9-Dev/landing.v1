#!/usr/bin/env node
/*
 * check-db-migration-safety.js
 *
 * A harmless, informational reminder about Leet9's database migration safety
 * rules. It does NOT connect to any database, does NOT read secrets or env
 * vars, and does NOT mutate anything. It only prints guidance and exits 0.
 *
 * Run: npm run db:safety-check
 * See: docs/DB_MIGRATION_SAFETY.md, docs/MIGRATION_READINESS_CHECKLIST.md
 */

const lines = [
  "",
  "  Leet9 — Database Migration Safety Check (informational only)",
  "  ===========================================================",
  "",
  "  Current reality:",
  "    • There is ONE Neon database and it is PRODUCTION.",
  "    • There is NO dev/staging database yet.",
  "    • Mattia controls Neon / Vercel database access.",
  "",
  "  Because the only database is production, any migration command is a",
  "  production-mutating command. Do NOT run these against production:",
  "",
  "    ✗ prisma migrate dev",
  "    ✗ prisma migrate reset      (drops & recreates the database)",
  "    ✗ prisma db push",
  "    ✗ prisma migrate deploy     (until a reviewed migration is approved)",
  "    ✗ any ad-hoc destructive SQL",
  "",
  "  Safe / allowed:",
  "    ✓ prisma format",
  "    ✓ prisma validate",
  "    ✓ prisma generate",
  "    ✓ prisma migrate diff (datamodel→datamodel, no DB connection)",
  "",
  "  Before applying the Phase 10 migration:",
  "    1. Create a Neon dev/staging branch (non-production DATABASE_URL).",
  "    2. Generate the tracked migration there (prisma migrate dev).",
  "    3. Review the SQL diff vs prisma/migrations-draft/.",
  "    4. Get DB-owner approval + a production restore point.",
  "    5. Apply with prisma migrate deploy — approved step only.",
  "",
  "  Docs: docs/DB_MIGRATION_SAFETY.md",
  "        docs/MIGRATION_READINESS_CHECKLIST.md",
  "",
  "  This script made no database connection and changed nothing.",
  "",
];

console.log(lines.join("\n"));
process.exit(0);
