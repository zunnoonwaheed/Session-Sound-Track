"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore"
import Sidebar from "../components/Sidebar"
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa"

function AdminSubs() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    features: "",
    planType: "basic",
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "subscription_plans"))
      const subs = []
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() })
      })
      setSubscriptions(subs)
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const planData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        features: formData.features.split(",").map((f) => f.trim()),
        createdAt: new Date(),
      }

      if (editingId) {
        await updateDoc(doc(db, "subscription_plans", editingId), planData)
      } else {
        await addDoc(collection(db, "subscription_plans"), planData)
      }

      setFormData({ name: "", price: "", features: "", planType: "basic" })
      setShowAddForm(false)
      setEditingId(null)
      fetchSubscriptions()
    } catch (error) {
      console.error("Error saving subscription:", error)
    }
  }

  const handleEdit = (subscription) => {
    setFormData({
      name: subscription.name,
      price: subscription.price.toString(),
      features: subscription.features.join(", "),
      planType: subscription.planType,
    })
    setEditingId(subscription.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription plan?")) {
      try {
        await deleteDoc(doc(db, "subscription_plans", id))
        fetchSubscriptions()
      } catch (error) {
        console.error("Error deleting subscription:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading subscriptions...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
          >
            <FaPlus /> Add New Plan
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Subscription Plan" : "Add New Subscription Plan"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plan Type</label>
                <select
                  value={formData.planType}
                  onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Features (comma-separated)</label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full p-2 border rounded-lg h-24"
                  placeholder="Feature 1, Feature 2, Feature 3"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  {editingId ? "Update Plan" : "Add Plan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                    setFormData({ name: "", price: "", features: "", planType: "basic" })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subscription plans found. Add your first plan to get started.
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{subscription.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">${subscription.price}/month</p>
                    <p className="text-sm text-gray-600 mt-1">Plan Type: {subscription.planType}</p>
                    <div className="mt-3">
                      <h4 className="font-medium text-gray-700">Features:</h4>
                      <ul className="list-disc list-inside mt-1 text-gray-600">
                        {subscription.features?.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSubs
