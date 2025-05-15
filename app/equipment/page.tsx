import { Button } from "@/components/ui/button"
import { executeQuery } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getEquipment() {
  try {
    // Use tagged template literal syntax (no parentheses)
    const equipment = await executeQuery`
      SELECT e.*, 
        (SELECT COUNT(*) FROM rentals r WHERE r.equipment_id = e.id AND r.status = 'active') as active_rentals,
        (SELECT COUNT(*) FROM documents d WHERE d.equipment_id = e.id) as valid_documents
      FROM equipment e
      ORDER BY e.gondola_number
    `

    return equipment
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return []
  }
}

export default async function EquipmentPage() {
  const equipment = await getEquipment()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipment</h1>
        <Link href="/equipment/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </Link>
      </div>

      <table className="min-w-full bg-white border rounded">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Gondola #</th>
            <th className="px-4 py-2 border">Motor Serial</th>
            <th className="px-4 py-2 border">Active Rentals</th>
            <th className="px-4 py-2 border">Valid Documents</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.length > 0 ? (
            equipment.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-100">
                <td className="px-4 py-2 border">{item.gondola_number}</td>
                <td className="px-4 py-2 border">{item.motor_serial_number}</td>
                <td className="px-4 py-2 border text-center">{item.active_rentals}</td>
                <td className="px-4 py-2 border text-center">{item.valid_documents}</td>
                <td className="px-4 py-2 border text-center">
                  <Link href={`/equipment/${item.id}`}>
                    <Button size="sm" variant="outline" className="mr-2">View</Button>
                  </Link>
                  <Link href={`/rentals/new?equipment_id=${item.id}`}>
                    <Button size="sm" variant="secondary">Rental</Button>
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-2 border text-center text-muted-foreground">No equipment found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
