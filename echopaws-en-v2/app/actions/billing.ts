'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSiteUrl, getStripeClient, hasStripeEnv } from '@/lib/stripe';

function redirectWithError(message: string) {
  redirect(`/pricing?error=${encodeURIComponent(message)}`);
}

export async function createVipCheckoutSession() {
  if (!hasSupabaseEnv()) {
    redirectWithError('Please configure Supabase. Sign in to subscribe to VIP.');
  }

  if (!hasStripeEnv()) {
    redirectWithError('Please configure Stripe environment variables.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login?message=Please sign in first to subscribe to membership.');
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_VIP_MONTHLY!,
        quantity: 1,
      },
    ],
    success_url: `${getSiteUrl()}/pricing?checkout=success`,
    cancel_url: `${getSiteUrl()}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: {
      supabase_user_id: user.id,
      plan: 'vip',
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan: 'vip',
      },
    },
  });

  if (!session.url) {
    redirectWithError('Failed to create Stripe Checkout session.');
  }

  redirect(session.url);
}

export async function openBillingPortal() {
  if (!hasSupabaseEnv()) {
    redirectWithError('Please configure Supabase.');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    redirectWithError('Please configure Stripe Secret Key.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login?message=Please sign in first to manage your membership.');
  }

  const stripe = getStripeClient();
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];

  if (!customer) {
    redirect(`/pricing?billing=${encodeURIComponent('No Stripe customer record found to manage.')}`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${getSiteUrl()}/account`,
  });

  redirect(session.url);
}