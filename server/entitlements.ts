/**
 * Entitlements Module
 * 
 * Manages lifetime premium comped users and admin/grant viewer roles.
 * Applied automatically on user registration and login.
 */

import { db } from "./db";
import { userProfiles, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================
// A) LIFETIME PREMIUM COMPED ALLOWLIST
// ============================================================
export const LIFETIME_PREMIUM_EMAILS = [
  "paigelindibella@gmail.com",
  "jetdocllc@gmail.com",
  "paige@civilla.ai",
  "bryan@civilla.ai",
  "qa.test@civilla.ai",
] as const;

// ============================================================
// B) ADMIN ROLE ALLOWLIST
// ============================================================
export const ADMIN_EMAILS = [
  "admin@civilla.ai",
  "paige@civilla.ai",
  "bryan@civilla.ai",
] as const;

// ============================================================
// C) GRANT VIEWER ROLE ALLOWLIST (restricted access)
// ============================================================
export const GRANT_VIEWER_EMAILS = [
  "grants@civilla.ai",
] as const;

type EntitlementResult = {
  applied: boolean;
  message: string;
};

/**
 * Apply lifetime premium entitlement to a user by email
 */
export async function applyLifetimePremium(email: string): Promise<EntitlementResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!LIFETIME_PREMIUM_EMAILS.includes(normalizedEmail as any)) {
    return { applied: false, message: "Email not in lifetime premium allowlist" };
  }
  
  try {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    if (user.length === 0) {
      console.log(`[ENTITLEMENTS] user not found for email ${normalizedEmail}; will apply when account exists`);
      return { applied: false, message: `User not found for email ${normalizedEmail}; will apply when account exists` };
    }
    
    const userId = user[0].id;
    
    await db
      .update(userProfiles)
      .set({
        subscriptionTier: "premium",
        subscriptionSource: "comped",
        isLifetime: true,
        compedReason: "founder_comp",
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
    
    console.log(`[ENTITLEMENTS] Applied lifetime premium to ${normalizedEmail}`);
    return { applied: true, message: `Applied lifetime premium to ${normalizedEmail}` };
  } catch (error) {
    console.error(`[ENTITLEMENTS] Failed to apply lifetime premium to ${normalizedEmail}:`, error);
    return { applied: false, message: `Failed to apply: ${error}` };
  }
}

/**
 * Apply admin role to a user by email
 */
export async function applyAdminRole(email: string): Promise<EntitlementResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!ADMIN_EMAILS.includes(normalizedEmail as any)) {
    return { applied: false, message: "Email not in admin allowlist" };
  }
  
  try {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    if (user.length === 0) {
      console.log(`[ROLES] account not found yet for admin email ${normalizedEmail}`);
      return { applied: false, message: `Account not found yet for admin email ${normalizedEmail}` };
    }
    
    const userId = user[0].id;
    
    await db
      .update(userProfiles)
      .set({
        isAdmin: true,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
    
    console.log(`[ROLES] Applied admin role to ${normalizedEmail}`);
    return { applied: true, message: `Applied admin role to ${normalizedEmail}` };
  } catch (error) {
    console.error(`[ROLES] Failed to apply admin role to ${normalizedEmail}:`, error);
    return { applied: false, message: `Failed to apply: ${error}` };
  }
}

/**
 * Apply grant viewer role to a user by email
 */
export async function applyGrantViewerRole(email: string): Promise<EntitlementResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!GRANT_VIEWER_EMAILS.includes(normalizedEmail as any)) {
    return { applied: false, message: "Email not in grant viewer allowlist" };
  }
  
  try {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    
    if (user.length === 0) {
      console.log(`[ROLES] account not found yet for grant viewer email ${normalizedEmail}`);
      return { applied: false, message: `Account not found yet for grant viewer email ${normalizedEmail}` };
    }
    
    const userId = user[0].id;
    
    // Grant viewers should NOT be admins
    await db
      .update(userProfiles)
      .set({
        isGrantViewer: true,
        isAdmin: false,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
    
    console.log(`[ROLES] Applied grant viewer role to ${normalizedEmail}`);
    return { applied: true, message: `Applied grant viewer role to ${normalizedEmail}` };
  } catch (error) {
    console.error(`[ROLES] Failed to apply grant viewer role to ${normalizedEmail}:`, error);
    return { applied: false, message: `Failed to apply: ${error}` };
  }
}

/**
 * Apply all applicable entitlements for a user by email.
 * Called on registration and login.
 */
export async function applyEntitlementsForUser(email: string): Promise<{
  lifetimePremium: EntitlementResult;
  admin: EntitlementResult;
  grantViewer: EntitlementResult;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const results = {
    lifetimePremium: { applied: false, message: "Not in allowlist" } as EntitlementResult,
    admin: { applied: false, message: "Not in allowlist" } as EntitlementResult,
    grantViewer: { applied: false, message: "Not in allowlist" } as EntitlementResult,
  };
  
  // Check and apply lifetime premium
  if (LIFETIME_PREMIUM_EMAILS.includes(normalizedEmail as any)) {
    results.lifetimePremium = await applyLifetimePremium(normalizedEmail);
  }
  
  // Check and apply admin role
  if (ADMIN_EMAILS.includes(normalizedEmail as any)) {
    results.admin = await applyAdminRole(normalizedEmail);
  }
  
  // Check and apply grant viewer role (mutually exclusive with admin)
  if (GRANT_VIEWER_EMAILS.includes(normalizedEmail as any)) {
    results.grantViewer = await applyGrantViewerRole(normalizedEmail);
  }
  
  return results;
}

/**
 * Check if a user has lifetime premium status
 */
export async function isLifetimePremiumUser(userId: string): Promise<boolean> {
  try {
    const profile = await db
      .select({
        subscriptionTier: userProfiles.subscriptionTier,
        subscriptionSource: userProfiles.subscriptionSource,
        isLifetime: userProfiles.isLifetime,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    
    if (profile.length === 0) return false;
    
    return profile[0].isLifetime === true && profile[0].subscriptionSource === "comped";
  } catch {
    return false;
  }
}

/**
 * Apply all entitlements for all users in allowlists.
 * Used for initial setup or refresh.
 */
export async function applyAllEntitlements(): Promise<{
  lifetimePremium: Array<{ email: string; result: EntitlementResult }>;
  admin: Array<{ email: string; result: EntitlementResult }>;
  grantViewer: Array<{ email: string; result: EntitlementResult }>;
}> {
  const results = {
    lifetimePremium: [] as Array<{ email: string; result: EntitlementResult }>,
    admin: [] as Array<{ email: string; result: EntitlementResult }>,
    grantViewer: [] as Array<{ email: string; result: EntitlementResult }>,
  };
  
  // Apply lifetime premium to all in allowlist
  for (const email of LIFETIME_PREMIUM_EMAILS) {
    const result = await applyLifetimePremium(email);
    results.lifetimePremium.push({ email, result });
  }
  
  // Apply admin to all in allowlist
  for (const email of ADMIN_EMAILS) {
    const result = await applyAdminRole(email);
    results.admin.push({ email, result });
  }
  
  // Apply grant viewer to all in allowlist
  for (const email of GRANT_VIEWER_EMAILS) {
    const result = await applyGrantViewerRole(email);
    results.grantViewer.push({ email, result });
  }
  
  return results;
}
