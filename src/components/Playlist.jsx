"use client"
import { useState, useEffect } from "react"
import {
  FaSpotify,
  FaYoutube,
  FaApple,
  FaMusic,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaList,
  FaPlay,
  FaExternalLinkAlt,
} from "react-icons/fa"
import {
  formatDuration,
  calculatePlaylistDuration,
  getTrackCount,
  getMoodFromTags,
} from "../utils/playlistUtils"
import {
  getThemeDescription,
  normalizeDescriptionLength,
  getMoodSpecificDescription,
} from "../utils/descriptionUtils"

const normalizePlatform = (platform) => {
  const map = {
    spotify: "Spotify",
    youtube: "YouTube",
    "apple music": "Apple Music",
    "external link": "External Link",
  }
  return map[platform?.toLowerCase()] || platform
}

const platformIcons = {
  Spotify: FaSpotify,
  YouTube: FaYoutube,
  "Apple Music": FaApple,
  "External Link": FaExternalLinkAlt,
}

const platformColors = {
  Spotify: "#1DB954",
  YouTube: "#FF0000",
  "Apple Music": "#000000",
  "External Link": "#6366f1",
  default: "#6b7280",
}

function getEmbedUrl(platform, url) {
  platform = normalizePlatform(platform)
  try {
    if (!url) return null
    if (platform === "Spotify") {
      return url.replace("/playlist/", "/embed/playlist/").replace("/album/", "/embed/album/")
    }
    if (platform === "YouTube") {
      const listId = new URL(url).searchParams.get("list")
      return listId ? `https://www.youtube.com/embed/videoseries?list=${listId}` : url.replace("watch?v=", "embed/")
    }
  } catch (e) {
    console.error("Invalid URL:", url)
  }
  return null
}

