import { Router } from "express";
import { requireAuth } from "../auth";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import { getUncachableStripeClient } from "../stripeClient";

export const billingRouter = Router();

// Get user's subscription status
billingRouter.get(
  "/subscription",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stripe = await getUncachableStripeClient();

    // Get user's email
    const { db } = await import("../db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId!),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json({
        hasSubscription: false,
        plan: "free",
      });
    }

    const customer = customers.data[0];

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        hasSubscription: false,
        plan: "free",
        customerId: customer.id,
      });
    }

    const subscription = subscriptions.data[0];

    res.json({
      hasSubscription: true,
      plan: "premium",
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      customerId: customer.id,
      subscriptionId: subscription.id,
    });
  }),
);

// Create checkout session
billingRouter.post(
  "/create-checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stripe = await getUncachableStripeClient();
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ message: "Price ID required" });
    }

    // Get user
    const { db } = await import("../db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId!),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000"}/billing/success`,
      cancel_url: `${process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000"}/billing`,
    });

    logger.info("Checkout session created", {
      userId: req.session.userId,
      sessionId: session.id,
    });

    res.json({ url: session.url });
  }),
);

// Create customer portal session
billingRouter.post(
  "/create-portal",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stripe = await getUncachableStripeClient();

    // Get user
    const { db } = await import("../db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId!),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ message: "No billing account found" });
    }

    const customer = customers.data[0];

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000"}/billing`,
    });

    logger.info("Portal session created", {
      userId: req.session.userId,
      customerId: customer.id,
    });

    res.json({ url: session.url });
  }),
);
