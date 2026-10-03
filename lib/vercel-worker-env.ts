// Vercel's Node runtime reads the same server-only keys as the Worker deployment.
// The Next.js server build aliases cloudflare:workers to this module.
export const env = process.env;
