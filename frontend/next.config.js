const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    img-src 'self' blob: data:;
    font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:;
    connect-src 'self' ws: wss:;
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        formats: ["image/avif", "image/webp"],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: cspHeader.replace(/\n/g, '').replace(/\s+/g, ' ').trim(),
                    },
                ],
            },
        ];
    },
};

module.exports = withBundleAnalyzer(nextConfig);
