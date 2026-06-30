import type { NextConfig } from "next";

function resolveApiUrl() {
  const fallback = new URL("http://localhost:4000");

  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? fallback.toString());
  } catch {
    return fallback;
  }
}

const apiUrl = resolveApiUrl();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
