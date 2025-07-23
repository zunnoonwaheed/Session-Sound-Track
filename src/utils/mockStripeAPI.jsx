// Enhanced Mock API for testing without webhooks
export class EnhancedMockStripeAPI {
    static async createPaymentIntent(amount, currency = "usd") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`
      const secretPart = Math.random().toString(36).substr(2, 24)
  
      return {
        client_secret: `${paymentIntentId}_secret_${secretPart}`,
        id: paymentIntentId,
        amount: amount * 100,
        currency,
        status: "requires_payment_method",
      }
    }
  
    static async createSubscription(priceId, customerEmail) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
  
      const subscriptionId = `sub_${Math.random().toString(36).substr(2, 24)}`
      const customerId = `cus_${Math.random().toString(36).substr(2, 24)}`
      const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`
      const secretPart = Math.random().toString(36).substr(2, 24)
  
      // Simulate subscription creation
      const subscription = {
        id: subscriptionId,
        customer: customerId,
        status: "incomplete",
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        cancel_at_period_end: false,
        latest_invoice: {
          payment_intent: {
            id: paymentIntentId,
            client_secret: `${paymentIntentId}_secret_${secretPart}`,
            status: "requires_payment_method",
          },
        },
      }
  
      // Store subscription locally for testing
      this.storeSubscription(customerEmail, subscription)
  
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscription: subscription,
      }
    }
  
    static async confirmSubscriptionPayment(subscriptionId, paymentMethodId) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
  
      // Simulate payment confirmation
      const subscription = this.getStoredSubscription(subscriptionId)
      if (subscription) {
        subscription.status = "active"
        subscription.latest_invoice.payment_intent.status = "succeeded"
  
        // Update stored subscription
        this.updateStoredSubscription(subscriptionId, subscription)
  
        // Simulate webhook event
        this.simulateWebhookEvent("customer.subscription.updated", subscription)
        this.simulateWebhookEvent("invoice.payment_succeeded", subscription.latest_invoice)
      }
  
      return {
        subscription: subscription,
        paymentIntent: subscription?.latest_invoice?.payment_intent,
      }
    }
  
    static async getSubscriptionStatus(customerEmail) {
      await new Promise((resolve) => setTimeout(resolve, 500))
  
      const subscriptions = this.getCustomerSubscriptions(customerEmail)
      const activeSubscription = subscriptions.find((sub) => sub.status === "active")
  
      if (activeSubscription) {
        return {
          hasSubscription: true,
          subscription: activeSubscription,
        }
      }
  
      return { hasSubscription: false }
    }
  
    static async cancelSubscription(subscriptionId) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      const subscription = this.getStoredSubscription(subscriptionId)
      if (subscription) {
        subscription.cancel_at_period_end = true
        subscription.status = "active" // Still active until period end
        this.updateStoredSubscription(subscriptionId, subscription)
  
        // Simulate webhook
        this.simulateWebhookEvent("customer.subscription.updated", subscription)
      }
  
      return subscription
    }
  
    // Local storage helpers for testing
    static storeSubscription(customerEmail, subscription) {
      const key = `mock_subscriptions_${customerEmail}`
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      existing.push(subscription)
      localStorage.setItem(key, JSON.stringify(existing))
    }
  
    static getStoredSubscription(subscriptionId) {
      const allKeys = Object.keys(localStorage).filter((key) => key.startsWith("mock_subscriptions_"))
      for (const key of allKeys) {
        const subscriptions = JSON.parse(localStorage.getItem(key) || "[]")
        const found = subscriptions.find((sub) => sub.id === subscriptionId)
        if (found) return found
      }
      return null
    }
  
    static updateStoredSubscription(subscriptionId, updatedSubscription) {
      const allKeys = Object.keys(localStorage).filter((key) => key.startsWith("mock_subscriptions_"))
      for (const key of allKeys) {
        const subscriptions = JSON.parse(localStorage.getItem(key) || "[]")
        const index = subscriptions.findIndex((sub) => sub.id === subscriptionId)
        if (index !== -1) {
          subscriptions[index] = updatedSubscription
          localStorage.setItem(key, JSON.stringify(subscriptions))
          break
        }
      }
    }
  
    static getCustomerSubscriptions(customerEmail) {
      const key = `mock_subscriptions_${customerEmail}`
      return JSON.parse(localStorage.getItem(key) || "[]")
    }
  
    static simulateWebhookEvent(eventType, data) {
      console.log(`🎣 Mock Webhook Event: ${eventType}`, data)
  
      // Simulate what would happen in real webhook
      switch (eventType) {
        case "customer.subscription.updated":
          console.log("✅ Subscription updated - user access should be updated")
          // In real app, this would update user's subscription status in database
          break
        case "invoice.payment_succeeded":
          console.log("💳 Payment succeeded - subscription is now active")
          break
        case "customer.subscription.deleted":
          console.log("❌ Subscription canceled - user access revoked")
          break
      }
    }
  
    // Clear all test data
    static clearTestData() {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("mock_subscriptions_"))
      keys.forEach((key) => localStorage.removeItem(key))
    }
  }
  