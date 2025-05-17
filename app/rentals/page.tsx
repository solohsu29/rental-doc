import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

import { DataTable } from "@/components/DataTable"
import { Rental, rentalColumns } from "@/components/rentalColumns"

async function getRentals(): Promise<Rental[]> {
  const rentals = await sql`
    SELECT r.*, c.name as client_name, e.gondola_number
    FROM rentals r
    JOIN clients c ON r.client_id = c.id
    JOIN equipment e ON r.equipment_id = e.id
    ORDER BY 
      CASE WHEN r.status = 'active' THEN 1 ELSE 2 END,
      r.start_date DESC
  `

  return rentals as Rental[]
}

export default async function RentalsPage() {
  const rentals = await getRentals()

  // Group rentals by status
  const rentalsByStatus: Record<string, any[]> = {
    active: [],
    completed: [],
    cancelled: [],
  }

  rentals.forEach((rental: any) => {
    rentalsByStatus[rental.status].push(rental)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
      <span>Total Rentals:{rentals?.length || 0}</span>
     
        <Link href="/rentals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Rental
          </Button>
        </Link>
      </div>

      <DataTable<Rental, unknown>
        columns={rentalColumns}
        data={rentals}
        searchColumn="gondola_number"
        searchPlaceholder="Search by equipment..."
        pageSize={5}
      />

      {rentalsByStatus.active.length === 0 && rentalsByStatus.completed.length === 0 && (
        <p className="text-center text-muted-foreground">No rentals found. Create your first rental to get started.</p>
      )}
    </div>
  )
}
