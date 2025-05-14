import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

// GET /api/documents/[id] - fetch document detail
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const result = await sql`SELECT * FROM documents WHERE id = ${id}`;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/documents/[id] - update document detail and optionally replace file
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const document_type = formData.get("document_type") as string;
      const issue_date = formData.get("issue_date") as string;
      const expiry_date = formData.get("expiry_date") as string | null;
      const notes = formData.get("notes") as string | null;
      const file = formData.get("file");
      if (!document_type || !issue_date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      let filePath = null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        // Save file to public/uploads/documents/{id}-{timestamp}-{filename}
        const now = Date.now();
        const origName = (file as File).name;
        const ext = origName.includes('.') ? origName.split('.').pop() : '';
        const safeName = origName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
        await fs.mkdir(uploadDir, { recursive: true });
        const destName = `${id}-${now}-${safeName}`;
        const destPath = path.join(uploadDir, destName);
        const arrayBuffer = await (file as File).arrayBuffer();
        await fs.writeFile(destPath, Buffer.from(arrayBuffer));
        filePath = path.join("uploads", "documents", destName);
      }
      // Update DB, optionally update file_path
      if (filePath) {
        await sql`
          UPDATE documents
          SET document_type = ${document_type}, issue_date = ${issue_date}, expiry_date = ${expiry_date || null}, notes = ${notes || null}, file_path = ${filePath}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE documents
          SET document_type = ${document_type}, issue_date = ${issue_date}, expiry_date = ${expiry_date || null}, notes = ${notes || null}
          WHERE id = ${id}
        `;
      }
      return NextResponse.json({ success: true });
    } else {
      // JSON update only
      const body = await request.json();
      const { document_type, issue_date, expiry_date, notes } = body;
      if (!document_type || !issue_date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      await sql`
        UPDATE documents
        SET document_type = ${document_type}, issue_date = ${issue_date}, expiry_date = ${expiry_date || null}, notes = ${notes || null}
        WHERE id = ${id}
      `;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// GET /api/documents/[id]/file - serve file for download/view
export async function GET_FILE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
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
