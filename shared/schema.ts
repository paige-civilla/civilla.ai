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
  petitionerName: text("petitioner_name"),
  respondentName: text("respondent_name"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  disclaimersAcceptedAt: timestamp("disclaimers_accepted_at"),
  tosVersion: text("tos_version").notNull().default("v1"),
  privacyVersion: text("privacy_version").notNull().default("v1"),
  disclaimersVersion: text("disclaimers_version").notNull().default("v1"),
  calendarTaskColor: text("calendar_task_color").notNull().default("#2E7D32"),
  calendarDeadlineColor: text("calendar_deadline_color").notNull().default("#C62828"),
  calendarTimelineColor: text("calendar_timeline_color").notNull().default("#1565C0"),
  onboardingDeferred: jsonb("onboarding_deferred").notNull().default({}),
  onboardingStatus: text("onboarding_status").notNull().default("incomplete"),
  startHereSeen: boolean("start_here_seen").notNull().default(false),
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
  petitionerName: z.string().max(200).optional().nullable(),
  respondentName: z.string().max(200).optional().nullable(),
  onboardingCompleted: z.boolean().optional(),
  onboardingCompletedAt: z.date().optional().nullable(),
  tosAcceptedAt: z.date().optional().nullable(),
  privacyAcceptedAt: z.date().optional().nullable(),
  disclaimersAcceptedAt: z.date().optional().nullable(),
  tosVersion: z.string().max(10).optional(),
  privacyVersion: z.string().max(10).optional(),
  disclaimersVersion: z.string().max(10).optional(),
  calendarTaskColor: z.string().max(20).optional(),
  calendarDeadlineColor: z.string().max(20).optional(),
  calendarTimelineColor: z.string().max(20).optional(),
  onboardingDeferred: z.record(z.boolean()).optional(),
  onboardingStatus: z.enum(["incomplete", "partial", "complete"]).optional(),
  startHereSeen: z.boolean().optional(),
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

export const startingPointValues = ["served_papers", "starting_case", "modifying_enforcing", "not_sure"] as const;
export type StartingPoint = typeof startingPointValues[number];

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  nickname: text("nickname"),
  state: text("state"),
  county: text("county"),
  caseNumber: text("case_number"),
  caseType: text("case_type"),
  hasChildren: boolean("has_children").notNull().default(false),
  startingPoint: text("starting_point").notNull().default("not_sure"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).pick({
  title: true,
  nickname: true,
  state: true,
  county: true,
  caseNumber: true,
  caseType: true,
  hasChildren: true,
  startingPoint: true,
}).extend({
  startingPoint: z.enum(startingPointValues).optional().default("not_sure"),
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

export const timelineCategories = pgTable("timeline_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").references(() => cases.id),
  name: text("name").notNull(),
  color: text("color").notNull().default("#628286"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("timeline_categories_user_idx").on(table.userId),
  caseIdx: index("timeline_categories_case_idx").on(table.caseId),
  uniqueUserCaseName: uniqueIndex("timeline_categories_unique_user_case_name_idx").on(table.userId, table.caseId, table.name),
}));

export const insertTimelineCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name must be 60 characters or less"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").default("#628286"),
});

export const updateTimelineCategorySchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type InsertTimelineCategory = z.infer<typeof insertTimelineCategorySchema>;
export type UpdateTimelineCategory = z.infer<typeof updateTimelineCategorySchema>;
export type TimelineCategory = typeof timelineCategories.$inferSelect;

export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  eventDate: timestamp("event_date").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  categoryId: varchar("category_id"),
  notes: text("notes"),
  source: text("source").notNull().default("user_manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseEventDateIdx: index("timeline_case_event_date_idx").on(table.caseId, table.eventDate),
  userIdx: index("timeline_user_idx").on(table.userId),
  categoryIdx: index("timeline_category_id_idx").on(table.categoryId),
}));

export const insertTimelineEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
  category: z.string().optional().default("other"),
  categoryId: z.string().optional().nullable(),
  eventDate: z.coerce.date({ required_error: "Event date is required" }),
  notes: z.string().optional(),
  source: z.string().optional().default("user_manual"),
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

export const caseEvidenceNotes = pgTable("case_evidence_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceFileId: varchar("evidence_file_id").notNull().references(() => evidenceFiles.id),
  pageNumber: integer("page_number"),
  timestampSeconds: integer("timestamp_seconds"),
  label: text("label"),
  note: text("note").notNull(),
  isKey: boolean("is_key").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("evidence_notes_case_idx").on(table.caseId),
  fileIdx: index("evidence_notes_file_idx").on(table.evidenceFileId),
  userIdx: index("evidence_notes_user_idx").on(table.userId),
}));

export const insertEvidenceNoteSchema = z.object({
  pageNumber: z.number().int().positive().optional().nullable(),
  timestampSeconds: z.number().int().min(0).optional().nullable(),
  label: z.string().max(80).optional().nullable(),
  note: z.string().min(1, "Note is required").max(5000),
  isKey: z.boolean().optional().default(false),
});

export const updateEvidenceNoteSchema = z.object({
  pageNumber: z.number().int().positive().optional().nullable(),
  timestampSeconds: z.number().int().min(0).optional().nullable(),
  label: z.string().max(80).optional().nullable(),
  note: z.string().min(1).max(5000).optional(),
  isKey: z.boolean().optional(),
});

export type InsertEvidenceNote = z.infer<typeof insertEvidenceNoteSchema>;
export type UpdateEvidenceNote = z.infer<typeof updateEvidenceNoteSchema>;
export type EvidenceNote = typeof caseEvidenceNotes.$inferSelect;

export const caseExhibitNoteLinks = pgTable("case_exhibit_note_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  exhibitListId: varchar("exhibit_list_id").notNull(),
  evidenceNoteId: varchar("evidence_note_id").notNull().references(() => caseEvidenceNotes.id),
  sortOrder: integer("sort_order").notNull().default(0),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  noteIdx: index("exhibit_note_links_note_idx").on(table.evidenceNoteId),
  listIdx: index("exhibit_note_links_list_idx").on(table.exhibitListId),
  caseIdx: index("exhibit_note_links_case_idx").on(table.caseId),
  uniqueListNote: uniqueIndex("exhibit_note_links_unique_idx").on(table.exhibitListId, table.evidenceNoteId),
}));

export const insertExhibitNoteLinkSchema = z.object({
  label: z.string().max(120).optional().nullable(),
});

export type InsertExhibitNoteLink = z.infer<typeof insertExhibitNoteLinkSchema>;
export type ExhibitNoteLink = typeof caseExhibitNoteLinks.$inferSelect;

