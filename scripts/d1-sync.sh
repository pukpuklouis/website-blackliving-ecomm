#!/bin/bash

# D1 Database Sync Script
# Menu-driven workflow for exporting remote D1 and importing to local

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/apps/api"
REMOTE_DB="blackliving-db"
LOCAL_DB="blackliving-db"
EXPORT_FILE="$PROJECT_ROOT/remote-export.sql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$PROJECT_ROOT/local-backup-${TIMESTAMP}.sql"
WRANGLER_ENV="development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  D1 Database Sync Tool${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Please install it first."
        exit 1
    fi
    print_status "Wrangler CLI found: $(wrangler --version)"
}

show_menu() {
    clear
    print_header
    echo -e "${YELLOW}Current Configuration:${NC}"
    echo "Remote DB: $REMOTE_DB (production)"
    echo "Local DB: $LOCAL_DB (development environment)"
    echo "Export File: $EXPORT_FILE"
    echo "Backup File: $BACKUP_FILE"
    echo "Wrangler Environment: $WRANGLER_ENV"
    echo
    echo -e "${YELLOW}Available Options:${NC}"
    echo "1) Export remote database to SQL file"
    echo "2) Check local database configuration"
    echo "3) Apply migrations to local database"
    echo "4) Backup local database"
    echo "5) Import exported data to local database"
    echo "6) Clear local database data"
    echo "7) Verify local database"
    echo "8) Full workflow (export → backup → import)"
    echo "9) Clean up temporary files"
    echo "10) Show database info"
    echo "0) Exit"
    echo
    echo -n "Select an option [0-9]: "
}

export_remote() {
    echo
    echo -e "${BLUE}Exporting remote database...${NC}"
    
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    if wrangler d1 export "$REMOTE_DB" --env production --remote --output="$EXPORT_FILE"; then
        print_status "Export completed successfully!"
        echo "File saved to: $EXPORT_FILE"
        echo "File size: $(du -h "$EXPORT_FILE" 2>/dev/null || echo "Unknown")"
    else
        print_error "Export failed!"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
}

create_local_db() {
    echo
    echo -e "${BLUE}Checking local database configuration...${NC}"
    
    # Change to API directory for wrangler commands
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    # Check if local DB is configured in wrangler.toml
    if wrangler d1 execute "$LOCAL_DB" --local --env development --command="SELECT 1 as test;" >/dev/null 2>&1; then
        print_status "Local database '$LOCAL_DB' is accessible!"
        echo "Working directory: $(pwd)"
    else
        print_error "Cannot access local database '$LOCAL_DB'!"
        echo "Please check your wrangler.toml configuration in: $API_DIR/wrangler.toml"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
}

apply_migrations() {
    echo
    echo -e "${BLUE}Applying migrations to local database...${NC}"
    
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    if wrangler d1 migrations apply "$LOCAL_DB" --local --env development; then
        print_status "Migrations applied successfully!"
    else
        print_error "Migration failed!"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
}

backup_local() {
    echo
    echo -e "${BLUE}Backing up local database...${NC}"
    
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    if wrangler d1 export "$LOCAL_DB" --local --env development --output="$BACKUP_FILE"; then
        print_status "Backup completed successfully!"
        echo "Backup saved to: $BACKUP_FILE"
    else
        print_error "Backup failed!"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
}

clear_local_data() {
    echo
    echo -e "${BLUE}Clearing local database data...${NC}"

    echo -e "${YELLOW}⚠ WARNING: This will delete ALL data from your local database!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        return 0
    fi

    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }

    # List of tables to clear (excluding system tables)
    # Order matters: delete from tables with foreign keys first, then referenced tables
    tables_to_clear=(
        "posts"  # references users, post_categories
        "post_categories"
        "sessions"  # references users
        "accounts"  # references users
        "customer_profiles"  # references users
        "products"
        "users"  # referenced by many tables
        "appointments"
        "contacts"
        "customer_interactions"
        "customer_tag_assignments"
        "customer_tags"
        "newsletters"
        "orders"
        "reviews"
        "verifications"
        "customer_addresses"
        "customer_notification_preferences"
        "customer_payment_methods"
        "customer_recently_viewed"
        "customer_reviews"
        "customer_wishlists"
        "user_security"
        "auth_tokens"
        "reservations"
    )

    for table in "${tables_to_clear[@]}"; do
        echo "Clearing table: $table"
        if ! wrangler d1 execute "$LOCAL_DB" --local --env development --command="DELETE FROM $table;"; then
            print_error "Failed to clear table: $table"
            cd "$SCRIPT_DIR"
            return 1
        fi
    done

    print_status "All local data cleared successfully!"
    cd "$SCRIPT_DIR"
}

