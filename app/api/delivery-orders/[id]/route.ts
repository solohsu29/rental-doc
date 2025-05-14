import { sql, executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = await context;
  const { id } = params;
  try {
    const { id } = params;
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
          SELECT id, document_type, file_path FROM documents WHERE id = ANY(${docIds})
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
  const { params } = await context;
  const { id } = params;
  try {
    const { id } = params;
    const body = await request.json();
    const { do_date, notes, documents, site_location } = body;
    // Update delivery order
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
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
