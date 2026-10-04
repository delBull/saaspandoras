ALTER TABLE "academy_assessments" ADD COLUMN "canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL;--> statement-breakpoint
ALTER TABLE "academy_candidates" ADD COLUMN "canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL;--> statement-breakpoint
ALTER TABLE "academy_certifications" ADD COLUMN "canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL;--> statement-breakpoint
ALTER TABLE "academy_invitations" ADD COLUMN "canonical_org_id" varchar(256) DEFAULT 'pandoras' NOT NULL;--> statement-breakpoint
CREATE INDEX "academy_assessments_org_idx" ON "academy_assessments" USING btree ("canonical_org_id");--> statement-breakpoint
CREATE INDEX "academy_candidates_org_idx" ON "academy_candidates" USING btree ("canonical_org_id");--> statement-breakpoint
CREATE INDEX "academy_certifications_org_idx" ON "academy_certifications" USING btree ("canonical_org_id");--> statement-breakpoint
CREATE INDEX "academy_invitations_org_idx" ON "academy_invitations" USING btree ("canonical_org_id");