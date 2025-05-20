import { executeQueryWithRetry as sql } from "@/lib/db"
import { NextResponse } from "next/server"

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Extract fields
    const equipment_id = formData.get("equipment_id") as string;
    const client_id = formData.get("client_id") as string;
    const site_location = formData.get("site_location") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const monthly_rate = formData.get("monthly_rate") as string | null;
    const notes = formData.get("notes") as string | null;

    // Validate required fields
    if (!equipment_id || !client_id || !site_location || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields (equipment_id, client_id, site_location, start_date, end_date)" }, { status: 400 });
    }

    // Check if equipment is available
    const equipment = await sql`
      SELECT * FROM equipment WHERE id = ${equipment_id}
    `;
    if (equipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
    if (equipment[0].status !== "available") {
      return NextResponse.json({ error: "Equipment is not available for rental" }, { status: 400 });
    }

    // Insert new rental
    const result = await sql`
      INSERT INTO rentals (equipment_id, client_id, site_location, start_date, end_date, monthly_rate, notes, status)
      VALUES (${equipment_id}, ${client_id}, ${site_location}, ${start_date}, ${end_date}, ${monthly_rate || null}, ${notes || null}, 'active')
      RETURNING id
    `;
    const rentalId = result[0]?.id;

    // Handle document uploads (support multiple, using documents[N][file] and documents[N][type])
    for (let [key, value] of formData.entries()) {
      const match = key.match(/^documents\[(\d+)\]\[file\]$/);
      if (match && value instanceof File) {
        const idx = match[1];
        const type = formData.get(`documents[${idx}][type]`) as string;
        let issueDate = formData.get(`documents[${idx}][issue_date]`) as string | null;
        let expiryDate = formData.get(`documents[${idx}][expiry_date]`) as string | null;
        if (!issueDate) issueDate = new Date().toISOString().split('T')[0];
        if (!expiryDate) expiryDate = null;
        const notes = null;
        const file = value as File;

        if (file && type) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = file.name;
          const mimeType = file.type;
  await sql`
            INSERT INTO documents (rental_id, file_data, file_name, mime_type, document_type, type, issue_date, expiry_date, notes)
            VALUES (${rentalId}, ${buffer}, ${fileName}, ${mimeType}, ${type}, ${type}, ${issueDate}, ${expiryDate}, ${notes})
          `;
        } else {
          console.error("Skipping document upload: missing file or type", { file, type });
        }
      }
    }

    // Update equipment status
    await sql`
      UPDATE equipment SET status = 'deployed', current_location = ${site_location}
      WHERE id = ${equipment_id}
    `;

    return NextResponse.json({ id: rentalId }, { status: 201 });
  } catch (error) {
    console.error("Error creating rental:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rentals = await sql`
      SELECT
        r.*,
        c.name as client_name,
        e.gondola_number,
        e.motor_serial_number,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', d.id,
              'file_name', d.file_name,
              'mime_type', d.mime_type,
              'document_type', d.document_type,
              'issue_date', d.issue_date,
              'expiry_date', d.expiry_date
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      LEFT JOIN documents d ON d.rental_id = r.id
      GROUP BY r.id, c.name, e.gondola_number, e.motor_serial_number
      ORDER BY 
        CASE WHEN r.status = 'active' THEN 1 ELSE 2 END,
        r.start_date DESC
    `;
    return NextResponse.json(rentals);
  } catch (error) {
    console.error("Error fetching rentals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