export const documentTemplateKeys = [
  "declaration",
  "affidavit",
  "motion",
  "proposed_order",
  "certificate_of_service",
  "notice_of_appearance",
  "case_information_sheet",
  "response",
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
  "proposed_order",
  "notice_of_appearance",
  "case_information_sheet",
  "response",
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

export const calendarCategories = pgTable("calendar_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  name: text("name").notNull(),
  color: text("color").notNull().default("#7BA3A8"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("calendar_categories_user_case_idx").on(table.userId, table.caseId),
}));

export const insertCalendarCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name must be 60 characters or less"),
  color: z.string().min(4).max(20).optional().default("#7BA3A8"),
});

export type InsertCalendarCategory = z.infer<typeof insertCalendarCategorySchema>;
export type CalendarCategory = typeof calendarCategories.$inferSelect;

export const caseCalendarItems = pgTable("case_calendar_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  startDate: timestamp("start_date").notNull(),
  isDone: boolean("is_done").notNull().default(false),
  categoryId: varchar("category_id").references(() => calendarCategories.id),
  colorOverride: text("color_override"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCaseDateIdx: index("calendar_items_user_case_date_idx").on(table.userId, table.caseId, table.startDate),
}));

export const insertCaseCalendarItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
  startDate: z.coerce.date({ required_error: "Date is required" }),
  categoryId: z.string().optional().nullable(),
  colorOverride: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateCaseCalendarItemSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  startDate: z.coerce.date().optional(),
  isDone: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  colorOverride: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type InsertCaseCalendarItem = z.infer<typeof insertCaseCalendarItemSchema>;
export type UpdateCaseCalendarItem = z.infer<typeof updateCaseCalendarItemSchema>;
export type CaseCalendarItem = typeof caseCalendarItems.$inferSelect;

export const contactRoles = [
  "opposing_party",
  "opposing_counsel",
  "mediator",
  "gal",
  "school",
  "therapist",
  "other",
] as const;
export type ContactRole = typeof contactRoles[number];

export const contactGroupValues = ["case", "witness"] as const;
export type ContactGroup = typeof contactGroupValues[number];

export const caseContacts = pgTable("case_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  name: text("name").notNull(),
  role: text("role").notNull().default("other"),
  contactGroup: text("contact_group").notNull().default("case"),
  organizationOrFirm: text("organization_or_firm"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("contacts_case_idx").on(table.caseId),
  userIdx: index("contacts_user_idx").on(table.userId),
  caseRoleIdx: index("contacts_case_role_idx").on(table.caseId, table.role),
  caseGroupIdx: index("contacts_case_group_idx").on(table.userId, table.caseId, table.contactGroup),
}));

export const insertContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  role: z.string().max(50).optional().default("other"),
  contactGroup: z.enum(["case", "witness"]).optional().default("case"),
  organizationOrFirm: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(50).optional(),
  contactGroup: z.enum(["case", "witness"]).optional(),
  organizationOrFirm: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;
export type CaseContact = typeof caseContacts.$inferSelect;

export const communicationDirections = ["outgoing", "incoming"] as const;
export type CommunicationDirection = typeof communicationDirections[number];

export const communicationChannels = ["email", "text", "call", "in_person", "portal", "other"] as const;
export type CommunicationChannel = typeof communicationChannels[number];

export const communicationStatuses = ["draft", "sent", "received", "no_response", "resolved"] as const;
export type CommunicationStatus = typeof communicationStatuses[number];

export const caseCommunications = pgTable("case_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  contactId: varchar("contact_id"),
  direction: text("direction").notNull().default("outgoing"),
  channel: text("channel").notNull().default("email"),
  status: text("status").notNull().default("draft"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  subject: text("subject"),
  summary: text("summary").notNull(),
  followUpAt: timestamp("follow_up_at"),
  needsFollowUp: boolean("needs_follow_up").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  evidenceIds: text("evidence_ids"),
  timelineEventId: varchar("timeline_event_id"),
  calendarItemId: varchar("calendar_item_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("communications_case_idx").on(table.caseId),
  userIdx: index("communications_user_idx").on(table.userId),
  caseOccurredIdx: index("communications_case_occurred_idx").on(table.caseId, table.occurredAt),
  caseFollowUpIdx: index("communications_case_followup_idx").on(table.caseId, table.followUpAt),
  statusIdx: index("communications_status_idx").on(table.status),
  needsFollowUpIdx: index("communications_needs_followup_idx").on(table.needsFollowUp),
}));

export const insertCommunicationSchema = z.object({
  contactId: z.string().optional().nullable(),
  direction: z.enum(communicationDirections).optional().default("outgoing"),
  channel: z.enum(communicationChannels).optional().default("email"),
  status: z.enum(communicationStatuses).optional().default("draft"),
  occurredAt: z.coerce.date().optional(),
  subject: z.string().max(200).optional().nullable(),
  summary: z.string().min(1, "Summary is required").max(10000, "Summary must be 10,000 characters or less"),
  followUpAt: z.coerce.date().optional().nullable(),
  needsFollowUp: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
  evidenceIds: z.string().optional().nullable(),
});

export const updateCommunicationSchema = z.object({
  contactId: z.string().optional().nullable(),
  direction: z.enum(communicationDirections).optional(),
  channel: z.enum(communicationChannels).optional(),
  status: z.enum(communicationStatuses).optional(),
  occurredAt: z.coerce.date().optional(),
  subject: z.string().max(200).optional().nullable(),
  summary: z.string().min(1).max(10000).optional(),
  followUpAt: z.coerce.date().optional().nullable(),
  needsFollowUp: z.boolean().optional(),
  pinned: z.boolean().optional(),
  evidenceIds: z.string().optional().nullable(),
  timelineEventId: z.string().optional().nullable(),
  calendarItemId: z.string().optional().nullable(),
});

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type UpdateCommunication = z.infer<typeof updateCommunicationSchema>;
export type CaseCommunication = typeof caseCommunications.$inferSelect;

export const exhibitLists = pgTable("exhibit_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  description: text("description"),
  isUsedForFiling: boolean("is_used_for_filing").notNull().default(false),
  filingLabel: text("filing_label"),
  coverPageEnabled: boolean("cover_page_enabled").notNull().default(true),
  coverPageTitle: text("cover_page_title"),
  coverPageSubtitle: text("cover_page_subtitle"),
  notes: text("notes"),
  usedForFiling: text("used_for_filing"),
  usedForFilingDate: timestamp("used_for_filing_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("exhibit_lists_case_idx").on(table.caseId),
  userIdx: index("exhibit_lists_user_idx").on(table.userId),
  caseCreatedIdx: index("exhibit_lists_case_created_idx").on(table.caseId, table.createdAt),
}));

