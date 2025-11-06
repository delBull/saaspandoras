#!/bin/bash

# Migration script for all databases (Local, Staging, Main)
# Run this script from the project root directory
# Date: November 5, 2025

echo "🚀 Starting migration for ALL databases..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run migration for a specific database
run_migration() {
    local env_name=$1
    local db_url=$2

    echo -e "\n${BLUE}📊 Migrating ${env_name} database...${NC}"

    # Run the SQL migration directly using psql
    echo -e "${YELLOW}Running SQL migration...${NC}"

    # Execute the migration SQL file
    if psql "$db_url" -f "apps/dashboard/drizzle/add-rewards-fields-migration.sql"; then
        echo -e "${GREEN}✅ ${env_name} database migration completed successfully!${NC}"
    else
        echo -e "${RED}❌ ${env_name} database migration failed!${NC}"
        return 1
    fi

    return 0
}

# Database URLs
LOCAL_DB="postgresql://Marco@localhost:5432/pandoras_local"
STAGING_DB="postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
MAIN_DB="postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations for each environment
echo -e "${BLUE}Starting database migrations...${NC}"

# Local
if run_migration "LOCAL" "$LOCAL_DB"; then
    echo -e "${GREEN}✅ LOCAL migration successful${NC}"
else
    echo -e "${RED}❌ LOCAL migration failed${NC}"
fi

# Staging
if run_migration "STAGING" "$STAGING_DB"; then
    echo -e "${GREEN}✅ STAGING migration successful${NC}"
else
    echo -e "${RED}❌ STAGING migration failed${NC}"
fi

# Main
if run_migration "MAIN" "$MAIN_DB"; then
    echo -e "${GREEN}✅ MAIN migration successful${NC}"
else
    echo -e "${RED}❌ MAIN migration failed${NC}"
fi

echo -e "\n${GREEN}🎉 All database migrations completed!${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  - Added recurring rewards fields to projects table"
echo -e "  - Added integration details and legal entity help fields"
echo -e "  - All environments should now support the new ConversationalForm features"
