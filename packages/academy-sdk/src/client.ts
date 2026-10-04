/**
 * Client-safe entry point for @saasfly/academy-sdk.
 *
 * ONLY pure data and types may be exported here. This module is imported by
 * "use client" components, so it must never (transitively) import server-only
 * code: next/headers, server-only, node:crypto, db access, auth, or hermes-core.
 *
 * Server code must keep importing from the package root ("@saasfly/academy-sdk").
 */
export * from './types';
export * from './candidates/types';
export * from './curriculum/program-registry';
export * from './curriculum/coo-program';
export * from './rewards/unlocked-perks';
