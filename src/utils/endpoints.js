
const BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3001/tripsonic-65ce4/us-central1/api'
    : 'https://us-central1-tripsonic-65ce4.cloudfunctions.net/api'

export const API_ENDPOINTS = {
  CREATE_CHECKOUT_SESSION: `${BASE_URL}/create-checkout-session`,
  CREATE_CHECKOUT_SESSION_LOCAL: 'http://localhost:3001/api/create-checkout-session', // only if using local express server
  VERIFY_PAYMENT: `${BASE_URL}/verify-payment`,
}
