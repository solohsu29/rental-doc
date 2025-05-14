import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const equipment = await executeQuery`
      SELECT * FROM equipment
      ORDER BY gondola_number
    `
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { gondola_number, motor_serial_number, equipment_type, status, current_location, notes } = body

    const result = await executeQuery`
      INSERT INTO equipment (
        gondola_number, 
        motor_serial_number, 
        equipment_type, 
        status, 
        current_location, 
        notes
      ) 
      VALUES (
        ${gondola_number}, 
        ${motor_serial_number}, 
        ${equipment_type}, 
        ${status || "available"}, 
        ${current_location || null}, 
        ${notes || null}
      )
      RETURNING id
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}
