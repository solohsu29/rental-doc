import { executeQueryWithRetry as sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const equipment_id = formData.get('equipment_id');
    const document_type = formData.get('document_type');
    const issue_date = formData.get('issue_date');
    const expiry_date = formData.get('expiry_date');
    const notes = formData.get('notes');
    // file_path will be handled by your upload logic, set to null or the uploaded path
    const file_path = null;

    // Validate required fields
    if (!equipment_id || !document_type || !issue_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert new document
    const result = await sql`
      INSERT INTO documents (equipment_id, document_type, file_path, issue_date, expiry_date, notes)
      VALUES (${equipment_id}, ${document_type}, ${file_path || null}, ${issue_date}, ${expiry_date || null}, ${notes || null})
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get("equipment_id")

    let documents
    if (equipmentId) {
      documents = await sql`
        SELECT d.*, e.gondola_number
        FROM documents d
        JOIN equipment e ON d.equipment_id = e.id
        WHERE d.equipment_id = ${equipmentId}
        ORDER BY d.document_type, d.expiry_date DESC
      `
    } else {
      documents = await sql`
        SELECT d.*, e.gondola_number
        FROM documents d
        JOIN equipment e ON d.equipment_id = e.id
        ORDER BY d.document_type, d.expiry_date DESC
      `
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
