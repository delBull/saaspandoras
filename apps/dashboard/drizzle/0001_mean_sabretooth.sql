ALTER TABLE "marketing_leads" ADD COLUMN "last_engaged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "marketing_leads" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "marketing_leads_is_deleted_idx" ON "marketing_leads" USING btree ("is_deleted");