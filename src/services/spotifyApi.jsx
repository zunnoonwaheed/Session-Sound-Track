class SpotifyAPI {
    constructor() {
      this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "3eef5118d0c94a449f266e8dccc0f766"
      this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
      this.accessToken = null
      this.tokenExpiry = null
    }
  
    async getAccessToken() {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken
      }
  
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
          },
          body: "grant_type=client_credentials",
        })
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Spotify API Error: ${response.status} - ${errorData.error_description || response.statusText}`)
        }
  
        const data = await response.json()
        this.accessToken = data.access_token
        this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000
  
        console.log("Spotify access token obtained successfully")
        return this.accessToken
      } catch (error) {
        console.error("Error getting Spotify access token:", error)
        throw error
      }
    }
  
    extractPlaylistId(url) {
      if (!url) return null
  
      const patterns = [
        /spotify:playlist:([a-zA-Z0-9]+)/,
        /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
        /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
        /playlist\/([a-zA-Z0-9]+)/,
      ]
  
      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
      }
  
      return null
    }
  
    async getPlaylistDetails(playlistId) {
      try {
        const token = await this.getAccessToken()
  
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Playlist not found or is private")
          }
          if (response.status === 401) {
            throw new Error("Authentication failed - check your Spotify credentials")
          }
          if (response.status === 403) {
            throw new Error("Access forbidden - playlist may be private")
          }
          throw new Error(`Spotify API Error: ${response.status}`)
        }
  
        const data = await response.json()
        return data
      } catch (error) {
        console.error("Error fetching playlist details:", error)
        throw error
      }
    }
  
    async getPlaylistTracks(playlistId, limit = 50, offset = 0) {
      try {
        const token = await this.getAccessToken()
  
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=total,items(track(duration_ms,name,artists(name),id,type))`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
  
        if (!response.ok) {
          throw new Error(`Spotify API Error: ${response.status}`)
        }
  
        return await response.json()
      } catch (error) {
        console.error("Error fetching playlist tracks:", error)
        throw error
      }
    }
  
    async getAllPlaylistTracks(playlistId) {
      try {
        const allTracks = []
        let offset = 0
        const limit = 50
        let hasMore = true
        let totalTracks = 0
  
        console.log(`🎵 Fetching all tracks for playlist ${playlistId}...`)
  
        while (hasMore) {
          const response = await this.getPlaylistTracks(playlistId, limit, offset)
  
          if (response.items) {
            allTracks.push(...response.items)
            totalTracks = response.total
          }
  
          hasMore = response.items && response.items.length === limit && offset + limit < totalTracks
          offset += limit
  
          if (offset > 10000) {
            console.warn("Reached maximum track limit for playlist")
            break
          }
  
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
  
        console.log(`Fetched ${allTracks.length} tracks total`)
        return allTracks
      } catch (error) {
        console.error("Error fetching all playlist tracks:", error)
        throw error
      }
    }
  
    async getPlaylistMetadata(playlistUrl) {
      try {
        const playlistId = this.extractPlaylistId(playlistUrl)
  
        if (!playlistId) {
          throw new Error("Invalid Spotify playlist URL")
        }
  
        console.log(`🔍 Processing playlist ID: ${playlistId}`)
  
        const [playlistDetails, tracks] = await Promise.all([
          this.getPlaylistDetails(playlistId),
          this.getAllPlaylistTracks(playlistId),
        ])
  
        let totalDuration = 0
        let validTrackCount = 0
        let invalidTrackCount = 0
  
        tracks.forEach((item, index) => {
          if (item.track && item.track.duration_ms) {
            totalDuration += item.track.duration_ms
            validTrackCount++
          } else {
            invalidTrackCount++
            console.log(`⚠️ Track ${index + 1} missing duration:`, {
              name: item.track?.name || "Unknown",
              type: item.track?.type || "Unknown",
              hasTrack: !!item.track,
              hasDuration: !!item.track?.duration_ms,
            })
          }
        })
  
        console.log(`📊 Duration Calculation Summary:`, {
          totalTracks: tracks.length,
          validTracks: validTrackCount,
          invalidTracks: invalidTrackCount,
          totalDurationMs: totalDuration,
          totalDurationMinutes: Math.round(totalDuration / (1000 * 60)),
          averageTrackDuration: validTrackCount > 0 ? Math.round(totalDuration / validTrackCount / 1000) : 0,
        })
  
        const metadata = {
          id: playlistId,
          name: playlistDetails.name,
          description: playlistDetails.description,
          totalTracks: playlistDetails.tracks.total,
          validTracks: validTrackCount,
          totalDuration: totalDuration,
          thumbnail: playlistDetails.images?.[0]?.url,
          owner: playlistDetails.owner?.display_name,
          isPublic: playlistDetails.public,
          followers: playlistDetails.followers?.total,
          url: playlistUrl,
        }
  
        console.log(`Playlist metadata processed:`, {
          name: metadata.name,
          tracks: metadata.validTracks,
          durationMs: metadata.totalDuration,
          durationMinutes: Math.round(metadata.totalDuration / (1000 * 60)),
        })
  
        return metadata
      } catch (error) {
        console.error("Error getting playlist metadata:", error)
        throw error
      }
    }
  }
  
  export const spotifyAPI = new SpotifyAPI()
  