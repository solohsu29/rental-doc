import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getClients() {
  const clients = await sql`
    SELECT c.*, 
      (SELECT COUNT(*) FROM rentals r WHERE r.client_id = c.id AND r.status = 'active') as active_rentals
    FROM clients c
    ORDER BY c.name
  `

  return clients
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.length > 0 ? (
          clients.map((client: any) => (
            <Link href={`/clients/${client.id}`} key={client.id}>
              <Card className="cursor-pointer hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle>{client.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Contact:</div>
                    <div>{client.contact_person || "N/A"}</div>

                    <div className="font-medium">Email:</div>
                    <div>{client.email || "N/A"}</div>

                    <div className="font-medium">Phone:</div>
                    <div>{client.phone || "N/A"}</div>

                    <div className="font-medium">Active Rentals:</div>
                    <div>{client.active_rentals}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="col-span-3 text-center text-muted-foreground">
            No clients found. Add your first client to get started.
          </p>
        )}
      </div>
    </div>
  )
}
