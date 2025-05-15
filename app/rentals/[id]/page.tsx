import { executeQuery } from "@/lib/db"
import { notFound } from "next/navigation"

async function getRental(id: string) {
  try {
    const rental = await executeQuery`
      SELECT r.*, c.name as client_name, e.gondola_number, e.motor_serial_number
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ${id}
    `
    if (rental.length === 0) return null
    return rental[0]
  } catch (error) {
    console.error("Error fetching rental:", error)
    return null
  }
}

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await getRental(id);
  if (!rental) return notFound()

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-bold">Rental Detail</h1>
  <a href={`/rentals/${id}/edit`}>
    <button className="px-4 py-2 bg-black text-white rounded hover:bg-black">Edit</button>
  </a>
</div>
      <div className="border rounded p-4 space-y-2">
        <div><b>Client:</b> {rental.client_name}</div>
        <div><b>Equipment:</b> {rental.gondola_number} ({rental.motor_serial_number})</div>
        <div><b>Status:</b> {rental.status}</div>
        <div><b>Start Date:</b> {rental.start_date instanceof Date ? rental.start_date.toLocaleDateString() : (typeof rental.start_date === 'string' ? rental.start_date.split('T')[0] : '-')}</div>
        <div><b>End Date:</b> {rental.end_date ? (rental.end_date instanceof Date ? rental.end_date.toLocaleDateString() : (typeof rental.end_date === 'string' ? rental.end_date.split('T')[0] : '-')) : '-'}</div>
        <div><b>Notes:</b> {rental.notes || "-"}</div>
      </div>
    </div>
  )
}