export const insertExhibitListSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(5000).optional().nullable(),
  isUsedForFiling: z.boolean().optional().default(false),
  filingLabel: z.string().max(120).optional().nullable(),
  coverPageEnabled: z.boolean().optional().default(true),
  coverPageTitle: z.string().max(200).optional().nullable(),
  coverPageSubtitle: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000, "Notes must be 5,000 characters or less").optional().nullable(),
  usedForFiling: z.string().max(200).optional().nullable(),
  usedForFilingDate: z.coerce.date().optional().nullable(),
});

export const updateExhibitListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  isUsedForFiling: z.boolean().optional(),
  filingLabel: z.string().max(120).optional().nullable(),
  coverPageEnabled: z.boolean().optional(),
  coverPageTitle: z.string().max(200).optional().nullable(),
  coverPageSubtitle: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  usedForFiling: z.string().max(200).optional().nullable(),
  usedForFilingDate: z.coerce.date().optional().nullable(),
});

export type InsertExhibitList = z.infer<typeof insertExhibitListSchema>;
export type UpdateExhibitList = z.infer<typeof updateExhibitListSchema>;
export type ExhibitList = typeof exhibitLists.$inferSelect;

export const exhibits = pgTable("exhibits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  exhibitListId: varchar("exhibit_list_id").notNull(),
  label: text("label").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  included: boolean("included").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  listIdx: index("exhibits_list_idx").on(table.exhibitListId),
  caseIdx: index("exhibits_case_idx").on(table.caseId),
  userIdx: index("exhibits_user_idx").on(table.userId),
  listSortIdx: index("exhibits_list_sort_idx").on(table.exhibitListId, table.sortOrder),
}));

export const insertExhibitSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(5000, "Description must be 5,000 characters or less").optional().nullable(),
  included: z.boolean().optional().default(true),
});

export const updateExhibitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  included: z.boolean().optional(),
});

export type InsertExhibit = z.infer<typeof insertExhibitSchema>;
export type UpdateExhibit = z.infer<typeof updateExhibitSchema>;
export type Exhibit = typeof exhibits.$inferSelect;

export const exhibitEvidence = pgTable("exhibit_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  exhibitId: varchar("exhibit_id"),
  exhibitListId: varchar("exhibit_list_id"),
  evidenceId: varchar("evidence_id"),
  evidenceFileId: varchar("evidence_file_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  label: text("label"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  exhibitIdx: index("exhibit_evidence_exhibit_idx").on(table.exhibitId),
  listIdx: index("exhibit_evidence_list_idx").on(table.exhibitListId),
  evidenceIdx: index("exhibit_evidence_evidence_idx").on(table.evidenceId),
  fileIdx: index("exhibit_evidence_file_idx").on(table.evidenceFileId),
  caseIdx: index("exhibit_evidence_case_idx").on(table.caseId),
  sortIdx: index("exhibit_evidence_sort_idx").on(table.exhibitListId, table.sortOrder),
  uniqueListFile: uniqueIndex("exhibit_evidence_list_file_unique_idx").on(table.exhibitListId, table.evidenceFileId),
}));

export const attachEvidenceToExhibitSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
});

export const attachEvidenceToExhibitListSchema = z.object({
  label: z.string().max(120).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type AttachEvidenceToExhibit = z.infer<typeof attachEvidenceToExhibitSchema>;
export type AttachEvidenceToExhibitList = z.infer<typeof attachEvidenceToExhibitListSchema>;
export type ExhibitEvidence = typeof exhibitEvidence.$inferSelect;

export const exhibitSnippets = pgTable("exhibit_snippets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  exhibitListId: varchar("exhibit_list_id").notNull().references(() => exhibitLists.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  noteId: varchar("note_id"),
  title: text("title").notNull(),
  snippetText: text("snippet_text").notNull(),
  pageNumber: integer("page_number"),
  timestampHint: text("timestamp_hint"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  listIdx: index("exhibit_snippets_list_idx").on(table.exhibitListId),
  evidenceIdx: index("exhibit_snippets_evidence_idx").on(table.evidenceId),
  noteIdx: index("exhibit_snippets_note_idx").on(table.noteId),
  userCaseIdx: index("exhibit_snippets_user_case_idx").on(table.userId, table.caseId),
}));

export const insertExhibitSnippetSchema = z.object({
  exhibitListId: z.string().min(1, "Exhibit list ID is required"),
  evidenceId: z.string().min(1, "Evidence ID is required"),
  noteId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200),
  snippetText: z.string().min(1, "Snippet text is required").max(10000),
  pageNumber: z.number().int().min(1).optional().nullable(),
  timestampHint: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateExhibitSnippetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  snippetText: z.string().min(1).max(10000).optional(),
  pageNumber: z.number().int().min(1).optional().nullable(),
  timestampHint: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InsertExhibitSnippet = z.infer<typeof insertExhibitSnippetSchema>;
export type UpdateExhibitSnippet = z.infer<typeof updateExhibitSnippetSchema>;
export type ExhibitSnippet = typeof exhibitSnippets.$inferSelect;

export const lexiMessageRoles = ["user", "assistant", "system"] as const;
export type LexiMessageRole = typeof lexiMessageRoles[number];

export const lexiThreads = pgTable("lexi_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id"),
  title: text("title").notNull(),
  disclaimerShown: boolean("disclaimer_shown").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCaseUpdatedIdx: index("lexi_threads_user_case_updated_idx").on(table.userId, table.caseId, table.updatedAt),
}));

export const createLexiThreadSchema = z.object({
  title: z.string().max(120, "Title must be 120 characters or less").optional(),
  moduleKey: z.string().max(50).optional(),
});

export const renameLexiThreadSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
});

export type CreateLexiThread = z.infer<typeof createLexiThreadSchema>;
export type RenameLexiThread = z.infer<typeof renameLexiThreadSchema>;
export type LexiThread = typeof lexiThreads.$inferSelect;

export const lexiMessages = pgTable("lexi_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id"),
  threadId: varchar("thread_id").notNull().references(() => lexiThreads.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  safetyFlags: jsonb("safety_flags"),
  metadata: jsonb("metadata"),
  model: text("model"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  threadCreatedIdx: index("lexi_messages_thread_created_idx").on(table.threadId, table.createdAt),
}));

export const createLexiMessageSchema = z.object({
  role: z.enum(lexiMessageRoles),
  content: z.string().min(1, "Content is required"),
});

export type CreateLexiMessage = z.infer<typeof createLexiMessageSchema>;
export type LexiMessage = typeof lexiMessages.$inferSelect;

export const lexiChatRequestSchema = z.object({
  caseId: z.string().nullable().optional(),
  threadId: z.string().min(1, "Thread ID is required"),
  message: z.string().min(1, "Message is required").max(10000, "Message too long"),
  stateOverride: z.string().optional(),
  mode: z.enum(["help", "chat", "research"]).optional(),
  moduleKey: z.string().optional(),
  stylePreset: z.enum(["bullets", "steps", "short", "detailed"]).optional(),
  fastMode: z.boolean().optional(),
});

