// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock the AudioContext and related audio APIs
class MockAudioContext {
  createMediaStreamSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }
  
  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      fftSize: 0,
      getByteFrequencyData: jest.fn()
    };
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock mediaDevices in navigator
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockImplementation(() => 
      Promise.resolve({
        getTracks: () => [{
          stop: jest.fn()
        }]
      })
    )
  }
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Mock WebSocket and Socket.IO
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true
  };
  return jest.fn(() => mockSocket);
});

// Mock Next.js server objects
jest.mock('next/server', () => {
  class NextResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.headers = new Headers(options.headers || {});
      this.isNextResponse = true;
    }
    
    static json(body, options = {}) {
      const response = new NextResponse(JSON.stringify(body), options);
      response.headers.set('Content-Type', 'application/json');
      return response;
    }
    
    // Add these methods for test compatibility
    json() {
      return Promise.resolve(this.body ? JSON.parse(this.body) : this.body);
    }
    
    text() {
      return Promise.resolve(this.body);
    }
  }
  
  class NextRequest {
    constructor(input, init) {
      this.url = input || 'http://localhost:3000';
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers || {});
      this.nextUrl = new URL(this.url);
      this.nextUrl.searchParams = new URLSearchParams();
      this.socket = {
        server: {
          // For socket.io tests
          io: null
        }
      };
    }
    
    json() {
      return Promise.resolve({});
    }
    
    formData() {
      const formData = new FormData();
      
      // Mock a File object for tests
      formData.append('audio', {
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
      
      return Promise.resolve(formData);
    }
  }
  
  return {
    NextRequest,
    NextResponse
  };
});

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
})); 