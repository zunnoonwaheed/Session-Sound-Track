import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())

// Webhook endpoint - must be raw body for Stripe
app.use("/webhook/stripe", express.raw({ type: "application/json" }))

// Regular JSON middleware for other routes
app.use(express.json())

// Import Stripe after environment is loaded
const stripe = await import("stripe").then((module) =>
  module.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  }),
)

// Subscription plans
const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic Plan",
    price: 999, // $9.99 in cents
    currency: "usd",
    interval: "month",
    features: ["Access to basic playlists", "Standard quality", "Limited downloads"],
  },
  premium: {
    name: "Premium Plan",
    price: 1999, // $19.99 in cents
    currency: "usd",
    interval: "month",
    features: ["Access to all playlists", "High quality", "Unlimited downloads", "Offline mode"],
  },
}

// API endpoint for creating checkout sessions
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { planType, userId, userEmail } = req.body

    if (!planType || !userId || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const plan = SUBSCRIPTION_PLANS[planType]
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan type" })
    }

    // Create or retrieve customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
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
        userId: userId,
        planType: planType,
      },
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Stripe webhook handler
app.post("/webhook/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break

      case "invoice.payment_succeeded":
        console.log("Payment succeeded for invoice:", event.data.object.id)
        break

      case "invoice.payment_failed":
        console.log("Payment failed for invoice:", event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    res.status(500).json({ message: "Webhook handler failed" })
  }
})

async function handleCheckoutSessionCompleted(session) {
  const { userId, planType } = session.metadata
  console.log(`Subscription completed for user ${userId} with plan ${planType}`)

  // Here you would save to Firebase
  // For now, just log the success
  console.log("Subscription data:", {
    userId,
    planType,
    customerId: session.customer,
    subscriptionId: session.subscription,
  })
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id)
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id)
}

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`)
})
