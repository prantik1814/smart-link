import React, { useState } from 'react';
import CustomMusicForm from '../components/CustomMusicForm';

const SmartLinkEditor = () => {
  const [submittedData, setSubmittedData] = useState(null);

  const sampleData = {
    bandName: "TLF GANG",
    tagline: "New Single 'Do or Die' Out Now",
    description: "Stream our latest track on your favorite platform.",
    heroImage: "https://github.com/prantik1814/smart-link/blob/main/public/DOD%20FINAL%20STRUCT.webp?raw=true",
    backgroundImage: "https://github.com/prantik1814/smart-link/blob/main/public/7542f5e39a6833ea40c5c01bf12b1f91.jpg?raw=true",
    theme: {
      accentColor: "#ff6b6b",
      backgroundOverlay: "rgba(4, 4, 12, 0.85)"
    },
    links: [
      {
        title: "Spotify",
        url: "https://open.spotify.com/track/5ybQaZNqNbPgPaUx6lL0rU?si=bc2b70c5705f4e7f",
        color: "#1DB954",
        iconUrl: "/icons/spotify.png"
      },
      {
        title: "YouTube",
        url: "https://youtu.be/tBWiUvQj1AQ?si=HbQ2Oe7rkKueKzSu",
        color: "#FF0000",
        iconUrl: "/icons/youtube.png"
      },
      {
        title: "YouTube Music",
        url: "https://music.youtube.com/watch?v=tBWiUvQj1AQ&si=grDxVVg9HeO0C1YX",
        color: "#FF0000",
        iconUrl: "/icons/youtubemusic.png"
      },
      {
        title: "JioSaavn",
        url: "https://www.saavn.com/song/wasted/GQUyXC5vYFg",
        color: "#2BC5B4",
        iconUrl: "/icons/JioSaavn Icon Transparent.png"
      },
      {
        title: "Amazon Music",
        url: "https://music.amazon.in/albums/B0F3PDNCGZ",
        color: "#00A8E1",
        iconUrl: "/icons/amazon.png"
      },
      {
        title: "Apple Music",
        url: "https://music.apple.com/in/song/do-or-die/6766575394",
        color: "#fc3c44",
        iconUrl: "/icons/applemusic.png"
      },
      {
        title: "Gaana",
        url: "https://gaana.com/song/wasted-1581",
        color: "#E72C30",
        iconUrl: "/icons/gaana.png"
      },
      {
        title: "Catalogue",
        url: "https://linktr.ee/tlfgang",
        color: "#E72C30",
        iconUrl: "/icons/band_icon.jpeg"
      }
    ]
  };

  const handleFormSubmit = (data) => {
    setSubmittedData(data);
    console.log('Smart link configuration saved:', data);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <CustomMusicForm 
          initialData={sampleData} 
          onSubmit={handleFormSubmit}
        />
        
        {submittedData && (
          <div className="mt-8 max-w-4xl mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✓ Configuration Saved Successfully!
            </h3>
            <p className="text-green-700">
              Your smart link configuration has been updated. You can now use this data to generate your smart link page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartLinkEditor;
