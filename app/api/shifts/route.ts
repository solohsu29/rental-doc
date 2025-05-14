import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { rental_id, equipment_id, shift_date, bay, elevation, block, floor, cos_issued, notes } = body

    // Validate required fields
    if (!rental_id || !equipment_id || !shift_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert new shift
    const result = await sql`
      INSERT INTO shifts (rental_id, equipment_id, shift_date, bay, elevation, block, floor, cos_issued, notes)
      VALUES (${rental_id}, ${equipment_id}, ${shift_date}, ${bay || null}, ${elevation || null}, ${block || null}, ${floor || null}, ${cos_issued || false}, ${notes || null})
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating shift:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const shifts = await sql`
      SELECT s.*, e.gondola_number, r.site_location
      FROM shifts s
      JOIN equipment e ON s.equipment_id = e.id
      JOIN rentals r ON s.rental_id = r.id
      ORDER BY s.shift_date DESC
    `
    return NextResponse.json(shifts)
  } catch (error) {
    console.error("Error fetching shifts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
