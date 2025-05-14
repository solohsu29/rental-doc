import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

// Simple wrapper for tagged template queries
export async function executeQuery(query: TemplateStringsArray, ...params: any[]) {
  if (!sql) {
    console.error("Database connection not initialized")
    return []
  }

  try {
    return await sql(query, ...params)
  } catch (error) {
    console.error("Database query error:", error)
    return []
  }
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
