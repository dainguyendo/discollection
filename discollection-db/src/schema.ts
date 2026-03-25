import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Placeholder table so migrations and type generation work out of the box.
export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: text("created_at").notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
