import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, timestamp, uniqueIndex, index, boolean, jsonb } from "drizzle-orm/pg-core";
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
  autoFillChoiceMade: boolean("auto_fill_choice_made").notNull().default(false),
  defaultRole: text("default_role").notNull().default("self_represented"),
  barNumber: text("bar_number"),
  firmName: text("firm_name"),
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
  autoFillChoiceMade: z.boolean().optional(),
  defaultRole: z.enum(["self_represented", "attorney"]).optional(),
  barNumber: z.string().max(50).optional().nullable(),
  firmName: z.string().max(200).optional().nullable(),
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
  hasChildren: boolean("has_children").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).pick({
  title: true,
  state: true,
  county: true,
  caseType: true,
  hasChildren: true,
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

export const taskStatuses = ["open", "completed"] as const;
export type TaskStatus = typeof taskStatuses[number];

export const deadlineStatuses = ["upcoming", "done"] as const;
export type DeadlineStatus = typeof deadlineStatuses[number];

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

export const generatedDocumentTemplateTypes = [
  "declaration",
  "affidavit",
  "motion",
  "memorandum",
  "certificate_of_service",
] as const;

export type GeneratedDocumentTemplateType = typeof generatedDocumentTemplateTypes[number];

export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  templateType: text("template_type").notNull(),
  title: text("title").notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseCreatedAtIdx: index("gen_docs_user_case_created_at_idx").on(table.userId, table.caseId, table.createdAt),
}));

export const generateDocumentPayloadSchema = z.object({
  court: z.object({
    district: z.string().optional(),
    county: z.string().min(1, "County is required"),
    state: z.string().min(1, "State is required"),
  }),
  case: z.object({
    caseNumber: z.string().min(1, "Case number is required"),
  }),
  parties: z.object({
    petitioner: z.string().optional(),
    respondent: z.string().optional(),
  }),
  filer: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().optional(),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    phone: z.string().optional(),
    partyRole: z.string().min(1, "Party role is required"),
    isSelfRepresented: z.boolean(),
    attorney: z.object({
      name: z.string().optional(),
      firm: z.string().optional(),
      barNumber: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
  }),
  document: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }).optional(),
  date: z.string().min(1, "Date is required"),
});

export const insertGeneratedDocumentSchema = z.object({
  templateType: z.enum(generatedDocumentTemplateTypes, { required_error: "Template type is required" }),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  payload: generateDocumentPayloadSchema,
});

export type GenerateDocumentPayload = z.infer<typeof generateDocumentPayloadSchema>;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;

export const caseChildren = pgTable("case_children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("case_children_user_case_idx").on(table.userId, table.caseId),
}));

export const insertCaseChildSchema = createInsertSchema(caseChildren)
  .pick({
    firstName: true,
    lastName: true,
    dateOfBirth: true,
    notes: true,
  })
  .extend({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().max(100).optional().nullable(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    notes: z.string().max(2000).optional().nullable(),
  });

export const updateCaseChildSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().min(1).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type InsertCaseChild = z.infer<typeof insertCaseChildSchema>;
export type UpdateCaseChild = z.infer<typeof updateCaseChildSchema>;
export type CaseChild = typeof caseChildren.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  dueDate: timestamp("due_date"),
  priority: integer("priority").notNull().default(2),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("tasks_case_idx").on(table.caseId),
  userIdx: index("tasks_user_idx").on(table.userId),
  caseDueIdx: index("tasks_case_due_idx").on(table.caseId, table.dueDate),
  caseStatusIdx: index("tasks_case_status_idx").on(table.caseId, table.status),
}));

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    description: true,
    status: true,
    dueDate: true,
    priority: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    description: z.string().max(5000, "Description must be 5,000 characters or less").optional().nullable(),
    status: z.enum(taskStatuses).optional().default("open"),
    dueDate: z.coerce.date().optional().nullable(),
    priority: z.number().int().min(1).max(3).optional().default(2),
  });

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(taskStatuses).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  priority: z.number().int().min(1).max(3).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const deadlines = pgTable("deadlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("upcoming"),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("deadlines_case_idx").on(table.caseId),
  userIdx: index("deadlines_user_idx").on(table.userId),
  caseDueIdx: index("deadlines_case_due_idx").on(table.caseId, table.dueDate),
  caseStatusIdx: index("deadlines_case_status_idx").on(table.caseId, table.status),
}));

export const insertDeadlineSchema = createInsertSchema(deadlines)
  .pick({
    title: true,
    notes: true,
    status: true,
    dueDate: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    notes: z.string().max(10000, "Notes must be 10,000 characters or less").optional().nullable(),
    status: z.enum(deadlineStatuses).optional().default("upcoming"),
    dueDate: z.coerce.date({ required_error: "Due date is required" }),
  });

export const updateDeadlineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(10000).optional().nullable(),
  status: z.enum(deadlineStatuses).optional(),
  dueDate: z.coerce.date().optional(),
});

export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
export type UpdateDeadline = z.infer<typeof updateDeadlineSchema>;
export type Deadline = typeof deadlines.$inferSelect;
