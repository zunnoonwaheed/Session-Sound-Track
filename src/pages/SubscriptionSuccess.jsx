import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function SubscriptionSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const sessionId = urlParams.get("session_id")

    if (sessionId) {
      console.log("Session ID:", sessionId)
      
      // Simulate processing or validate sessionId if needed
      const timer = setTimeout(() => {
        setLoading(false)

        // Optional auto-redirect after 5 sec
        setTimeout(() => {
          navigate("/") // Redirect to Home
        }, 5000)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [location, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-400 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Successful!</h1>
        <p className="text-gray-600 mb-6">Thank you for subscribing! You’ll be redirected to the homepage shortly.</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate("/")}
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
