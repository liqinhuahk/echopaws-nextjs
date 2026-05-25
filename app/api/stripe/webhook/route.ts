import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import {
  findUserIdByStripeCustomerId,
  mapStripeSubscriptionToRecord,
  upsertSubscription,
} from "@/lib/subscriptions";
import { getStripeClient } from "@/lib/stripe";
import Stripe from "stripe";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const userId = session.metadata?.supabase_user_id || session.client_reference_id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!userId || !subscriptionId) return;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const record = mapStripeSubscriptionToRecord(subscription, userId, session.metadata?.plan || "vip");
  await upsertSubscription(record);
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || "";

  let userId = subscription.metadata?.supabase_user_id || null;

  if (!userId && customerId) {
    userId = await findUserIdByStripeCustomerId(customerId);
  }

  if (!userId) return;

  const record = mapStripeSubscriptionToRecord(subscription, userId, subscription.metadata?.plan || "vip");
  await upsertSubscription(record);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new Response("Missing Stripe webhook secret or signature.", { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    return new Response("Missing Supabase service role environment variables.", { status: 500 });
  }

  createSupabaseAdminClient();

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook";
    return new Response(message, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook handling failed";
    return new Response(message, { status: 500 });
  }

  return Response.json({ received: true });
}
