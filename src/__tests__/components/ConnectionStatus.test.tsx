import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConnectionStatus from '../../app/components/ConnectionStatus';

// The mock for StatusIndicator isn't needed as the component doesn't use it

describe('ConnectionStatus', () => {
  test('should display connected status', () => {
    render(
      <ConnectionStatus 
        isConnected={true}
        isConnecting={false}
      />
    );
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Connected').previousSibling).toHaveClass('bg-green-500');
  });
  
  test('should display disconnected status', () => {
    render(
      <ConnectionStatus 
        isConnected={false}
        isConnecting={false}
      />
    );
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Disconnected').previousSibling).toHaveClass('bg-red-500');
  });
  
  test('should display connecting status', () => {
    render(
      <ConnectionStatus 
        isConnected={false}
        isConnecting={true}
      />
    );
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByText('Connecting...').previousSibling).toHaveClass('bg-yellow-500');
  });
  
  test('should display reconnect attempt', () => {
    render(
      <ConnectionStatus 
        isConnected={false}
        isConnecting={true}
        reconnectAttempt={3}
      />
    );
    
    expect(screen.getByText('Connecting (Attempt 3)')).toBeInTheDocument();
    expect(screen.getByText('Connecting (Attempt 3)').previousSibling).toHaveClass('bg-yellow-500');
  });
}); 