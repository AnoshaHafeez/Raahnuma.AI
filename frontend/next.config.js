/** @type {import('next').NextConfig} */
const backendUrl = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

const nextConfig = {
  reactStrictMode: true,

  // Catalogue imagery is user-supplied Unsplash content. Keep this allowlist
  // exact so the optimizer cannot become a public image proxy.
  //
  // The previous config allowed `{ protocol: "https", hostname: "**" }`, which
  // lets the built-in optimizer fetch and re-serve *any* HTTPS URL through
  // /_next/image?url=... — effectively a public image proxy running on your
  // origin. Add an exact host if the catalogue later uses another approved CDN:
  //
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        protocol: backendUrl.protocol.replace(":", ""),
        hostname: backendUrl.hostname,
        ...(backendUrl.port ? { port: backendUrl.port } : {}),
        pathname: "/static/gear/**"
      }
    ]
  }
};

module.exports = nextConfig;
