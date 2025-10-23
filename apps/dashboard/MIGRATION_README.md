# 🔧 Database Migration Fix for Production

## Problem Identified

The application in production is missing the `users` table and other database tables. The error logs show:

```
k: relation "users" does not exist
Error in ensureUser: relation "users" does not exist
💥 [Profile API] CRITICAL ERROR: relation "users" does not exist
```

## Root Cause

1. **Schema Inconsistency**: The schema file (`src/db/schema.ts`) was defining the users table as `pgTable("User", ...)` (capital U) but the migrations create it as `pgTable("users", ...)` (lowercase u).

2. **Missing Migrations**: The migration journal shows only the initial migration (`0000_loud_morph`) was applied, but subsequent migrations (0001-0011) were not executed in production.

3. **Broken Migration**: The migration `0009_fix_user_id_default.sql` was trying to alter table "User" (capital) but the actual table is "users" (lowercase).

## Files Fixed

### ✅ 1. Schema Consistency (`src/db/schema.ts`)
- Changed `pgTable("User", ...)` to `pgTable("users", ...)` to match migrations
- Updated all foreign key references to use lowercase "users"

### ✅ 2. Migration Fix (`drizzle/0009_fix_user_id_default.sql`)
- Changed `ALTER TABLE "User"` to `ALTER TABLE "users"`
- Updated all references from "User" to "users"

### ✅ 3. Migration Script (`migrate-production.mjs`)
- Created automated script to run all missing migrations in production
- Added proper error handling and logging

## How to Fix in Production

### Option 1: Using the Migration Script (Recommended)

1. **Deploy the updated code** with the fixes above
2. **Run the migration script**:
   ```bash
   cd apps/dashboard
   npm run db:migrate:production
   ```

3. **Or run manually**:
   ```bash
   cd apps/dashboard
   node migrate-production.mjs
   ```

### Option 2: Manual Migration

If the automated script doesn't work, you can run migrations manually:

```bash
cd apps/dashboard
npx drizzle-kit migrate
```

## What This Fixes

After running the migrations, the following tables will be created/updated:

- ✅ `users` - Main user table with wallet addresses
- ✅ `administrators` - Admin user management
- ✅ `projects` - Investment projects with featured status
- ✅ `gamification_profiles` - User gamification data
- ✅ `gamification_events` - User activity tracking
- ✅ `achievements` - Achievement system
- ✅ `rewards` - Reward system
- ✅ All related indexes and constraints

## Verification

After running migrations, verify:

1. **Check logs**: No more "relation does not exist" errors
2. **Test user registration**: Users should be able to connect wallets
3. **Test profile access**: `/profile` should load user data
4. **Test featured projects**: Featured projects should display correctly

## Environment Variables Required

Make sure these environment variables are set in production:

```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

## Troubleshooting

### If migrations still fail:

1. **Check database connectivity**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check existing tables**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

3. **Check migration journal**:
   ```bash
   cat apps/dashboard/drizzle/meta/_journal.json
   ```

### If users still can't access profiles:

1. **Check if users table exists**:
   ```sql
   SELECT COUNT(*) FROM users;
   ```

2. **Check user sync API**:
   ```bash
   curl -X POST /api/user-sync/connect \
     -H "Content-Type: application/json" \
     -d '{"walletAddress": "0x..."}'
   ```

## Support

If issues persist after running migrations:

1. Check Vercel function logs
2. Verify database connection string
3. Confirm all environment variables are set
4. Check if there are any database permission issues
