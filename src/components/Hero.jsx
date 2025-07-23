import React from 'react';
import { FaSpotify, FaYoutube, FaApple } from 'react-icons/fa';
import { motion } from 'framer-motion';

function Hero() {
  return (
    <section className="py-2">
      <div className="w-full max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center min-h-[60vh]">
        
        {/* Left: Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col justify-center text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-europa font-bold text-black leading-tight">
            Curated Playlists for Psychedelic Journeys
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
            Explore music designed for healing, creativity, and inner exploration — from clinical studies to deep personal journeys.
          </p>

          {/* Platform Icons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 flex items-center justify-center md:justify-start space-x-5 text-2xl text-gray-700"
            aria-label="Streaming platforms"
          >
            <FaSpotify className="text-green-500" title="Spotify" />
            <FaYoutube className="text-red-500" title="YouTube" />
            <FaApple className="text-gray-700" title="Apple Music" />
          </motion.div>
        </motion.div>

        {/* Right: Image */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="flex justify-center md:justify-end"
        >
          <img
            src="/hero-image.jpg"
            alt="Foggy mountain landscape — moody and introspective"
            className="max-w-xs md:max-w-sm lg:max-w-md rounded-xl shadow-xl border border-gray-200"
          />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
