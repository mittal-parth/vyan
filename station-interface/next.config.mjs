/** @type {import('next').NextConfig} */
const nextConfig = {
  // fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Optimize thirdweb bundle by excluding unused modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Skip processing of large dependencies during development
    if (config.mode === 'development') {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/thirdweb/dist/**',
          '**/node_modules/@walletconnect/**',
          '**/node_modules/viem/**',
        ],
      };
    }
    
    return config;
  },
  
  // Experimental features for better performance
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;
