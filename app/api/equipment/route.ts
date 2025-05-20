
import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { Buffer } from "buffer";
// NOTE: Ensure your 'documents' table has BYTEA column 'file_data', and optionally 'file_name', 'mime_type'.


export async function GET() {
  try {
    const equipment = await executeQuery`
      SELECT
        e.id,
        e.gondola_number,
        e.motor_serial_number,
        e.status,
        e.equipment_type,
        e.current_location as current_location,
        e.valid_documents,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', d.id,
              'file_name', d.file_name,
              'mime_type', d.mime_type,
              'document_type', d.document_type,
              'type', d.type,
              'issue_date', d.issue_date,
              'expiry_date', d.expiry_date
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM equipment e
      LEFT JOIN documents d ON d.equipment_id = e.id
      GROUP BY e.id
      ORDER BY e.gondola_number
    `;
    // If your executeQuery returns rows as an array, this is sufficient. If it returns a result object, use .rows

    console.log(' NextResponse.json(equipment)', NextResponse.json(equipment))
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
  }
}

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    // Use native Web API to parse form data
    const formData = await request.formData();

    // Extract fields
    const gondola_number = formData.get("gondola_number") as string;
    const motor_serial_number = formData.get("motor_serial_number") as string;
    const equipment_type = formData.get("equipment_type") as string;
    const status = (formData.get("status") as string) || "available";
    const current_location = (formData.get("current_location") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    // Insert equipment
    const result = await executeQuery`
      INSERT INTO equipment (
        gondola_number,
        motor_serial_number,
        equipment_type,
        status,
        current_location,
        notes
      ) VALUES (
        ${gondola_number},
        ${motor_serial_number},
        ${equipment_type},
        ${status},
        ${current_location},
        ${notes}
      )
      RETURNING id
    `;
    const equipmentId = result[0]?.id;

    // Handle document uploads (support multiple, using documents[N][file] and documents[N][type])
    for (let [key, value] of formData.entries()) {
      const match = key.match(/^documents\[(\d+)\]\[file\]$/);
      if (match && value instanceof File) {
        const idx = match[1];
        const type = formData.get(`documents[${idx}][type]`) as string;
        let issueDate = formData.get(`documents[${idx}][issue_date]`) as string;
        let expiryDate = formData.get(`documents[${idx}][expiry_date]`) as string;
        if (!issueDate) issueDate = new Date().toISOString().split('T')[0];
        if (!expiryDate) expiryDate = null;
        const notes = null;
        const file = value as File;
        if (file && type) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = file.name;
          const mimeType = file.type;
          await executeQuery`
            INSERT INTO documents (equipment_id, file_data, file_name, mime_type, document_type, type, issue_date, expiry_date, notes)
            VALUES (${equipmentId}, ${buffer}, ${fileName}, ${mimeType}, ${type}, ${type}, ${issueDate}, ${expiryDate}, ${notes})
          `;
        } else {
          console.error("Skipping document upload: missing file or type", { file, type });
        }
      }
    }

    // Fetch and return the full equipment row (with all expected fields)
    const equipment = await executeQuery`
      SELECT 
        id, gondola_number, motor_serial_number,
        status, equipment_type,
        current_location as location,
        valid_documents
      FROM equipment
      WHERE id = ${equipmentId}
    `;

    // Fetch all documents for this equipment
    const documents = await executeQuery`
      SELECT id, file_name, mime_type, document_type, type, issue_date, expiry_date FROM documents WHERE equipment_id = ${equipmentId}
    `;

    return NextResponse.json({ ...equipment[0], documents });
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    return NextResponse.json({ error: error.message || "Failed to create equipment" }, { status: 500 });
  }
}
