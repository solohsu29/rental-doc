import { executeQueryWithRetry as sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { equipment_id, client_id, site_location, start_date, end_date, monthly_rate, notes } = body

    // Validate required fields
    if (!equipment_id || !client_id || !site_location || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields (equipment_id, client_id, site_location, start_date, end_date)" }, { status: 400 })
    }

    // Check if equipment is available
    const equipment = await sql`
      SELECT * FROM equipment WHERE id = ${equipment_id}
    `

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    if (equipment[0].status !== "available") {
      return NextResponse.json({ error: "Equipment is not available for rental" }, { status: 400 })
    }

    // Insert new rental
    const result = await sql`
      INSERT INTO rentals (equipment_id, client_id, site_location, start_date, end_date, monthly_rate, notes, status)
      VALUES (${equipment_id}, ${client_id}, ${site_location}, ${start_date}, ${end_date}, ${monthly_rate || null}, ${notes || null}, 'active')
      RETURNING id
    `

    // Update equipment status
    await sql`
      UPDATE equipment SET status = 'deployed', current_location = ${site_location}
      WHERE id = ${equipment_id}
    `

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating rental:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rentals = await sql`
      SELECT r.*, c.name as client_name, e.gondola_number, e.motor_serial_number
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      ORDER BY r.start_date DESC
    `
    return NextResponse.json(rentals)
  } catch (error) {
    console.error("Error fetching rentals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
