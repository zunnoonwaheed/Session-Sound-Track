// Import from separated files
import { API_ENDPOINTS } from './endpoints';
import { post, get, put, del } from './httpMethods';

// Re-export everything for backward compatibility
export { API_ENDPOINTS } from './endpoints';
export { post, get, put, del } from './httpMethods'



// For Subscription.jsx 
export async function createCheckoutSession({ planType, userId, userEmail }) {
  const response = await post(API_ENDPOINTS.CREATE_CHECKOUT_SESSION, {
    planType,
    userId,
    userEmail,
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  return response.json();
}

// For SubscriptionForm.jsx
export async function createCheckoutSessionV2({ planId, userId, userEmail }) {
  const response = await post(API_ENDPOINTS.CREATE_CHECKOUT_SESSION, {
    planId,
    userId,
    userEmail,
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  return response.json();
}

// For StripeVerification.jsx 
export async function verifyPayment({ payment_intent_id }) {
  const response = await post(API_ENDPOINTS.VERIFY_PAYMENT, {
    payment_intent_id,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
