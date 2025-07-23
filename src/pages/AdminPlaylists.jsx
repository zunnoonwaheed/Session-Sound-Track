import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FaTrash, FaEdit, FaPlus, FaTrashAlt } from 'react-icons/fa';

function AdminPlaylists() {
  const [playlistGroups, setPlaylistGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    creator: '',
    description: '',
    access: 'free',
    tags: [''],
    playlists: [{ title: '', description: '', platform: '', link: '' }]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'playlistGroups'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlaylistGroups(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this playlist group?')) return;
    try {
      await deleteDoc(doc(db, 'playlistGroups', id));
      setPlaylistGroups(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const openEditModal = (group) => {
    setEditingId(group.id);
    setEditData({
      creator: group.creator || '',
      description: group.description || '',
      access: group.access || 'free',
      tags: group.tags || [''],
      playlists: group.playlists || []
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagChange = (idx, value) => {
    const updated = [...editData.tags];
    updated[idx] = value;
    setEditData(prev => ({ ...prev, tags: updated }));
  };

  const handleAddTag = () => {
    setEditData(prev => ({ ...prev, tags: [...prev.tags, ''] }));
  };

  const handleRemoveTag = (idx) => {
    const updated = [...editData.tags];
    updated.splice(idx, 1);
    setEditData(prev => ({ ...prev, tags: updated }));
  };

  const handlePlaylistChange = (idx, field, value) => {
    const updated = [...editData.playlists];
    updated[idx][field] = value;
    setEditData(prev => ({ ...prev, playlists: updated }));
  };

  const handleAddPlaylist = () => {
    setEditData(prev => ({
      ...prev,
      playlists: [...prev.playlists, { title: '', description: '', platform: '', link: '' }]
    }));
  };

  const handleRemovePlaylist = (idx) => {
    const updated = [...editData.playlists];
    updated.splice(idx, 1);
    setEditData(prev => ({ ...prev, playlists: updated }));
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'playlistGroups', editingId);
      await updateDoc(docRef, {
        creator: editData.creator,
        description: editData.description,
        access: editData.access || 'free',
        tags: editData.tags.filter(Boolean),
        playlists: editData.playlists.filter(p => p.title && p.link)
      });

      setPlaylistGroups(prev =>
        prev.map(p =>
          p.id === editingId ? { ...p, ...editData, tags: editData.tags.filter(Boolean) } : p
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save. Check console.');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-4">Playlist Groups</h1>

        {loading ? (
          <p>Loading...</p>
        ) : playlistGroups.length === 0 ? (
          <p>No playlist groups found.</p>
        ) : (
          <table className="min-w-full text-center bg-white border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border-b">Creator</th>
                <th className="p-3 border-b">Tags</th>
                <th className="p-3 border-b">Playlists</th>
                <th className="p-3 border-b">Access</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {playlistGroups.map(group => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{group.creator}</td>
                  <td className="p-3 border-b">{(group.tags || []).join(', ')}</td>
                  <td className="p-3 border-b text-sm text-gray-700">
                    {group.playlists.map((pl, i) => (
                      <div key={i} className="mb-1">
                        <strong>{pl.title}</strong> — {pl.platform}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 border-b">{group.access || 'free'}</td>
                  <td className="p-3 border-b">
                    <button onClick={() => openEditModal(group)} className="text-blue-600 mr-3">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="text-red-600">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded max-w-2xl w-full overflow-y-auto max-h-[90vh] space-y-4">
              <h2 className="text-lg font-semibold">Edit Group</h2>

              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={editData.creator}
                onChange={(e) => handleEditChange('creator', e.target.value)}
                placeholder="Creator"
              />

              <textarea
                className="w-full border px-3 py-2 rounded"
                value={editData.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                placeholder="Description"
              />

              <select
                className="w-full border px-3 py-2 rounded"
                value={editData.access}
                onChange={(e) => handleEditChange('access', e.target.value)}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>

              <div>
                <label className="text-sm font-medium">Tags</label>
                {editData.tags.map((tag, idx) => (
                  <div key={idx} className="flex items-center gap-2 my-1">
                    <input
                      value={tag}
                      onChange={(e) => handleTagChange(idx, e.target.value)}
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <button onClick={() => handleRemoveTag(idx)} className="text-red-600">
                      <FaTrashAlt />
                    </button>
                  </div>
                ))}
                <button onClick={handleAddTag} className="text-blue-600 text-sm mt-2">
                  <FaPlus className="inline-block mr-1" /> Add Tag
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Playlists</label>
                {editData.playlists.map((pl, idx) => (
                  <div key={idx} className="border p-3 rounded mb-2 space-y-2">
                    <input
                      value={pl.title}
                      onChange={(e) => handlePlaylistChange(idx, 'title', e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Title"
                    />
                    <input
                      value={pl.platform}
                      onChange={(e) => handlePlaylistChange(idx, 'platform', e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Platform"
                    />
                    <input
                      value={pl.link}
                      onChange={(e) => handlePlaylistChange(idx, 'link', e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Link"
                    />
                    <textarea
                      value={pl.description}
                      onChange={(e) => handlePlaylistChange(idx, 'description', e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Description"
                    />
                    {editData.playlists.length > 1 && (
                      <button onClick={() => handleRemovePlaylist(idx)} className="text-red-600 text-sm mt-2">
                        <FaTrashAlt /> Remove
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={handleAddPlaylist} className="text-blue-600 text-sm mt-2">
                  <FaPlus className="inline-block mr-1" /> Add Playlist
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPlaylists;
