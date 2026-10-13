import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy SQL client so module import doesn't crash during build time when DATABASE_URL is not yet configured
export const sql = ((...args: Parameters<NeonQueryFunction<false, false>>) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure your Neon database connection string in .env.local"
    );
  }
  const client = neon(dbUrl);
  return (client as unknown as (...a: unknown[]) => unknown)(...args);
}) as NeonQueryFunction<false, false>;