export const caseRuleTerms = pgTable("case_rule_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  moduleKey: text("module_key").notNull(),
  jurisdictionState: text("jurisdiction_state").notNull(),
  jurisdictionCounty: text("jurisdiction_county"),
  termKey: text("term_key").notNull(),
  officialLabel: text("official_label").notNull(),
  alsoKnownAs: text("also_known_as"),
  summary: text("summary").notNull(),
  sourcesJson: jsonb("sources_json").notNull().default(sql`'[]'::jsonb`),
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("case_rule_terms_user_case_idx").on(table.userId, table.caseId),
  termIdx: index("case_rule_terms_term_idx").on(table.caseId, table.moduleKey, table.termKey),
}));

export const upsertCaseRuleTermSchema = z.object({
  moduleKey: z.string().min(1),
  jurisdictionState: z.string().min(1),
  jurisdictionCounty: z.string().optional().nullable(),
  termKey: z.string().min(1),
  officialLabel: z.string().min(1),
  alsoKnownAs: z.string().optional().nullable(),
  summary: z.string().min(1),
  sourcesJson: z.array(z.object({
    title: z.string().optional(),
    url: z.string().url(),
    retrievedAt: z.string().optional(),
  })).default([]),
});

export type UpsertCaseRuleTerm = z.infer<typeof upsertCaseRuleTermSchema>;
export type CaseRuleTerm = typeof caseRuleTerms.$inferSelect;

export const trialBinderSections = pgTable("trial_binder_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  key: text("key").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("trial_binder_sections_user_case_idx").on(table.userId, table.caseId),
}));

export type TrialBinderSection = typeof trialBinderSections.$inferSelect;

export const trialBinderItemSourceTypes = [
  "evidence",
  "timeline",
  "communication",
  "document",
  "deadline",
  "task",
  "calendar",
  "contact",
  "child",
  "disclosure",
] as const;
export type TrialBinderItemSourceType = typeof trialBinderItemSourceTypes[number];

export const trialBinderItems = pgTable("trial_binder_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  sectionKey: text("section_key").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  pinnedRank: integer("pinned_rank"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCaseSectionIdx: index("trial_binder_items_user_case_section_idx").on(table.userId, table.caseId, table.sectionKey),
  userCaseSectionPinnedIdx: index("trial_binder_items_user_case_section_pinned_idx").on(table.userId, table.caseId, table.sectionKey, table.pinnedRank),
}));

export const upsertTrialBinderItemSchema = z.object({
  sectionKey: z.string().min(1),
  sourceType: z.enum(trialBinderItemSourceTypes),
  sourceId: z.string().min(1),
  pinnedRank: z.number().int().min(1).max(3).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const updateTrialBinderItemSchema = z.object({
  pinnedRank: z.number().int().min(1).max(3).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type UpsertTrialBinderItem = z.infer<typeof upsertTrialBinderItemSchema>;
export type UpdateTrialBinderItem = z.infer<typeof updateTrialBinderItemSchema>;
export type TrialBinderItem = typeof trialBinderItems.$inferSelect;

export const exhibitPacketStatuses = ["draft", "generated"] as const;
export type ExhibitPacketStatus = typeof exhibitPacketStatuses[number];

export const exhibitPackets = pgTable("exhibit_packets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  filingType: text("filing_type"),
  filingDate: timestamp("filing_date"),
  coverPageText: text("cover_page_text"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("exhibit_packets_user_case_idx").on(table.userId, table.caseId),
}));

export const insertExhibitPacketSchema = createInsertSchema(exhibitPackets)
  .pick({
    title: true,
    filingType: true,
    filingDate: true,
    coverPageText: true,
    status: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200),
    filingType: z.string().max(100).optional().nullable(),
    filingDate: z.coerce.date().optional().nullable(),
    coverPageText: z.string().max(5000).optional().nullable(),
    status: z.enum(exhibitPacketStatuses).optional().default("draft"),
  });

export const updateExhibitPacketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  filingType: z.string().max(100).optional().nullable(),
  filingDate: z.coerce.date().optional().nullable(),
  coverPageText: z.string().max(5000).optional().nullable(),
  status: z.enum(exhibitPacketStatuses).optional(),
});

export type InsertExhibitPacket = z.infer<typeof insertExhibitPacketSchema>;
export type UpdateExhibitPacket = z.infer<typeof updateExhibitPacketSchema>;
export type ExhibitPacket = typeof exhibitPackets.$inferSelect;

export const exhibitPacketItems = pgTable("exhibit_packet_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  packetId: varchar("packet_id").notNull().references(() => exhibitPackets.id),
  exhibitLabel: text("exhibit_label").notNull(),
  exhibitTitle: text("exhibit_title").notNull(),
  exhibitNotes: text("exhibit_notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  packetIdx: index("exhibit_packet_items_packet_idx").on(table.packetId),
  userCaseIdx: index("exhibit_packet_items_user_case_idx").on(table.userId, table.caseId),
}));

export const insertExhibitPacketItemSchema = z.object({
  exhibitLabel: z.string().min(1, "Label is required").max(20),
  exhibitTitle: z.string().min(1, "Title is required").max(200),
  exhibitNotes: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateExhibitPacketItemSchema = z.object({
  exhibitLabel: z.string().min(1).max(20).optional(),
  exhibitTitle: z.string().min(1).max(200).optional(),
  exhibitNotes: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export type InsertExhibitPacketItem = z.infer<typeof insertExhibitPacketItemSchema>;
export type UpdateExhibitPacketItem = z.infer<typeof updateExhibitPacketItemSchema>;
export type ExhibitPacketItem = typeof exhibitPacketItems.$inferSelect;

export const exhibitPacketEvidence = pgTable("exhibit_packet_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  packetItemId: varchar("packet_item_id").notNull().references(() => exhibitPacketItems.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  packetItemIdx: index("exhibit_packet_evidence_packet_item_idx").on(table.packetItemId),
  evidenceIdx: index("exhibit_packet_evidence_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("exhibit_packet_evidence_user_case_idx").on(table.userId, table.caseId),
}));

export const insertExhibitPacketEvidenceSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type InsertExhibitPacketEvidence = z.infer<typeof insertExhibitPacketEvidenceSchema>;
export type ExhibitPacketEvidence = typeof exhibitPacketEvidence.$inferSelect;

export const generatedExhibitPackets = pgTable("generated_exhibit_packets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  packetId: varchar("packet_id").notNull().references(() => exhibitPackets.id),
  title: text("title").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  metaJson: jsonb("meta_json").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  packetIdx: index("generated_exhibit_packets_packet_idx").on(table.packetId),
  userCaseIdx: index("generated_exhibit_packets_user_case_idx").on(table.userId, table.caseId),
}));

export type GeneratedExhibitPacket = typeof generatedExhibitPackets.$inferSelect;

export const parentingPlanStatusEnum = z.enum(["draft", "reviewed"]);
export type ParentingPlanStatus = z.infer<typeof parentingPlanStatusEnum>;

export const parentingPlans = pgTable("parenting_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  status: text("status").notNull().default("draft"),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseIdx: index("parenting_plans_user_case_idx").on(table.userId, table.caseId),
  caseIdUnique: index("parenting_plans_case_unique_idx").on(table.caseId),
}));

