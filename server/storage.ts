import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  cases,
  authIdentities,
  timelineEvents,
  evidenceFiles,
  documents,
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
        caseType: caseData.caseType,
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
        caseType: caseData.caseType ?? existingCase.caseType,
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
}

export const storage = new DatabaseStorage();
