import React from 'react';

interface StatusIndicatorProps {
  type: 'microphone' | 'transcription';
  status: 'active' | 'inactive' | 'error';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ type, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-300';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getLabel = () => {
    if (type === 'microphone') {
      return `Microphone ${status === 'active' ? 'connected' : status === 'error' ? 'blocked' : 'disconnected'}`;
    } else {
      return `Transcription ${status === 'active' ? 'active' : 'inactive'}`;
    }
  };

  const getIcon = () => {
    if (type === 'microphone') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
      <div className="flex items-center text-sm text-gray-700">
        {getIcon()}
        <span className="ml-1">{getLabel()}</span>
      </div>
    </div>
  );
};

export default StatusIndicator; 