export const insertParentingPlanSchema = z.object({
  status: parentingPlanStatusEnum.optional().default("draft"),
});

export const updateParentingPlanSchema = z.object({
  status: parentingPlanStatusEnum.optional(),
});

export type InsertParentingPlan = z.infer<typeof insertParentingPlanSchema>;
export type UpdateParentingPlan = z.infer<typeof updateParentingPlanSchema>;
export type ParentingPlan = typeof parentingPlans.$inferSelect;

export const parentingPlanSections = pgTable("parenting_plan_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentingPlanId: varchar("parenting_plan_id").notNull().references(() => parentingPlans.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  sectionKey: text("section_key").notNull(),
  data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  planIdx: index("parenting_plan_sections_plan_idx").on(table.parentingPlanId),
  sectionKeyIdx: index("parenting_plan_sections_key_idx").on(table.parentingPlanId, table.sectionKey),
}));

export const insertParentingPlanSectionSchema = z.object({
  sectionKey: z.string().min(1, "Section key is required"),
  data: z.record(z.unknown()).optional().default({}),
});

export const updateParentingPlanSectionSchema = z.object({
  data: z.record(z.unknown()),
});

export type InsertParentingPlanSection = z.infer<typeof insertParentingPlanSectionSchema>;
export type UpdateParentingPlanSection = z.infer<typeof updateParentingPlanSectionSchema>;
export type ParentingPlanSection = typeof parentingPlanSections.$inferSelect;

// OCR + Pattern Analysis Tables

export const evidenceProcessingJobStatuses = ["queued", "processing", "done", "error"] as const;
export type EvidenceProcessingJobStatus = typeof evidenceProcessingJobStatuses[number];

export const evidenceProcessingJobs = pgTable("evidence_processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  status: text("status").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_processing_jobs_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_processing_jobs_user_case_idx").on(table.userId, table.caseId),
}));

export const insertEvidenceProcessingJobSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
});

export const updateEvidenceProcessingJobSchema = z.object({
  status: z.enum(evidenceProcessingJobStatuses).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: z.string().optional().nullable(),
});

export type InsertEvidenceProcessingJob = z.infer<typeof insertEvidenceProcessingJobSchema>;
export type UpdateEvidenceProcessingJob = z.infer<typeof updateEvidenceProcessingJobSchema>;
export type EvidenceProcessingJob = typeof evidenceProcessingJobs.$inferSelect;

export const ocrProviders = ["gcv", "pdf_text", "tesseract"] as const;
export type OcrProvider = typeof ocrProviders[number];

export const evidenceOcrPages = pgTable("evidence_ocr_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  pageNumber: integer("page_number"),
  providerPrimary: text("provider_primary").notNull(),
  providerSecondary: text("provider_secondary"),
  textPrimary: text("text_primary").notNull(),
  textSecondary: text("text_secondary"),
  confidencePrimary: integer("confidence_primary"),
  confidenceSecondary: integer("confidence_secondary"),
  diffScore: integer("diff_score"),
  needsReview: boolean("needs_review").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_ocr_pages_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_ocr_pages_user_case_idx").on(table.userId, table.caseId),
  pageIdx: index("evidence_ocr_pages_page_idx").on(table.evidenceId, table.pageNumber),
}));

export const upsertEvidenceOcrPageSchema = z.object({
  pageNumber: z.number().int().min(0).optional().nullable(),
  providerPrimary: z.enum(ocrProviders),
  providerSecondary: z.enum(ocrProviders).optional().nullable(),
  textPrimary: z.string(),
  textSecondary: z.string().optional().nullable(),
  confidencePrimary: z.number().int().min(0).max(100).optional().nullable(),
  confidenceSecondary: z.number().int().min(0).max(100).optional().nullable(),
  diffScore: z.number().int().min(0).max(100).optional().nullable(),
  needsReview: z.boolean().optional().default(true),
});

export type UpsertEvidenceOcrPage = z.infer<typeof upsertEvidenceOcrPageSchema>;
export type EvidenceOcrPage = typeof evidenceOcrPages.$inferSelect;

export const evidenceAnchors = pgTable("evidence_anchors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  pageNumber: integer("page_number"),
  startChar: integer("start_char"),
  endChar: integer("end_char"),
  excerpt: text("excerpt").notNull(),
  note: text("note"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_anchors_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_anchors_user_case_idx").on(table.userId, table.caseId),
}));

export const insertEvidenceAnchorSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  pageNumber: z.number().int().min(0).optional().nullable(),
  startChar: z.number().int().min(0).optional().nullable(),
  endChar: z.number().int().min(0).optional().nullable(),
  excerpt: z.string().min(1, "Excerpt is required").max(5000),
  note: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export const updateEvidenceAnchorSchema = z.object({
  pageNumber: z.number().int().min(0).optional().nullable(),
  startChar: z.number().int().min(0).optional().nullable(),
  endChar: z.number().int().min(0).optional().nullable(),
  excerpt: z.string().min(1).max(5000).optional(),
  note: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export type InsertEvidenceAnchor = z.infer<typeof insertEvidenceAnchorSchema>;
export type UpdateEvidenceAnchor = z.infer<typeof updateEvidenceAnchorSchema>;
export type EvidenceAnchor = typeof evidenceAnchors.$inferSelect;

export const extractionStatuses = ["queued", "processing", "complete", "failed"] as const;
export type ExtractionStatus = typeof extractionStatuses[number];

export const extractionProviders = ["internal", "gcv", "pdf_text"] as const;
export type ExtractionProvider = typeof extractionProviders[number];

export const evidenceExtractions = pgTable("evidence_extractions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  status: text("status").notNull().default("queued"),
  provider: text("provider").notNull().default("internal"),
  mimeType: text("mime_type"),
  pageCount: integer("page_count"),
  extractedText: text("extracted_text"),
  metadata: jsonb("metadata"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_extractions_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_extractions_user_case_idx").on(table.userId, table.caseId),
  statusIdx: index("evidence_extractions_status_idx").on(table.status),
}));

export const insertEvidenceExtractionSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  provider: z.enum(extractionProviders).optional().default("internal"),
  mimeType: z.string().optional().nullable(),
});

