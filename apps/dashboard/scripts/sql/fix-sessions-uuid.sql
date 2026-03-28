ALTER TABLE sessions ALTER COLUMN id TYPE uuid USING id::text::uuid;
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
