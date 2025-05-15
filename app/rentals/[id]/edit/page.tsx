import { executeQuery } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

async function updateRental(id: string, formData: FormData) {
  "use server"
  const status = formData.get("status") as string
  const end_date = formData.get("end_date") as string
  const notes = formData.get("notes") as string
  await executeQuery`
    UPDATE rentals SET status = ${status}, end_date = ${end_date}, notes = ${notes}
    WHERE id = ${id}
  `
  revalidatePath(`/rentals/${id}`)
  redirect(`/rentals/${id}`)
}

export default async function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await getRental(id);
  if (!rental) return notFound()

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Rental</h1>
      <form action={updateRental.bind(null, params.id)} className="space-y-4">
        <div>
          <label className="block font-medium">Status</label>
          <select name="status" defaultValue={rental.status} className="border rounded px-2 py-1">
            <option value="active">Active</option>
            <option value="completed">Completed (Offhire)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">End Date</label>
          <input type="date" name="end_date" defaultValue={rental.end_date ? rental.end_date.split('T')[0] : ''} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block font-medium">Notes</label>
          <textarea name="notes" defaultValue={rental.notes || ''} className="border rounded px-2 py-1 w-full" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Link href={`/rentals/${params.id}`}><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  )
}
