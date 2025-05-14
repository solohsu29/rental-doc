import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { rental_id, do_number, do_date, do_type, documents, notes } = body

    // Validate required fields
    if (!rental_id || !do_number || !do_date || !do_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if DO number already exists
    const existingDO = await sql`
      SELECT * FROM delivery_orders WHERE do_number = ${do_number}
    `

    if (existingDO.length > 0) {
      return NextResponse.json({ error: "Delivery order with this number already exists" }, { status: 400 })
    }

    // Insert new delivery order
    const result = await sql`
      INSERT INTO delivery_orders (rental_id, do_number, do_date, do_type, documents, notes)
      VALUES (${rental_id}, ${do_number}, ${do_date}, ${do_type}, ${documents ? JSON.stringify(documents) : null}, ${notes || null})
      RETURNING id
    `

    // If this is an offhire DO, update the rental status to completed
    if (do_type === "offhire") {
      await sql`
        UPDATE rentals 
        SET status = 'completed', end_date = ${do_date}
        WHERE id = ${rental_id}
      `

      // Also update the equipment status to available
      await sql`
        UPDATE equipment e
        SET status = 'available'
        FROM rentals r
        WHERE r.id = ${rental_id} AND e.id = r.equipment_id
      `
    }

    // If this is a deployment DO, update the equipment status to deployed
    if (do_type === "deployment") {
      await sql`
        UPDATE equipment e
        SET status = 'deployed'
        FROM rentals r
        WHERE r.id = ${rental_id} AND e.id = r.equipment_id
      `
    }

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating delivery order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
