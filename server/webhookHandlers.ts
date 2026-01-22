import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { handleWebhookEvent } from './billing';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      try {
        const stripe = await getUncachableStripeClient();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        await handleWebhookEvent(event);
        console.log(`[WEBHOOK] Processed event: ${event.type}`);
      } catch (err) {
        console.error('[WEBHOOK] Signature verification failed:', err instanceof Error ? err.message : err);
        throw err;
      }
    } else {
      console.log('[WEBHOOK] No STRIPE_WEBHOOK_SECRET configured, using stripe-replit-sync');
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
    }
  }
}
