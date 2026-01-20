import { db } from "./db";
import { userProfiles, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient, STRIPE_SUSPENDED } from "./stripeClient";
import Stripe from "stripe";

export type SubscriptionTier = "free" | "trial" | "core" | "pro" | "premium";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "comped";

export interface UserEntitlements {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  casesAllowed: number;
  storageGb: number;
  analysisEnabled: boolean;
  videoUploadsEnabled: boolean;
  advancedExhibitsEnabled: boolean;
  downloadsEnabled: boolean;
  archiveMode: boolean;
  isComped: boolean;
  isLifetime: boolean;
  trialEndsAt: Date | null;
  addOnSecondCase: boolean;
  addOnArchiveMode: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, Omit<UserEntitlements, "tier" | "status" | "isComped" | "isLifetime" | "trialEndsAt" | "addOnSecondCase" | "addOnArchiveMode">> = {
  free: {
    casesAllowed: 0,
    storageGb: 0,
    analysisEnabled: false,
    videoUploadsEnabled: false,
    advancedExhibitsEnabled: false,
    downloadsEnabled: false,
    archiveMode: false,
  },
  trial: {
    casesAllowed: 1,
    storageGb: 1,
    analysisEnabled: true,
    videoUploadsEnabled: false,
    advancedExhibitsEnabled: false,
    downloadsEnabled: false,
    archiveMode: false,
  },
  core: {
    casesAllowed: 1,
    storageGb: 30,
    analysisEnabled: true,
    videoUploadsEnabled: false,
    advancedExhibitsEnabled: false,
    downloadsEnabled: true,
    archiveMode: false,
  },
  pro: {
    casesAllowed: 1,
    storageGb: 50,
    analysisEnabled: true,
    videoUploadsEnabled: true,
    advancedExhibitsEnabled: true,
    downloadsEnabled: true,
    archiveMode: false,
  },
  premium: {
    casesAllowed: 2,
    storageGb: 100,
    analysisEnabled: true,
    videoUploadsEnabled: true,
    advancedExhibitsEnabled: true,
    downloadsEnabled: true,
    archiveMode: false,
  },
};

const COMPED_EMAILS = [
  "paigelindibella@gmail.com",
  "jetdocllc@gmail.com",
  "paige@civilla.ai",
  "bryan@civilla.ai",
  "qa.test@civilla.ai",
];

export function isCompedEmail(email: string): boolean {
  return COMPED_EMAILS.includes(email.toLowerCase().trim());
}

export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  const result = await db
    .select({
      email: users.email,
      subscriptionTier: userProfiles.subscriptionTier,
      subscriptionStatus: userProfiles.subscriptionStatus,
      subscriptionSource: userProfiles.subscriptionSource,
      isLifetime: userProfiles.isLifetime,
      addOnSecondCase: userProfiles.addOnSecondCase,
      addOnArchiveMode: userProfiles.addOnArchiveMode,
      trialEndsAt: userProfiles.trialEndsAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return {
      tier: "free",
      status: "none",
      casesAllowed: 0,
      storageGb: 0,
      analysisEnabled: false,
      videoUploadsEnabled: false,
      advancedExhibitsEnabled: false,
      downloadsEnabled: false,
      archiveMode: false,
      isComped: false,
      isLifetime: false,
      trialEndsAt: null,
      addOnSecondCase: false,
      addOnArchiveMode: false,
    };
  }

  const user = result[0];
  const email = user.email;
  const isComped = isCompedEmail(email) || user.subscriptionSource === "comped";
  const isLifetime = user.isLifetime ?? false;

  if (isComped || isLifetime) {
    return {
      tier: "premium",
      status: "comped",
      ...TIER_LIMITS.premium,
      isComped: true,
      isLifetime,
      trialEndsAt: null,
      addOnSecondCase: true,
      addOnArchiveMode: false,
    };
  }

  const tier = (user.subscriptionTier as SubscriptionTier) || "free";
  const status = (user.subscriptionStatus as SubscriptionStatus) || "none";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const addOnSecondCase = user.addOnSecondCase ?? false;
  const addOnArchiveMode = user.addOnArchiveMode ?? false;

  let casesAllowed = limits.casesAllowed;
  if (addOnSecondCase) {
    casesAllowed += 1;
  }

  let analysisEnabled = limits.analysisEnabled;
  let archiveMode = false;
  if (addOnArchiveMode) {
    archiveMode = true;
    analysisEnabled = false;
  }

  if (status === "past_due" || status === "unpaid" || status === "canceled") {
    analysisEnabled = false;
  }

  return {
    tier,
    status,
    ...limits,
    casesAllowed,
    analysisEnabled,
    archiveMode,
    isComped: false,
    isLifetime: false,
    trialEndsAt: user.trialEndsAt ?? null,
    addOnSecondCase,
    addOnArchiveMode,
  };
}

export type PaywallCode = 
  | "PLAN_REQUIRED"
  | "TIER_REQUIRED"
  | "CASE_LIMIT_REACHED"
  | "ANALYSIS_DISABLED"
  | "DOWNLOADS_DISABLED"
  | "VIDEO_UPLOAD_DISABLED"
  | "ADVANCED_EXHIBITS_DISABLED"
  | "ARCHIVE_MODE_ACTIVE"
  | "SUBSCRIPTION_INACTIVE";

export interface PaywallError {
  error: string;
  code: PaywallCode;
  requiredTier?: SubscriptionTier;
  currentTier?: SubscriptionTier;
}

export function createPaywallError(
  message: string,
  code: PaywallCode,
  requiredTier?: SubscriptionTier,
  currentTier?: SubscriptionTier
): PaywallError {
  return {
    error: message,
    code,
    requiredTier,
    currentTier,
  };
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  if (STRIPE_SUSPENDED) {
    throw new Error("Stripe is suspended");
  }
  
  const profile = await db
    .select({ stripeCustomerId: userProfiles.stripeCustomerId })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length > 0 && profile[0].stripeCustomerId) {
    return profile[0].stripeCustomerId;
  }

  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    throw new Error("Stripe is suspended");
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db
    .update(userProfiles)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));

  return customer.id;
}

