import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  casesAllowed: integer("cases_allowed").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const authMagicLinks = pgTable("auth_magic_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMagicLinkSchema = createInsertSchema(authMagicLinks).pick({
  userId: true,
  tokenHash: true,
  expiresAt: true,
});

export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;
export type MagicLink = typeof authMagicLinks.$inferSelect;

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  state: text("state"),
  county: text("county"),
  caseType: text("case_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).pick({
  title: true,
  state: true,
  county: true,
  caseType: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export const authIdentities = pgTable("auth_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  emailAtProvider: text("email_at_provider"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  providerUserIdx: uniqueIndex("provider_user_idx").on(table.provider, table.providerUserId),
}));

export const insertAuthIdentitySchema = createInsertSchema(authIdentities).pick({
  userId: true,
  provider: true,
  providerUserId: true,
  emailAtProvider: true,
});

export type InsertAuthIdentity = z.infer<typeof insertAuthIdentitySchema>;
export type AuthIdentity = typeof authIdentities.$inferSelect;
