"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"
import { loadStripe } from "@stripe/stripe-js"
import { createCheckoutSession } from "../utils/api"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const PLANS = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$9.99",
    interval: "month",
    features: ["Access to basic playlists", "Standard quality", "Limited downloads"],
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: "$19.99",
    interval: "month",
    features: ["Access to all playlists", "High quality", "Unlimited downloads", "Offline mode"],
  },
]

export default function Subscription() {
  const [user, loading] = useAuthState(auth)
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(null)

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription()
    }
  }, [user])

  const fetchCurrentSubscription = async () => {
    try {
      const subscriptionDoc = await getDoc(doc(db, "subscriptions", user.uid))
      if (subscriptionDoc.exists()) {
        setCurrentSubscription(subscriptionDoc.data())
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const handleSubscribe = async (planType) =>  { 
    if (!user) {
      alert("Please log in to subscribe")
      return
    
    }

setIsLoading(planType)

    try {
      const response = await createCheckoutSession({
        planType: planType,
        userId: user.uid,
        userEmail: user.email,
      })

      const { sessionId } = response
      const stripe = await stripePromise

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (error) {
        console.error("Error redirecting to checkout:", error)
        alert("Error redirecting to checkout")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      alert("Error creating checkout session")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view subscription plans</h2>
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Log In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose Your Plan</h2>
          <p className="mt-4 text-xl text-gray-600">Select the perfect plan for your music streaming needs</p>
        </div>

        {currentSubscription && (
          <div className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">
              Current Plan: {currentSubscription.planType} - Status: {currentSubscription.status}
            </p>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-500">Perfect for getting started</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/{plan.interval}</span>
                </p>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                 disabled={
                    isLoading === plan.id || (currentSubscription?.planType === plan.id && currentSubscription?.status === "active")
                  }
                  className="mt-8 block w-full bg-gray-800 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === plan.id
                    ? "Processing..."
                    : currentSubscription?.planType === plan.id && currentSubscription?.status === "active"
                      ? "Current Plan"
                      : "Subscribe"}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex space-x-3">
                      <svg className="flex-shrink-0 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
