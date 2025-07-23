import React from 'react';

function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="text-center md:text-left">
          © {new Date().getFullYear()} Session Soundtracks. Curated for exploration, healing, and creativity.
        </div>

        <div className="flex space-x-4 items-center">
          <a href="https://maps9.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            maps9.com
          </a>
          <a href="mailto:john@mapsofthemind.com" className="hover:underline">
            Contact
          </a>
          <a href="/privacy" className="hover:underline">
            Privacy
          </a>
          <a
            href="/admin-login"
            className="text-xs text-gray-400 hover:text-gray-600 underline ml-2 hidden md:inline"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
