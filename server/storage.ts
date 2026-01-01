import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  cases,
  authIdentities,
  timelineEvents,
  evidenceFiles,
  documents,
  userProfiles,
  generatedDocuments,
  caseChildren,
  tasks,
  deadlines,
  type User,
  type InsertUser,
  type Case,
  type InsertCase,
  type AuthIdentity,
  type InsertAuthIdentity,
  type TimelineEvent,
  type InsertTimelineEvent,
  type EvidenceFile,
  type InsertEvidenceFile,
  type Document,
  type InsertDocument,
  type UpdateDocument,
  type UserProfile,
  type UpsertUserProfile,
  type GeneratedDocument,
  type GenerateDocumentPayload,
  type CaseChild,
  type InsertCaseChild,
  type UpdateCaseChild,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Deadline,
  type InsertDeadline,
  type UpdateDeadline,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCasesByUserId(userId: string): Promise<Case[]>;
  getCaseCountByUserId(userId: string): Promise<number>;
  getCase(caseId: string, userId: string): Promise<Case | undefined>;
  createCase(userId: string, caseData: InsertCase): Promise<Case>;
  updateCase(caseId: string, userId: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;

  getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined>;
  createAuthIdentity(identity: InsertAuthIdentity): Promise<AuthIdentity>;
  getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]>;

  listTimelineEvents(caseId: string, userId: string): Promise<TimelineEvent[]>;
  getTimelineEvent(eventId: string, userId: string): Promise<TimelineEvent | undefined>;
  createTimelineEvent(caseId: string, userId: string, data: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(eventId: string, userId: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(eventId: string, userId: string): Promise<boolean>;

  listEvidenceFiles(caseId: string, userId: string): Promise<EvidenceFile[]>;
  getEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined>;
  createEvidenceFile(caseId: string, userId: string, data: InsertEvidenceFile): Promise<EvidenceFile>;
  deleteEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined>;

  listDocuments(caseId: string, userId: string): Promise<Document[]>;
  getDocument(docId: string, userId: string): Promise<Document | undefined>;
  createDocument(caseId: string, userId: string, data: InsertDocument): Promise<Document>;
  updateDocument(docId: string, userId: string, data: UpdateDocument): Promise<Document | undefined>;
  duplicateDocument(docId: string, userId: string): Promise<Document | undefined>;
  deleteDocument(docId: string, userId: string): Promise<boolean>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(userId: string, data: UpsertUserProfile): Promise<UserProfile>;

  listGeneratedDocuments(userId: string, caseId: string): Promise<GeneratedDocument[]>;
  createGeneratedDocument(userId: string, caseId: string, templateType: string, title: string, payloadJson: GenerateDocumentPayload): Promise<GeneratedDocument>;
  getGeneratedDocument(userId: string, docId: string): Promise<GeneratedDocument | undefined>;

  listCaseChildren(caseId: string, userId: string): Promise<CaseChild[]>;
  getCaseChild(childId: string, userId: string): Promise<CaseChild | undefined>;
  createCaseChild(caseId: string, userId: string, data: InsertCaseChild): Promise<CaseChild>;
  updateCaseChild(childId: string, userId: string, data: UpdateCaseChild): Promise<CaseChild | undefined>;
  deleteCaseChild(childId: string, userId: string): Promise<boolean>;
  deleteAllCaseChildren(caseId: string, userId: string): Promise<number>;

  listTasks(userId: string, caseId: string): Promise<Task[]>;
  createTask(userId: string, caseId: string, data: InsertTask): Promise<Task>;
  updateTask(userId: string, taskId: string, data: UpdateTask): Promise<Task | undefined>;
  deleteTask(userId: string, taskId: string): Promise<boolean>;

  listDeadlines(userId: string, caseId: string): Promise<Deadline[]>;
  createDeadline(userId: string, caseId: string, data: InsertDeadline): Promise<Deadline>;
  updateDeadline(userId: string, deadlineId: string, data: UpdateDeadline): Promise<Deadline | undefined>;
  deleteDeadline(userId: string, deadlineId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: insertUser.email.toLowerCase(),
        passwordHash: insertUser.passwordHash,
      })
      .returning();
    return user;
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    return db.select().from(cases).where(eq(cases.userId, userId));
  }

  async getCaseCountByUserId(userId: string): Promise<number> {
    const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
    return userCases.length;
  }

  async getCase(caseId: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
    return caseRecord;
  }

  async createCase(userId: string, caseData: InsertCase): Promise<Case> {
    const [newCase] = await db
      .insert(cases)
      .values({
        userId,
        title: caseData.title,
        state: caseData.state,
        county: caseData.county,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        hasChildren: caseData.hasChildren ?? false,
      })
      .returning();
    return newCase;
  }

  async updateCase(caseId: string, userId: string, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = await this.getCase(caseId, userId);
    if (!existingCase) {
      return undefined;
    }
    const [updatedCase] = await db
      .update(cases)
      .set({
        title: caseData.title ?? existingCase.title,
        state: caseData.state ?? existingCase.state,
        county: caseData.county ?? existingCase.county,
        caseNumber: caseData.caseNumber !== undefined ? caseData.caseNumber : existingCase.caseNumber,
        caseType: caseData.caseType ?? existingCase.caseType,
        hasChildren: caseData.hasChildren ?? existingCase.hasChildren,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
      .returning();
    return updatedCase;
  }

  async getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined> {
    const [identity] = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId)
        )
      );
    return identity;
  }

  async createAuthIdentity(identity: InsertAuthIdentity): Promise<AuthIdentity> {
    const [authIdentity] = await db
      .insert(authIdentities)
      .values(identity)
      .returning();
    return authIdentity;
  }

  async getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]> {
    return db
      .select()
      .from(authIdentities)
      .where(eq(authIdentities.userId, userId));
  }

  async listTimelineEvents(caseId: string, userId: string): Promise<TimelineEvent[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.caseId, caseId), eq(timelineEvents.userId, userId)))
      .orderBy(desc(timelineEvents.eventDate));
  }

  async getTimelineEvent(eventId: string, userId: string): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)));
    return event;
  }

  async createTimelineEvent(caseId: string, userId: string, data: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await db
      .insert(timelineEvents)
      .values({
        userId,
        caseId,
        eventDate: data.eventDate,
        title: data.title,
        category: data.category,
        notes: data.notes,
        source: "user_manual",
      })
      .returning();
    return event;
  }

  async updateTimelineEvent(eventId: string, userId: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const existingEvent = await this.getTimelineEvent(eventId, userId);
    if (!existingEvent) {
      return undefined;
    }
    const caseRecord = await this.getCase(existingEvent.caseId, userId);
    if (!caseRecord) {
      return undefined;
    }
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set({
        eventDate: data.eventDate ?? existingEvent.eventDate,
        title: data.title ?? existingEvent.title,
        category: data.category ?? existingEvent.category,
        notes: data.notes !== undefined ? data.notes : existingEvent.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)))
      .returning();
    return updatedEvent;
  }

  async deleteTimelineEvent(eventId: string, userId: string): Promise<boolean> {
    const existingEvent = await this.getTimelineEvent(eventId, userId);
    if (!existingEvent) {
      return false;
    }
    const caseRecord = await this.getCase(existingEvent.caseId, userId);
    if (!caseRecord) {
      return false;
    }
    await db
      .delete(timelineEvents)
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)));
    return true;
  }

  async listEvidenceFiles(caseId: string, userId: string): Promise<EvidenceFile[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.caseId, caseId), eq(evidenceFiles.userId, userId)))
      .orderBy(desc(evidenceFiles.createdAt));
  }

  async getEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined> {
    const [file] = await db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)));
    return file;
  }

  async createEvidenceFile(caseId: string, userId: string, data: InsertEvidenceFile): Promise<EvidenceFile> {
    const [file] = await db
      .insert(evidenceFiles)
      .values({
        userId,
        caseId,
        originalName: data.originalName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        sha256: data.sha256,
        notes: data.notes,
      })
      .returning();
    return file;
  }

  async deleteEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined> {
    const file = await this.getEvidenceFile(evidenceId, userId);
    if (!file) {
      return undefined;
    }
    await db
      .delete(evidenceFiles)
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)));
    return file;
  }

  async updateEvidenceMetadata(
    evidenceId: string,
    userId: string,
    data: { category?: string; description?: string; tags?: string }
  ): Promise<EvidenceFile | undefined> {
    const file = await this.getEvidenceFile(evidenceId, userId);
    if (!file) {
      return undefined;
    }
    const [updated] = await db
      .update(evidenceFiles)
      .set({
        category: data.category,
        description: data.description,
        tags: data.tags,
      })
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)))
      .returning();
    return updated;
  }

  async listDocuments(caseId: string, userId: string): Promise<Document[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(documents)
      .where(and(eq(documents.caseId, caseId), eq(documents.userId, userId)))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(docId: string, userId: string): Promise<Document | undefined> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)));
    return doc;
  }

  async createDocument(caseId: string, userId: string, data: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        caseId,
        title: data.title,
        templateKey: data.templateKey,
        content: data.content || "",
      })
      .returning();
    return doc;
  }

  async updateDocument(docId: string, userId: string, data: UpdateDocument): Promise<Document | undefined> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return undefined;
    }
    const [updated] = await db
      .update(documents)
      .set({
        title: data.title ?? existingDoc.title,
        content: data.content !== undefined ? data.content : existingDoc.content,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
      .returning();
    return updated;
  }

  async duplicateDocument(docId: string, userId: string): Promise<Document | undefined> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return undefined;
    }
    const [dup] = await db
      .insert(documents)
      .values({
        userId,
        caseId: existingDoc.caseId,
        title: `${existingDoc.title} (Copy)`,
        templateKey: existingDoc.templateKey,
        content: existingDoc.content,
      })
      .returning();
    return dup;
  }

  async deleteDocument(docId: string, userId: string): Promise<boolean> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return false;
    }
    await db
      .delete(documents)
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)));
    return true;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(userId: string, data: UpsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({
          fullName: data.fullName !== undefined ? data.fullName : existing.fullName,
          email: data.email !== undefined ? data.email : existing.email,
          addressLine1: data.addressLine1 !== undefined ? data.addressLine1 : existing.addressLine1,
          addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : existing.addressLine2,
          city: data.city !== undefined ? data.city : existing.city,
          state: data.state !== undefined ? data.state : existing.state,
          zip: data.zip !== undefined ? data.zip : existing.zip,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          partyRole: data.partyRole !== undefined ? data.partyRole : existing.partyRole,
          isSelfRepresented: data.isSelfRepresented !== undefined ? data.isSelfRepresented : existing.isSelfRepresented,
          autoFillEnabled: data.autoFillEnabled !== undefined ? data.autoFillEnabled : existing.autoFillEnabled,
          petitionerName: data.petitionerName !== undefined ? data.petitionerName : existing.petitionerName,
          respondentName: data.respondentName !== undefined ? data.respondentName : existing.respondentName,
          onboardingCompletedAt: data.onboardingCompletedAt !== undefined ? data.onboardingCompletedAt : existing.onboardingCompletedAt,
          tosAcceptedAt: data.tosAcceptedAt !== undefined ? data.tosAcceptedAt : existing.tosAcceptedAt,
          privacyAcceptedAt: data.privacyAcceptedAt !== undefined ? data.privacyAcceptedAt : existing.privacyAcceptedAt,
          disclaimersAcceptedAt: data.disclaimersAcceptedAt !== undefined ? data.disclaimersAcceptedAt : existing.disclaimersAcceptedAt,
          tosVersion: data.tosVersion !== undefined ? data.tosVersion : existing.tosVersion,
          privacyVersion: data.privacyVersion !== undefined ? data.privacyVersion : existing.privacyVersion,
          disclaimersVersion: data.disclaimersVersion !== undefined ? data.disclaimersVersion : existing.disclaimersVersion,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          fullName: data.fullName ?? null,
          email: data.email ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          zip: data.zip ?? null,
          phone: data.phone ?? null,
          partyRole: data.partyRole ?? null,
          isSelfRepresented: data.isSelfRepresented ?? true,
          autoFillEnabled: data.autoFillEnabled ?? true,
          petitionerName: data.petitionerName ?? null,
          respondentName: data.respondentName ?? null,
          onboardingCompletedAt: data.onboardingCompletedAt ?? null,
          tosAcceptedAt: data.tosAcceptedAt ?? null,
          privacyAcceptedAt: data.privacyAcceptedAt ?? null,
          disclaimersAcceptedAt: data.disclaimersAcceptedAt ?? null,
          tosVersion: data.tosVersion ?? "v1",
          privacyVersion: data.privacyVersion ?? "v1",
          disclaimersVersion: data.disclaimersVersion ?? "v1",
        })
        .returning();
      return created;
    }
  }

  async listGeneratedDocuments(userId: string, caseId: string): Promise<GeneratedDocument[]> {
    const docs = await db
      .select()
      .from(generatedDocuments)
      .where(and(eq(generatedDocuments.userId, userId), eq(generatedDocuments.caseId, caseId)))
      .orderBy(desc(generatedDocuments.createdAt));
    return docs;
  }

  async createGeneratedDocument(
    userId: string,
    caseId: string,
    templateType: string,
    title: string,
    payloadJson: GenerateDocumentPayload
  ): Promise<GeneratedDocument> {
    const [doc] = await db
      .insert(generatedDocuments)
      .values({
        userId,
        caseId,
        templateType,
        title,
        payloadJson,
      })
      .returning();
    return doc;
  }

  async getGeneratedDocument(userId: string, docId: string): Promise<GeneratedDocument | undefined> {
    const [doc] = await db
      .select()
      .from(generatedDocuments)
      .where(and(eq(generatedDocuments.id, docId), eq(generatedDocuments.userId, userId)));
    return doc;
  }

  async listCaseChildren(caseId: string, userId: string): Promise<CaseChild[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(caseChildren)
      .where(and(eq(caseChildren.caseId, caseId), eq(caseChildren.userId, userId)))
      .orderBy(desc(caseChildren.createdAt));
  }

  async getCaseChild(childId: string, userId: string): Promise<CaseChild | undefined> {
    const [child] = await db
      .select()
      .from(caseChildren)
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)));
    return child;
  }

  async createCaseChild(caseId: string, userId: string, data: InsertCaseChild): Promise<CaseChild> {
    const [child] = await db
      .insert(caseChildren)
      .values({
        userId,
        caseId,
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        dateOfBirth: data.dateOfBirth,
        notes: data.notes ?? null,
      })
      .returning();
    return child;
  }

  async updateCaseChild(childId: string, userId: string, data: UpdateCaseChild): Promise<CaseChild | undefined> {
    const existing = await this.getCaseChild(childId, userId);
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(caseChildren)
      .set({
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName !== undefined ? data.lastName : existing.lastName,
        dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      })
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCaseChild(childId: string, userId: string): Promise<boolean> {
    const existing = await this.getCaseChild(childId, userId);
    if (!existing) {
      return false;
    }
    await db
      .delete(caseChildren)
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)));
    return true;
  }

  async deleteAllCaseChildren(caseId: string, userId: string): Promise<number> {
    const existing = await this.listCaseChildren(caseId, userId);
    if (existing.length === 0) return 0;
    await db
      .delete(caseChildren)
      .where(and(eq(caseChildren.caseId, caseId), eq(caseChildren.userId, userId)));
    return existing.length;
  }

  async listTasks(userId: string, caseId: string): Promise<Task[]> {
    const rows = await db.select().from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.caseId, caseId)))
      .orderBy(desc(tasks.createdAt));
    return rows;
  }

  async createTask(userId: string, caseId: string, data: InsertTask): Promise<Task> {
    const [row] = await db.insert(tasks)
      .values({
        userId,
        caseId,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "open",
        dueDate: data.dueDate ?? null,
        priority: data.priority ?? 2,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateTask(userId: string, taskId: string, data: UpdateTask): Promise<Task | undefined> {
    const [row] = await db.update(tasks)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("description" in data ? { description: data.description ?? null } : {}),
        ...("status" in data ? { status: data.status } : {}),
        ...("dueDate" in data ? { dueDate: data.dueDate ?? null } : {}),
        ...("priority" in data ? { priority: data.priority } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return row;
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const res = await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).returning();
    return res.length > 0;
  }

  async listDeadlines(userId: string, caseId: string): Promise<Deadline[]> {
    const rows = await db.select().from(deadlines)
      .where(and(eq(deadlines.userId, userId), eq(deadlines.caseId, caseId)))
      .orderBy(asc(deadlines.dueDate));
    return rows;
  }

  async createDeadline(userId: string, caseId: string, data: InsertDeadline): Promise<Deadline> {
    const [row] = await db.insert(deadlines)
      .values({
        userId,
        caseId,
        title: data.title,
        notes: data.notes ?? null,
        status: data.status ?? "upcoming",
        dueDate: data.dueDate,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateDeadline(userId: string, deadlineId: string, data: UpdateDeadline): Promise<Deadline | undefined> {
    const [row] = await db.update(deadlines)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
        ...("status" in data ? { status: data.status } : {}),
        ...("dueDate" in data ? { dueDate: data.dueDate } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId)))
      .returning();
    return row;
  }

  async deleteDeadline(userId: string, deadlineId: string): Promise<boolean> {
    const res = await db.delete(deadlines).where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId))).returning();
    return res.length > 0;
  }
}

export const storage = new DatabaseStorage();
