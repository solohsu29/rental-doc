import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getRentals() {
  const rentals = await sql`
    SELECT r.*, c.name as client_name, e.gondola_number
    FROM rentals r
    JOIN clients c ON r.client_id = c.id
    JOIN equipment e ON r.equipment_id = e.id
    ORDER BY 
      CASE WHEN r.status = 'active' THEN 1 ELSE 2 END,
      r.start_date DESC
  `

  return rentals
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
        <h1 className="text-3xl font-bold">Rentals</h1>
        <Link href="/rentals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Rental
          </Button>
        </Link>
      </div>

      {rentalsByStatus.active.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium">
                <div>Equipment</div>
                <div>Client</div>
                <div>Site Location</div>
                <div>Start Date</div>
                <div>Duration</div>
                <div>Hire Status</div>
              </div>
              {rentalsByStatus.active.map((rental: any) => {
                const startDate = new Date(rental.start_date)
                const today = new Date()
                const durationInDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <Link href={`/rentals/${rental.id}`} key={rental.id}>
                    <div className="grid grid-cols-6 gap-4 border-t p-4 hover:bg-muted/50">
                      <div>{rental.gondola_number}</div>
                      <div>{rental.client_name}</div>
                      <div>{rental.site_location}</div>
                      <div>{formatDate(rental.start_date)}</div>
                      <div>{durationInDays} days</div>
                      <div>
                        <Badge variant={rental.status === 'active' ? 'default' : 'destructive'}>
                          {rental.status === 'active' ? 'On Hire' : 'Off Hire'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {rentalsByStatus.completed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completed Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium">
                <div>Equipment</div>
                <div>Client</div>
                <div>Site Location</div>
                <div>Start Date</div>
                <div>End Date</div>
                <div>Hire Status</div>
              </div>
              {rentalsByStatus.completed.map((rental: any) => (
                <Link href={`/rentals/${rental.id}`} key={rental.id}>
                  <div className="grid grid-cols-6 gap-4 border-t p-4 hover:bg-muted/50">
                    <div>{rental.gondola_number}</div>
                    <div>{rental.client_name}</div>
                    <div>{rental.site_location}</div>
                    <div>{formatDate(rental.start_date)}</div>
                    <div>{formatDate(rental.end_date)}</div>
                    <div>
                      <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                        {rental.status === 'active' ? 'On Hire' : 'Off Hire'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rentalsByStatus.active.length === 0 && rentalsByStatus.completed.length === 0 && (
        <p className="text-center text-muted-foreground">No rentals found. Create your first rental to get started.</p>
      )}
    </div>
  )
}
