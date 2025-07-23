import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

export async function checkUserSubscription(userId) {
  try {
    const subscriptionDoc = await getDoc(doc(db, "subscriptions", userId))

    if (!subscriptionDoc.exists()) {
      return { hasActiveSubscription: false, subscription: null }
    }

    const subscription = subscriptionDoc.data()
    const now = new Date()
    const periodEnd = subscription.currentPeriodEnd.toDate()

    const hasActiveSubscription = subscription.status === "active" && periodEnd > now

    return {
      hasActiveSubscription,
      subscription: {
        ...subscription,
        currentPeriodEnd: periodEnd,
        currentPeriodStart: subscription.currentPeriodStart.toDate(),
      },
    }
  } catch (error) {
    console.error("Error checking subscription:", error)
    return { hasActiveSubscription: false, subscription: null }
  }
}

export function formatSubscriptionDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function getPlanFeatures(planType) {
  const features = {
    basic: ["Access to basic playlists", "Standard quality", "Limited downloads"],
    premium: ["Access to all playlists", "High quality", "Unlimited downloads", "Offline mode"],
  }
  return features[planType] || []
}
