import Stripe from "stripe"
import { loadStripe } from "@stripe/stripe-js"


export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic Plan",
    price: 999, 
    currency: "usd",
    interval: "month",
    features: ["Access to basic playlists", "Standard quality", "Limited downloads"],
  },
  premium: {
    name: "Premium Plan",
    price: 1999, 
    currency: "usd",
    interval: "month",
    features: ["Access to all playlists", "High quality", "Unlimited downloads", "Offline mode"],
  },
}

// API endpoint functions for client-side use
export async function createCheckoutSession(planType, userId, userEmail) {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      planType,
      userId,
      userEmail,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create checkout session")
  }

  return response.json()
}
