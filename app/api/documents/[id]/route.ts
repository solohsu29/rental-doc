import { sql } from "@/lib/db"
import { NextResponse } from "next/server"


// GET /api/documents/[id] - fetch document detail
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const result = await sql`SELECT id, equipment_id, document_type, issue_date, file_name FROM documents WHERE id = ${id}`;
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
      let fileData = null;
      let fileName = null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const origName = (file as File).name;
        const arrayBuffer = await (file as File).arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
        fileName = origName;
      }
      // Update DB, optionally update file_data and file_name
      if (fileData && fileName) {
        await sql`
          UPDATE documents
          SET document_type = ${document_type}, issue_date = ${issue_date}, expiry_date = ${expiry_date || null}, notes = ${notes || null}, file_data = ${fileData}, file_name = ${fileName}
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
    const result = await sql`SELECT file_data, file_name FROM documents WHERE id = ${id}`;
    if (!result || !result[0]?.file_data) {
      return new Response("File not found", { status: 404 });
    }
    const fileBuffer = result[0].file_data;
    const fileName = result[0].file_name || `document_${id}`;
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
