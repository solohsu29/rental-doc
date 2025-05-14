import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { CheckCircle, Plus, XCircle } from "lucide-react"
import Link from "next/link"

async function getInspections() {
  const inspections = await sql`
    SELECT i.*, e.gondola_number, c.name as client_name, r.site_location
    FROM inspections i
    JOIN equipment e ON i.equipment_id = e.id
    JOIN rentals r ON i.rental_id = r.id
    JOIN clients c ON r.client_id = c.id
    ORDER BY i.inspection_date DESC
  `

  return inspections
}

export default async function InspectionsPage() {
  const inspections = await getInspections()

  // Group inspections by type
  const inspectionsByType: Record<string, any[]> = {}
  inspections.forEach((inspection: any) => {
    if (!inspectionsByType[inspection.inspection_type]) {
      inspectionsByType[inspection.inspection_type] = []
    }
    inspectionsByType[inspection.inspection_type].push(inspection)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inspections</h1>
        <Link href="/inspections/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Inspection
          </Button>
        </Link>
      </div>

      {Object.keys(inspectionsByType).length > 0 ? (
        Object.entries(inspectionsByType).map(([type, inspections]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="capitalize">{type} Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium">
                  <div>Date</div>
                  <div>Equipment</div>
                  <div>Site Location</div>
                  <div>Inspector</div>
                  <div>Endorsed</div>
                </div>
                {inspections.map((inspection: any) => (
                  <Link href={`/inspections/${inspection.id}`} key={inspection.id}>
                    <div className="grid grid-cols-5 gap-4 border-t p-4 hover:bg-muted/50">
                      <div>{formatDate(inspection.inspection_date)}</div>
                      <div>{inspection.gondola_number}</div>
                      <div>{inspection.site_location}</div>
                      <div>{inspection.inspector_name}</div>
                      <div>
                        {inspection.is_endorsed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground">
          No inspections found. Add your first inspection to get started.
        </p>
      )}
    </div>
  )
}
