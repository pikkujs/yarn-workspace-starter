CREATE SCHEMA "app";

CREATE TYPE "app"."user_role" AS ENUM ('client', 'cook', 'admin');

CREATE TABLE "app"."user" (
    "user_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "api_key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "role" "app"."user_role" NOT NULL DEFAULT 'client'
);