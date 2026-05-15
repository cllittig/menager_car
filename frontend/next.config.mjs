
const devAllowedHosts = (process.env.NEXT_DEV_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const nextConfig = {

  ...(devAllowedHosts.length > 0 ? { allowedDevOrigins: devAllowedHosts } : {}),


  typescript: {
    ignoreBuildErrors: false,
  },


  poweredByHeader: false,
  compress: true,


  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
  },


  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        ...devAllowedHosts.map((host) => `${host}:3000`),
      ],
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ],
    webVitalsAttribution: ['CLS', 'LCP'],
    /** Evita cache otimista que, em dev, pode desalinhar RSC/HTML e piorar avisos de hidratação. */
    optimisticClientCache: false,
  },
  async headers() {
    return [
      // Headers de segurança
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      },
      // Cache para assets estáticos
      {
        source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache para fontes
      {
        source: '/(.*)\\.(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // BFF/auth: não cachear publicamente (tokens, sessão)
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, must-revalidate'
          }
        ]
      },
      // Cache para demais API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ]
  },
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      )
      return config
    }
  }),
}

export default nextConfig;
