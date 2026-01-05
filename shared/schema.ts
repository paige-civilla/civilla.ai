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
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
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
});

export const LEXI_GENERAL_CASE_ID = "__general__";

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
