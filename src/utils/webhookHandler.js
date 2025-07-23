import stripe from '../config/stripe.js';
import { db } from "../firebase"
import { doc, setDoc, updateDoc } from "firebase/firestore"

export async function handleStripeWebhook(event) {
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
        await handlePaymentSucceeded(event.data.object)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error handling webhook:", error)
    throw error
  }
}

async function handleCheckoutSessionCompleted(session) {
  const { userId, planType } = session.metadata

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription)

  // Save subscription to Firebase
  await setDoc(doc(db, "subscriptions", userId), {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    planType: planType,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Update user document
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, {
    subscriptionStatus: "active",
    planType: planType,
    updatedAt: new Date(),
  })
}

async function handleSubscriptionUpdated(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata.userId

  if (userId) {
    await updateDoc(doc(db, "subscriptions", userId), {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata.userId

  if (userId) {
    await updateDoc(doc(db, "subscriptions", userId), {
      status: "canceled",
      updatedAt: new Date(),
    })

    await updateDoc(doc(db, "users", userId), {
      subscriptionStatus: "canceled",
      updatedAt: new Date(),
    })
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log("Payment succeeded for invoice:", invoice.id)
}

async function handlePaymentFailed(invoice) {
  console.log("Payment failed for invoice:", invoice.id)
}
