-- schema.prisma declares `name String @unique` on RelicSet, but the
-- 20260629190000_admin_media_catalog migration that introduced the table
-- never created the matching index (only `slug` got one) — this migration
-- closes that drift so RelicSet.name is actually enforced unique like
-- Character.name and LightCone.name already are.
CREATE UNIQUE INDEX "RelicSet_name_key" ON "public"."RelicSet"("name");
