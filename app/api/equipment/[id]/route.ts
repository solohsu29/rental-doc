import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const equipment = await sql`
      SELECT * FROM equipment WHERE id = ${id}
    `

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    return NextResponse.json(equipment[0])
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    const { gondola_number, motor_serial_number, equipment_type, status, current_location, notes } = body

    // Validate required fields
    if (!gondola_number || !motor_serial_number || !equipment_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if equipment exists
    const existingEquipment = await sql`
      SELECT * FROM equipment WHERE id = ${id}
    `

    if (existingEquipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Update equipment
    await sql`
      UPDATE equipment
      SET 
        gondola_number = ${gondola_number},
        motor_serial_number = ${motor_serial_number},
        equipment_type = ${equipment_type},
        status = ${status || "available"},
        current_location = ${current_location || null},
        notes = ${notes || null}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating equipment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
