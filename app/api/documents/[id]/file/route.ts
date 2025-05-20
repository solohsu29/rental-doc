import { sql } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

// GET /api/documents/[id]/file - serve file for download/view
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await sql`SELECT file_data, file_name, mime_type FROM documents WHERE id = ${id}`;
    if (!result || !result[0]?.file_data) {
      return new Response("File not found", { status: 404 });
    }
    return new Response(result[0].file_data, {
      status: 200,
      headers: {
        "Content-Type": result[0].mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${result[0].file_name || 'document'}\"`
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
