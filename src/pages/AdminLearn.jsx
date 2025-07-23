// src/pages/AdminLearn.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function AdminLearn() {
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formLesson, setFormLesson] = useState({ title: '', description: '', vimeoUrl: '', position: 1 });

  const fetchLessons = async () => {
    const querySnapshot = await getDocs(collection(db, 'learnVideos'));
    const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLessons(fetched.sort((a, b) => a.position - b.position));
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const openAddModal = () => {
    setFormLesson({ title: '', description: '', vimeoUrl: '', position: 1 });
    setEditingLesson(null);
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setFormLesson({ ...lesson });
    setEditingLesson(lesson);
    setShowModal(true);
  };

  const handleSaveLesson = async () => {
    try {
      if (editingLesson) {
        await updateDoc(doc(db, 'learnVideos', editingLesson.id), formLesson);
      } else {
        await addDoc(collection(db, 'learnVideos'), formLesson);
      }
      setShowModal(false);
      fetchLessons();
    } catch (err) {
      console.error('Error saving lesson:', err);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await deleteDoc(doc(db, 'learnVideos', id));
      fetchLessons();
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Learn Videos</h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:opacity-90"
          >
            <FaPlus /> Add Video
          </button>
        </div>

        <table className="w-full text-left border-t border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Title</th>
              <th className="p-3">Description</th>
              <th className="p-3">Position</th>
              <th className="p-3">Vimeo URL</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map(lesson => (
              <tr key={lesson.id} className="border-t">
                <td className="p-3 font-medium text-gray-800">{lesson.title}</td>
                <td className="p-3 text-gray-600">{lesson.description}</td>
                <td className="p-3 text-gray-700">{lesson.position}</td>
                <td className="p-3 text-blue-600 underline truncate max-w-xs">{lesson.vimeoUrl}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="text-sm px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="text-sm px-3 py-1 bg-red-600 text-white rounded"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
              <input
                type="text"
                placeholder="Title"
                value={formLesson.title}
                onChange={(e) => setFormLesson({ ...formLesson, title: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={formLesson.description}
                onChange={(e) => setFormLesson({ ...formLesson, description: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              ></textarea>
              <input
                type="text"
                placeholder="Vimeo URL"
                value={formLesson.vimeoUrl}
                onChange={(e) => setFormLesson({ ...formLesson, vimeoUrl: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Position"
                value={formLesson.position}
                onChange={(e) => setFormLesson({ ...formLesson, position: Number(e.target.value) })}
                className="w-full mb-4 p-2 border rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLesson}
                  className="px-4 py-2 bg-black text-white rounded"
                >
                  {editingLesson ? 'Save Changes' : 'Add Video'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminLearn;
