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

      <table className="min-w-full bg-white border rounded shadcn-table">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Contact Person</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Phone</th>
            <th className="px-4 py-2 border">Active Rentals</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length > 0 ? (
            clients.map((client: any) => (
              <tr key={client.id} className="hover:bg-muted/50">
                <td className="px-4 py-2 border">{client.name}</td>
                <td className="px-4 py-2 border">{client.contact_person || "N/A"}</td>
                <td className="px-4 py-2 border">{client.email || "N/A"}</td>
                <td className="px-4 py-2 border">{client.phone || "N/A"}</td>
                <td className="px-4 py-2 border text-center">{client.active_rentals}</td>
                <td className="px-4 py-2 border text-center">
                  <Link href={`/clients/${client.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-2 border text-center text-muted-foreground">No clients found. Add your first client to get started.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
