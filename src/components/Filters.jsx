import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const fallbackCategories = {
  Substance: ['Psilocybin', 'LSD', 'MDMA', 'Ketamine', 'DMT', '2C-B', 'Ayahuasca'],
  Genres: ['Ambient', 'Neo-Classical', 'Classical', 'World', 'Indigenous', 'Psychedelic Rock', 'Electronic', 'Nature Sounds', 'Experimental', 'Folk'],
  Platforms: ['Spotify', 'YouTube', 'SoundCloud', 'Apple Music', 'External Link'],
  'Use Context': ['Recreational', 'Therapeutic', 'Clinical Study Use'],
  'Special Tags': ['⭐ Recommended', '🔥 Editor’s Pick / Curator’s Choice']
};

const categoryOrder = ['Substance', 'Genres', 'Platforms', 'Use Context', 'Special Tags'];

const tagIcons = {
  Substance: '🧠',
  Genres: '🎵',
  Platforms: '📡',
  'Use Context': '🧘',
  'Special Tags': '⭐'
};

const tagColors = {
  Substance: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  Genres: 'bg-green-100 text-green-800 border border-green-200',
  Platforms: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Use Context': 'bg-pink-100 text-pink-800 border border-pink-200',
  'Special Tags': 'bg-orange-100 text-orange-800 border border-orange-200'
};

function Filters({ selected, onChange }) {
  const [filterCategories, setFilterCategories] = useState(fallbackCategories);
  const [expanded, setExpanded] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [atTop, setAtTop] = useState(false);
  const sectionRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'filters'));
        const data = snapshot.docs.map(doc => doc.data());
        const grouped = data.reduce((acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr.tag);
          return acc;
        }, {});
        setFilterCategories(grouped);
      } catch (err) {
        console.error('Failed to fetch filters, using fallback.', err);
        setFilterCategories(fallbackCategories);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const { top } = sectionRef.current.getBoundingClientRect();
        setAtTop(top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 1.0, rootMargin: '0px 0px -1px 0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleTag = (tag) => {
    setHasInteracted(true);
    const newTags = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(newTags);
  };

  const toggleCategory = (category) => {
    setHasInteracted(true);
    setExpanded((prev) => {
      const isOpen = prev[category];
      const newState = {};
      Object.keys(filterCategories).forEach((key) => (newState[key] = false));
      newState[category] = !isOpen;
      return newState;
    });
  };

  const getColorClass = (category) => tagColors[category] || 'bg-gray-100 text-gray-800 border border-gray-300';
  const getIcon = (category) => tagIcons[category] || '';
  const fullyExpanded = hasInteracted || isSticky || atTop;

  return (
    <motion.section
      ref={sectionRef}
      initial={{ borderRadius: '1rem', backgroundColor: '#ffffff', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' }}
      animate={{
        borderRadius: fullyExpanded ? '0rem' : '1rem',
        backgroundColor: fullyExpanded ? '#fffef4' : '#ffffff',
        width: fullyExpanded ? '100%' : 'fit-content',
        marginLeft: fullyExpanded ? '0' : 'auto',
        marginRight: fullyExpanded ? '0' : 'auto',
        transition: { duration: 0.5, ease: 'easeInOut' }
      }}
      className="sticky top-0 z-40 border-b border-gray-200 shadow-lg"
    >
      <motion.div
        ref={containerRef}
        layout
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="max-w-7xl mx-auto px-4 py-3"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Filter Playlists</h2>

        {selected.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <div className="flex flex-wrap gap-2 items-center">
              {selected.map((tag) => {
                const parent = Object.entries(filterCategories).find(([_, tags]) => tags.includes(tag))?.[0];
                return (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${getColorClass(parent)}`}
                  >
                    {getIcon(parent)} {tag}
                    <button onClick={() => toggleTag(tag)} className="ml-1 text-xs">✕</button>
                  </span>
                );
              })}
              <button
                onClick={() => onChange([])}
                className="ml-2 px-3 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Reset All
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3 mb-5 overflow-x-auto">
          {categoryOrder
            .filter((category) => filterCategories[category])
            .map((category) => {
              const isOpen = expanded[category];
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                    isOpen
                      ? getColorClass(category)
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {getIcon(category)} {category}
                </button>
              );
            })}
        </div>

        <AnimatePresence mode="wait">
          {categoryOrder
            .filter((category) => filterCategories[category])
            .map((category) =>
              expanded[category] ? (
                <motion.div
                  key={category}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-wrap gap-2">
                    {filterCategories[category].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs border transition ${
                          selected.includes(tag)
                            ? getColorClass(category)
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null
            )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}

export default Filters;
