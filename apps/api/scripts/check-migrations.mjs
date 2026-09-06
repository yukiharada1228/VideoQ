#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateMigration } from "drizzle-kit/api";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = join(root, "drizzle");
const metaDir = join(migrationDir, "meta");
const journal = JSON.parse(
  await readFile(join(metaDir, "_journal.json"), "utf8"),
);

// 0000-0016 are immutable historical migrations created before this policy.
// Enforce generated-vs-custom provenance for every migration from 0017 onward.
const enforcedFromIndex = 17;
const customMarker = "-- drizzle-kit:custom";
const ddlPattern = /\b(?:ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE)\b/i;
const errors = [];

const sqlFiles = (await readdir(migrationDir))
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();
const journalFiles = journal.entries.map((entry) => `${entry.tag}.sql`).sort();

for (const file of journalFiles) {
  if (!sqlFiles.includes(file)) errors.push(`journal references missing ${file}`);
}
for (const file of sqlFiles) {
  if (!journalFiles.includes(file)) errors.push(`migration is absent from journal: ${file}`);
}

for (const entry of journal.entries.filter(
  (candidate) => candidate.idx >= enforcedFromIndex,
)) {
  const previous = journal.entries.find(
    (candidate) => candidate.idx === entry.idx - 1,
  );
  if (!previous) {
    errors.push(`${entry.tag}: previous journal entry is missing`);
    continue;
  }

  let previousSnapshot;
  let currentSnapshot;
  let actualSql;
  try {
    [previousSnapshot, currentSnapshot, actualSql] = await Promise.all([
      readFile(
        join(metaDir, `${String(previous.idx).padStart(4, "0")}_snapshot.json`),
        "utf8",
      ).then(JSON.parse),
      readFile(
        join(metaDir, `${String(entry.idx).padStart(4, "0")}_snapshot.json`),
        "utf8",
      ).then(JSON.parse),
      readFile(join(migrationDir, `${entry.tag}.sql`), "utf8"),
    ]);
  } catch (error) {
    errors.push(`${entry.tag}: ${error.message}`);
    continue;
  }

  const generatedStatements = await generateMigration(
    previousSnapshot,
    currentSnapshot,
  );
  const isCustom = actualSql.startsWith(customMarker);

  if (isCustom) {
    if (generatedStatements.length !== 0) {
      errors.push(
        `${entry.tag}: custom migration snapshot contains schema changes`,
      );
    }
    const executableSql = actualSql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    if (ddlPattern.test(executableSql)) {
      errors.push(`${entry.tag}: custom migration contains DDL`);
    }
    continue;
  }

  const expectedSql = generatedStatements.join("--> statement-breakpoint\n");
  if (actualSql !== expectedSql) {
    errors.push(
      `${entry.tag}: SQL differs from the Drizzle snapshot-generated output`,
    );
  }
}

if (errors.length > 0) {
  console.error("Drizzle migration verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Verified ${journal.entries.length} journal entries; migration provenance is enforced from index ${enforcedFromIndex}.`,
);
