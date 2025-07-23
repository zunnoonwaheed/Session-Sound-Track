import { stripe, SUBSCRIPTION_PLANS } from "../config/stripe.js"

export async function createCheckoutSession(planType, userId, userEmail) {
  if (!planType || !userId || !userEmail) {
    throw new Error("Missing required fields")
  }

  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) {
    throw new Error("Invalid plan type")
  }

  // Check for existing Stripe customer
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  })

  let customer
  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0]
  } else {
    customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    })
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.features.join(", "),
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/subscription`,
    metadata: {
      userId,
      planType,
    },
  })

  return { sessionId: session.id }
}
