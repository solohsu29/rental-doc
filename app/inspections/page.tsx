import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import InspectionsTableClient from "@/components/InspectionsTableClient"
import { Inspection } from "@/components/inspectionColumns"
import { executeQuery } from "@/lib/db"

async function getInspections(): Promise<Inspection[]> {
  const inspections = await executeQuery`
    SELECT i.*, e.gondola_number, c.name as client_name, r.site_location
    FROM inspections i
    JOIN equipment e ON i.equipment_id = e.id
    JOIN rentals r ON i.rental_id = r.id
    JOIN clients c ON r.client_id = c.id
    ORDER BY i.inspection_date DESC
  `
  return inspections as Inspection[]
}

export default async function InspectionsPage() {
  const inspections = await getInspections()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span>Total Inspections:{inspections?.length || 0}</span>
        <Link href="/inspections/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Inspection
          </Button>
        </Link>
      </div>
      <InspectionsTableClient data={inspections} />
    </div>
  )
}
