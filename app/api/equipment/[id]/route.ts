import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    const equipmentRows = await sql`
      SELECT * FROM equipment WHERE id = ${id}
    `;
    if (equipmentRows.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }
    const equipment = equipmentRows[0];
    // Fetch documents for this equipment
    const documents = await sql`
      SELECT id, file_name, mime_type, document_type, type, issue_date, expiry_date FROM documents WHERE equipment_id = ${id}
    `;
    equipment.documents = documents.map((doc: any) => ({
      ...doc,
      issue_date: doc.issue_date ? doc.issue_date.toISOString().split('T')[0] : "",
      expiry_date: doc.expiry_date ? doc.expiry_date.toISOString().split('T')[0] : ""
    }));
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    // Accept multipart/form-data for file uploads
    const contentType = request.headers.get("content-type") || "";
    let formData: FormData | null = null;
    let fields: Record<string, any> = {};
    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      // Extract equipment fields
      fields.gondola_number = formData.get("gondola_number") as string;
      fields.motor_serial_number = formData.get("motor_serial_number") as string;
      fields.equipment_type = formData.get("equipment_type") as string;
      fields.status = (formData.get("status") as string) || "available";
      fields.current_location = (formData.get("current_location") as string) || null;
      fields.notes = (formData.get("notes") as string) || null;
    } else {
      // fallback to JSON
      const body = await request.json();
      fields = body;
    }

    // Validate required fields
    if (!fields.gondola_number || !fields.motor_serial_number || !fields.equipment_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if equipment exists
    const existingEquipment = await sql`
      SELECT * FROM equipment WHERE id = ${id}
    `;
    if (existingEquipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Update equipment
    await sql`
      UPDATE equipment
      SET 
        gondola_number = ${fields.gondola_number},
        motor_serial_number = ${fields.motor_serial_number},
        equipment_type = ${fields.equipment_type},
        status = ${fields.status || "available"},
        current_location = ${fields.current_location || null},
        notes = ${fields.notes || null}
      WHERE id = ${id}
    `;

    // Handle document updates if multipart/form-data
    if (formData) {
      console.log('formData from be',formData)
      // 1. Collect document indices and IDs from formData
      const docIndices = Array.from(formData.keys())
        .map(k => k.match(/^documents\[(\d+)\]\[file\]$/))
        .filter(Boolean)
        .map(m => m![1]);
        console.log('docIndices',docIndices)
      const docIdsInForm = new Set<string>();
      for (const idx of docIndices) {
        const docId = formData.get(`documents[${idx}][id]`);
        if (docId) docIdsInForm.add(docId.toString());
      }
      // 2. Get all existing document IDs for this equipment
      const existingDocs = await sql`SELECT id FROM documents WHERE equipment_id = ${id}`;
      const existingDocIds = new Set(existingDocs.map((d: any) => d.id.toString()));
      // 3. Delete documents removed in the form
      // for (const docId of existingDocIds) {
      //   if (!docIdsInForm.has(docId)) {
      //     await sql`DELETE FROM documents WHERE id = ${docId}`;
      //   }
      // }
      // 4. Upsert documents
      
      for (const idx of docIndices) {
        const docId = formData.get(`documents[${idx}][id]`);
        const type = formData.get(`documents[${idx}][type]`) as string;
        let issueDate = formData.get(`documents[${idx}][issue_date]`) as string;
        let expiryDate = formData.get(`documents[${idx}][expiry_date]`) as string;
        if (!issueDate) issueDate = new Date().toISOString().split('T')[0];
        if (!expiryDate) expiryDate = "";
        const file = formData.get(`documents[${idx}][file]`);
        if (docId && existingDocIds.has(docId.toString())) {
          // Update existing document
          if (file && file instanceof File && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = file.name;
            const mimeType = file.type;
            await sql`
              UPDATE documents
              SET type = ${type}, document_type = ${type}, file_data = ${buffer}, file_name = ${fileName}, mime_type = ${mimeType}, issue_date = ${issueDate}, expiry_date = ${expiryDate || null}
              WHERE id = ${docId}
            `;
          } else {
            await sql`
              UPDATE documents
              SET type = ${type}, document_type = ${type}, issue_date = ${issueDate}, expiry_date = ${expiryDate || null}
              WHERE id = ${docId}
            `;
          }
        } else if (file && file instanceof File && file.size > 0) {
          // Insert new document
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = file.name;
          const mimeType = file.type;
          await sql`
            INSERT INTO documents (equipment_id, file_data, file_name, mime_type, document_type, type, issue_date, expiry_date)
            VALUES (${id}, ${buffer}, ${fileName}, ${mimeType}, ${type}, ${type}, ${issueDate}, ${expiryDate || null})
          `;
        }
      }
    
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
