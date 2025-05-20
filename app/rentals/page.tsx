import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { executeQuery, formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

import RentalsTableClient from "@/components/RentalsTableClient"
import { Rental } from "@/components/rentalColumns"

async function getRentals(): Promise<Rental[]> {
  const rentals = await executeQuery`
    SELECT
      r.*,
      c.name as client_name,
      e.gondola_number,
      e.motor_serial_number,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', d.id,
            'file_name', d.file_name,
            'mime_type', d.mime_type,
            'document_type', d.document_type,
            'issue_date', d.issue_date,
            'expiry_date', d.expiry_date
          )
        ) FILTER (WHERE d.id IS NOT NULL), '[]'
      ) AS documents
    FROM rentals r
    JOIN clients c ON r.client_id = c.id
    JOIN equipment e ON r.equipment_id = e.id
    LEFT JOIN documents d ON d.rental_id = r.id
    GROUP BY r.id, c.name, e.gondola_number, e.motor_serial_number
    ORDER BY 
      CASE WHEN r.status = 'active' THEN 1 ELSE 2 END,
      r.start_date DESC
  `;
  return rentals as Rental[];
}


export default async function RentalsPage() {
  const rentals = await getRentals()

  // Group rentals by status
  const rentalsByStatus: Record<string, any[]> = {
    "on hire": [],
    "off hire": [],
    other: [],
  }

  rentals.forEach((rental: any) => {
    if (rentalsByStatus[rental.status]) {
      rentalsByStatus[rental.status].push(rental)
    } else {
      rentalsByStatus.other.push(rental)
    }
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

      <RentalsTableClient data={rentals} />

      {rentals.length === 0 && (
        <p className="text-center text-muted-foreground">No rentals found. Create your first rental to get started.</p>
      )}
    </div>
  )
}
