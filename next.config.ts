import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // تجاهل أخطاء Typescript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
