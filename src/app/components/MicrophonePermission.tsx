import React from 'react';

interface MicrophonePermissionProps {
  permissionState: 'granted' | 'denied' | 'prompt';
  onRequestPermission: () => void;
}

const MicrophonePermission: React.FC<MicrophonePermissionProps> = ({ 
  permissionState, 
  onRequestPermission 
}) => {
  if (permissionState === 'granted') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            {permissionState === 'denied' 
              ? 'Microphone access is blocked. Please enable it in your browser settings to use this application.' 
              : 'Microphone access is required for speech recognition to work.'}
          </p>
          {permissionState === 'prompt' && (
            <div className="mt-2">
              <button
                onClick={onRequestPermission}
                className="px-3 py-1 text-sm text-white bg-yellow-500 hover:bg-yellow-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Allow Microphone Access
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermission; 