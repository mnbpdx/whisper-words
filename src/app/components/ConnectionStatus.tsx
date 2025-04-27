import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempt?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  reconnectAttempt = 0,
}) => {
  let statusText = 'Disconnected';
  let statusClass = 'bg-red-500';
  
  if (isConnected) {
    statusText = 'Connected';
    statusClass = 'bg-green-500';
  } else if (isConnecting) {
    statusText = reconnectAttempt > 0 
      ? `Connecting (Attempt ${reconnectAttempt})` 
      : 'Connecting...';
    statusClass = 'bg-yellow-500';
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${statusClass}`} />
      <span className="text-sm font-medium">{statusText}</span>
    </div>
  );
};

export default ConnectionStatus; 