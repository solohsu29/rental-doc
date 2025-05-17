import { executeQueryWithRetry as sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Accept multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rental_id = formData.get("rental_id");
      const do_number = formData.get("do_number");
      const do_date = formData.get("do_date");
      const do_type = formData.get("do_type");
      const notes = formData.get("notes");
      const documents = formData.get("documents"); // JSON string of doc IDs
      const end_date = formData.get("end_date");
      // Validate required fields
      if (!rental_id || !do_number || !do_date || !do_type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      // Check if DO number already exists
      const existingDO = await sql`
        SELECT * FROM delivery_orders WHERE do_number = ${do_number}
      `;
      if (existingDO.length > 0) {
        return NextResponse.json({ error: "Delivery order with this number already exists" }, { status: 400 });
      }
      // Handle file uploads
      const files = formData.getAll("files");
      let uploadedDocumentIds: number[] = [];
      for (const file of files) {
        if (typeof file === "object" && file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          // Insert document record with file_data and file_name
          const docRes = await sql`
            INSERT INTO documents (equipment_id, document_type, issue_date, file_data, file_name)
            VALUES (${null}, ${file.name}, ${new Date().toISOString().slice(0, 10)}, ${buffer}, ${file.name}) RETURNING id
          `;
          uploadedDocumentIds.push(docRes[0].id);
        }
      }
      // Combine uploaded doc IDs with selected documents
      let docIds: string[] = [];
      try {
        docIds = documents ? JSON.parse(documents as string) : [];
      } catch {
        docIds = [];
      }
      docIds = [...docIds, ...uploadedDocumentIds.map(String)];
      // Insert new delivery order
      const result = await sql`
        INSERT INTO delivery_orders (rental_id, do_number, do_date, do_type, documents, notes)
        VALUES (${rental_id}, ${do_number}, ${do_date}, ${do_type}, ${docIds.length > 0 ? JSON.stringify(docIds) : null}, ${notes || null})
        RETURNING id
      `;
      // Update rental end_date if provided
      if (end_date) {
        await sql`
          UPDATE rentals SET end_date = ${end_date} WHERE id = ${rental_id}
        `;
      }
      // If this is an offhire DO, update the rental status to completed
      if (do_type === "offhire") {
        await sql`
          UPDATE rentals 
          SET status = 'completed', end_date = ${do_date}
          WHERE id = ${rental_id}
        `;
        await sql`
          UPDATE equipment e
          SET status = 'available'
          FROM rentals r
          WHERE r.id = ${rental_id} AND e.id = r.equipment_id
        `;
      }
      // If this is a deployment DO, update the equipment status to deployed
      if (do_type === "deployment") {
        await sql`
          UPDATE equipment e
          SET status = 'deployed'
          FROM rentals r
          WHERE r.id = ${rental_id} AND e.id = r.equipment_id
        `;
      }
      return NextResponse.json({ id: result[0].id }, { status: 201 });
    } else {
      // Fallback for old JSON-only requests (should be deprecated)
      const body = await request.json();
      const { rental_id, do_number, do_date, do_type, documents, notes, end_date } = body;
      if (!rental_id || !do_number || !do_date || !do_type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      // Insert new delivery order as before
      const result = await sql`
        INSERT INTO delivery_orders (rental_id, do_number, do_date, do_type, documents, notes)
        VALUES (${rental_id}, ${do_number}, ${do_date}, ${do_type}, ${documents ? JSON.stringify(documents) : null}, ${notes || null})
        RETURNING id
      `;
      if (end_date) {
        await sql`
          UPDATE rentals SET end_date = ${end_date} WHERE id = ${rental_id}
        `;
      }
      return NextResponse.json({ id: result[0].id }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function GET() {
  try {
    const deliveryOrders = await sql`
      SELECT d.*, r.site_location, c.name as client_name, e.gondola_number
      FROM delivery_orders d
      JOIN rentals r ON d.rental_id = r.id
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      ORDER BY d.do_date DESC
    `
    return NextResponse.json(deliveryOrders)
  } catch (error) {
    console.error("Error fetching delivery orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
