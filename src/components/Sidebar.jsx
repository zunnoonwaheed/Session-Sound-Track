import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaListUl,
  FaFilter,
  FaHome,
  FaSignOutAlt,
  FaChalkboardTeacher,
  FaPoundSign
} from 'react-icons/fa'; // added FaPoundSign for subscription settings

function Sidebar() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('tripsonicAdmin') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('tripsonicAdmin');
    navigate('/');
  };

  const navClass = ({ isActive }) =>
    isActive
      ? 'bg-gray-100 text-black font-medium px-4 py-2 rounded-lg flex items-center gap-2'
      : 'text-gray-700 hover:text-black px-4 py-2 rounded-lg flex items-center gap-2';

  if (!isLoggedIn) {
    navigate('/admin-login');
    return null;
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">Session Soundtracks Admin</h2>
      <nav className="flex flex-col gap-3">
        <NavLink to="/admin" className={navClass}>
          <FaPlus /> Add Playlist
        </NavLink>
        <NavLink to="/adminplaylists" className={navClass}>
          <FaListUl /> View Playlists
        </NavLink>
        <NavLink to="/admin-filters" className={navClass}>
          <FaFilter /> Manage Filters
        </NavLink>
        <NavLink to="/admin-learn" className={navClass}>
          <FaChalkboardTeacher /> Manage Learn
        </NavLink>
        <NavLink to="/admin-subs" className={navClass}>
          <FaPoundSign /> Subscription Settings
        </NavLink>
        <NavLink to="/" className={navClass}>
          <FaHome /> Back to Site
        </NavLink>
        <button
          onClick={handleLogout}
          className="text-left text-gray-700 hover:text-black px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
