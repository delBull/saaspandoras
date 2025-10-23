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

### 🚨 **PROBLEM: Deployment Not Updated**

The error **405 (Method Not Allowed)** means your Vercel deployment didn't update with the new API code. Here's how to fix it:

### Option 1: Force Deploy Update (Recommended)

1. **Go to Vercel Dashboard**
2. **Select your project** (pandoras-dashboard)
3. **Go to "Deployments" tab**
4. **Find the latest deployment**
5. **Click "Redeploy"** or the refresh button
6. **Wait for deployment to complete** (2-3 minutes)

### Option 2: Browser Console Method (After Deploy Update)

**After the deployment updates:**

1. **Go to your staging site**: https://staging.dash.pandoras.finance
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Run this command**:
   ```javascript
   fetch("/api/admin/create-users-table", {method: "POST"}).then(r=>r.json()).then(console.log)
   ```

**This will:**
- ✅ Check if `users` table exists
- ✅ Create it only if missing
- ✅ Show current table structure
- ✅ Create necessary indexes
- ✅ **Bypasses Vercel protection**
- ✅ **Works immediately in production**

### Option 2: Direct API Call (If Console doesn't work)

**If the console method fails, try this:**

1. **Go to**: https://staging.dash.pandoras.finance/api/admin/create-users-table
2. **If you see "Method Not Allowed"**, the deployment needs to be updated
3. **If you see JSON response**, the API is working but needs POST method

### Option 3: Force Deploy Update

**If the API still shows 405 error:**

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Deployments**
4. **Find the latest deployment**
5. **Click "Redeploy"** to force update with new code

### Option 2: Disable Vercel Protection (Alternative)

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings > Functions**
4. **Find "Protection" section**
5. **Temporarily disable protection**
6. **Then use curl**:
   ```bash
   curl -X POST https://staging.dash.pandoras.finance/api/admin/create-users-table
   ```
7. **Re-enable protection** after fixing

### Option 3: Using Bypass Token (Advanced)

1. **Get bypass token** from Vercel dashboard
2. **Use with curl**:
   ```bash
   curl -X POST "https://staging.dash.pandoras.finance/api/admin/create-users-table?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=YOUR_TOKEN"
   ```

### Option 2: Enhanced Migration Script (If Option 1 fails)

1. **Install dependencies**:
   ```bash
   cd apps/dashboard
   npm install
   ```

2. **Run the enhanced migration script**:
   ```bash
   cd apps/dashboard
   npm run db:migrate:production
   ```

**The enhanced script will try multiple approaches:**
- ✅ **Push method**: Updates schema without recreating existing objects
- ✅ **Force migrate**: If push fails, tries with force flag
- ✅ **Direct table creation**: If all else fails, creates only the missing `users` table

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
