import { NextResponse } from "next/server";
import { executeQueryWithRetry as sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }
    // Convert all ids to integers to avoid type issues
    const intIds = ids.map((id: any) => parseInt(id, 10)).filter((id: any) => !isNaN(id));
    if (intIds.length === 0) {
      return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 });
    }
    // await sql`DELETE FROM rentals WHERE id = ANY(${intIds})`;
    const result = await sql`DELETE FROM rentals WHERE id = ANY(${ids}) RETURNING id`;
console.log("Deleted rows:", result);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



