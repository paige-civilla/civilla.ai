// Stripe client - uses environment variables for credentials
import Stripe from 'stripe';

function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  return {
    publishableKey: publishableKey || '',
    secretKey,
  };
}

export async function getUncachableStripeClient() {
  const { secretKey } = getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

export function getStripePublishableKey() {
  const { publishableKey } = getCredentials();
  return publishableKey;
}

export function getStripeSecretKey() {
  const { secretKey } = getCredentials();
  return secretKey;
}

let stripeSync: any = null;

function getCleanDatabaseUrl(): string {
  let databaseUrl = process.env.DATABASE_URL!;
  // Fix corrupted DATABASE_URL if it has prefix before postgresql://
  if (databaseUrl.includes('postgresql://') && !databaseUrl.startsWith('postgresql://')) {
    databaseUrl = databaseUrl.substring(databaseUrl.indexOf('postgresql://'));
  }
  return databaseUrl;
}

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: getCleanDatabaseUrl(),
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