export const STRIPE_PRICE_MAP: Record<string, { monthly: string; yearly: string }> = {
  core: {
    monthly: process.env.STRIPE_PRICE_CORE_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_CORE_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || "",
  },
};

export const STRIPE_ADDON_PRICES = {
  secondCase: process.env.STRIPE_PRICE_SECOND_CASE_ADDON || "",
  archiveMode: process.env.STRIPE_PRICE_ARCHIVE_ADDON || "",
  overageOneTime: process.env.STRIPE_PRICE_OVERAGE_ONE_TIME || "",
};

export const PROCESSING_PACK_PRICES = {
  overlimit_200: process.env.STRIPE_PRICE_OVERLIMIT_PACK_ONETIME || "",
  plus_600: process.env.STRIPE_PRICE_PLUS_PACK_ONETIME || "",
};

export type ProcessingPackType = "overlimit_200" | "plus_600";

export const PROCESSING_PACK_CREDITS: Record<ProcessingPackType, number> = {
  overlimit_200: 200,
  plus_600: 600,
};

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: "core" | "pro" | "premium",
  billingPeriod: "monthly" | "yearly",
  addSecondCase?: boolean,
  archiveMode?: boolean,
  origin?: string
): Promise<{ url: string | null; error?: string }> {
  if (isCompedEmail(email)) {
    return { url: null, error: "Comped users do not need to subscribe" };
  }

  const priceMapping = STRIPE_PRICE_MAP[plan];
  if (!priceMapping) {
    return { url: null, error: "Invalid plan selected" };
  }

  const priceId = billingPeriod === "yearly" ? priceMapping.yearly : priceMapping.monthly;
  if (!priceId) {
    return { url: null, error: "Stripe price not configured for this plan" };
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);
  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    return { url: null, error: "Billing is temporarily unavailable" };
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  if (addSecondCase && STRIPE_ADDON_PRICES.secondCase) {
    lineItems.push({ price: STRIPE_ADDON_PRICES.secondCase, quantity: 1 });
  }

  if (archiveMode && STRIPE_ADDON_PRICES.archiveMode) {
    lineItems.push({ price: STRIPE_ADDON_PRICES.archiveMode, quantity: 1 });
  }

  const baseUrl = origin || "https://civilla.ai";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${baseUrl}/app/dashboard?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
    cancel_url: `${baseUrl}/plans?canceled=true`,
    metadata: {
      userId,
      plan,
      billingPeriod,
      addSecondCase: addSecondCase ? "true" : "false",
      archiveMode: archiveMode ? "true" : "false",
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string, origin?: string): Promise<{ url: string | null; error?: string }> {
  const profile = await db
    .select({ stripeCustomerId: userProfiles.stripeCustomerId })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length === 0 || !profile[0].stripeCustomerId) {
    return { url: null, error: "No Stripe customer found for this user" };
  }

  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    return { url: null, error: "Billing is temporarily unavailable" };
  }
  const baseUrl = origin || "https://civilla.ai";

  const session = await stripe.billingPortal.sessions.create({
    customer: profile[0].stripeCustomerId,
    return_url: `${baseUrl}/app/account`,
  });

  return { url: session.url };
}

