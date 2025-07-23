"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { loadStripe } from "@stripe/stripe-js"
import { createCheckoutSessionV2 } from "../utils/api"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function SubscriptionForm({ plan = "basic" }) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please log in to subscribe")
      return
    }

    setLoading(true)

    try {
      // Create checkout session
      const { sessionId, error } = await createCheckoutSessionV2({
        planId: plan,
        userId: user.uid,
        userEmail: user.email,
      })

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to start subscription process. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic Plan</h3>
      <div className="text-3xl font-bold text-gray-900 mb-6">
        $9.99<span className="text-lg font-normal text-gray-600">/month</span>
      </div>

      <ul className="space-y-3 mb-6">
        <li className="flex items-center text-gray-700">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Access to basic playlists
        </li>
        <li className="flex items-center text-gray-700">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Standard quality
        </li>
        <li className="flex items-center text-gray-700">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Limited downloads
        </li>
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : "Subscribe"}
      </button>
    </div>
  )
}
