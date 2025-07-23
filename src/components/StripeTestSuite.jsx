"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import PaymentForm from "./PaymentForm"
import StripeVerification from "./StripeVerification"
import { stripeConfig } from "../config/stripe"

const stripePromise = loadStripe(stripeConfig.publishableKey)

const testCards = [
  {
    number: "4242424242424242",
    description: "Visa - Success",
    type: "success",
    cvc: "123",
    expiry: "12/25",
    expected: "Payment will succeed",
  },
  {
    number: "4000000000000002",
    description: "Visa - Card Declined",
    type: "declined",
    cvc: "123",
    expiry: "12/25",
    expected: "Card will be declined",
  },
  {
    number: "4000000000009995",
    description: "Visa - Insufficient Funds",
    type: "insufficient_funds",
    cvc: "123",
    expiry: "12/25",
    expected: "Insufficient funds error",
  },
  {
    number: "4000000000000069",
    description: "Visa - Expired Card",
    type: "expired_card",
    cvc: "123",
    expiry: "12/20",
    expected: "Expired card error",
  },
  {
    number: "4000000000000127",
    description: "Visa - Incorrect CVC",
    type: "incorrect_cvc",
    cvc: "999",
    expiry: "12/25",
    expected: "Incorrect CVC error",
  },
  {
    number: "4000002500003155",
    description: "Visa - Requires Authentication",
    type: "authentication_required",
    cvc: "123",
    expiry: "12/25",
    expected: "3D Secure authentication required",
  },
  {
    number: "5555555555554444",
    description: "Mastercard - Success",
    type: "success",
    cvc: "123",
    expiry: "12/25",
    expected: "Payment will succeed",
  },
  {
    number: "378282246310005",
    description: "American Express - Success",
    type: "success",
    cvc: "1234",
    expiry: "12/25",
    expected: "Payment will succeed",
  },
]

