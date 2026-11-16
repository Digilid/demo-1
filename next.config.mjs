const isGithubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: '/demo-1',
        assetPrefix: '/demo-1/',
        images: { unoptimized: true },
      }
    : {}),
};
export default nextConfig;
