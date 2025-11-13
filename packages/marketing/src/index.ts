// packages/marketing/src/index.ts
// Main exports for @pandoras/marketing

// Components
export { HeroSection } from './components/HeroSection'
export { EmailCaptureForm } from './components/EmailCaptureForm'

// Email services
export { EmailService, defaultEmailService, handleEmailSignup } from './email/resend'

// Types
export * from './types'