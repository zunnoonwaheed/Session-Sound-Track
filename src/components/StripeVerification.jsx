"use client"

import { useState } from "react"
import { verifyPayment } from "../utils/api"

export default function StripeVerification() {
  const [paymentIntentId, setPaymentIntentId] = useState("")
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const verifyPaymentHandler = async () => {
    if (!paymentIntentId.trim()) {
      alert("Please enter a Payment Intent ID")
      return
    }

    setLoading(true)
    setVerificationResult(null)

    try {
      const result = await verifyPayment({
        payment_intent_id: paymentIntentId,
      })
      setVerificationResult(result)
    } catch (error) {
      setVerificationResult({
        error: true,
        message: "Failed to verify payment: " + error.message,
      })
    }

    setLoading(false)
  }

  const generateTestPaymentIntent = () => {
    const testId = "pi_test_" + Math.random().toString(36).substr(2, 9)
    setPaymentIntentId(testId)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    })
  }

  return (
    <div className="stripe-verification">
      <div className="verification-container">
        <div className="verification-header">
          <h2>🔍 Payment Verification</h2>
          <p>Verify the status and details of any payment using its Payment Intent ID</p>
        </div>

        <div className="verification-form">
          <div className="form-group">
            <label htmlFor="payment-intent-id">Payment Intent ID:</label>
            <div className="input-group">
              <input
                id="payment-intent-id"
                type="text"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                placeholder="pi_1234567890abcdef..."
                className="payment-id-input"
              />
              <button
                type="button"
                onClick={generateTestPaymentIntent}
                className="generate-button"
                title="Generate a test Payment Intent ID"
              >
                Generate Test ID
              </button>
            </div>
            <small className="input-help">
              Enter a Payment Intent ID from a previous payment or generate a test ID
            </small>
          </div>

          <button
            onClick={verifyPaymentHandler}
            disabled={loading || !paymentIntentId.trim()}
            className={`verify-button ${loading ? "loading" : ""}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying Payment...
              </>
            ) : (
              <>🔍 Verify Payment</>
            )}
          </button>
        </div>

        {verificationResult && (
          <div className={`verification-result ${verificationResult.error ? "error" : "success"}`}>
            <div className="result-header">
              <h3>{verificationResult.error ? "❌ Verification Failed" : "✅ Payment Verified"}</h3>
            </div>

            {verificationResult.error ? (
              <div className="error-content">
                <div className="error-message">
                  <strong>Error:</strong> {verificationResult.message}
                </div>
                <div className="error-suggestions">
                  <h4>Troubleshooting:</h4>
                  <ul>
                    <li>Check that the Payment Intent ID is correct</li>
                    <li>Ensure the payment was created with your test keys</li>
                    <li>Try generating a test ID using the button above</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="success-content">
                <div className="payment-details">
                  <div className="detail-section">
                    <h4>Payment Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Payment Intent ID:</span>
                        <div className="detail-value-container">
                          <code className="detail-value">{verificationResult.id}</code>
                          <button
                            onClick={() => copyToClipboard(verificationResult.id)}
                            className="copy-button"
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-${verificationResult.status}`}>
                          {verificationResult.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value amount">
                          ${(verificationResult.amount / 100).toFixed(2)} {verificationResult.currency?.toUpperCase()}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {new Date(verificationResult.created * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {verificationResult.payment_method && (
                    <div className="detail-section">
                      <h4>Payment Method</h4>
                      <div className="payment-method-info">
                        <div className="detail-item">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{verificationResult.payment_method.type}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Last 4 digits:</span>
                          <span className="detail-value">****{verificationResult.payment_method.last4}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h4>Additional Details</h4>
                    <div className="additional-details">
                      <div className="detail-item">
                        <span className="detail-label">Client Secret:</span>
                        <code className="detail-value small">
                          {verificationResult.client_secret || "Not available"}
                        </code>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Confirmation Method:</span>
                        <span className="detail-value">{verificationResult.confirmation_method || "automatic"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="test-scenarios">
          <h3>🧪 Test Scenarios</h3>
          <div className="scenarios-grid">
            <div className="scenario-card success">
              <div className="scenario-icon">✅</div>
              <h4>Successful Payment</h4>
              <p>Use any test Payment Intent ID to see a successful verification with complete payment details.</p>
              <code>pi_test_xxxxxxxxx</code>
            </div>

            <div className="scenario-card error">
              <div className="scenario-icon">❌</div>
              <h4>Failed Payment</h4>
              <p>Test IDs starting with "pi_fail_" will show failed payment status with error details.</p>
              <code>pi_fail_xxxxxxxxx</code>
            </div>

            <div className="scenario-card warning">
              <div className="scenario-icon">⏳</div>
              <h4>Pending Payment</h4>
              <p>Test IDs starting with "pi_pending_" will show processing status for incomplete payments.</p>
              <code>pi_pending_xxxxxxxxx</code>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stripe-verification {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .verification-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .verification-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .verification-header h2 {
          margin: 0 0 10px 0;
          font-size: 2rem;
          font-weight: 700;
        }
        .verification-header p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }
        .verification-form {
          padding: 30px;
        }
        .form-group {
          margin-bottom: 24px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        .input-group {
          display: flex;
          gap: 12px;
        }
        .payment-id-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          font-family: 'SF Mono', Monaco, monospace;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .payment-id-input:focus {
          outline: none;
          border-color: #5469d4;
          box-shadow: 0 0 0 3px rgba(84, 105, 212, 0.1);
        }
        .generate-button {
          padding: 12px 16px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          font-weight: 500;
          transition: background 0.2s;
        }
        .generate-button:hover {
          background: #4b5563;
        }
        .input-help {
          display: block;
          color: #6b7280;
          margin-top: 6px;
          font-size: 13px;
        }
        .verify-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #5469d4 0%, #4f63d2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .verify-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f63d2 0%, #4558c9 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(84, 105, 212, 0.3);
        }
        .verify-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .verification-result {
          margin: 30px;
          border-radius: 12px;
          overflow: hidden;
        }
        .verification-result.success {
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
        }
        .verification-result.error {
          background: #fef2f2;
          border: 2px solid #fecaca;
        }
        .result-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .result-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .success-content, .error-content {
          padding: 24px;
        }
        .detail-section {
          margin-bottom: 24px;
        }
        .detail-section:last-child {
          margin-bottom: 0;
        }
        .detail-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .detail-grid, .payment-method-info, .additional-details {
          display: grid;
          gap: 12px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 500;
          color: #374151;
          min-width: 140px;
        }
        .detail-value {
          font-family: 'SF Mono', Monaco, monospace;
          color: #1f2937;
          font-weight: 500;
        }
        .detail-value.small {
          font-size: 12px;
        }
        .detail-value-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .copy-button:hover {
          background: #f3f4f6;
        }
        .status-succeeded {
          color: #059669;
          background: #d1fae5;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-failed {
          color: #dc2626;
          background: #fee2e2;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-processing {
          color: #d97706;
          background: #fef3c7;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .amount {
          color: #059669;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .error-message {
          color: #991b1b;
          margin-bottom: 16px;
        }
        .error-suggestions h4 {
          color: #991b1b;
          margin-bottom: 8px;
        }
        .error-suggestions ul {
          color: #7f1d1d;
          margin: 0;
          padding-left: 20px;
        }
        .error-suggestions li {
          margin-bottom: 4px;
        }
        .test-scenarios {
          padding: 30px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .test-scenarios h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .scenarios-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .scenario-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .scenario-card.success {
          border-left: 4px solid #10b981;
        }
        .scenario-card.error {
          border-left: 4px solid #ef4444;
        }
        .scenario-card.warning {
          border-left: 4px solid #f59e0b;
        }
        .scenario-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }
        .scenario-card h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 600;
        }
        .scenario-card p {
          margin: 0 0 12px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }
        .scenario-card code {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #374151;
        }
        @media (max-width: 768px) {
          .input-group {
            flex-direction: column;
          }
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .detail-label {
            min-width: auto;
          }
          .scenarios-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
