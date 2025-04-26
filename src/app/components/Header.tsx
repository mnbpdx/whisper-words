import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 bg-gray-800 text-white">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">WhisperWords</h1>
        <p className="text-sm text-gray-300">Real-time speech-to-text bubble display</p>
      </div>
    </header>
  );
};

export default Header; 