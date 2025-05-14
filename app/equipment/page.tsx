import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipment.length > 0 ? (
          equipment.map((item: any) => (
            <Link href={`/equipment/${item.id}`} key={item.id}>
              <Card className="cursor-pointer hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle>{item.gondola_number}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Motor Serial:</div>
                    <div>{item.motor_serial_number}</div>

                    <div className="font-medium">Type:</div>
                    <div>{item.equipment_type}</div>

                    <div className="font-medium">Status:</div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          item.status === "available"
                            ? "bg-green-100 text-green-800"
                            : item.status === "deployed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="font-medium">Active Rentals:</div>
                    <div>{item.active_rentals}</div>

                    <div className="font-medium">Valid Documents:</div>
                    <div>{item.valid_documents}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="col-span-3 text-center text-muted-foreground">
            No equipment found. Add your first equipment to get started.
          </p>
        )}
      </div>
    </div>
  )
}