export const updateEvidenceExtractionSchema = z.object({
  status: z.enum(extractionStatuses).optional(),
  pageCount: z.number().int().positive().optional().nullable(),
  extractedText: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  error: z.string().optional().nullable(),
});

export type InsertEvidenceExtraction = z.infer<typeof insertEvidenceExtractionSchema>;
export type UpdateEvidenceExtraction = z.infer<typeof updateEvidenceExtractionSchema>;
export type EvidenceExtraction = typeof evidenceExtractions.$inferSelect;

export const analysisTypes = ["summary", "timeline_candidates", "topics", "questions_to_ask", "credibility_flags", "follow_up_requests"] as const;
export type AnalysisType = typeof analysisTypes[number];

export const aiAnalysisStatuses = ["pending", "running", "complete", "error"] as const;
export type AiAnalysisStatus = typeof aiAnalysisStatuses[number];

export const evidenceAiAnalyses = pgTable("evidence_ai_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  analysisType: text("analysis_type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("complete"),
  model: text("model"),
  summary: text("summary"),
  findings: jsonb("findings"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_ai_analyses_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_ai_analyses_user_case_idx").on(table.userId, table.caseId),
  typeIdx: index("evidence_ai_analyses_type_idx").on(table.analysisType),
  statusIdx: index("evidence_ai_analyses_status_idx").on(table.status),
}));

export const insertEvidenceAiAnalysisSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  analysisType: z.enum(analysisTypes),
  content: z.string().min(1, "Content is required"),
  metadata: z.record(z.any()).optional().nullable(),
  status: z.enum(aiAnalysisStatuses).optional().default("complete"),
  model: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  findings: z.record(z.any()).optional().nullable(),
  error: z.string().optional().nullable(),
});

export const updateEvidenceAiAnalysisSchema = z.object({
  content: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional().nullable(),
  status: z.enum(aiAnalysisStatuses).optional(),
  model: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  findings: z.record(z.any()).optional().nullable(),
  error: z.string().optional().nullable(),
});

export type InsertEvidenceAiAnalysis = z.infer<typeof insertEvidenceAiAnalysisSchema>;
export type UpdateEvidenceAiAnalysis = z.infer<typeof updateEvidenceAiAnalysisSchema>;
export type EvidenceAiAnalysis = typeof evidenceAiAnalyses.$inferSelect;

export const noteAnchorTypes = ["page", "timestamp", "text", "range"] as const;
export type NoteAnchorType = typeof noteAnchorTypes[number];

export const evidenceNotes = pgTable("evidence_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceFiles.id),
  noteTitle: text("note_title"),
  noteText: text("note_text").notNull(),
  anchorType: text("anchor_type").notNull().default("page"),
  pageNumber: integer("page_number"),
  timestamp: integer("timestamp"),
  selectionText: text("selection_text"),
  tags: jsonb("tags"),
  color: text("color"),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  evidenceIdx: index("evidence_notes_evidence_idx").on(table.evidenceId),
  userCaseIdx: index("evidence_notes_user_case_idx").on(table.userId, table.caseId),
}));

export const insertEvidenceNoteFullSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  noteTitle: z.string().max(200).optional().nullable(),
  noteText: z.string().min(1, "Note text is required").max(10000),
  anchorType: z.enum(noteAnchorTypes).optional().default("page"),
  pageNumber: z.number().int().min(1).optional().nullable(),
  timestamp: z.number().int().min(0).optional().nullable(),
  selectionText: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  isResolved: z.boolean().optional().default(false),
});

export const updateEvidenceNoteFullSchema = z.object({
  noteTitle: z.string().max(200).optional().nullable(),
  noteText: z.string().min(1).max(10000).optional(),
  anchorType: z.enum(noteAnchorTypes).optional(),
  pageNumber: z.number().int().min(1).optional().nullable(),
  timestamp: z.number().int().min(0).optional().nullable(),
  selectionText: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  isResolved: z.boolean().optional(),
});

export type InsertEvidenceNoteFull = z.infer<typeof insertEvidenceNoteFullSchema>;
export type UpdateEvidenceNoteFull = z.infer<typeof updateEvidenceNoteFullSchema>;
export type EvidenceNoteFull = typeof evidenceNotes.$inferSelect;

export const binderSectionValues = [
  "Overview",
  "Key Facts",
  "Key Evidence",
  "Timeline Highlights",
  "Communications",
  "Discovery & Disclosures",
  "Witnesses",
  "Financial",
  "Parenting",
  "Safety",
  "Other",
  "General",
] as const;

export const shortlistSourceTypeValues = [
  "evidence",
  "evidence_note",
  "exhibit_snippet",
  "evidence_ai_analysis",
  "analysis_finding",
  "timeline_event",
  "communication",
  "document",
  "exhibit_item",
  "manual",
] as const;

export const trialPrepShortlist = pgTable("trial_prep_shortlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  sourceType: text("source_type").notNull(),
  sourceId: varchar("source_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  binderSection: text("binder_section").notNull().default("General"),
  importance: integer("importance").notNull().default(3),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  color: text("color"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("trial_prep_shortlist_case_idx").on(table.caseId),
  userCaseIdx: index("trial_prep_shortlist_user_case_idx").on(table.userId, table.caseId),
  sectionIdx: index("trial_prep_shortlist_section_idx").on(table.caseId, table.binderSection),
  uniqueSource: uniqueIndex("trial_prep_shortlist_unique_source_idx").on(table.userId, table.caseId, table.sourceType, table.sourceId),
}));

export const binderSectionEnum = z.enum(binderSectionValues);
export const shortlistSourceTypeEnum = z.enum(shortlistSourceTypeValues);

export const insertTrialPrepShortlistSchema = z.object({
  sourceType: shortlistSourceTypeEnum,
  sourceId: z.string().min(1, "Source ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  summary: z.string().max(1000).optional().nullable(),
  binderSection: binderSectionEnum.optional().default("General"),
  importance: z.number().int().min(1).max(5).optional().default(3),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().max(20).optional().nullable(),
  isPinned: z.boolean().optional().default(false),
});

export const updateTrialPrepShortlistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(1000).optional().nullable(),
  binderSection: binderSectionEnum.optional(),
  importance: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().max(20).optional().nullable(),
  isPinned: z.boolean().optional(),
});

export type InsertTrialPrepShortlist = z.infer<typeof insertTrialPrepShortlistSchema>;
export type UpdateTrialPrepShortlist = z.infer<typeof updateTrialPrepShortlistSchema>;
export type TrialPrepShortlist = typeof trialPrepShortlist.$inferSelect;

