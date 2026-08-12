CREATE TABLE "knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar(256) NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"embedding" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_tenant_id_projects_slug_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_tenant_idx" ON "knowledge_chunks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "knowledge_source_idx" ON "knowledge_chunks" USING btree ("tenant_id","source_id");