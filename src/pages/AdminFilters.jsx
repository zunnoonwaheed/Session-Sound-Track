import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { FaTrash, FaPlus } from 'react-icons/fa';

function AdminFilters() {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');

  const categories = [
    'Substance',
    'Genres',
    'Platforms',
    'Use Context',
    'Special Tags',
  ];

  const defaultFilters = [
    { category: 'Substance', tag: 'Psilocybin' },
    { category: 'Substance', tag: 'LSD' },
    { category: 'Substance', tag: 'MDMA' },
    { category: 'Substance', tag: 'Ketamine' },
    { category: 'Substance', tag: 'DMT' },
    { category: 'Substance', tag: '2C-B' },
    { category: 'Substance', tag: 'Ayahuasca' },

    { category: 'Genres', tag: 'Ambient' },
    { category: 'Genres', tag: 'Neo-Classical' },
    { category: 'Genres', tag: 'Classical' },
    { category: 'Genres', tag: 'World' },
    { category: 'Genres', tag: 'Indigenous' },
    { category: 'Genres', tag: 'Psychedelic Rock' },
    { category: 'Genres', tag: 'Electronic' },
    { category: 'Genres', tag: 'Nature Sounds' },
    { category: 'Genres', tag: 'Experimental' },
    { category: 'Genres', tag: 'Folk' },

    { category: 'Platforms', tag: 'Spotify' },
    { category: 'Platforms', tag: 'YouTube' },
    { category: 'Platforms', tag: 'SoundCloud' },
    { category: 'Platforms', tag: 'Apple Music' },
    { category: 'Platforms', tag: 'External Link' },

    { category: 'Use Context', tag: 'Recreational' },
    { category: 'Use Context', tag: 'Therapeutic' },
    { category: 'Use Context', tag: 'Clinical Study Use' },

    { category: 'Special Tags', tag: '⭐ Recommended' },
    { category: 'Special Tags', tag: '🔥 Editor’s Pick / Curator’s Choice' },
  ];

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'filters'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!category || !tag) return;
    try {
      await addDoc(collection(db, 'filters'), { category, tag });
      setModalOpen(false);
      setCategory('');
      setTag('');
      fetchFilters();
    } catch (error) {
      console.error('Error adding filter:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this filter?')) return;
    try {
      await deleteDoc(doc(db, 'filters', id));
      setFilters(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const handleSeedFilters = async () => {
    setSeeding(true);
    try {
      const snapshot = await getDocs(collection(db, 'filters'));
      const deletes = snapshot.docs.map(docItem => deleteDoc(doc(db, 'filters', docItem.id)));
      await Promise.all(deletes);

      const adds = defaultFilters.map(f => addDoc(collection(db, 'filters'), f));
      await Promise.all(adds);

      await fetchFilters();
      setSeedModalOpen(false);
    } catch (error) {
      console.error('Seeding error:', error);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">All Filters</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              <FaPlus /> Add Filter
            </button>
            <button
              onClick={() => setSeedModalOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Seed Default Filters
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading filters...</p>
        ) : filters.length === 0 ? (
          <p>No filters found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3 border-b">Category</th>
                  <th className="p-3 border-b">Tag</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
  {Object.entries(
    filters.reduce((acc, cur) => {
      if (!acc[cur.category]) acc[cur.category] = [];
      acc[cur.category].push(cur);
      return acc;
    }, {})
  ).map(([category, items]) => (
    <React.Fragment key={category}>
      <tr className="bg-gray-50">
        <td colSpan={3} className="p-3 font-semibold text-gray-800 border-b">
          {category}
        </td>
      </tr>
      {items.map((filter) => (
        <tr key={filter.id} className="hover:bg-gray-50">
          <td className="p-3 border-b">{filter.category}</td>
          <td className="p-3 border-b">{filter.tag}</td>
          <td className="p-3 border-b">
            <button
              onClick={() => handleDelete(filter.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete Filter"
            >
              <FaTrash />
            </button>
          </td>
        </tr>
      ))}
    </React.Fragment>
  ))}
</tbody>

            </table>
          </div>
        )}

        {/* Add Filter Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleAdd}
              className="bg-white p-6 rounded-lg shadow-lg w-96"
            >
              <h2 className="text-lg font-semibold mb-4">Add New Filter</h2>

              <label className="block mb-2 text-sm font-medium">Category</label>
              <select
                className="w-full mb-4 p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <label className="block mb-2 text-sm font-medium">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full mb-4 p-2 border rounded"
                placeholder="e.g. Psilocybin"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Seed Modal */}
        {seedModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[95%] max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-red-600">Seed Default Filters</h2>
              <p className="text-gray-700 mb-4">
                This will <strong>delete all existing filters</strong> and replace them with the original defaults from the initial design. Are you sure?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSeedModalOpen(false)}
                  className="text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeedFilters}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  disabled={seeding}
                >
                  {seeding ? 'Seeding...' : 'Yes, Seed Defaults'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminFilters;
