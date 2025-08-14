-- Ingredients table
CREATE TABLE "app"."ingredient" (
    "ingredient_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "unit" TEXT NOT NULL, -- e.g., 'grams', 'pieces', 'ml'
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dishes table
CREATE TABLE "app"."dish" (
    "dish_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dish ingredients (many-to-many relationship)
CREATE TABLE "app"."dish_ingredient" (
    "dish_ingredient_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dish_id" UUID NOT NULL REFERENCES "app"."dish" ON DELETE CASCADE,
    "ingredient_id" UUID NOT NULL REFERENCES "app"."ingredient" ON DELETE CASCADE,
    "quantity_needed" INTEGER NOT NULL,
    UNIQUE("dish_id", "ingredient_id")
);

-- Order status enum
CREATE TYPE "app"."order_status" AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled');

-- Orders table
CREATE TABLE "app"."order" (
    "order_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL REFERENCES "app"."user",
    "cook_id" UUID REFERENCES "app"."user",
    "status" "app"."order_status" NOT NULL DEFAULT 'pending',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "accepted_at" TIMESTAMPTZ,
    "ready_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ
);

-- Order items (dishes in an order)
CREATE TABLE "app"."order_item" (
    "order_item_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL REFERENCES "app"."order" ON DELETE CASCADE,
    "dish_id" UUID NOT NULL REFERENCES "app"."dish",
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL
);

-- Indexes for performance
CREATE INDEX "idx_order_status" ON "app"."order" ("status");
CREATE INDEX "idx_order_client" ON "app"."order" ("client_id");
CREATE INDEX "idx_order_cook" ON "app"."order" ("cook_id");
CREATE INDEX "idx_order_created_at" ON "app"."order" ("created_at");
CREATE INDEX "idx_ingredient_available" ON "app"."ingredient" ("quantity_available");