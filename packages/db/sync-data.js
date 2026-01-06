#!/usr/bin/env node

/**
 * Enhanced Data Sync Script
 * Syncs all table data from remote to local database with proper error handling
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

const WRANGLER_CWD = "../../apps/api";
const TEMP_DIR = "./temp-sync";

/**
 * Execute wrangler command safely
 */
function executeWrangler(command, options = {}) {
  const fullCommand = `wrangler d1 execute blackliving-db ${command}`;
  try {
    return execSync(fullCommand, {
      cwd: WRANGLER_CWD,
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
  } catch (error) {
    throw new Error(`Wrangler command failed: ${error.message}`);
  }
}

/**
 * Get all table names from remote database
 */
function getAllTables() {
  console.log("🔍 Discovering tables in remote database...");

  const result = executeWrangler(
    "--command \"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;\" --remote",
    { silent: true }
  );

  try {
    // Parse JSON response properly
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON data found in response");
    }

    const data = JSON.parse(jsonMatch[0]);
    const tables = data[0]?.results?.map((row) => row.name) || [];

    console.log(`  Found ${tables.length} tables: ${tables.join(", ")}`);
    return tables;
  } catch (error) {
    throw new Error(`Failed to parse table list: ${error.message}`);
  }
}

/**
 * Get record count for a table
 */
function getTableCount(tableName, isRemote = true) {
  const location = isRemote ? "--remote" : "--local";
  const result = executeWrangler(
    `--command "SELECT COUNT(*) as count FROM ${tableName};" ${location}`,
    { silent: true }
  );

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return 0;

    const data = JSON.parse(jsonMatch[0]);
    return data[0]?.results?.[0]?.count || 0;
  } catch {
    return 0;
  }
}

/**
 * Export table data to SQL file using proper SQL dump
 */
function exportTableData(tableName) {
  console.log(`  📤 Exporting ${tableName} data...`);

  const result = executeWrangler(
    `--command "SELECT * FROM ${tableName};" --remote`,
    {
      silent: true,
    }
  );

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON data found");
    }

    const data = JSON.parse(jsonMatch[0]);
    const records = data[0]?.results || [];

    if (records.length === 0) {
      return null;
    }

    // Generate proper SQL INSERT statements
    const columns = Object.keys(records[0]);
    const sqlStatements = records.map((record) => {
      const values = columns.map((col) => {
        const val = record[col];
        if (val === null) return "NULL";
        if (typeof val === "string") {
          // Proper SQL string escaping
          return `'${val.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
        }
        return String(val);
      });

      return `INSERT INTO ${tableName} (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`;
    });

    return sqlStatements.join("\n");
  } catch (error) {
    throw new Error(`Failed to export ${tableName}: ${error.message}`);
  }
}

/**
 * Import SQL statements to local database
 */
function importTableData(sqlStatements) {
  // Create temp directory with absolute path
  const absoluteTempDir = join(process.cwd(), TEMP_DIR);
  execSync(`mkdir -p ${absoluteTempDir}`, { stdio: "pipe" });

  // Write SQL to temp file with absolute path
  const tempFile = join(absoluteTempDir, "import.sql");
  writeFileSync(tempFile, sqlStatements, "utf8");

  // Get relative path from wrangler working directory
  const relativeFromWrangler = join(
    "../..",
    "packages/db",
    TEMP_DIR,
    "import.sql"
  );

  try {
    // Execute SQL file with correct relative path from wrangler's perspective
    executeWrangler(`--file="${relativeFromWrangler}" --local`, {
      silent: true,
    });

    // Cleanup
    execSync(`rm -rf ${absoluteTempDir}`, { stdio: "pipe" });

    return true;
  } catch (error) {
    // Cleanup on error
    execSync(`rm -rf ${absoluteTempDir}`, { stdio: "pipe" });
    throw error;
  }
}

/**
 * Sync a single table
 */
function syncTable(tableName) {
  console.log(`\n📋 Syncing ${tableName}...`);

  try {
    // Get counts
    const remoteCount = getTableCount(tableName, true);
    const localCount = getTableCount(tableName, false);

    console.log(
      `  Remote: ${remoteCount} records, Local: ${localCount} records`
    );

    if (remoteCount === 0) {
      console.log(`  ℹ️  No data in remote ${tableName}`);
      return;
    }

    // Clear local table
    console.log(`  🗑️  Clearing local ${tableName}...`);
    executeWrangler(`--command "DELETE FROM ${tableName};" --local`, {
      silent: true,
    });

    // Export and import data
    const sqlStatements = exportTableData(tableName);
    if (sqlStatements) {
      console.log(`  📥 Importing ${remoteCount} records...`);
      importTableData(sqlStatements);

      // Verify import
      const newLocalCount = getTableCount(tableName, false);
      if (newLocalCount === remoteCount) {
        console.log(`  ✅ Successfully synced ${newLocalCount} records`);
      } else {
        console.log(
          `  ⚠️  Partial sync: ${newLocalCount}/${remoteCount} records`
        );
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to sync ${tableName}: ${error.message}`);
  }
}

/**
 * Main sync function
 */
function main() {
  console.log("🔄 Enhanced Data Sync: Remote → Local");
  console.log("=====================================\n");

  try {
    // Get all tables
    const tables = getAllTables();

    if (tables.length === 0) {
      console.log("⚠️  No tables found in remote database");
      return;
    }

    // Sync each table
    let successCount = 0;
    let errorCount = 0;

    for (const table of tables) {
      try {
        syncTable(table);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to sync ${table}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log("\n=====================================");
    console.log("📊 Sync Summary:");
    console.log(`  ✅ Successful: ${successCount} tables`);
    console.log(`  ❌ Failed: ${errorCount} tables`);
    console.log(`  📋 Total: ${tables.length} tables`);

    if (successCount > 0) {
      console.log("\n💡 Next steps:");
      console.log("  pnpm -F db db:studio:local  # View synced data");
    }
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
  }
}

main();
