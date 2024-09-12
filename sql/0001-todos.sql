CREATE SCHEMA "app";

CREATE TABLE "app"."todo" (
    "todo_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completed_at" TIMESTAMPTZ,
    "text" TEXT NOT NULL
);