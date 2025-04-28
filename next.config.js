/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure other Next.js options as needed
  webpack: (config, { isServer }) => {
    // Fix for WebSocket support
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        { bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' },
      ];
    }
    return config;
  },
  // Enable WebSockets for the server
  experimental: {
    // This option has been renamed in newer Next.js versions
    serverExternalPackages: ['socket.io', 'socket.io-client'],
  },
};

module.exports = nextConfig;
