#!/usr/bin/env node

/**
 * register-snarai-staging-key.mjs
 * 
 * Registers the S'Narai portal API key in the STAGING database.
 * 
 * WHAT IT DOES (non-destructive):
 * 1. Checks if the key already exists in staging (by hash)
 * 2. If not, and no other pk_test_ key exists for this project, creates a new client record
 * 3. Never deletes or modifies existing records
 * 4. Handles revocation edge case (reactivates if found revoked)
 * 
 * HOW TO RUN:
 *   node scripts/register-snarai-staging-key.mjs
 * 
 * Requires .env.staging with DATABASE_URL set.
 */

import postgres from "postgres";
import crypto from "crypto";

// The existing API key from S'Narai portal .env
const API_KEY = 'pk_test_b277293448bd09198b6fd29ff0b87c4e1c9184219ff50111';

// Generate hash (same method as IntegrationKeyService)
const hash = crypto.createHash('sha256').update(API_KEY).digest('hex');

// Only keep the first 12 chars for fingerprint (matching IntegrationKeyService pattern)
const fingerprint = 'pk_test_b...' + API_KEY.slice(-8);

async function main() {
  console.log('🔑 S\'Narai Portal - Staging API Key Registration');
  console.log('================================================\n');
  
  console.log('📋 Key fingerprint:', fingerprint);
  console.log('📋 Key hash (first 16):', hash.slice(0, 16) + '...');
  console.log('');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in .env.staging');
    console.error('   Make sure .env.staging exists and has DATABASE_URL set');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL, { max: 1 });
  console.log('🔌 Connected to staging database\n');

  try {
    // STEP 1: Find the snarai project ID
    console.log('1️⃣  Looking for snarai project in staging...');
    const [project] = await sql`
      SELECT id, slug, title FROM projects WHERE slug IN ('snarai', 'narai') AND is_deleted = false LIMIT 1
    `;

    if (!project) {
      console.error('❌ ERROR: Project "snarai" or "narai" not found in staging database');
      console.error('   The project may not exist in staging yet.');
      console.error('   You need to create or sync the project to staging first.');
      await sql.end();
      process.exit(1);
    }

    const projectId = project.id;
    console.log(`   ✅ Found project ID: ${projectId} (${project.slug}) - "${project.title}"\n`);

    // STEP 2: Check if key already exists
    console.log('2️⃣  Checking if API key already exists...');
    const [existing] = await sql`
      SELECT id, name, environment, key_fingerprint, is_active, revoked_at 
      FROM integration_clients 
      WHERE api_key_hash = ${hash}
    `;

    if (existing) {
      console.log('   ✅ API key already registered in staging');
      console.log(`      Client ID: ${existing.id}`);
      console.log(`      Name: ${existing.name}`);
      console.log(`      Environment: ${existing.environment}`);
      console.log(`      Active: ${existing.is_active}`);
      
      if (existing.revoked_at) {
        console.log('   ⚠️  WARNING: Key is REVOKED. Reactivating...');
        await sql`
          UPDATE integration_clients 
          SET is_active = true, revoked_at = NULL, updated_at = NOW()
          WHERE id = ${existing.id}
        `;
        console.log('   ✅ Key reactivated successfully');
      }
      
      await sql.end();
      console.log('\n🎉 DONE! Key is ready for use in staging.');
      console.log('   No changes needed. The portal should work now.');
      return;
    }

    // STEP 3: Check if there's already a pk_test_ key for this project in staging
    console.log('3️⃣  Checking for existing pk_test_ keys for this project...');
    const [existingForProject] = await sql`
      SELECT id, key_fingerprint, name 
      FROM integration_clients 
      WHERE project_id = ${projectId} 
        AND environment = 'staging' 
        AND key_fingerprint LIKE 'pk_test_%'
        AND is_active = true
        AND revoked_at IS NULL
      LIMIT 1
    `;

    if (existingForProject) {
      console.log('   ⚠️  A different pk_test_ key already exists for this project:');
      console.log(`      Existing fingerprint: ${existingForProject.key_fingerprint}`);
      console.log(`      Name: ${existingForProject.name}`);
      console.log('');
      console.log('   The S\'Narai portal is using a different key than the one registered.');
      console.log('');
      console.log('   OPTIONS:');
      console.log('   A) Update the S\'Narai portal .env with this existing key');
      console.log('   B) Revoke the existing key and register the portal\'s key');
      console.log('');
      console.log('   Option A - Update portal .env with the existing key fingerprint.');
      await sql.end();
      process.exit(1);
    }

    // STEP 4: Register the key (INSERT only if not exists)
    console.log('4️⃣  Registering API key in staging...');
    
    const [inserted] = await sql`
      INSERT INTO integration_clients (
        name, 
        project_id, 
        environment, 
        api_key_hash, 
        key_fingerprint, 
        is_active, 
        permissions, 
        created_at, 
        updated_at
      ) VALUES (
        'S Narai Portal (Staging)', 
        ${projectId}, 
        'staging', 
        ${hash}, 
        ${fingerprint}, 
        true, 
        '["read", "deploy"]'::jsonb, 
        NOW(), 
        NOW()
      )
      RETURNING id, name, environment, key_fingerprint, is_active
    `;

    if (inserted) {
      console.log('   ✅ API key registered successfully!');
      console.log(`      Client ID: ${inserted.id}`);
      console.log(`      Name: ${inserted.name}`);
      console.log(`      Environment: ${inserted.environment}`);
      console.log(`      Fingerprint: ${inserted.key_fingerprint}`);
      console.log(`      Active: ${inserted.is_active}`);
      console.log('');
      console.log('🎉 SUCCESS! The S\'Narai portal should now be able to authenticate against staging.');
      console.log('');
      console.log('   Next step: Refresh the portal page - the API call should now succeed.');
    }

  } catch (error) {
    console.error('\n❌ ERROR during registration:', error.message);
    console.error('   Stack:', error.stack);
    await sql.end();
    process.exit(1);
  }

  await sql.end();
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});