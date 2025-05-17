import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : (...args: any[]) => {
      throw new Error("DATABASE_URL environment variable is not set. Please configure your database connection.");
    };

// Simple wrapper for tagged template queries
export async function executeQuery(query: TemplateStringsArray, ...params: any[]) {
  try {
    return await sql(query, ...params)
  } catch (error) {
    console.error("Database query error:", error)
    return []
  }
}

/**
 * Robust wrapper for database queries with retry/backoff for rate limit errors.
 * Use this for user-facing queries to minimize NeonDB rate limit errors.
 */
export async function executeQueryWithRetry(query: TemplateStringsArray, ...params: any[]) {
  let attempts = 0;
  const maxAttempts = 3;
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  while (attempts < maxAttempts) {
    try {
      return await executeQuery(query, ...params);
    } catch (error: any) {
      // Detect NeonDB rate limit error
      const msg = error?.message || error?.toString() || "";
      if (msg.includes("rate limit") || msg.includes("exceeded the rate limit")) {
        attempts++;
        if (attempts === maxAttempts) throw error;
        await delay(2000 * attempts); // Exponential backoff: 2s, 4s, ...
        continue;
      }
      throw error;
    }
  }
  // Should never reach here
  throw new Error("Failed to execute DB query after retries");
}

// Helper function to format dates for display
export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Helper function to check if a document is expired or expiring soon
export function getDocumentStatus(expiryDate: Date | string | null): "valid" | "expiring" | "expired" {
  if (!expiryDate) return "valid"

  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return "expired"
  if (daysUntilExpiry < 30) return "expiring"
  return "valid"
}

export { sql }
