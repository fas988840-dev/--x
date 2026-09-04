/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The API base URL comes from the environment; the client uses fetch()
  // against ${NEXT_PUBLIC_JONARAI_API_URL}/... at runtime. Left unset by
  // default so the app never talks to a real backend from a Phase A.1
  // scaffold build.
  env: {
    NEXT_PUBLIC_JONARAI_API_URL: process.env.NEXT_PUBLIC_JONARAI_API_URL ?? "",
  },
};

export default nextConfig;
