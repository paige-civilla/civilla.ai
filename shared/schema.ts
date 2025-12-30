import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, timestamp, uniqueIndex, index, boolean } from "drizzle-orm/pg-core";
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

export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  fullName: text("full_name"),
  email: text("email"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  partyRole: text("party_role"),
  isSelfRepresented: boolean("is_self_represented").notNull().default(true),
  autoFillEnabled: boolean("auto_fill_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const upsertUserProfileSchema = z.object({
  fullName: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  partyRole: z.string().max(50).optional().nullable(),
  isSelfRepresented: z.boolean().optional(),
  autoFillEnabled: z.boolean().optional(),
});

export type UpsertUserProfile = z.infer<typeof upsertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

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

export const allowedEvidenceMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/zip",
] as const;

export type AllowedEvidenceMimeType = typeof allowedEvidenceMimeTypes[number];

export const evidenceCategories = [
  "document",
  "photo",
  "message",
  "medical",
  "financial",
  "school",
  "other",
] as const;

export type EvidenceCategory = typeof evidenceCategories[number];

export const evidenceFiles = pgTable("evidence_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  sha256: text("sha256"),
  notes: text("notes"),
  category: text("category"),
  description: text("description"),
  tags: text("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("evidence_case_idx").on(table.caseId),
  userIdx: index("evidence_user_idx").on(table.userId),
  caseCreatedAtIdx: index("evidence_case_created_at_idx").on(table.caseId, table.createdAt),
}));

export const insertEvidenceFileSchema = createInsertSchema(evidenceFiles)
  .pick({
    originalName: true,
    storageKey: true,
    mimeType: true,
    sizeBytes: true,
    sha256: true,
    notes: true,
    category: true,
    description: true,
    tags: true,
  })
  .extend({
    originalName: z.string().min(1, "File name is required"),
    storageKey: z.string().min(1, "Storage key is required"),
    mimeType: z.string().min(1, "MIME type is required"),
    sizeBytes: z.number().int().positive("File size must be positive"),
    sha256: z.string().optional(),
    notes: z.string().max(10000, "Notes must be 10,000 characters or less").optional(),
    category: z.string().max(50, "Category must be 50 characters or less").optional(),
    description: z.string().max(5000, "Description must be 5,000 characters or less").optional(),
    tags: z.string().max(500, "Tags must be 500 characters or less").optional(),
  });

export const updateEvidenceMetadataSchema = z.object({
  category: z.string().max(50, "Category must be 50 characters or less").optional(),
  description: z.string().max(5000, "Description must be 5,000 characters or less").optional(),
  tags: z.string().max(500, "Tags must be 500 characters or less").optional(),
});

export type UpdateEvidenceMetadata = z.infer<typeof updateEvidenceMetadataSchema>;
export type InsertEvidenceFile = z.infer<typeof insertEvidenceFileSchema>;
export type EvidenceFile = typeof evidenceFiles.$inferSelect;

export const documentTemplateKeys = [
  "declaration",
  "motion",
  "proposed_order",
  "certificate_of_service",
] as const;

export type DocumentTemplateKey = typeof documentTemplateKeys[number];

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  templateKey: text("template_key").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("documents_case_idx").on(table.caseId),
  userIdx: index("documents_user_idx").on(table.userId),
}));

export const insertDocumentSchema = createInsertSchema(documents)
  .pick({
    title: true,
    templateKey: true,
    content: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    templateKey: z.enum(documentTemplateKeys, { required_error: "Template is required" }),
    content: z.string().optional().default(""),
  });

export const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  content: z.string().optional(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type Document = typeof documents.$inferSelect;
