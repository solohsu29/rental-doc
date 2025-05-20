import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry as sql } from "@/lib/db";


// PUT /api/rentals/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const formData = await req.formData();

    const equipment_id = formData.get("equipment_id");
    const client_id = formData.get("client_id");
    const site_location = formData.get("site_location");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const monthly_rate = formData.get("monthly_rate");
    const notes = formData.get("notes");

    // Validate required fields
    if (!equipment_id || !client_id || !site_location || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields (equipment_id, client_id, site_location, start_date, end_date)" }, { status: 400 });
    }

    // Update rental
    await sql`
      UPDATE rentals
      SET equipment_id = ${equipment_id},
          client_id = ${client_id},
          site_location = ${site_location},
          start_date = ${start_date},
          end_date = ${end_date},
          monthly_rate = ${monthly_rate},
          notes = ${notes}
      WHERE id = ${id}
    `;

    // Handle document updates
    // 1. Find all document indices in the form data
    const docIndices = Array.from(formData.keys())
      .map(key => {
        const match = key.match(/^documents\[(\d+)\]/);
        return match ? match[1] : null;
      })
      .filter((idx, i, arr) => idx !== null && arr.indexOf(idx) === i);

    // 2. Fetch existing documents for this rental
    const existingDocs = await sql`SELECT id FROM documents WHERE rental_id = ${id}`;
    const existingDocIds = existingDocs.map((doc: any) => doc.id);
    const updatedDocIds: number[] = [];

    for (const idx of docIndices) {
      const docId = formData.get(`documents[${idx}][id]`);
      const type = formData.get(`documents[${idx}][type]`);
      const issue_date = formData.get(`documents[${idx}][issue_date]`);
      const expiry_date = formData.get(`documents[${idx}][expiry_date]`);
      const file = formData.get(`documents[${idx}][file]`);
      if (docId && !file) {
        // Update metadata only
        await sql`
          UPDATE documents SET document_type = ${type}, issue_date = ${issue_date}, expiry_date = ${expiry_date}
          WHERE id = ${docId} AND rental_id = ${id}
        `;
        updatedDocIds.push(Number(docId));
      } else if (file && file instanceof File) {
        // Insert new document (or replace existing)
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const mimeType = file.type;
        const result = await sql`
          INSERT INTO documents (rental_id, file_data, file_name, mime_type, document_type, type, issue_date, expiry_date)
          VALUES (${id}, ${buffer}, ${fileName}, ${mimeType}, ${type}, ${type}, ${issue_date}, ${expiry_date})
          RETURNING id
        `;
        updatedDocIds.push(result[0].id);
      }
    }

    // 3. Remove documents that were deleted in the form
    // Only perform delete if document fields are present in the form
    if (docIndices.length > 0) {
      const toDelete = existingDocIds.filter((docId: number) => !updatedDocIds.includes(docId));
      if (toDelete.length > 0) {
        await sql`DELETE FROM documents WHERE id = ANY(${toDelete}) AND rental_id = ${id}`;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rental" }, { status: 500 });
  }
}

// GET /api/rentals/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intId = parseInt(id, 10);
  if (isNaN(intId)) {
    return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
  }
  try {
    const rentalRows = await sql`
      SELECT r.*, c.*, e.*
      FROM rentals r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ${intId}
    `;
    if (!rentalRows || rentalRows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }
    // You may want to format the result to match your API shape. For now, return the joined row.
    return NextResponse.json(rentalRows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rental' }, { status: 500 });
  }
}
