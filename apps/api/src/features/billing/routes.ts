import { Hono } from "hono";
import { claimStripeEvent } from "../../repositories/billing-repository";
import { apiBadRequest, apiServiceUnavailable } from "../../shared/errors";
import type { AppEnv } from "../../types/bindings";
import { onError } from "../../middleware/error-handler";
import * as billingService from "./service";
import { requireStripeClient } from "./stripe";

/** Stripe requires the untouched request body for signature verification. */
export const billingRoutes = new Hono<AppEnv>();
billingRoutes.onError(onError);

billingRoutes.post("/webhook", async (c) => {
  const secret = c.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw apiServiceUnavailable("Webhook secret is not configured.", "STRIPE_WEBHOOK_UNSET");
  }
  const signature = c.req.header("stripe-signature");
  if (!signature) throw apiBadRequest("Missing Stripe-Signature header.", "MISSING_SIGNATURE");

  const rawBody = await c.req.text();
  const stripe = requireStripeClient(c.env);
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch {
    throw apiBadRequest("Invalid Stripe webhook signature.", "INVALID_SIGNATURE");
  }

  const claimed = await claimStripeEvent(c.env, event.id, event.type);
  if (!claimed) return c.json({ received: true }, 200);

  switch (event.type) {
    case "checkout.session.completed":
      await billingService.handleCheckoutCompleted(c.env, event.data.object);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await billingService.handleSubscriptionChange(c.env, event.data.object);
      break;
    case "invoice.paid":
      await billingService.handleInvoiceEvent(c.env, event.data.object, false);
      break;
    case "invoice.payment_failed":
      await billingService.handleInvoiceEvent(c.env, event.data.object, true);
      break;
    default:
      break;
  }
  return c.json({ received: true }, 200);
});
