import React from 'react';

interface ToggleSwitchProps {
  isActive: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isActive, onToggle }) => {
  return (
    <button
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isActive 
          ? 'bg-green-500 focus:ring-green-500' 
          : 'bg-red-500 focus:ring-red-500'
      }`}
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label="Toggle microphone"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch; 