export async function createProcessingPackCheckout(
  userId: string,
  email: string,
  packType: ProcessingPackType,
  origin?: string
): Promise<{ url: string | null; error?: string }> {
  const priceId = PROCESSING_PACK_PRICES[packType];
  if (!priceId) {
    return { url: null, error: `Stripe price not configured for ${packType} processing pack` };
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);
  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    return { url: null, error: "Billing is temporarily unavailable" };
  }

  const baseUrl = origin || "https://civilla.ai";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/account?pack_purchase=success&pack=${packType}`,
    cancel_url: `${baseUrl}/plans?pack_canceled=true`,
    metadata: {
      userId,
      pack_type: packType,
      checkout_type: "processing_pack",
    },
  });

  return { url: session.url };
}

export async function awardProcessingPackCredits(
  userId: string,
  packType: ProcessingPackType,
  sessionId?: string
): Promise<void> {
  const creditsToAdd = PROCESSING_PACK_CREDITS[packType];
  if (!creditsToAdd) {
    console.error(`[BILLING] Unknown pack type: ${packType}`);
    return;
  }

  const { addPackCredits } = await import("./services/credits");
  const jobKey = sessionId ? `stripe_session:${sessionId}` : `pack_${packType}:${userId}:${Date.now()}`;
  
  await addPackCredits({
    userId,
    credits: creditsToAdd,
    jobKey,
    jobType: "export",
  });

  console.log(`[BILLING] Awarded ${creditsToAdd} analysis credits (${packType} pack) to user ${userId}, jobKey=${jobKey}`);
}

export async function getAnalysisCredits(userId: string): Promise<number> {
  const result = await db
    .select({
      analysisCredits: userProfiles.analysisCreditsRemaining,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return 0;
  }

  return result[0].analysisCredits ?? 0;
}

export async function consumeAnalysisCredit(
  userId: string,
  quantity: number = 1
): Promise<{ consumed: boolean; remaining: number }> {
  const result = await db.execute(sql`
    UPDATE user_profiles 
    SET analysis_credits_remaining = GREATEST(0, COALESCE(analysis_credits_remaining, 0) - ${quantity}),
        updated_at = NOW()
    WHERE user_id = ${userId} 
      AND COALESCE(analysis_credits_remaining, 0) >= ${quantity}
    RETURNING analysis_credits_remaining as remaining
  `);

  if (result.rows.length === 0) {
    const remaining = await getAnalysisCredits(userId);
    return { consumed: false, remaining };
  }

  return { consumed: true, remaining: Number(result.rows[0].remaining) ?? 0 };
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`[BILLING WEBHOOK] Processing event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }
    default:
      console.log(`[BILLING WEBHOOK] Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[BILLING WEBHOOK] No userId in checkout session metadata");
    return;
  }

  const checkoutType = session.metadata?.checkout_type;
  
  if (checkoutType === "processing_pack") {
    const packType = session.metadata?.pack_type as ProcessingPackType;
    if (packType && (packType === "overlimit_200" || packType === "plus_600")) {
      await awardProcessingPackCredits(userId, packType, session.id);
      console.log(`[BILLING WEBHOOK] Processing pack ${packType} purchased for user ${userId}, sessionId=${session.id}`);
    } else {
      console.error(`[BILLING WEBHOOK] Invalid pack_type in metadata: ${packType}`);
    }
    return;
  }

  const plan = session.metadata?.plan as SubscriptionTier;
  const addSecondCase = session.metadata?.addSecondCase === "true";
  const archiveMode = session.metadata?.archiveMode === "true";

  await db
    .update(userProfiles)
    .set({
      subscriptionTier: plan || "core",
      subscriptionStatus: "active",
      subscriptionSource: "stripe",
      stripeSubscriptionId: session.subscription as string,
      addOnSecondCase: addSecondCase,
      addOnArchiveMode: archiveMode,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));

  console.log(`[BILLING WEBHOOK] Checkout completed for user ${userId}, plan: ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    const customerId = subscription.customer as string;
    const profile = await db
      .select({ userId: userProfiles.userId })
      .from(userProfiles)
      .where(eq(userProfiles.stripeCustomerId, customerId))
      .limit(1);
    
    if (profile.length === 0) {
      console.error(`[BILLING WEBHOOK] No user found for Stripe customer ${customerId}`);
      return;
    }
    await updateSubscriptionStatus(profile[0].userId, subscription);
  } else {
    await updateSubscriptionStatus(userId, subscription);
  }
}

