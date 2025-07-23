// Predefined descriptions for different playlist themes
export const THEME_DESCRIPTIONS = {
    psychedelic: [
      "Journey through consciousness-expanding soundscapes designed to facilitate deep introspection and spiritual awakening. These carefully curated tracks create the perfect atmosphere for transformative experiences.",
      "Immerse yourself in ethereal melodies and otherworldly rhythms that guide you through inner exploration and heightened awareness. Perfect for meditation and consciousness expansion.",
      "Experience the profound healing power of psychedelic-inspired music that opens doorways to deeper understanding and emotional release through therapeutic sound journeys.",
    ],
    therapeutic: [
      "Discover healing frequencies and therapeutic tones specifically chosen to support emotional wellness, stress reduction, and holistic healing practices in clinical settings.",
      "Experience the transformative power of music therapy through carefully selected tracks that promote mental health, emotional balance, and psychological well-being.",
      "Immerse yourself in scientifically-backed sound healing that facilitates recovery, reduces anxiety, and supports overall mental and emotional health through music.",
    ],
    meditation: [
      "Find inner peace through tranquil soundscapes and gentle rhythms designed to deepen your meditation practice and enhance mindful awareness in daily life.",
      "Create a sacred space for contemplation with these serene melodies that guide you into states of deep relaxation and spiritual connection with your inner self.",
      "Experience profound stillness through carefully crafted ambient sounds that support various meditation techniques and promote lasting inner transformation.",
    ],
    ceremonial: [
      "Sacred sounds and ritualistic rhythms create a reverent atmosphere perfect for spiritual ceremonies, life transitions, and meaningful community gatherings.",
      "Honor sacred traditions through music that connects you to ancient wisdom and ceremonial practices, fostering deep spiritual connection and reverence.",
      "Experience the power of ritual through sound that bridges the physical and spiritual realms, creating space for transformation and sacred celebration.",
    ],
    energizing: [
      "Boost your vitality with uplifting beats and invigorating melodies designed to enhance motivation, creativity, and zest for life's adventures and challenges.",
      "Elevate your energy and mood through dynamic rhythms that inspire action, promote positivity, and fuel your passion for personal growth and achievement.",
      "Ignite your inner fire with powerful musical compositions that energize your spirit, enhance focus, and support peak performance in all areas of life.",
    ],
  }
  
  // Function to get a random description for a theme
  export const getThemeDescription = (theme, index = null) => {
    const descriptions = THEME_DESCRIPTIONS[theme] || THEME_DESCRIPTIONS.psychedelic
  
    if (index !== null && index < descriptions.length) {
      return descriptions[index]
    }
  
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }
  
  // Function to ensure consistent description length
  export const normalizeDescriptionLength = (description, targetLength = 120) => {
    if (!description) {
      return getThemeDescription("psychedelic")
    }
  
    // If too short, extend with relevant context
    if (description.length < targetLength) {
      const extensions = [
        " Perfect for deep meditation and self-reflection.",
        " Ideal for therapeutic sessions and healing work.",
        " Carefully crafted for transformative experiences.",
        " Designed to enhance spiritual journey and growth.",
        " Created to support mindful listening practices.",
        " Tailored for consciousness expansion sessions.",
        " Optimized for therapeutic sound healing work.",
        " Curated for profound inner exploration.",
      ]
  
      while (description.length < targetLength - 10) {
        const extension = extensions[Math.floor(Math.random() * extensions.length)]
        if (description.length + extension.length <= targetLength + 10) {
          description += extension
          break
        }
      }
    }
  
    // If too long, truncate properly
    if (description.length > targetLength + 10) {
      description = description.substring(0, targetLength)
      const lastSpace = description.lastIndexOf(" ")
      if (lastSpace > targetLength - 20) {
        description = description.substring(0, lastSpace)
      }
      description += "..."
    }
  
    return description
  }
  
  // Function to get mood-specific descriptions
  export const getMoodSpecificDescription = (tags) => {
    if (!tags || !Array.isArray(tags)) {
      return getThemeDescription("psychedelic")
    }
  
    const moodDescriptions = {
      calming:
        "Gentle waves of therapeutic sound wash over you, creating a serene atmosphere perfect for stress relief and deep relaxation. These tracks promote inner peace and emotional balance.",
      introspective:
        "Dive deep into your inner world with contemplative melodies that encourage profound self-reflection and mindful awareness. Perfect for meditation and soul-searching journeys.",
      "heart-opening":
        "Experience the transformative power of love and compassion through music that opens your heart to deeper emotional connections and facilitates healing of past wounds.",
      ceremonial:
        "Sacred sounds and ritualistic rhythms create a reverent atmosphere for spiritual ceremonies and meaningful life transitions. Honor the sacred through sound.",
      therapeutic:
        "Healing frequencies and therapeutic tones designed to support emotional wellness, trauma recovery, and holistic healing practices in clinical and personal settings.",
      grounding:
        "Earth-connected rhythms and natural sounds help you feel centered, stable, and deeply rooted in the present moment while releasing anxiety and stress.",
      mystical:
        "Ethereal soundscapes and otherworldly melodies transport you to higher dimensions of consciousness and facilitate profound spiritual awakening experiences.",
      transformative:
        "Powerful musical journeys that facilitate personal growth, breakthrough moments, and profound life changes through the therapeutic application of sound healing.",
      energizing:
        "Uplifting beats and invigorating melodies designed to boost your energy, enhance motivation, and inspire zest for life's adventures and creative pursuits.",
      peaceful:
        "Tranquil harmonies and gentle rhythms create a sanctuary of calm, promoting deep relaxation, inner stillness, and restoration of mental and emotional balance.",
    }
  
    // Find the first matching tag
    for (const tag of tags) {
      const key = tag.toLowerCase().replace(/\s+/g, "-")
      if (moodDescriptions[key]) {
        return moodDescriptions[key]
      }
    }
  
    return getThemeDescription("psychedelic")
  }
  