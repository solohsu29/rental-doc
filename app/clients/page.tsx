import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"
import ClientsTableClient from "@/components/ClientsTableClient"
import { Client } from "@/components/clientColumns"

async function getClients(): Promise<Client[]> {
  const clients = await sql`
    SELECT c.*, 
      (SELECT COUNT(*) FROM rentals r WHERE r.client_id = c.id AND r.status = 'active') as active_rentals
    FROM clients c
    ORDER BY c.name
  `

  return clients as Client[]
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
      <span>Total Clients:{clients?.length || 0}</span>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      <ClientsTableClient data={clients} />
    </div>
  )
}
