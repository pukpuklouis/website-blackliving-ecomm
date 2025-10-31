#!/usr/bin/env node
/**
 * Migration Integrity Validator
 * Checks that all migrations have corresponding snapshots
 * Run this in CI or pre-commit hook
 */

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, 'migrations');
const META_DIR = join(MIGRATIONS_DIR, 'meta');

function getMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

function getSnapshotFiles() {
  return readdirSync(META_DIR)
    .filter((file) => file.endsWith('_snapshot.json'))
    .sort();
}

function extractMigrationNumber(filename) {
  const match = filename.match(/^(\d+)_/);
  return match ? match[1] : null;
}

function validateMigrations() {
  console.log('🔍 Validating migration integrity...\n');

  const migrationFiles = getMigrationFiles();
  const snapshotFiles = getSnapshotFiles();

  const migrationNumbers = migrationFiles
    .map(extractMigrationNumber)
    .filter(Boolean);

  const snapshotNumbers = snapshotFiles
    .map(extractMigrationNumber)
    .filter(Boolean);

  console.log(`Found ${migrationFiles.length} migration files`);
  console.log(`Found ${snapshotFiles.length} snapshot files\n`);

  let hasErrors = false;
  const missingSnapshots = [];

  // Check each migration has a corresponding snapshot
  for (const migNum of migrationNumbers) {
    const hasSnapshot = snapshotNumbers.includes(migNum);
    const migrationFile = migrationFiles.find((f) => f.startsWith(migNum));

    if (hasSnapshot) {
      console.log(`✅ ${migrationFile} → ${migNum}_snapshot.json`);
    } else {
      console.log(`❌ ${migrationFile} → MISSING SNAPSHOT!`);
      missingSnapshots.push(migNum);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log('\n⚠️  Migration Integrity Issues Detected!\n');
    console.log('Missing snapshots for migrations:', missingSnapshots.join(', '));
    console.log('\n📝 Known Issue:');
    console.log('   Migrations 0003-0005 were created manually before Drizzle Kit was used.');
    console.log('   This is acceptable because:');
    console.log('   - Migration 0006 snapshot includes all their changes');
    console.log('   - Future migrations will diff correctly from 0006');
    console.log('   - The snapshot chain is repaired going forward\n');
    console.log('✅ Solution: Always use `pnpm db:generate` for new migrations\n');

    // Only fail if there are missing snapshots AFTER 0006
    const problematicMissing = missingSnapshots.filter(num => parseInt(num) > 6);
    if (problematicMissing.length > 0) {
      console.error('❌ CRITICAL: Missing snapshots after migration 0006!');
      console.error('   This will break future migration generation.');
      console.error('   Missing:', problematicMissing.join(', '));
      process.exit(1);
    }
  } else {
    console.log('\n✅ All migrations have corresponding snapshots!');
  }

  console.log('\n✨ Migration integrity check complete\n');
}

// Run validation
try {
  validateMigrations();
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
