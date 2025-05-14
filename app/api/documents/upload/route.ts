import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const file = formData.get("file") as File
    const equipment_id = formData.get("equipment_id") as string
    const document_type = formData.get("document_type") as string
    const issue_date = formData.get("issue_date") as string
    const expiry_date = formData.get("expiry_date") as string | null
    const notes = formData.get("notes") as string | null

    // In a real application, you would upload the file to a storage service
    // and get back a URL to store in the database
    const file_path = `/uploads/${Date.now()}_${file.name}`

    // For now, we'll just store the file information in the database
    // Validate required fields
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const result = await executeQuery`
      INSERT INTO documents (
        equipment_id, 
        document_type, 
        file_path, 
        issue_date, 
        expiry_date, 
        notes
      ) 
      VALUES (
        ${equipment_id || null}, 
        ${document_type || null}, 
        ${file_path}, 
        ${issue_date || null}, 
        ${expiry_date || null}, 
        ${notes || null}
      )
      RETURNING id
    `;

    if (!result || !result[0] || !result[0].id) {
      return NextResponse.json({ error: "Failed to insert document" }, { status: 500 });
    }

    return NextResponse.json({ id: result[0].id, file_path });
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
