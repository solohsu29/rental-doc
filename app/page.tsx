import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { executeQuery, formatDate } from "@/lib/db"
import { AlertCircle, CheckCircle, Clock, Package } from "lucide-react"
import Link from "next/link"

async function getStats() {
  try {
    const equipmentCount = await executeQuery`SELECT COUNT(*) FROM equipment`
    const activeRentals = await executeQuery`SELECT COUNT(*) FROM rentals WHERE status = 'active'`
    const expiringDocuments = await executeQuery`
      SELECT COUNT(*) FROM documents 
      WHERE expiry_date IS NOT NULL 
      AND expiry_date > CURRENT_DATE 
      AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    `
    const pendingInspections = await executeQuery`
      SELECT COUNT(*) FROM inspections 
      WHERE is_endorsed = false
    `

    return {
      equipmentCount: Number.parseInt(equipmentCount[0]?.count || "0"),
      activeRentals: Number.parseInt(activeRentals[0]?.count || "0"),
      expiringDocuments: Number.parseInt(expiringDocuments[0]?.count || "0"),
      pendingInspections: Number.parseInt(pendingInspections[0]?.count || "0"),
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      equipmentCount: 0,
      activeRentals: 0,
      expiringDocuments: 0,
      pendingInspections: 0,
    }
  }
}

async function getRecentRentals() {
  try {
    const rentals = await executeQuery`
      SELECT r.id, r.start_date, r.site_location, c.name as client_name, e.gondola_number
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.status = 'active'
      ORDER BY r.start_date DESC
      LIMIT 5
    `

    return rentals
  } catch (error) {
    console.error("Error fetching recent rentals:", error)
    return []
  }
}

async function getExpiringDocuments() {
  try {
    const documents = await executeQuery`
      SELECT d.id, d.document_type, d.expiry_date, e.gondola_number
      FROM documents d
      JOIN equipment e ON d.equipment_id = e.id
      WHERE d.expiry_date IS NOT NULL 
      AND d.expiry_date > CURRENT_DATE 
      AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY d.expiry_date ASC
      LIMIT 5
    `

    return documents
  } catch (error) {
    console.error("Error fetching expiring documents:", error)
    return []
  }
}

export default async function Dashboard() {
  const stats = await getStats()
  const recentRentals = await getRecentRentals()
  const expiringDocuments = await getExpiringDocuments()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.equipmentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRentals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Documents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInspections}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rentals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rentals">Recent Rentals</TabsTrigger>
          <TabsTrigger value="documents">Expiring Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="rentals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Rentals</CardTitle>
              <CardDescription>Recently deployed equipment and active rentals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentRentals.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium">
                    <div>Gondola Number</div>
                    <div>Client</div>
                    <div>Site Location</div>
                    <div>Start Date</div>
                  </div>
                  {recentRentals.map((rental: any) => (
                    <div key={rental.id} className="grid grid-cols-4 gap-4 border-t p-4">
                      <div>{rental.gondola_number}</div>
                      <div>{rental.client_name}</div>
                      <div>{rental.site_location}</div>
                      <div>{formatDate(rental.start_date)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No active rentals found.</p>
              )}
              <div className="mt-2">
                <Link href="/rentals" className="text-sm text-blue-600 hover:underline">
                  View all rentals
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Documents</CardTitle>
              <CardDescription>Documents expiring within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiringDocuments.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 gap-4 p-4 font-medium">
                    <div>Document Type</div>
                    <div>Equipment</div>
                    <div>Expiry Date</div>
                  </div>
                  {expiringDocuments.map((doc: any) => (
                    <div key={doc.id} className="grid grid-cols-3 gap-4 border-t p-4">
                      <div>{doc.document_type}</div>
                      <div>{doc.gondola_number}</div>
                      <div>{formatDate(doc.expiry_date)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No documents expiring soon.</p>
              )}
              <div className="mt-2">
                <Link href="/documents" className="text-sm text-blue-600 hover:underline">
                  View all documents
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
