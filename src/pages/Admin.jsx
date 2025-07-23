
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FaPlus, FaTrash } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Papa from 'papaparse';
import Modal from 'react-modal';

function Admin() {
  const [creator, setCreator] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['']);
  const [access, setAccess] = useState('free');
  const [playlists, setPlaylists] = useState([
    { title: '', description: '', platform: '', link: '' }
  ]);
  const [thumbnail, setThumbnail] = useState(null);
  const [message, setMessage] = useState(null);
  const [csvPlaylists, setCsvPlaylists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileMode, setFileMode] = useState(false);
  const [importedPlaylists, setImportedPlaylists] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleAddTag = () => setTags([...tags, '']);
  const handleRemoveTag = (index) => setTags(tags.filter((_, i) => i !== index));
  const handleTagChange = (value, index) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };

  const handleAddPlaylist = () => {
    setPlaylists([...playlists, { title: '', description: '', platform: '', link: '' }]);
  };

  const handleRemovePlaylist = (index) => {
    setPlaylists(playlists.filter((_, i) => i !== index));
  };

  const handlePlaylistChange = (index, field, value) => {
    const updated = [...playlists];
    updated[index][field] = value;
    setPlaylists(updated);
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const storage = getStorage();
    const storageRef = ref(storage, `thumbnails/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null, console.error, () => {
      getDownloadURL(uploadTask.snapshot.ref).then(setThumbnail);
    });
  };

  const handleCsvUpload = (e) => {
    setMessage(null);
    const file = e.target.files[0];
    if (!file) return;
    setFileMode(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPlaylists(results.data);
        setShowModal(true);
      },
    });
  };

  // Advanced tag and description generation system
  const PSYCHEDELIC_TAGS = [
    'psychedelic', 'consciousness', 'awakening', 'transformation', 'healing',
    'spiritual', 'mystical', 'transcendental', 'ethereal', 'cosmic',
    'introspective', 'meditative', 'therapeutic', 'ceremonial', 'sacred',
    'journey', 'exploration', 'inner-work', 'mindfulness', 'awareness',
    'expansion', 'enlightenment', 'soul-healing', 'energy-work', 'vibration',
    'frequency', 'sound-healing', 'ambient', 'downtempo', 'experimental',
    'electronic', 'organic', 'natural', 'grounding', 'heart-opening',
    'calming', 'energizing', 'transformative', 'peaceful', 'uplifting'
  ];

  const THEME_DESCRIPTIONS = {
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
  };

  function generateTagsFromTitle(title, platform) {
    const titleWords = title.toLowerCase().split(/\s+/);
    
    // Find matching psychedelic/therapeutic tags from title
    const matchedTags = PSYCHEDELIC_TAGS.filter(tag => 
      titleWords.some(word => word.includes(tag) || tag.includes(word) || 
        word.includes(tag.split('-')[0]) || tag.includes(word))
    );

    // Add platform as a tag if it's relevant
    const platformTag = platform.toLowerCase();
    let finalTags = [...matchedTags];
    
    // Add some contextual tags based on title analysis
    if (titleWords.some(word => ['healing', 'therapy', 'medicine', 'recovery'].includes(word))) {
      finalTags.push('therapeutic', 'healing', 'wellness');
    }
    if (titleWords.some(word => ['meditation', 'mindful', 'zen', 'peace'].includes(word))) {
      finalTags.push('meditative', 'peaceful', 'mindfulness');
    }
    if (titleWords.some(word => ['ceremony', 'ritual', 'sacred', 'spiritual'].includes(word))) {
      finalTags.push('ceremonial', 'sacred', 'spiritual');
    }
    if (titleWords.some(word => ['energy', 'power', 'boost', 'active'].includes(word))) {
      finalTags.push('energizing', 'uplifting', 'transformative');
    }
    
    // Add some random relevant tags if not enough matches
    if (finalTags.length < 4) {
      const remainingTags = PSYCHEDELIC_TAGS.filter(tag => !finalTags.includes(tag));
      const randomTags = remainingTags.sort(() => 0.5 - Math.random()).slice(0, 6 - finalTags.length);
      finalTags.push(...randomTags);
    }

    // Remove duplicates and return max 6 tags
    return [...new Set(finalTags)].slice(0, 6);
  }

  function generateDescriptionFromTitle(title, platform) {
    const titleWords = title.toLowerCase().split(/\s+/);
    
    // Determine theme based on title analysis
    let theme = 'psychedelic'; // default
    
    if (titleWords.some(word => ['healing', 'therapy', 'medicine', 'recovery', 'wellness'].includes(word))) {
      theme = 'therapeutic';
    } else if (titleWords.some(word => ['meditation', 'mindful', 'zen', 'peace', 'calm'].includes(word))) {
      theme = 'meditation';
    } else if (titleWords.some(word => ['ceremony', 'ritual', 'sacred', 'spiritual', 'divine'].includes(word))) {
      theme = 'ceremonial';
    } else if (titleWords.some(word => ['energy', 'power', 'boost', 'active', 'dance', 'movement'].includes(word))) {
      theme = 'energizing';
    }
    
    // Get theme-specific description
    const descriptions = THEME_DESCRIPTIONS[theme];
    let description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Normalize description length (120-180 characters)
    if (description.length < 120) {
      const extensions = [
        " Perfect for deep meditation and self-reflection.",
        " Ideal for therapeutic sessions and healing work.",
        " Carefully crafted for transformative experiences.",
        " Designed to enhance spiritual journey and growth.",
        " Created to support mindful listening practices.",
        " Tailored for consciousness expansion sessions.",
        " Optimized for therapeutic sound healing work.",
        " Curated for profound inner exploration.",
      ];
      
      const extension = extensions[Math.floor(Math.random() * extensions.length)];
      if (description.length + extension.length <= 180) {
        description += extension;
      }
    }
    
    // If too long, truncate properly
    if (description.length > 180) {
      description = description.substring(0, 170);
      const lastSpace = description.lastIndexOf(' ');
      if (lastSpace > 150) {
        description = description.substring(0, lastSpace);
      }
      description += '...';
    }
    
    return description;
  }

  const handleConfirmUpload = async () => {
    setUploading(true);
    setMessage(null);

    try {
      // Set bulk upload as creator and description
      setCreator('Bulk Upload');
      setDescription(`Bulk uploaded playlists - ${new Date().toLocaleString()}`);
      
      // Generate playlists with auto-generated tags and descriptions
      const generatedPlaylists = csvPlaylists.map(row => {
        const { Name, Platform, 'Playlist Time': playlistTime, 'Platform Link': link } = row;
        const autoTags = generateTagsFromTitle(Name, Platform);
        const autoDescription = generateDescriptionFromTitle(Name, Platform);
        
        return {
          title: Name,
          description: autoDescription,
          platform: Platform,
          link: link,
          playlistTime // keep original data if needed
        };
      });

      // Set the generated playlists to the form
      setPlaylists(generatedPlaylists);
      
      // Generate tags from all playlists
      const allTags = csvPlaylists.flatMap(row => 
        generateTagsFromTitle(row.Name, row.Platform)
      );
      const uniqueTags = [...new Set(allTags)].slice(0, 8); // Get unique tags, max 8
      setTags(uniqueTags);

      // Close modal and show success message
      setShowModal(false);
      setMessage('✅ CSV data loaded successfully! Review and click Submit to save.');
      
    } catch (error) {
      setMessage(`❌ Failed to process CSV data: ${error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setShowModal(false);
    setCsvPlaylists([]);
    setFileMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!creator.trim() || !description.trim()) {
      setMessage('Creator and description are required.');
      return;
    }

    const cleanedPlaylists = playlists.map(p => ({
      title: p.title,
      description: p.description,
      platform: p.platform,
      link: p.link
    }));

    try {
      await addDoc(collection(db, 'playlistGroups'), {
        creator,
        description,
        tags: tags.filter(Boolean),
        thumbnail,
        access,
        playlists: cleanedPlaylists,
        createdAt: new Date()
      });

      setMessage('✅ Playlist group added successfully');
      setCreator('');
      setDescription('');
      setTags(['']);
      setAccess('free');
      setPlaylists([{ title: '', description: '', platform: '', link: '' }]);
      setThumbnail(null);
      setFileMode(false);
      setCsvPlaylists([]);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to add playlist group.');
    }
  };

  // Handler for one-click import
  const handleImportPlaylists = async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await fetch('/api/import-playlists');
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      setImportedPlaylists(data.playlists || []);
      setShowImportModal(true);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Handler to confirm import and load into form for review
  const handleConfirmImport = () => {
    // Set creator and description for bulk import
    setCreator('Bulk Upload');
    setDescription(`Bulk uploaded playlists - ${new Date().toLocaleString()}`);

    // Generate tags from all imported playlists
    const allTags = importedPlaylists.flatMap(row =>
      generateTagsFromTitle(row.title, row.platform || '')
    );
    const uniqueTags = [...new Set(allTags)].slice(0, 8); // Get unique tags, max 8
    setTags(uniqueTags.length > 0 ? uniqueTags : ['']);

    setPlaylists(importedPlaylists.map(p => ({
      title: p.title,
      description: p.description,
      platform: p.platform,
      link: p.link
    })));
    setShowImportModal(false);
    setMessage('✅ Imported playlists loaded into form! Review and click Submit to save.');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Add Playlist Group</h1>
        {/* One-click import button */}
        <button onClick={handleImportPlaylists} className="mb-4 bg-black  text-white px-4 py-2 rounded disabled:opacity-60" disabled={importLoading}>
          {importLoading ? 'Importing...' : 'Import Playlists'}
        </button>
        {importError && <p className="text-red-600 mb-2">{importError}</p>}
        {/* Always show the form (removed fileMode condition) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="Creator Name"
            className="w-full border rounded px-3 py-2"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Group Description"
            className="w-full border rounded px-3 py-2"
            required
          />

          {tags.map((tag, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={tag}
                placeholder='Tag (e.g. "LSD", "Ambient","Ketamine")'
                onChange={(e) => handleTagChange(e.target.value, idx)}
                className="border rounded px-3 py-2 flex-1"
              />
              {tags.length > 1 && (
                <button type="button" onClick={() => handleRemoveTag(idx)}>
                  <FaTrash />
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={handleAddTag} className="text-blue-600 flex items-center gap-2">
            <FaPlus /> Add Tag
          </button>

          {/* ACCESS LEVEL (free or paid) */}
          <select
            value={access}
            onChange={(e) => setAccess(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          {playlists.map((playlist, idx) => (
            <div key={idx} className="border p-4 rounded mb-4 space-y-3">
              <input
                value={playlist.title}
                onChange={(e) => handlePlaylistChange(idx, 'title', e.target.value)}
                placeholder="Playlist Title"
                className="w-full border rounded px-3 py-2"
                required
              />
              <textarea
                value={playlist.description}
                onChange={(e) => handlePlaylistChange(idx, 'description', e.target.value)}
                placeholder="Playlist Description"
                className="w-full border rounded px-3 py-2"
              />
              <input
                value={playlist.platform}
                onChange={(e) => handlePlaylistChange(idx, 'platform', e.target.value)}
                placeholder="Platform (e.g. Spotify)"
                className="w-full border rounded px-3 py-2"
              />
              <input
                value={playlist.link}
                onChange={(e) => handlePlaylistChange(idx, 'link', e.target.value)}
                placeholder="Platform Link"
                className="w-full border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={() => handleRemovePlaylist(idx)}
                className="text-red-600"
              >
                Remove Playlist
              </button>
            </div>
          ))}

          <button type="button" onClick={handleAddPlaylist} className="text-blue-600 flex items-center gap-2">
            <FaPlus /> Add Playlist
          </button>

          {/* File inputs */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <label className="flex flex-col text-sm font-medium">
              <span className="mb-1">Bulk Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="border rounded px-3 py-2" />
            </label>
            <label className="flex flex-col text-sm font-medium">
              <span className="mb-1">Thumbnail Image</span>
              <input type="file" onChange={handleThumbnailUpload} className="border rounded px-3 py-2" />
            </label>
          </div>

          <button type="submit" className="bg-black text-white px-4 py-2 rounded">
            Submit
          </button>
        </form>

        {/* Modal for confirming CSV playlists upload */}
        <Modal isOpen={showModal} onRequestClose={handleCancelUpload} ariaHideApp={false} style={{content: {maxWidth: 600, margin: 'auto', borderRadius: 12, padding: 32}}}>
          <h2 className="text-xl font-bold mb-4">Confirm Bulk Upload</h2>
          <p className="mb-4">{csvPlaylists.length} playlists will be loaded into the form. Tags and descriptions will be auto-generated.</p>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Platform</th>
                  <th className="px-3 py-2 text-left">Link</th>
                </tr>
              </thead>
              <tbody>
                {csvPlaylists.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{row.Name}</td>
                    <td className="px-3 py-2">{row.Platform}</td>
                    <td className="px-3 py-2 break-all"><a href={row['Platform Link']} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{row['Platform Link']}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={handleCancelUpload} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100">Cancel</button>
            <button 
              onClick={handleConfirmUpload} 
              disabled={uploading} 
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {uploading ? 'Loading...' : 'Load into Form'}
            </button>
          </div>
        </Modal>

        {/* Import preview modal */}
        <Modal isOpen={showImportModal} onRequestClose={() => setShowImportModal(false)} ariaHideApp={false} style={{content: {maxWidth: 800, margin: 'auto', borderRadius: 16, padding: 40, minHeight: 400}}}>
          <h2 className="text-2xl font-bold mb-6 text-center">Preview Imported Playlists</h2>
          <p className="mb-6 text-gray-700 text-center">Review the playlists below. Click "Load into Form" to submit them, or Cancel to discard.</p>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Platform</th>
                  <th className="px-3 py-2 text-left">Link</th>
                </tr>
              </thead>
              <tbody>
                {importedPlaylists.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2 max-w-xs truncate" title={row.title}>{row.title}</td>
                    <td className="px-3 py-2">{row.platform || ''}</td>
                    <td className="px-3 py-2 break-all">
                      {row.link ? (
                        <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{row.link}</a>
                      ) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100">Cancel</button>
            <button onClick={handleConfirmImport} disabled={uploading} className="bg-black text-white px-6 py-2 rounded disabled:opacity-60 font-semibold text-lg">
              {uploading ? 'Loading...' : 'Load into Form'}
            </button>
          </div>
        </Modal>

        {/* Show success or error message */}
        {message && (
          <p className={`mt-4 text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default Admin;