async function updateSubscriptionStatus(userId: string, subscription: Stripe.Subscription): Promise<void> {
  let status: SubscriptionStatus = "none";
  switch (subscription.status) {
    case "trialing":
      status = "trialing";
      break;
    case "active":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
      status = "canceled";
      break;
    case "unpaid":
      status = "unpaid";
      break;
    default:
      status = "none";
  }

  const plan = subscription.metadata?.plan as SubscriptionTier;
  const priceId = subscription.items.data[0]?.price.id;

  const updates: Record<string, unknown> = {
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    updatedAt: new Date(),
  };

  if (plan) {
    updates.subscriptionTier = plan;
  }

  if (subscription.trial_end) {
    updates.trialEndsAt = new Date(subscription.trial_end * 1000);
  }

  await db.update(userProfiles).set(updates).where(eq(userProfiles.userId, userId));
  console.log(`[BILLING WEBHOOK] Subscription updated for user ${userId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const profile = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.stripeCustomerId, customerId))
    .limit(1);

  if (profile.length === 0) {
    console.error(`[BILLING WEBHOOK] No user found for Stripe customer ${customerId}`);
    return;
  }

  await db
    .update(userProfiles)
    .set({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      stripePriceId: null,
      addOnSecondCase: false,
      addOnArchiveMode: false,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, profile[0].userId));

  console.log(`[BILLING WEBHOOK] Subscription deleted for user ${profile[0].userId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;
  console.log(`[BILLING WEBHOOK] Invoice paid for subscription ${subscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;
  
  const profile = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (profile.length > 0) {
    await db
      .update(userProfiles)
      .set({
        subscriptionStatus: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, profile[0].userId));
    
    console.log(`[BILLING WEBHOOK] Payment failed for user ${profile[0].userId}, status set to past_due`);
  }
}

export async function getBillingStatus(userId: string): Promise<{
  entitlements: UserEntitlements;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  canManageSubscription: boolean;
}> {
  const entitlements = await getEntitlements(userId);
  
  const profile = await db
    .select({
      stripeCustomerId: userProfiles.stripeCustomerId,
      stripeSubscriptionId: userProfiles.stripeSubscriptionId,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const stripeCustomerId = profile[0]?.stripeCustomerId ?? null;
  const stripeSubscriptionId = profile[0]?.stripeSubscriptionId ?? null;
  const canManageSubscription = !entitlements.isComped && !!stripeSubscriptionId;

  return {
    entitlements,
    stripeCustomerId,
    stripeSubscriptionId,
    canManageSubscription,
  };
}
