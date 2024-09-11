CREATE SCHEMA "application";

CREATE TABLE "application"."books" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "published" DATE NOT NULL
);