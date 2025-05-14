import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, contact_person, email, phone, address } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    // Insert new client
    const result = await sql`
      INSERT INTO clients (name, contact_person, email, phone, address)
      VALUES (${name}, ${contact_person || null}, ${email || null}, ${phone || null}, ${address || null})
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const clients = await sql`SELECT * FROM clients ORDER BY name`
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
