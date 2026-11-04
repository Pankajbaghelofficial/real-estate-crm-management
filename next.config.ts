import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Images committed in public/uploads are served as static files on Vercel, but the
  // gallery API lists them from disk, so ship them with that function too.
  outputFileTracingIncludes: {
    "/api/upload": ["./public/uploads/**/*"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploaded files are user-supplied: never let the browser sniff them as HTML/script.
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" },
        ],
      },
    ];
  },
};

export default nextConfig;
