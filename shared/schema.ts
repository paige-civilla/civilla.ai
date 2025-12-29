import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
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

export const timelineEventCategories = [
  "court",
  "filing",
  "communication",
  "incident",
  "parenting_time",
  "expense",
  "medical",
  "school",
  "other",
] as const;

export type TimelineEventCategory = typeof timelineEventCategories[number];

export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  eventDate: timestamp("event_date").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  source: text("source").notNull().default("user_manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseEventDateIdx: index("timeline_case_event_date_idx").on(table.caseId, table.eventDate),
  userIdx: index("timeline_user_idx").on(table.userId),
}));

export const insertTimelineEventSchema = createInsertSchema(timelineEvents)
  .pick({
    eventDate: true,
    title: true,
    category: true,
    notes: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
    category: z.enum(timelineEventCategories, { required_error: "Category is required" }),
    eventDate: z.coerce.date({ required_error: "Event date is required" }),
    notes: z.string().optional(),
  });

export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