export default function StripeTestSuite() {
  const [activeTab, setActiveTab] = useState("overview")
  const [testResults, setTestResults] = useState([])
  const [runningTests, setRunningTests] = useState(new Set())

  const runCardTest = async (card) => {
    const testId = `${card.number}-${Date.now()}`
    setRunningTests((prev) => new Set([...prev, card.number]))

    setTestResults((prev) => [
      {
        id: testId,
        card: card.description,
        number: card.number,
        status: "testing",
        timestamp: new Date().toLocaleTimeString(),
        expected: card.expected,
      },
      ...prev,
    ])

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))

      setTestResults((prev) =>
        prev.map((result) =>
          result.id === testId
            ? {
                ...result,
                status: card.type,
                result: getTestResult(card.type),
                duration: `${(2 + Math.random()).toFixed(1)}s`,
              }
            : result,
        ),
      )
    } catch (error) {
      setTestResults((prev) =>
        prev.map((result) =>
          result.id === testId ? { ...result, status: "error", result: "Test execution failed" } : result,
        ),
      )
    } finally {
      setRunningTests((prev) => {
        const newSet = new Set(prev)
        newSet.delete(card.number)
        return newSet
      })
    }
  }

  const getTestResult = (type) => {
    const results = {
      success: "Payment processed successfully",
      declined: "Your card was declined",
      insufficient_funds: "Your card has insufficient funds",
      expired_card: "Your card has expired",
      incorrect_cvc: "Your card's security code is incorrect",
      authentication_required: "Authentication required - 3D Secure triggered",
    }
    return results[type] || "❓ Unknown result"
  }

  const runAllTests = async () => {
    for (const card of testCards) {
      if (!runningTests.has(card.number)) {
        await runCardTest(card)
        await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay between tests
      }
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const getStatusColor = (status) => {
    const colors = {
      success: "#10b981",
      declined: "#ef4444",
      insufficient_funds: "#ef4444",
      expired_card: "#ef4444",
      incorrect_cvc: "#ef4444",
      authentication_required: "#f59e0b",
      testing: "#6b7280",
      error: "#dc2626",
    }
    return colors[status] || "#6b7280"
  }

  return (
    <div className="stripe-test-suite">
      <div className="test-header">
        <h1>🧪 Session Soundtrack - Stripe Test Suite</h1>
        <p>Comprehensive testing environment for your Stripe integration</p>
        <div className="test-stats">
          <div className="stat">
            <span className="stat-number">{testCards.length}</span>
            <span className="stat-label">Test Cards</span>
          </div>
          <div className="stat">
            <span className="stat-number">{testResults.length}</span>
            <span className="stat-label">Tests Run</span>
          </div>
          <div className="stat">
            <span className="stat-number">{runningTests.size}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
      </div>

      <div className="test-tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          📊 Overview
        </button>
        <button className={`tab ${activeTab === "cards" ? "active" : ""}`} onClick={() => setActiveTab("cards")}>
          💳 Test Cards
        </button>
        <button className={`tab ${activeTab === "payment" ? "active" : ""}`} onClick={() => setActiveTab("payment")}>
          💰 Payment Form
        </button>
        <button
          className={`tab ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          🔍 Verification
        </button>
        <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>
          📋 Results ({testResults.length})
        </button>
      </div>

      <div className="test-content">
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>🎯 Quick Start</h3>
                <p>Begin testing your Stripe integration with pre-configured test scenarios</p>
                <div className="quick-actions">
                  <button onClick={runAllTests} className="action-button primary" disabled={runningTests.size > 0}>
                    {runningTests.size > 0 ? "Running Tests..." : "Run All Tests"}
                  </button>
                  <button onClick={() => setActiveTab("payment")} className="action-button secondary">
                    Test Payment Form
                  </button>
                </div>
              </div>

              <div className="overview-card">
                <h3>🔧 Configuration</h3>
                <div className="config-info">
                  <div className="config-item">
                    <span className="config-label">Mode:</span>
                    <span className="config-value">Test Mode</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Currency:</span>
                    <span className="config-value">USD</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Key:</span>
                    <span className="config-value">pk_test_51J3Esr...</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>📈 Test Coverage</h3>
                <div className="coverage-list">
                  <div className="coverage-item">✅ Successful Payments</div>
                  <div className="coverage-item">❌ Declined Cards</div>
                  <div className="coverage-item">💰 Insufficient Funds</div>
                  <div className="coverage-item">📅 Expired Cards</div>
                  <div className="coverage-item">🔐 3D Secure Auth</div>
                  <div className="coverage-item">🔢 Invalid CVC</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cards" && (
          <div className="test-cards">
            <div className="cards-header">
              <h2>💳 Test Card Numbers</h2>
              <div className="cards-actions">
                <button onClick={runAllTests} className="bulk-test-button" disabled={runningTests.size > 0}>
                  {runningTests.size > 0 ? `Running ${runningTests.size} tests...` : "Test All Cards"}
                </button>
                <button onClick={clearResults} className="clear-button">
                  Clear Results
                </button>
              </div>
            </div>

            <div className="cards-grid">
              {testCards.map((card, index) => (
                <div key={index} className={`card-item ${card.type}`}>
                  <div className="card-header">
                    <h3>{card.description}</h3>
                    <span className={`status-badge ${card.type}`}>{card.type.replace("_", " ")}</span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">Number:</span>
                      <code className="detail-value">{card.number}</code>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">CVC:</span>
                      <code className="detail-value">{card.cvc}</code>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Expiry:</span>
                      <code className="detail-value">{card.expiry}</code>
                    </div>
                  </div>

                  <div className="card-expected">
                    <strong>Expected:</strong> {card.expected}
                  </div>

                  <button
                    className="test-button"
                    onClick={() => runCardTest(card)}
                    disabled={runningTests.has(card.number)}
                  >
                    {runningTests.has(card.number) ? (
                      <>
                        <span className="spinner-small"></span>
                        Testing...
                      </>
                    ) : (
                      "Test This Card"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="payment-test">
            <h2>💰 Payment Form Testing</h2>
            <p>Use any of the test card numbers from the "Test Cards" tab to simulate different payment scenarios.</p>
            <div className="payment-wrapper">
              <PaymentForm />
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="verification-test">
            <h2>🔍 Payment Verification Testing</h2>
            <StripeVerification />
          </div>
        )}

        {activeTab === "results" && (
          <div className="test-results">
            <div className="results-header">
              <h2>📋 Test Results</h2>
              <div className="results-actions">
                <button onClick={clearResults} className="clear-button">
                  Clear All Results
                </button>
              </div>
            </div>

            {testResults.length === 0 ? (
              <div className="no-results">
                <p>No test results yet.</p>
                <p>Run some card tests to see results here.</p>
                <button onClick={() => setActiveTab("cards")} className="action-button primary">
                  Go to Test Cards
                </button>
              </div>
            ) : (
              <div className="results-list">
                {testResults.map((result) => (
                  <div key={result.id} className={`result-item ${result.status}`}>
                    <div className="result-header">
                      <div className="result-title">
                        <span className="card-name">{result.card}</span>
                        <code className="card-number">{result.number}</code>
                      </div>
                      <div className="result-meta">
                        <span className="timestamp">{result.timestamp}</span>
                        {result.duration && <span className="duration">{result.duration}</span>}
                      </div>
                    </div>

                    <div className="result-status" style={{ color: getStatusColor(result.status) }}>
                      Status: {result.status === "testing" ? "Testing..." : result.status.replace("_", " ")}
                    </div>

                    {result.expected && <div className="result-expected">Expected: {result.expected}</div>}

                    {result.result && <div className="result-message">{result.result}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .stripe-test-suite {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .test-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }
        .test-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }
        .test-header p {
          margin: 0 0 30px 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }
        .test-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
        }
        .stat {
          text-align: center;
        }
        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .test-tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 30px;
          overflow-x: auto;
        }
        .tab {
          padding: 16px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .tab:hover {
          background: #f9fafb;
        }
        .tab.active {
          border-bottom-color: #5469d4;
          color: #5469d4;
          background: #f0f4ff;
        }
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        .overview-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .overview-card h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 1.25rem;
        }
        .overview-card p {
          margin: 0 0 20px 0;
          color: #6b7280;
          line-height: 1.5;
        }
        .quick-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .action-button {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-button.primary {
          background: #5469d4;
          color: white;
        }
        .action-button.primary:hover:not(:disabled) {
          background: #4f63d2;
        }
        .action-button.secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .action-button.secondary:hover {
          background: #e5e7eb;
        }
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .config-info {
          space-y: 8px;
        }
        .config-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .config-label {
          color: #6b7280;
        }
        .config-value {
          font-family: monospace;
          color: #1f2937;
          font-weight: 500;
        }
        .coverage-list {
          space-y: 6px;
        }
        .coverage-item {
          margin-bottom: 6px;
          font-size: 14px;
        }
        .cards-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .cards-header h2 {
          margin: 0;
          color: #1f2937;
        }
        .cards-actions {
          display: flex;
          gap: 12px;
        }
        .bulk-test-button {
          padding: 10px 16px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .bulk-test-button:hover:not(:disabled) {
          background: #047857;
        }
        .bulk-test-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .clear-button {
          padding: 10px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .clear-button:hover {
          background: #b91c1c;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .card-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: white;
          transition: all 0.2s;
        }
        .card-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .card-item.success {
          border-left: 4px solid #10b981;
        }
        .card-item.declined,
        .card-item.insufficient_funds,
        .card-item.expired_card,
        .card-item.incorrect_cvc {
          border-left: 4px solid #ef4444;
        }
        .card-item.authentication_required {
          border-left: 4px solid #f59e0b;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .card-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge.success {
          background: #d1fae5;
          color: #065f46;
        }
        .status-badge.declined,
        .status-badge.insufficient_funds,
        .status-badge.expired_card,
        .status-badge.incorrect_cvc {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-badge.authentication_required {
          background: #fef3c7;
          color: #92400e;
        }
        .card-details {
          margin-bottom: 16px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .detail-label {
          color: #6b7280;
          font-weight: 500;
        }
        .detail-value {
          font-family: 'SF Mono', Monaco, monospace;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
        }
        .card-expected {
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
        }
        .test-button {
          width: 100%;
          padding: 12px;
          background: #5469d4;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .test-button:hover:not(:disabled) {
          background: #4f63d2;
        }
        .test-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
        .no-results p {
          margin-bottom: 8px;
        }
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .results-header h2 {
          margin: 0;
          color: #1f2937;
        }
        .results-list {
          space-y: 16px;
        }
        .result-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background: white;
        }
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .result-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-name {
          font-weight: 600;
          color: #1f2937;
        }
        .card-number {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .result-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
        }
        .result-status {
          font-weight: 500;
          margin-bottom: 8px;
        }
        .result-expected {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .result-message {
          font-size: 14px;
          font-weight: 500;
        }
        .payment-wrapper {
          margin-top: 20px;
        }
        @media (max-width: 768px) {
          .test-stats {
            gap: 20px;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .result-header {
            flex-direction: column;
            gap: 8px;
          }
          .result-meta {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
