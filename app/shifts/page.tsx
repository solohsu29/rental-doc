import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { CheckCircle, Plus, XCircle } from "lucide-react"
import Link from "next/link"

async function getShifts() {
  const shifts = await sql`
    SELECT s.*, e.gondola_number, r.site_location
    FROM shifts s
    JOIN equipment e ON s.equipment_id = e.id
    JOIN rentals r ON s.rental_id = r.id
    ORDER BY s.shift_date DESC
  `

  return shifts
}

export default async function ShiftsPage() {
  const shifts = await getShifts()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipment Shifts</h1>
        <Link href="/shifts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Shift
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium">
                <div>Date</div>
                <div>Equipment</div>
                <div>Site Location</div>
                <div>Position</div>
                <div>COS Issued</div>
                <div>Photos</div>
              </div>
              {shifts.map((shift: any) => (
                <Link href={`/shifts/${shift.id}`} key={shift.id}>
                  <div className="grid grid-cols-6 gap-4 border-t p-4 hover:bg-muted/50">
                    <div>{formatDate(shift.shift_date)}</div>
                    <div>{shift.gondola_number}</div>
                    <div>{shift.site_location}</div>
                    <div>
                      {shift.block && `Block ${shift.block}, `}
                      {shift.floor && `Floor ${shift.floor}, `}
                      {shift.bay && `Bay ${shift.bay}`}
                    </div>
                    <div>
                      {shift.cos_issued ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>{shift.photos ? shift.photos.length : 0} photos</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No shifts recorded. Record your first shift to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
