import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  authMagicLinks,
  cases,
  authIdentities,
  type User,
  type InsertUser,
  type MagicLink,
  type InsertMagicLink,
  type Case,
  type InsertCase,
  type AuthIdentity,
  type InsertAuthIdentity,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMagicLink(link: InsertMagicLink): Promise<MagicLink>;
  getMagicLinkByTokenHash(tokenHash: string): Promise<MagicLink | undefined>;
  markMagicLinkUsed(id: string): Promise<void>;
  
  getCasesByUserId(userId: string): Promise<Case[]>;
  getCaseCountByUserId(userId: string): Promise<number>;
  createCase(userId: string, caseData: InsertCase): Promise<Case>;

  getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined>;
  createAuthIdentity(identity: InsertAuthIdentity): Promise<AuthIdentity>;
  getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]>;
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

  async createMagicLink(link: InsertMagicLink): Promise<MagicLink> {
    const [magicLink] = await db
      .insert(authMagicLinks)
      .values(link)
      .returning();
    return magicLink;
  }

  async getMagicLinkByTokenHash(tokenHash: string): Promise<MagicLink | undefined> {
    const [link] = await db
      .select()
      .from(authMagicLinks)
      .where(eq(authMagicLinks.tokenHash, tokenHash));
    return link;
  }

  async markMagicLinkUsed(id: string): Promise<void> {
    await db
      .update(authMagicLinks)
      .set({ usedAt: new Date() })
      .where(eq(authMagicLinks.id, id));
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    return db.select().from(cases).where(eq(cases.userId, userId));
  }

  async getCaseCountByUserId(userId: string): Promise<number> {
    const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
    return userCases.length;
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
}

export const storage = new DatabaseStorage();
