import { z } from "zod";

export const platformEventSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  eventType: z.string().min(1, "eventType is required"),
  
  source: z.object({
    system: z.string().min(1, "source.system is required"),
    channel: z.string().optional(),
  }),

  requestedOrganizationId: z.string().optional(),
  projectId: z.string().optional(),

  occurredAt: z.string().datetime({ offset: true }).or(z.string()), // Accept ISO string

  correlationId: z.string().min(1, "correlationId is required"),
  causationId: z.string().optional(),

  identity: z.object({
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    walletAddress: z.string().optional().or(z.literal("")),
    externalId: z.string().optional().or(z.literal("")),
  }).optional(),

  attribution: z.object({
    campaignId: z.string().optional(),
    adId: z.string().optional(),
    creativeId: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }).optional(),

  payload: z.record(z.any()).default({}),
});

export type PlatformEventPayload = z.infer<typeof platformEventSchema>;