export const citationPointers = pgTable("citation_pointers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  evidenceFileId: varchar("evidence_file_id").notNull().references(() => evidenceFiles.id),
  pageNumber: integer("page_number"),
  timestampSeconds: integer("timestamp_seconds"),
  messageRange: text("message_range"),
  quote: text("quote").notNull(),
  excerpt: text("excerpt"),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  confidence: integer("confidence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("citation_pointers_case_idx").on(table.caseId),
  evidenceIdx: index("citation_pointers_evidence_idx").on(table.evidenceFileId),
}));

export const insertCitationPointerSchema = z.object({
  evidenceFileId: z.string().min(1, "Evidence file ID is required"),
  quote: z.string().min(1, "Quote is required").max(2000),
  pageNumber: z.number().int().min(1).optional().nullable(),
  timestampSeconds: z.number().int().min(0).optional().nullable(),
  messageRange: z.string().max(100).optional().nullable(),
  excerpt: z.string().max(5000).optional().nullable(),
  startOffset: z.number().int().min(0).optional().nullable(),
  endOffset: z.number().int().min(0).optional().nullable(),
  confidence: z.number().int().min(0).max(100).optional().nullable(),
});

export type InsertCitationPointer = z.infer<typeof insertCitationPointerSchema>;
export type CitationPointer = typeof citationPointers.$inferSelect;

export const claimTypeValues = [
  "fact",
  "procedural",
  "context",
  "communication",
  "financial",
  "medical",
  "school",
  "custody",
] as const;

export const claimCreatedFromValues = [
  "manual",
  "ai_suggested",
  "note",
  "extraction",
] as const;

export const claimStatusValues = [
  "suggested",
  "accepted",
  "rejected",
] as const;

export type ClaimType = typeof claimTypeValues[number];
export type ClaimCreatedFrom = typeof claimCreatedFromValues[number];
export type ClaimStatus = typeof claimStatusValues[number];

export const caseClaims = pgTable("case_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  claimText: text("claim_text").notNull(),
  claimType: text("claim_type").notNull().default("fact"),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  color: text("color"),
  missingInfoFlag: boolean("missing_info_flag").notNull().default(false),
  createdFrom: text("created_from").notNull().default("manual"),
  status: text("status").notNull().default("suggested"),
  sourceNoteId: varchar("source_note_id").references(() => evidenceNotes.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("case_claims_case_idx").on(table.caseId),
  caseStatusIdx: index("case_claims_case_status_idx").on(table.caseId, table.status),
}));

export const insertCaseClaimSchema = z.object({
  claimText: z.string().min(1, "Claim text is required").max(2000),
  claimType: z.enum(claimTypeValues).optional().default("fact"),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().max(20).optional().nullable(),
  missingInfoFlag: z.boolean().optional().default(false),
  createdFrom: z.enum(claimCreatedFromValues).optional().default("manual"),
  status: z.enum(claimStatusValues).optional().default("suggested"),
  sourceNoteId: z.string().optional().nullable(),
});

export const updateCaseClaimSchema = z.object({
  claimText: z.string().min(1).max(2000).optional(),
  claimType: z.enum(claimTypeValues).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().max(20).optional().nullable(),
  missingInfoFlag: z.boolean().optional(),
  status: z.enum(claimStatusValues).optional(),
});

export type InsertCaseClaim = z.infer<typeof insertCaseClaimSchema>;
export type UpdateCaseClaim = z.infer<typeof updateCaseClaimSchema>;
export type CaseClaim = typeof caseClaims.$inferSelect;

export const claimCitations = pgTable("claim_citations", {
  claimId: varchar("claim_id").notNull().references(() => caseClaims.id, { onDelete: "cascade" }),
  citationId: varchar("citation_id").notNull().references(() => citationPointers.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: uniqueIndex("claim_citations_pk").on(table.claimId, table.citationId),
}));

export type ClaimCitation = typeof claimCitations.$inferSelect;

export const issueGroupings = pgTable("issue_groupings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  title: text("title").notNull(),
  description: text("description"),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("issue_groupings_case_idx").on(table.caseId),
}));

export const insertIssueGroupingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateIssueGroupingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type InsertIssueGrouping = z.infer<typeof insertIssueGroupingSchema>;
export type UpdateIssueGrouping = z.infer<typeof updateIssueGroupingSchema>;
export type IssueGrouping = typeof issueGroupings.$inferSelect;

export const issueClaims = pgTable("issue_claims", {
  issueId: varchar("issue_id").notNull().references(() => issueGroupings.id, { onDelete: "cascade" }),
  claimId: varchar("claim_id").notNull().references(() => caseClaims.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: uniqueIndex("issue_claims_pk").on(table.issueId, table.claimId),
}));

export type IssueClaim = typeof issueClaims.$inferSelect;

export interface DraftReadinessStats {
  acceptedClaimsCount: number;
  acceptedClaimsWithCitationsCount: number;
  acceptedClaimsMissingInfoCount: number;
  suggestedClaimsCount: number;
  timelineEventsWithCitationsCount: number;
  lastUpdatedAt: string | null;
}

export const lexiUserPrefs = pgTable("lexi_user_prefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  responseStyle: text("response_style").notNull().default("bullets"),
  verbosity: integer("verbosity").notNull().default(3),
  citationStrictness: text("citation_strictness").notNull().default("when_available"),
  defaultMode: text("default_mode").notNull().default("organize"),
  streamingEnabled: boolean("streaming_enabled").notNull().default(true),
  fasterMode: boolean("faster_mode").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const upsertLexiUserPrefsSchema = z.object({
  responseStyle: z.enum(["bullets", "headings", "compact", "detailed"]).optional(),
  verbosity: z.number().int().min(1).max(5).optional(),
  citationStrictness: z.enum(["always", "when_available"]).optional(),
  defaultMode: z.enum(["organize", "research"]).optional(),
  streamingEnabled: z.boolean().optional(),
  fasterMode: z.boolean().optional(),
});

export type UpsertLexiUserPrefs = z.infer<typeof upsertLexiUserPrefsSchema>;
export type LexiUserPrefs = typeof lexiUserPrefs.$inferSelect;

export const lexiCaseMemory = pgTable("lexi_case_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  memoryMarkdown: text("memory_markdown"),
  preferencesJson: jsonb("preferences_json").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCaseUnique: uniqueIndex("lexi_case_memory_user_case_idx").on(table.userId, table.caseId),
}));

export const lexiCaseMemoryPreferencesSchema = z.object({
  tone: z.enum(["formal", "friendly", "concise", "default"]).optional(),
  formatting: z.object({
    useBullets: z.boolean().optional(),
    useHeadings: z.boolean().optional(),
    shortParagraphs: z.boolean().optional(),
  }).optional(),
  bannedPhrases: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
});

export const upsertLexiCaseMemorySchema = z.object({
  memoryMarkdown: z.string().max(10000).optional().nullable(),
  preferencesJson: lexiCaseMemoryPreferencesSchema.optional(),
});

