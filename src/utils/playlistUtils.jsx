import { spotifyAPI } from "../services/spotifyApi"

const playlistCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 

export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds === 0) return "0m"

  const totalMinutes = Math.round(milliseconds / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${totalMinutes}m`
}

export const formatDurationDetailed = (milliseconds) => {
  if (!milliseconds || milliseconds === 0) return "0:00"

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export const calculatePlaylistDuration = async (playlistId, platform, url) => {
  try {
    if (platform?.toLowerCase() === "spotify" && url) {

      const cacheKey = `duration_${playlistId}_${url}`
      const cached = playlistCache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Using cached duration for ${url}: ${formatDuration(cached.duration)}`)
        return cached.duration
      }

      try {
        console.log(`🎵 Fetching real Spotify duration for: ${url}`)
        const metadata = await spotifyAPI.getPlaylistMetadata(url)
        const duration = metadata.totalDuration

        console.log(`Spotify API Response:`, {
          playlistName: metadata.name,
          totalTracks: metadata.totalTracks,
          validTracks: metadata.validTracks,
          rawDuration: duration,
          formattedDuration: formatDuration(duration),
          detailedDuration: formatDurationDetailed(duration),
        })

        if (!duration || duration <= 0) {
          console.warn(`Invalid duration received: ${duration}`)
          throw new Error("Invalid duration from Spotify API")
        }

        // Cache the result
        playlistCache.set(cacheKey, {
          duration,
          timestamp: Date.now(),
        })

        return duration
      } catch (error) {
        console.error(" Error fetching Spotify duration:", error)

        if (cached) {
          console.log(`Using expired cache for ${url}: ${formatDuration(cached.duration)}`)
          return cached.duration
        }

        const fallbackDuration = Math.floor(Math.random() * 3600000) + 2400000
        console.log(`🎲 Using fallback duration: ${formatDuration(fallbackDuration)}`)
        return fallbackDuration
      }
    }


    const mockDurations = {
      youtube: () => Math.floor(Math.random() * 4800000) + 1800000, 
      "apple music": () => Math.floor(Math.random() * 3000000) + 2700000, 
    }

    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

    const platformKey = platform?.toLowerCase()
    const durationGenerator = mockDurations[platformKey] || (() => Math.floor(Math.random() * 3600000) + 2400000)
    const mockDuration = durationGenerator()

    console.log(`Mock duration for ${platform}: ${formatDuration(mockDuration)}`)
    return mockDuration
  } catch (error) {
    console.error("Error calculating duration:", error)
    const defaultDuration = Math.floor(Math.random() * 3600000) + 1800000 
    console.log(`Default duration: ${formatDuration(defaultDuration)}`)
    return defaultDuration
  }
}

export const getTrackCount = async (platform, description, url) => {
  try {
    if (platform?.toLowerCase() === "spotify" && url) {
      const cacheKey = `tracks_${url}`
      const cached = playlistCache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(` Using cached track count for ${url}: ${cached.trackCount}`)
        return cached.trackCount
      }

      try {
        console.log(`🎵 Fetching real Spotify track count for: ${url}`)
        const metadata = await spotifyAPI.getPlaylistMetadata(url)
        const trackCount = metadata.validTracks

        console.log(`Spotify Track Count:`, {
          playlistName: metadata.name,
          totalTracks: metadata.totalTracks,
          validTracks: metadata.validTracks,
          unavailableTracks: metadata.totalTracks - metadata.validTracks,
        })

        if (!trackCount || trackCount <= 0) {
          console.warn(`⚠️ Invalid track count received: ${trackCount}`)
          throw new Error("Invalid track count from Spotify API")
        }

        playlistCache.set(cacheKey, {
          trackCount,
          timestamp: Date.now(),
        })

        return trackCount
      } catch (error) {
        console.error(" Error fetching Spotify track count:", error)

        if (cached) {
          console.log(` Using expired cache for ${url}: ${cached.trackCount}`)
          return cached.trackCount
        }

      }
    }

    const trackMatch = description?.match(/(\d+)\s*(tracks?|songs?)/i)
    if (trackMatch) {
      const count = Number.parseInt(trackMatch[1])
      console.log(`📝 Extracted track count from description: ${count}`)
      return count
    }

    const platformDefaults = {
      spotify: () => Math.floor(Math.random() * 30) + 15, 
      youtube: () => Math.floor(Math.random() * 25) + 10, 
      "apple music": () => Math.floor(Math.random() * 35) + 12, 
    }

    const platformKey = platform?.toLowerCase()
    const generator = platformDefaults[platformKey] || platformDefaults.spotify
    const mockCount = generator()

    console.log(`Mock track count for ${platform}: ${mockCount}`)
    return mockCount
  } catch (error) {
    console.error("Error getting track count:", error)
    const defaultCount = Math.floor(Math.random() * 30) + 15
    console.log(`Default track count: ${defaultCount}`)
    return defaultCount
  }
}

export const getMoodFromTags = (tags) => {
  const moodMap = {
    calming: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "🌊" },
    introspective: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: "🧘" },
    "heart-opening": { color: "bg-pink-100 text-pink-800 border-pink-200", icon: "💖" },
    ceremonial: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🕯️" },
    therapeutic: { color: "bg-green-100 text-green-800 border-green-200", icon: "🌿" },
    grounding: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: "🌱" },
    mystical: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: "✨" },
    transformative: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "🦋" },
    energizing: { color: "bg-red-100 text-red-800 border-red-200", icon: "⚡" },
    peaceful: { color: "bg-teal-100 text-teal-800 border-teal-200", icon: "☮️" },
  }

  return (
    tags?.map((tag) => {
      const key = tag.toLowerCase().replace(/\s+/g, "-")
      return {
        name: tag,
        style: moodMap[key] || { color: "bg-gray-100 text-gray-800 border-gray-200", icon: "🎵" },
      }
    }) || []
  )
}

export const debugDuration = (milliseconds) => {
  console.log("🔍 Duration Debug:", {
    input: milliseconds,
    inputType: typeof milliseconds,
    isValid: !isNaN(milliseconds) && milliseconds > 0,
    totalSeconds: Math.floor(milliseconds / 1000),
    totalMinutes: Math.round(milliseconds / (1000 * 60)),
    formatted: formatDuration(milliseconds),
    detailed: formatDurationDetailed(milliseconds),
  })
}

setInterval(() => {
  const now = Date.now()
  let cleared = 0
  for (const [key, value] of playlistCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      playlistCache.delete(key)
      cleared++
    }
  }
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries`)
  }
}, CACHE_DURATION)

export const getCache = () => playlistCache
export const clearCache = () => {
  playlistCache.clear()
  console.log("🧹 Cache cleared manually")
}
