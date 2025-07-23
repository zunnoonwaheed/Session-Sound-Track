import express from "express"
import cors from "cors" // ✅ Add this
import dotenv from "dotenv"
import { stripe } from "./src/config/stripe.js"
import { handleStripeWebhook } from "./src/utils/webhookHandler.js"

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// ✅ Add CORS before any routes
app.use(cors({ origin: true })) // or use your domain specifically

// Stripe webhook route (must be raw body)
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"]
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
      await handleStripeWebhook(event)
      res.status(200).json({ received: true })
    } catch (error) {
      console.error("Error handling webhook:", error)
      res.status(500).json({ message: "Webhook handler failed" })
    }
  }
)

// 👇 Important: JSON parser must come AFTER the webhook route
app.use(express.json())

// API: Create Stripe checkout session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { planType, userId, userEmail } = req.body

    if (!planType || !userId || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const { createCheckoutSession } = await import("./src/utils/createCheckoutSession.js")
    const sessionData = await createCheckoutSession(planType, userId, userEmail)

    res.status(200).json(sessionData)
  } catch (error) {
    console.error("Error creating checkout session:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
