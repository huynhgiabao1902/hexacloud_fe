/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        events: false,
      };
    }

    // Exclude SSH2 and cpu-features from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'ssh2': 'commonjs2 ssh2',
        'cpu-features': 'commonjs2 cpu-features',
        'ssh2-streams': 'commonjs2 ssh2-streams',
        'ssh2-sftp-client': 'commonjs2 ssh2-sftp-client'
      });
    }

    return config;
  },
  serverExternalPackages: ['ssh2', 'cpu-features'],
  output: 'standalone'
};

module.exports = nextConfig;