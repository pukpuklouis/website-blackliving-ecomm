#!/usr/bin/env node

/**
 * Database Sync Management Script
 * Single source of truth for database operations and remote sync
 *
 * Usage:
 *   node db-sync.js --help
 *   node db-sync.js sync-from-remote
 *   node db-sync.js sync-to-remote
 *   node db-sync.js migrate-local
 *   node db-sync.js migrate-remote
 */

import { execSync } from "child_process";

const COMMANDS = {
  "sync-from-remote": {
    description:
      "Sync schema from remote database to local migrations (only if remote has migrations)",
    commands: ["drizzle-kit introspect", "drizzle-kit generate"],
  },
  "init-remote": {
    description:
      "Initialize remote database with local migrations (first time setup)",
    commands: [
      "cd ../../apps/api && wrangler d1 migrations apply blackliving-db --remote",
      "cd ../../apps/api && wrangler d1 execute blackliving-db --file=../../packages/db/seed-wrangler.sql --remote",
    ],
  },
  "sync-to-remote": {
    description: "Push local schema changes to remote database",
    commands: ["drizzle-kit push"],
  },
  "migrate-local": {
    description: "Apply migrations to local database",
    commands: [
      "cd ../../apps/api && wrangler d1 migrations apply blackliving-db --local --persist-to .wrangler/state",
    ],
  },
  "migrate-remote": {
    description: "Apply migrations to remote database",
    commands: [
      "cd ../../apps/api && wrangler d1 migrations apply blackliving-db --remote",
    ],
  },
  "seed-local": {
    description: "Seed local database with sample data",
    commands: [
      "cd ../../apps/api && wrangler d1 execute blackliving-db --file=../../packages/db/seed-wrangler.sql --local --persist-to .wrangler/state",
    ],
  },
  "seed-remote": {
    description: "Seed remote database with sample data",
    commands: [
      "cd ../../apps/api && wrangler d1 execute blackliving-db --file=../../packages/db/seed-wrangler.sql --remote",
    ],
  },
  "reset-local": {
    description: "Reset local database (delete and recreate)",
    commands: [
      "rm -rf ../../apps/api/.wrangler/state/v3/d1/",
      "cd ../../apps/api && wrangler d1 migrations apply blackliving-db --local --persist-to .wrangler/state",
      "cd ../../apps/api && wrangler d1 execute blackliving-db --file=../../packages/db/seed-wrangler.sql --local --persist-to .wrangler/state",
    ],
  },
  status: {
    description: "Show database migration status",
    commands: [
      "cd ../../apps/api && wrangler d1 migrations list blackliving-db",
      "cd ../../apps/api && wrangler d1 migrations list blackliving-db --local --persist-to .wrangler/state",
    ],
  },
};

function executeCommand(cmd, description) {
  console.log(`\n🔄 ${description || cmd}`);
  try {
    const output = execSync(cmd, {
      stdio: "inherit",
      cwd: process.cwd(),
      encoding: "utf8",
    });
    console.log(`✅ Success: ${description || cmd}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${description || cmd}`);
    console.error(error.message);
    return false;
  }
}

function showHelp() {
  console.log(`
📦 Database Sync Management
Single source of truth for BlackLiving database operations

Usage: node db-sync.js <command>

Available commands:
`);

  Object.entries(COMMANDS).forEach(([cmd, config]) => {
    console.log(`  ${cmd.padEnd(20)} ${config.description}`);
  });

  console.log(`
Environment Variables Required for Remote Operations:
  CLOUDFLARE_D1_DATABASE_ID - Database ID (set in drizzle.config.ts)
  CLOUDFLARE_API_TOKEN      - Cloudflare API token
  CLOUDFLARE_ACCOUNT_ID     - Cloudflare account ID

Examples:
  node db-sync.js sync-from-remote  # Sync remote changes to local
  node db-sync.js migrate-local     # Apply migrations locally
  node db-sync.js migrate-remote    # Apply migrations to remote
  node db-sync.js status            # Check migration status
`);
}

function main() {
  const command = process.argv[2];

  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  const config = COMMANDS[command];
  if (!config) {
    console.error(`❌ Unknown command: ${command}`);
    console.error("Use --help to see available commands");
    process.exit(1);
  }

  console.log(`\n🚀 Executing: ${command}`);
  console.log(`📝 Description: ${config.description}`);

  let allSuccessful = true;
  for (const cmd of config.commands) {
    const success = executeCommand(cmd, `Step: ${cmd}`);
    if (!success) {
      allSuccessful = false;
      break;
    }
  }

  if (allSuccessful) {
    console.log(`\n✅ Successfully completed: ${command}`);
  } else {
    console.log(`\n❌ Failed to complete: ${command}`);
    process.exit(1);
  }
}

main();
