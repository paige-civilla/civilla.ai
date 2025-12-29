import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  cases,
  authIdentities,
  timelineEvents,
  type User,
  type InsertUser,
  type Case,
  type InsertCase,
  type AuthIdentity,
  type InsertAuthIdentity,
  type TimelineEvent,
  type InsertTimelineEvent,
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
}

export const storage = new DatabaseStorage();
