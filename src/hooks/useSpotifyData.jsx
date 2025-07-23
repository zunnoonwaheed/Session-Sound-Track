"use client"

import { useState, useEffect, useCallback } from "react"
import { spotifyAPI } from "../services/spotifyApi"

export function useSpotifyData(url, platform) {
  const [data, setData] = useState({
    duration: 0,
    trackCount: 0,
    loading: true,
    error: null,
    metadata: null,
    retryCount: 0,
  })

  const fetchData = useCallback(
    async (isRetry = false) => {
      if (platform?.toLowerCase() !== "spotify" || !url) {
        setData((prev) => ({ ...prev, loading: false }))
        return
      }

      if (!isRetry) {
        setData((prev) => ({ ...prev, loading: true, error: null }))
      }

      try {
        console.log(`🎵 Fetching Spotify data for: ${url}`)
        const metadata = await spotifyAPI.getPlaylistMetadata(url)

        setData({
          duration: metadata.totalDuration,
          trackCount: metadata.validTracks,
          loading: false,
          error: null,
          metadata,
          retryCount: 0,
        })
      } catch (error) {
        console.error("❌ Error fetching Spotify data:", error)

        const errorMessage = error.message.includes("private")
          ? "This playlist is private or unavailable"
          : error.message.includes("not found")
            ? "Playlist not found"
            : error.message.includes("credentials")
              ? "Spotify API authentication failed"
              : "Failed to load playlist data"

        setData((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          retryCount: prev.retryCount + 1,
        }))
      }
    },
    [url, platform],
  )

  const retry = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, refetch: fetchData, retry }
}
