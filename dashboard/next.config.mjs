/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/architecture", destination: "/docs", permanent: true },
    ];
  },
  /** Same handler as /api/admin/… — some clients hit /admin/… matching the backend path shape. */
  async rewrites() {
    return [
      {
        source: "/admin/data-pipeline/jobs",
        destination: "/api/admin/data-pipeline/jobs",
      },
    ];
  },
};

export default nextConfig;
