import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/rentals/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
  }
  try {
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        client: true,
        equipment: true,
      },
    });
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }
    return NextResponse.json(rental);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rental' }, { status: 500 });
  }
}
