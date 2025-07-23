// src/pages/Learn.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Learn() {
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const subbed = localStorage.getItem('isSubscribed');
    setIsSubscribed(subbed === 'true');

    const fetchVideos = async () => {
      const snapshot = await getDocs(collection(db, 'learnVideos'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => a.position - b.position);
      setVideos(sorted);
      if (sorted.length > 0) setSelected(sorted[0]);
    };

    fetchVideos();
  }, []);

  const handleClick = (video) => {
    if (!isSubscribed && video.position !== 1) {
      navigate('/subscription');
      return;
    }
    setSelected(video);
  };

  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar menu */}
        <aside className="w-64 bg-white border-r overflow-y-auto sticky top-0 h-full p-6">
          <h2 className="text-lg font-semibold mb-4">Chapters</h2>
          {videos.length === 0 ? (
            <p className="text-gray-500 text-sm">No lessons available yet.</p>
          ) : (
            <ul className="space-y-4">
              {videos.map((video) => {
                const locked = !isSubscribed && video.position !== 1;
                return (
                  <li
                    key={video.id}
                    onClick={() => handleClick(video)}
                    className={`p-3 rounded-md border transition cursor-pointer ${selected?.id === video.id ? 'bg-gray-100 border-black' : 'border-gray-200'} ${locked ? 'opacity-50 hover:opacity-70' : 'hover:bg-gray-100'}`}
                  >
                    <h3 className="font-medium text-sm text-gray-900">{video.title}</h3>
                    <p className="text-xs text-gray-500">{video.duration || ''}</p>
                    {locked && (
                      <p className="text-[11px] text-red-500 mt-1 underline">🔒 Subscribe to unlock</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main video section */}
        <section className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {selected ? (
              <>
                <div className="aspect-video mb-6">
                  <iframe
                    src={selected.vimeoUrl}
                    title={selected.title}
                    className="w-full h-full rounded-md"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  ></iframe>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{selected.title}</h1>
                <p className="text-sm text-gray-500 mb-2">{selected.duration || ''}</p>
                <p className="text-gray-700 text-base leading-relaxed">{selected.description}</p>
              </>
            ) : (
              <p className="text-gray-600 text-center text-lg">No content to display.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default Learn;