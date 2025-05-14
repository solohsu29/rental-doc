import { sql } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

// GET /api/documents/[id]/file - serve file for download/view
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await sql`SELECT file_path FROM documents WHERE id = ${id}`;
    if (!result || !result[0]?.file_path) {
      return new Response("File not found", { status: 404 });
    }
    const filePath = result[0].file_path;
    const absPath = path.join(process.cwd(), "public", filePath);
    const file = await fs.readFile(absPath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${path.basename(filePath)}\"`
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
