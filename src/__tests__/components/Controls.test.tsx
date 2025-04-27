import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Controls from '../../app/components/Controls';

// Mock the child components to simplify testing
jest.mock('../../app/components/ToggleSwitch', () => {
  return function MockToggleSwitch({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) {
    return (
      <button 
        data-testid="toggle-switch"
        onClick={onToggle}
        className={isActive ? 'toggle-active' : 'toggle-inactive'}
      >
        Toggle
      </button>
    );
  };
});

jest.mock('../../app/components/StatusIndicator', () => {
  return function MockStatusIndicator({ type, status }: { type: string, status: string }) {
    return (
      <div 
        data-testid={`status-${type}`} 
        className={`status-${status}`}
      >
        {type} - {status}
      </div>
    );
  };
});

describe('Controls', () => {
  test('should render toggle switch with correct state', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    const toggleSwitch = screen.getByTestId('toggle-switch');
    expect(toggleSwitch).toBeInTheDocument();
    expect(toggleSwitch).toHaveClass('toggle-active');
  });
  
  test('should display "Listening" text when active', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });
  
  test('should display "Paused" text when inactive', () => {
    render(
      <Controls 
        isActive={false}
        isListening={false}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
  
  test('should call onToggle when toggle switch is clicked', () => {
    const onToggleMock = jest.fn();
    
    render(
      <Controls 
        isActive={false}
        isListening={false}
        onToggle={onToggleMock}
        micPermission="granted"
      />
    );
    
    fireEvent.click(screen.getByTestId('toggle-switch'));
    
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
  
  test('should render microphone status indicator with granted status', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    const micIndicator = screen.getByTestId('status-microphone');
    expect(micIndicator).toBeInTheDocument();
    expect(micIndicator).toHaveClass('status-active');
  });
  
  test('should render microphone status indicator with denied status', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="denied"
      />
    );
    
    const micIndicator = screen.getByTestId('status-microphone');
    expect(micIndicator).toBeInTheDocument();
    expect(micIndicator).toHaveClass('status-error');
  });
  
  test('should render microphone status indicator with prompt status', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="prompt"
      />
    );
    
    const micIndicator = screen.getByTestId('status-microphone');
    expect(micIndicator).toBeInTheDocument();
    expect(micIndicator).toHaveClass('status-inactive');
  });
  
  test('should render transcription status indicator with active status', () => {
    render(
      <Controls 
        isActive={true}
        isListening={true}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    const transcriptionIndicator = screen.getByTestId('status-transcription');
    expect(transcriptionIndicator).toBeInTheDocument();
    expect(transcriptionIndicator).toHaveClass('status-active');
  });
  
  test('should render transcription status indicator with inactive status', () => {
    render(
      <Controls 
        isActive={true}
        isListening={false}
        onToggle={() => {}}
        micPermission="granted"
      />
    );
    
    const transcriptionIndicator = screen.getByTestId('status-transcription');
    expect(transcriptionIndicator).toBeInTheDocument();
    expect(transcriptionIndicator).toHaveClass('status-inactive');
  });
}); 