/** Canonical site origin for sitemap, robots, and metadata. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  // Vercel production primary domain (e.g. custom domain). Not set on preview deploys.
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    ""
  );
  if (productionHost) {
    return productionHost.startsWith("http")
      ? productionHost
      : `https://${productionHost}`;
  }

  // Per-deployment hostname (preview *.vercel.app URLs).
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
