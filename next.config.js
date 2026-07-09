/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/isomorphic-fetch",
    "@prisma/adapter-libsql",
    "@prisma/client",
    "@vercel/blob",
  ],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};
module.exports = nextConfig;