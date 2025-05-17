import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/DataTable"
import { Shift, shiftColumns } from "@/components/shiftColumns"
import { executeQuery } from "@/lib/db"

async function getShifts(): Promise<Shift[]> {
  const shifts = await executeQuery`
    SELECT s.*, e.gondola_number, r.site_location
    FROM shifts s
    JOIN equipment e ON s.equipment_id = e.id
    JOIN rentals r ON s.rental_id = r.id
    ORDER BY s.shift_date DESC
  `
  return shifts as Shift[]
}

export default async function ShiftsPage() {
  const shifts = await getShifts()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span>Total Shifts:{shifts?.length || 0}</span>
        <Link href="/shifts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Shift
          </Button>
        </Link>
      </div>
      <DataTable<Shift, unknown>
        columns={shiftColumns}
        data={shifts}
        searchColumn="gondola_number"
        searchPlaceholder="Search by equipment..."
        pageSize={5}
      />
    </div>
  )
}