function PlaylistCard({ group }) {
  const { playlists, tags, description, thumbnail, creator } = group
  const [selected, setSelected] = useState(0)
  const current = playlists[selected]
  const [selectedEmbed, setSelectedEmbed] = useState(null)
  const [duration, setDuration] = useState(0)
  const [trackCount, setTrackCount] = useState(0)
  const [loadingDuration, setLoadingDuration] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [spotifyError, setSpotifyError] = useState(null)

  useEffect(() => {
    const embed = getEmbedUrl(current.platform, current.link)
    setSelectedEmbed(embed ? { platform: normalizePlatform(current.platform), url: embed } : null)
    setImageError(false)
  }, [selected, playlists])

  useEffect(() => {
    const loadPlaylistData = async () => {
      setLoadingDuration(true)
      setSpotifyError(null)

      try {
        const [calculatedDuration, calculatedTrackCount] = await Promise.all([
          calculatePlaylistDuration(current.id || `${group.id}-${selected}`, current.platform, current.link),
          getTrackCount(current.platform, current.description, current.link),
        ])

        setDuration(calculatedDuration)
        setTrackCount(calculatedTrackCount)

        if (current.platform?.toLowerCase() === "spotify") {
          console.log(`✅ Successfully loaded Spotify data for: ${current.title}`)
        }
      } catch (error) {
        console.error("Error loading playlist data:", error)

        if (current.platform?.toLowerCase() === "spotify") {
          setSpotifyError("Failed to load Spotify data")
        }

        setDuration(Math.floor(Math.random() * 3600000) + 1800000)
        setTrackCount(Math.floor(Math.random() * 30) + 15)
      } finally {
        setLoadingDuration(false)
      }
    }

    loadPlaylistData()
  }, [current, group.id, selected])

  const normalizedPlatform = normalizePlatform(current.platform)
  const Icon = platformIcons[normalizedPlatform] || FaMusic
  const platformColor = platformColors[normalizedPlatform] || platformColors.default

  const baseDescription = current.description || description
  const moodBasedDescription = getMoodSpecificDescription(tags) || baseDescription || getThemeDescription("psychedelic")
  const finalDescription = normalizeDescriptionLength(moodBasedDescription, 120)

  const handleNext = () => setSelected((prev) => (prev + 1) % playlists.length)
  const handlePrev = () => setSelected((prev) => (prev - 1 + playlists.length) % playlists.length)

  return (
    <div className="flex flex-col justify-between bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1 w-full max-w-sm sm:max-w-none mx-auto min-w-0 sm:min-w-[380px]">
      <div className="flex-1 flex flex-col">
        {/* Tags */}
   <div className="p-3 sm:p-5 flex items-start flex-shrink-0">
  <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full max-h-20 overflow-y-auto">
    {getMoodFromTags(tags).map((tag, idx) => (
      <span
        key={idx}
        className={`inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${tag.style.color} flex-shrink-0 shadow-sm`}
        title={tag.name}
      >
        <span className="text-xs sm:text-sm">{tag.style.icon}</span>
        <span className="truncate max-w-[60px] sm:max-w-[100px]">{tag.name}</span>
      </span>
    ))}
  </div>
</div>

        {/* Title and Platform */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4 h-20 sm:h-15 flex-shrink-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight mb-1 sm:mb-2 line-clamp-2" title={current.title}>
                {current.title}
              </h3>
              {creator && <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">by {creator}</p>}
            </div>
            <div
              className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center space-x-1.5 sm:space-x-2 text-white text-xs sm:text-sm font-bold flex-shrink-0 shadow-lg"
              style={{ backgroundColor: platformColor }}
            >
              <Icon className="text-xs sm:text-sm" />
              <span className="whitespace-nowrap hidden sm:inline">{normalizedPlatform}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4 h-8 sm:h-10 flex-shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 font-medium">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <FaList className="text-xs sm:text-sm text-gray-400" />
              <span>{trackCount} tracks</span>
              {current.platform?.toLowerCase() === "spotify" && !spotifyError && !loadingDuration && (
                <span className="text-green-500 text-xs" title="Real Spotify data">✓</span>
              )}
              {spotifyError && (
                <span className="text-red-500 text-xs" title={spotifyError}>⚠️</span>
              )}
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <FaClock className="text-xs sm:text-sm text-gray-400" />
              <span>
                {loadingDuration ? (
                  <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  formatDuration(duration)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Embed / Image */}
        <div className="relative mx-3 sm:mx-5 mb-3 sm:mb-5 rounded-lg sm:rounded-xl overflow-hidden shadow-inner h-32 sm:h-40 flex-shrink-0">
          {playlists.length > 1 && (
            <>
              <button onClick={handlePrev} className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 sm:p-2.5 rounded-full transition-all duration-200 shadow-lg hover:scale-110 touch-manipulation">
                <FaChevronLeft className="text-xs sm:text-sm" />
              </button>
              <button onClick={handleNext} className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 sm:p-2.5 rounded-full transition-all duration-200 shadow-lg hover:scale-110 touch-manipulation">
                <FaChevronRight className="text-xs sm:text-sm" />
              </button>
            </>
          )}
          <div className="w-full h-full">
            {selectedEmbed ? (
              <iframe
                src={selectedEmbed.url}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={current.title}
                className="w-full h-full rounded-lg sm:rounded-xl bg-white"
              />
            ) : thumbnail && !imageError ? (
              <div className="relative w-full h-full group/image bg-gray-200">
                <img
                  src={thumbnail || "/placeholder.svg"}
                  alt={current.title}
                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center rounded-lg sm:rounded-xl" style={{ backgroundColor: platformColor }}>
                <Icon className="text-white text-3xl sm:text-4xl mb-2 sm:mb-3" />
                <span className="text-white text-sm sm:text-base font-bold mb-1">{normalizedPlatform}</span>
                <span className="text-white/90 text-xs sm:text-sm">Click to explore</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-3 sm:px-5 h-24 sm:h-28 flex flex-col justify-start flex-shrink-0">
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-4 text-justify">
              {finalDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="px-3 sm:px-5 pb-5 sm:pb-7">
        <a
          href={current.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-white font-bold px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 hover:opacity-90 active:scale-95 text-sm sm:text-base shadow-lg hover:shadow-xl block touch-manipulation"
          style={{ backgroundColor: platformColor }}
        >
          <FaPlay className="text-sm sm:text-base" />
          <span>Play on {normalizedPlatform}</span>
        </a>
      </div>
    </div>
  )
}

function Playlist({ playlistGroups }) {
  if (!Array.isArray(playlistGroups)) return null

  return (
    <div className="min-h-screen p-5 sm:p-9">
      <div className="max-w-7xl sm:max-w-8xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-10 sm:gap-12">
          {playlistGroups.map((group, idx) => (
            <PlaylistCard key={group.id || idx} group={group} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Playlist
