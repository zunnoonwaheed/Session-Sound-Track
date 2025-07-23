import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function About() {
  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About Session Soundtracks</h1>

        <p className="mb-5 text-lg text-gray-800">
          <strong>Session Soundtracks</strong> is a curated collection of music playlists designed for psychedelic experiences, emotional healing, and expanded states of awareness.
        </p>

        <p className="mb-5 text-lg text-gray-800">
          We believe music is more than background sound — it’s a guide, a container, a mirror. Whether you're journeying with psilocybin, integrating an MDMA session, or simply seeking presence, the right soundtrack can support the process deeply.
        </p>

        <p className="mb-5 text-lg text-gray-800">
          Explore playlists by <strong>substance</strong>, <strong>genre</strong>, <strong>mood</strong>, or <strong>platform</strong>. From ambient and classical to indigenous and experimental, each playlist is tagged and categorized for easy discovery.
        </p>

        <p className="mb-5 text-lg text-gray-800">
          All tracks are embedded from platforms like Spotify, YouTube, SoundCloud, and Apple Music. Some include notes from curators, guides, or researchers to offer deeper context for listening.
        </p>

        <p className="mb-5 text-lg text-gray-800">
          This project is fueled by a love of music, a respect for the psychedelic experience, and a desire to create safe, meaningful spaces for inner work.
        </p>

        <p className="mb-5 text-lg text-gray-800">
          If you'd like to suggest a playlist, we welcome thoughtful contributions from across the community.
        </p>

        <p className="text-gray-500 text-sm mt-8">
          <em>Note: Session Soundtracks is an educational and creative platform. We do not promote or encourage the use of illegal substances. Please act responsibly and follow local laws.</em>
        </p>
      </main>

      <Footer />
    </>
  );
}

export default About;
