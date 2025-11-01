CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "name" text,
  "email" text NOT NULL,
  "role" text DEFAULT 'user',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "research_areas" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "is_restricted" boolean DEFAULT false,
  "order" serial
);

CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "research_areas_order_idx" ON "research_areas" ("order" ASC);
