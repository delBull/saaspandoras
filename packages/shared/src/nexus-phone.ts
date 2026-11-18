/**
 * Client-safe entry point for the canonical Nexus phone rules.
 *
 * The `@saasfly/shared` root entry pulls the whole server surface (db-core,
 * auth, hermes) and must never be imported from a client component. Client
 * components import these helpers from `@saasfly/shared/nexus-phone` instead.
 */
export {
  E164_PATTERN,
  NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  describePhoneFailure,
  isE164Phone,
  normalizePhoneE164,
} from './nexus/phone';
export type {
  PhoneNormalizationFailure,
  PhoneNormalizationResult,
} from './nexus/phone';
