import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry as sql } from "@/lib/db";


// GET /api/rentals/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
  }
  try {
    const rentalRows = await sql`
      SELECT r.*, c.*, e.*
      FROM rentals r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ${id}
    `;
    if (!rentalRows || rentalRows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }
    // You may want to format the result to match your API shape. For now, return the joined row.
    return NextResponse.json(rentalRows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rental' }, { status: 500 });
  }
}
