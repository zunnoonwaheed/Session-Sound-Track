"use client"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { db, auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../components/Header"
import Hero from "../components/Hero"
import Filters from "../components/Filters"
import Footer from "../components/Footer"
import Playlist from "../components/Playlist"
import { Link } from "react-router-dom"

function normalizePlatform(platform) {
  const map = {
    spotify: "Spotify",
    youtube: "YouTube",
    "apple music": "Apple Music",
  }
  return map[platform?.toLowerCase()] || platform
}

// Loading skeleton component
function PlaylistSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="aspect-video bg-gray-200 rounded-xl mb-4"></div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex space-x-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-14"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
      </div>
    </div>
  )
}

export default function Home() {
  const [playlists, setPlaylists] = useState([])
  const [playlistGroups, setPlaylistGroups] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [userState, setUserState] = useState("unknown")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroups = async (subscribed) => {
      try {
        setLoading(true)
        const col = collection(db, "playlistGroups")
        const q = subscribed ? col : query(col, where("access", "==", "free"))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        // Add a small delay for better UX
        setTimeout(() => {
          setPlaylistGroups(data)
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error("Error fetching playlist groups:", err)
        setLoading(false)
      }
    }

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserState("guest")
        fetchGroups(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.exists() ? userDoc.data() : null
        const subscribed = userData?.isSubscribed === true
        localStorage.setItem("isSubscribed", subscribed ? "true" : "false")
        setIsSubscribed(subscribed)
        setUserState(subscribed ? "subscribed" : "notSubscribed")
        fetchGroups(subscribed)
      } catch (err) {
        console.error("Error checking subscription:", err)
        setUserState("guest")
        fetchGroups(false)
      }
    })

    // Mock data - replace with actual API call
    const mockPlaylists = [
      {
        id: "playlist1",
        name: "Psychedelic Psychotherapy Playlist 2",
        description: "Deep introspective journey with carefully curated tracks for therapeutic sessions",
        spotifyUrl: "https://open.spotify.com/playlist/example1",
        imageUrl: "/hero-image.jpg",
        trackCount: 24,
        createdAt: "2024-01-15",
      },
      {
        id: "playlist2",
        name: "Heart Playlist 1",
        description: "Heart-opening music for emotional healing and connection",
        spotifyUrl: "https://open.spotify.com/playlist/example2",
        imageUrl: "/hero-image.jpg",
        trackCount: 18,
        createdAt: "2024-01-10",
      },
      {
        id: "playlist3",
        name: "Music for Mushrooms",
        description: "Ceremonial soundscapes for grounding and spiritual exploration",
        spotifyUrl: "https://open.spotify.com/playlist/example3",
        imageUrl: "/hero-image.jpg",
        trackCount: 31,
        createdAt: "2024-01-20",
      },
      {
        id: "playlist4",
        name: "Sacred Knowledge",
        description: "Mystical and classical compositions for deep contemplation",
        spotifyUrl: "https://open.spotify.com/playlist/example4",
        imageUrl: "/hero-image.jpg",
        trackCount: 15,
        createdAt: "2024-01-05",
      },
      {
        id: "playlist5",
        name: "Tommi - Trust",
        description: "Calming and contemplative tracks for building inner trust",
        spotifyUrl: "https://open.spotify.com/playlist/example5",
        imageUrl: "/hero-image.jpg",
        trackCount: 22,
        createdAt: "2024-01-25",
      },
    ]

    // Simulate loading
    setTimeout(() => {
      setPlaylists(mockPlaylists)
      setLoading(false)
    }, 1000)
  }, [])

  const handleTagChange = (tags) => setSelectedTags(tags)

  const filteredGroups = playlistGroups.filter((group) => {
    if (selectedTags.length === 0) return true
    const groupTags = group.tags || []
    const platforms = (group.playlists || []).map((p) => normalizePlatform(p.platform))
    const allGroupTags = [...groupTags, ...platforms]
    return selectedTags.every((tag) => allGroupTags.includes(normalizePlatform(tag)))
  })

  return (
    <div className="bg-tripsonic-blend min-h-screen text-gray-800">
      <Header />
      <main className="px-4">
        <div className="max-w-7xl mx-auto">
          <Hero />
        </div>
        <Filters selected={selectedTags} onChange={handleTagChange} />
        <section className="max-w-7xl mx-auto py-10">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {[...Array(8)].map((_, idx) => (
                  <PlaylistSkeleton key={idx} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Playlist playlistGroups={filteredGroups} />
              </motion.div>
            )}
          </AnimatePresence>
          {!loading && (userState === "guest" || userState === "notSubscribed") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-12 p-8 border border-gray-300 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl text-center max-w-2xl mx-auto"
            >
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">Want access to more exclusive playlists?</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {userState === "guest"
                    ? "Log in or create an account to unlock the full experience with premium therapeutic playlists."
                    : "Subscribe to access our complete collection of curated therapeutic music."}
                </p>
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {userState === "guest" && (
                  <>
                    <Link
                      to="/login"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold hover:from-gray-900 hover:to-black transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-3 rounded-xl border-2 border-gray-800 text-gray-800 font-semibold hover:bg-gray-800 hover:text-white transform hover:scale-105 transition-all duration-200"
                    >
                      Create Account
                    </Link>
                  </>
                )}
                {userState === "notSubscribed" && (
                  <Link
                    to="/subscription"
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Subscribe Now
                  </Link>
                )}
              </div>

              {/* Stripe Test Links for Development */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">Development Tools:</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <Link
                      to="/stripe-test"
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Test Payments
                    </Link>
                    <Link
                      to="/stripe-verify"
                      className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Verify Payments
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