export type LexiCaseMemoryPreferences = z.infer<typeof lexiCaseMemoryPreferencesSchema>;
export type UpsertLexiCaseMemory = z.infer<typeof upsertLexiCaseMemorySchema>;
export type LexiCaseMemory = typeof lexiCaseMemory.$inferSelect;

export const lexiFeedbackEventTypes = [
  "claim_accept",
  "claim_reject",
  "doc_export",
  "search_click",
  "lexi_rating",
  "trial_prep_pin",
] as const;
export type LexiFeedbackEventType = typeof lexiFeedbackEventTypes[number];

export const lexiFeedbackEvents = pgTable("lexi_feedback_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id"),
  eventType: text("event_type").notNull(),
  payloadJson: jsonb("payload_json").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCaseEventIdx: index("lexi_feedback_user_case_event_idx").on(table.userId, table.caseId, table.eventType, table.createdAt),
}));

export const createLexiFeedbackEventSchema = z.object({
  caseId: z.string().optional().nullable(),
  eventType: z.enum(lexiFeedbackEventTypes),
  payload: z.record(z.unknown()).optional().default({}),
});

export type CreateLexiFeedbackEvent = z.infer<typeof createLexiFeedbackEventSchema>;
export type LexiFeedbackEvent = typeof lexiFeedbackEvents.$inferSelect;

export const activityLogTypes = [
  "ai_analysis",
  "claims_generated",
  "document_compiled",
  "trial_prep_export",
  "evidence_upload",
  "memory_rebuild",
  "lexi_chat",
] as const;
export type ActivityLogType = typeof activityLogTypes[number];

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id"),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  metadataJson: jsonb("metadata_json").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCreatedIdx: index("activity_logs_user_created_idx").on(table.userId, table.createdAt),
}));

export type ActivityLog = typeof activityLogs.$inferSelect;

// Phase 2F: Case Facts (structured field extraction)
export const factValueTypes = ["text", "date", "number", "bool", "name", "address", "other"] as const;
export type FactValueType = typeof factValueTypes[number];

export const factStatuses = ["suggested", "accepted", "rejected"] as const;
export type FactStatus = typeof factStatuses[number];

export const factSourceTypes = ["claim", "note", "timeline", "manual"] as const;
export type FactSourceType = typeof factSourceTypes[number];

export const caseFacts = pgTable("case_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  key: text("key").notNull(),
  value: text("value"),
  valueType: text("value_type").notNull().default("text"),
  status: text("status").notNull().default("suggested"),
  missingInfoFlag: boolean("missing_info_flag").notNull().default(false),
  sourceType: text("source_type").notNull().default("manual"),
  sourceId: varchar("source_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseKeyIdx: index("case_facts_case_key_idx").on(table.caseId, table.key),
  caseStatusIdx: index("case_facts_case_status_idx").on(table.caseId, table.status),
}));

export const insertCaseFactSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().max(2000).optional().nullable(),
  valueType: z.enum(factValueTypes).optional().default("text"),
  status: z.enum(factStatuses).optional().default("suggested"),
  missingInfoFlag: z.boolean().optional().default(false),
  sourceType: z.enum(factSourceTypes).optional().default("manual"),
  sourceId: z.string().optional().nullable(),
});

export const updateCaseFactSchema = z.object({
  value: z.string().max(2000).optional().nullable(),
  valueType: z.enum(factValueTypes).optional(),
  status: z.enum(factStatuses).optional(),
  missingInfoFlag: z.boolean().optional(),
});

export const listCaseFactsSchema = z.object({
  status: z.enum(factStatuses).optional(),
  prefix: z.string().max(100).optional(),
});

export type InsertCaseFact = z.infer<typeof insertCaseFactSchema>;
export type UpdateCaseFact = z.infer<typeof updateCaseFactSchema>;
export type ListCaseFactsFilters = z.infer<typeof listCaseFactsSchema>;
export type CaseFact = typeof caseFacts.$inferSelect;

// Phase 2F: Fact Citations (join table linking facts to citation_pointers)
export const factCitations = pgTable("fact_citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  factId: varchar("fact_id").notNull().references(() => caseFacts.id),
  citationId: varchar("citation_id").notNull().references(() => citationPointers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  factCitationUnique: uniqueIndex("fact_citations_fact_citation_idx").on(table.factId, table.citationId),
}));

export type FactCitation = typeof factCitations.$inferSelect;

// Phase 3A: Cross-Module Link Tables
export const timelineEventLinkTypes = ["evidence", "claim", "snippet"] as const;
export type TimelineEventLinkType = typeof timelineEventLinkTypes[number];

export const timelineEventLinks = pgTable("timeline_event_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  eventId: varchar("event_id").notNull().references(() => timelineEvents.id),
  linkType: text("link_type").notNull(),
  evidenceId: varchar("evidence_id"),
  claimId: varchar("claim_id"),
  snippetId: varchar("snippet_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("timeline_event_links_case_idx").on(table.caseId),
  eventIdx: index("timeline_event_links_event_idx").on(table.eventId),
  uniqueLink: uniqueIndex("timeline_event_links_unique_idx").on(
    table.eventId, table.linkType, table.evidenceId, table.claimId, table.snippetId
  ),
}));

export const insertTimelineEventLinkSchema = z.object({
  linkType: z.enum(timelineEventLinkTypes),
  evidenceId: z.string().optional().nullable(),
  claimId: z.string().optional().nullable(),
  snippetId: z.string().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type InsertTimelineEventLink = z.infer<typeof insertTimelineEventLinkSchema>;
export type TimelineEventLink = typeof timelineEventLinks.$inferSelect;

export const claimLinkTypes = ["timeline", "trial_prep", "snippet"] as const;
export type ClaimLinkType = typeof claimLinkTypes[number];

export const claimLinks = pgTable("claim_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  claimId: varchar("claim_id").notNull().references(() => caseClaims.id),
  linkType: text("link_type").notNull(),
  eventId: varchar("event_id"),
  trialPrepId: varchar("trial_prep_id"),
  snippetId: varchar("snippet_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  caseIdx: index("claim_links_case_idx").on(table.caseId),
  claimIdx: index("claim_links_claim_idx").on(table.claimId),
  uniqueLink: uniqueIndex("claim_links_unique_idx").on(
    table.claimId, table.linkType, table.eventId, table.trialPrepId, table.snippetId
  ),
}));

export const insertClaimLinkSchema = z.object({
  linkType: z.enum(claimLinkTypes),
  eventId: z.string().optional().nullable(),
  trialPrepId: z.string().optional().nullable(),
  snippetId: z.string().optional().nullable(),
});

export type InsertClaimLink = z.infer<typeof insertClaimLinkSchema>;
export type ClaimLink = typeof claimLinks.$inferSelect;
