import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import StatusIndicator from './StatusIndicator';

interface ControlsProps {
  isActive: boolean;
  isListening: boolean;
  onToggle: () => void;
  micPermission: 'granted' | 'denied' | 'prompt';
}

const Controls: React.FC<ControlsProps> = ({ 
  isActive, 
  isListening, 
  onToggle, 
  micPermission 
}) => {
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ToggleSwitch isActive={isActive} onToggle={onToggle} />
          <span className="text-gray-700 font-medium">
            {isActive ? 'Listening' : 'Paused'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator 
            type="microphone" 
            status={micPermission === 'granted' ? 'active' : micPermission === 'denied' ? 'error' : 'inactive'} 
          />
          <StatusIndicator 
            type="transcription" 
            status={isListening ? 'active' : 'inactive'} 
          />
        </div>
      </div>
    </div>
  );
};

export default Controls; 