CREATE TYPE "app"."vote" AS ENUM ('up', 'down');

CREATE TABLE "app"."todo_vote" (
    "todo_id" UUID NOT NULL REFERENCES "app"."todo",
    "user_id" UUID NOT NULL REFERENCES "app"."user",
    "vote" "app"."vote" NOT NULL,
    PRIMARY KEY ("todo_id", "user_id")
);