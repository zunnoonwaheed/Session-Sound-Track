import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';

function Header() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setUser(null);
      localStorage.removeItem('isSubscribed'); // clean local storage too
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-tripsonic-blend/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between relative">
        {/* Left: Logo */}
       <Link to="/" className="flex items-center space-x-3">
  <img src="/new-logo.png" alt="Session Soundtracks Logo" className="h-16 object-contain" />
  <span className="text-xl font-semibold text-black">Session Soundtracks</span>
</Link>


        {/* Center: Nav links */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex space-x-10 text-[17px] text-gray-700 font-medium">
          <Link to="/" className={`hover:text-black transition ${pathname === '/' ? 'text-black' : ''}`}>Home</Link>
          <Link to="/about" className={`hover:text-black transition ${pathname === '/about' ? 'text-black' : ''}`}>About</Link>
          <Link to="/learn" className={`hover:text-black transition ${pathname === '/learn' ? 'text-black' : ''}`}>Learn</Link>
        </nav>

        {/* Right: User or Login */}
        <div className="text-sm text-gray-700 font-medium">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="truncate max-w-[150px] text-gray-800">{user.email}</span>
              <button onClick={handleLogout} className="text-gray-600 hover:text-black text-sm">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="hover:text-black transition">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
