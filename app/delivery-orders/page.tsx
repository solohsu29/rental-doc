import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/db"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getDeliveryOrders() {
  const deliveryOrders = await sql`
    SELECT d.*, r.site_location, c.name as client_name, e.gondola_number
    FROM delivery_orders d
    JOIN rentals r ON d.rental_id = r.id
    JOIN clients c ON r.client_id = c.id
    JOIN equipment e ON r.equipment_id = e.id
    ORDER BY d.do_date DESC
  `

  return deliveryOrders
}

export default async function DeliveryOrdersPage() {
  const deliveryOrders = await getDeliveryOrders()

  // Group delivery orders by type
  const ordersByType: Record<string, any[]> = {}
  deliveryOrders.forEach((order: any) => {
    if (!ordersByType[order.do_type]) {
      ordersByType[order.do_type] = []
    }
    ordersByType[order.do_type].push(order)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Orders</h1>
        <Link href="/delivery-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery Order
          </Button>
        </Link>
      </div>

      {Object.keys(ordersByType).length > 0 ? (
        Object.entries(ordersByType).map(([type, orders]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="capitalize">{type} Delivery Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium">
                  <div>DO Number</div>
                  <div>Date</div>
                  <div>Equipment</div>
                  <div>Client</div>
                  <div>Site Location</div>
                </div>
                {orders.map((order: any) => (
                  <Link href={`/delivery-orders/${order.id}`} key={order.id}>
                    <div className="grid grid-cols-5 gap-4 border-t p-4 hover:bg-muted/50">
                      <div>{order.do_number}</div>
                      <div>{formatDate(order.do_date)}</div>
                      <div>{order.gondola_number}</div>
                      <div>{order.client_name}</div>
                      <div>{order.site_location}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground">
          No delivery orders found. Create your first delivery order to get started.
        </p>
      )}
    </div>
  )
}
