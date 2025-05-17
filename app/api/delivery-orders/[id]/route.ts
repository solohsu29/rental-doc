import { executeQueryWithRetry as executeQuery, executeQueryWithRetry as sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    // Join with rentals, clients, equipment for detail
    const result = await executeQuery`
      SELECT d.*, r.site_location, c.name as client_name, e.gondola_number
      FROM delivery_orders d
      JOIN rentals r ON d.rental_id = r.id
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE d.id = ${id}
    `;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Delivery order not found" }, { status: 404 });
    }
    let deliveryOrder = result[0];
    // Parse documents
    let documents: any[] = [];
    if (deliveryOrder.documents) {
      let docIds = deliveryOrder.documents;
      if (typeof docIds === "string") {
        try { docIds = JSON.parse(docIds); } catch {}
      }
      if (Array.isArray(docIds) && docIds.length > 0) {
        documents = await executeQuery`
          SELECT id, document_type, file_name, issue_date, expiry_date, notes FROM documents WHERE id = ANY(${docIds})
        `;
      }
    }
    deliveryOrder.documents = documents;
    return NextResponse.json(deliveryOrder);
  } catch (error) {
    console.error("Error fetching delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const do_date = formData.get("do_date");
      const notes = formData.get("notes");
      const documents = formData.get("documents"); // JSON string of doc IDs
      const site_location = formData.get("site_location");
      const end_date = formData.get("end_date");
      // Handle file uploads
      const files = formData.getAll("files");
      let uploadedDocumentIds: number[] = [];
      for (const file of files) {
        if (typeof file === "object" && file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          // Insert document record with file_data and file_name
          // You must supply a valid document_type and equipment_id if required by your schema.
          // For this example, we'll use 'uploaded' as the document_type and leave equipment_id null (change as needed):
          let document_type = formData.get("document_type") || "uploaded";
          let equipment_id = formData.get("equipment_id") || null;
          try {
            const docRes = await executeQuery`
              INSERT INTO documents (equipment_id, document_type, issue_date, file_data, file_name)
              VALUES (${equipment_id ? Number(equipment_id) : null}, ${document_type}, ${new Date().toISOString().slice(0, 10)}, ${buffer}, ${file.name}) RETURNING id
            `;
            if (docRes && docRes[0] && docRes[0].id) {
              uploadedDocumentIds.push(docRes[0].id);
            } else {
              console.error('Failed to insert document or no id returned:', docRes);
              return NextResponse.json({ error: "Failed to upload document (no id returned)" }, { status: 500 });
            }
          } catch (insertError) {
            console.error('SQL insert error:', insertError);
            return NextResponse.json({ error: "Failed to upload document (SQL error)" }, { status: 500 });
          }
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
      // Update delivery order
      await executeQuery`
        UPDATE delivery_orders
        SET do_date = ${do_date}, notes = ${notes}, documents = ${docIds.length > 0 ? JSON.stringify(docIds) : null}
        WHERE id = ${id}
      `;
      // Update site_location and/or equipment_id in rentals if provided
      const rentalResult = await executeQuery`SELECT rental_id FROM delivery_orders WHERE id = ${id}`;
      if (rentalResult && rentalResult[0] && rentalResult[0].rental_id) {
        const rentalId = rentalResult[0].rental_id;
        if (site_location !== undefined) {
          await executeQuery`UPDATE rentals SET site_location = ${site_location} WHERE id = ${rentalId}`;
        }
        if (formData.get("equipment_id") !== undefined) {
          await executeQuery`UPDATE rentals SET equipment_id = ${formData.get("equipment_id") as string} WHERE id = ${rentalId}`;
        }
        if (end_date) {
          await executeQuery`UPDATE rentals SET end_date = ${end_date} WHERE id = ${rentalId}`;
        }
      }
      return NextResponse.json({ success: true });
    } else {
      // Fallback for old JSON-only requests
      const body = await request.json();
      const { do_date, notes, documents, site_location, end_date } = body;
      await executeQuery`
        UPDATE delivery_orders
        SET do_date = ${do_date}, notes = ${notes}, documents = ${documents ? JSON.stringify(documents) : null}
        WHERE id = ${id}
      `;
      // Update site_location and/or equipment_id in rentals if provided
      const rentalResult = await executeQuery`SELECT rental_id FROM delivery_orders WHERE id = ${id}`;
      if (rentalResult && rentalResult[0] && rentalResult[0].rental_id) {
        const rentalId = rentalResult[0].rental_id;
        if (site_location !== undefined) {
          await executeQuery`UPDATE rentals SET site_location = ${site_location} WHERE id = ${rentalId}`;
        }
        if (body.equipment_id !== undefined) {
          await executeQuery`UPDATE rentals SET equipment_id = ${body.equipment_id} WHERE id = ${rentalId}`;
        }
        if (end_date) {
          await executeQuery`UPDATE rentals SET end_date = ${end_date} WHERE id = ${rentalId}`;
        }
      }
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
