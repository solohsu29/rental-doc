import { executeQueryWithRetry as sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      rental_id,
      equipment_id,
      inspection_date,
      inspection_type,
      inspector_name,
      client_safety_officer,
      is_endorsed,
      is_chargeable,
      charge_amount,
      notes,
    } = body

    // Validate required fields
    if (!rental_id || !equipment_id || !inspection_date || !inspection_type || !inspector_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert new inspection
    const result = await sql`
      INSERT INTO inspections (
        rental_id, 
        equipment_id, 
        inspection_date, 
        inspection_type, 
        inspector_name, 
        client_safety_officer, 
        is_endorsed, 
        is_chargeable, 
        charge_amount, 
        notes
      )
      VALUES (
        ${rental_id}, 
        ${equipment_id}, 
        ${inspection_date}, 
        ${inspection_type}, 
        ${inspector_name}, 
        ${client_safety_officer || null}, 
        ${is_endorsed || false}, 
        ${is_chargeable || false}, 
        ${charge_amount || null}, 
        ${notes || null}
      )
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const inspections = await sql`
      SELECT i.*, e.gondola_number, c.name as client_name, r.site_location
      FROM inspections i
      JOIN equipment e ON i.equipment_id = e.id
      JOIN rentals r ON i.rental_id = r.id
      JOIN clients c ON r.client_id = c.id
      ORDER BY i.inspection_date DESC
    `
    return NextResponse.json(inspections)
  } catch (error) {
    console.error("Error fetching inspections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