import_to_local() {
    echo
    echo -e "${BLUE}Importing data to local database...${NC}"

    if [[ ! -f "$EXPORT_FILE" ]]; then
        print_error "Export file not found: $EXPORT_FILE"
        echo "Please export the remote database first (option 1)."
        return 1
    fi

    # Find the actual local D1 database file
    LOCAL_DB_PATH=$(find "$API_DIR/.wrangler/state/v3/d1" -name "*.sqlite" -type f 2>/dev/null | head -n 1)
    
    if [[ -z "$LOCAL_DB_PATH" ]]; then
        print_error "Cannot find local D1 database file in .wrangler/state/v3/d1/"
        echo "Please ensure the local database exists by running 'pnpm --filter api dev' first."
        return 1
    fi
    
    print_status "Found local database: $LOCAL_DB_PATH"
    echo "Importing data using INSERT OR REPLACE strategy..."
    echo "This will update existing records and insert new ones."
    echo
    
    # Use sed to convert INSERT INTO to INSERT OR REPLACE INTO, then pipe to sqlite3
    if sed 's/^INSERT INTO/INSERT OR REPLACE INTO/' "$EXPORT_FILE" | grep "^INSERT OR REPLACE INTO" | sqlite3 "$LOCAL_DB_PATH"; then
        print_status "Import completed successfully!"
        echo "Data has been synced (existing records updated, new records inserted)."
    else
        print_error "Import failed!"
        return 1
    fi
}

verify_local() {
    echo
    echo -e "${BLUE}Verifying local database...${NC}"
    
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    echo "Checking database connection..."
    if wrangler d1 execute "$LOCAL_DB" --local --env development --command="SELECT 1 as test;" >/dev/null 2>&1; then
        print_status "Database connection successful!"
    else
        print_error "Cannot connect to local database!"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    echo
    echo "Database tables:"
    wrangler d1 execute "$LOCAL_DB" --local --env development --command="SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "No tables found or query failed"
    
    echo
    echo "Sample data (first 5 rows from first table):"
    wrangler d1 execute "$LOCAL_DB" --local --env development --command="SELECT * FROM (SELECT * FROM sqlite_master WHERE type='table' LIMIT 1) CROSS JOIN (SELECT * FROM (SELECT * FROM main.sqlite_master LIMIT 5));" 2>/dev/null || echo "No data available or query failed"
    
    cd "$SCRIPT_DIR"
}

full_workflow() {
    echo
    echo -e "${BLUE}Running full workflow...${NC}"
    echo "This will: export → backup → import"
    echo
    
    read -p "Continue with full workflow? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        return 0
    fi
    
    # Step 1: Export
    export_remote || return 1
    
    # Step 2: Backup
    backup_local || return 1
    
    # Step 3: Import
    import_to_local || return 1
    
    # Step 4: Verify
    verify_local || return 1
    
    print_status "Full workflow completed successfully!"
}

cleanup_files() {
    echo
    echo -e "${BLUE}Cleaning up temporary files...${NC}"
    
    files_to_clean=("$EXPORT_FILE" "$PROJECT_ROOT/remote-export-*.sql" "$PROJECT_ROOT/local-backup-*.sql")
    cleaned_count=0
    
    for pattern in "${files_to_clean[@]}"; do
        for file in $pattern; do
            if [[ -f "$file" ]]; then
                rm "$file"
                echo "Removed: $file"
                ((cleaned_count++))
            fi
        done
    done
    
    if [[ $cleaned_count -gt 0 ]]; then
        print_status "Cleaned up $cleaned_count file(s)."
    else
        print_warning "No temporary files found to clean."
    fi
}

show_db_info() {
    echo
    echo -e "${BLUE}Database Information${NC}"
    echo
    
    cd "$API_DIR" || {
        print_error "Cannot change to API directory: $API_DIR"
        return 1
    }
    
    echo "Available D1 databases:"
    wrangler d1 list
    echo
    
    cd "$SCRIPT_DIR"
    echo "Local files in project root:"
    ls -la "$PROJECT_ROOT"/*.sql 2>/dev/null || echo "No SQL files found in project root"
}

# Main execution
main() {
    check_wrangler
    
    while true; do
        show_menu
        read -r choice
        echo
        
        case $choice in
            1) export_remote ;;
            2) create_local_db ;;
            3) apply_migrations ;;
            4) backup_local ;;
            5) import_to_local ;;
            6) clear_local_data ;;
            7) verify_local ;;
            8) full_workflow ;;
            9) cleanup_files ;;
            10) show_db_info ;;
            0)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 0-10."
                ;;
        esac
        
        echo
        echo -n "Press Enter to continue..."
        read -r
    done
}

# Run main function
main "$@"