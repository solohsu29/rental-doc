import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/DataTable"
import { DeliveryOrder, deliveryOrderColumns } from "@/components/deliveryOrderColumns"
import { executeQuery } from "@/lib/db"


async function getDeliveryOrders(): Promise<DeliveryOrder[]> {
  const deliveryOrders = await executeQuery`
    SELECT d.*, r.site_location, r.start_date, r.end_date, c.name as client_name, e.gondola_number
    FROM delivery_orders d
    JOIN rentals r ON d.rental_id = r.id
    JOIN clients c ON r.client_id = c.id
    JOIN equipment e ON r.equipment_id = e.id
    ORDER BY d.do_date DESC
  `;
  return deliveryOrders as DeliveryOrder[]
}


export default async function DeliveryOrdersPage() {
  const deliveryOrders = await getDeliveryOrders()

  console.log('deliver',deliveryOrders)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span>Total Delivery Orders:{deliveryOrders?.length || 0}</span>
        <Link href="/delivery-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery Order
          </Button>
        </Link>
      </div>
      <DataTable<DeliveryOrder, unknown>
        columns={deliveryOrderColumns}
        data={deliveryOrders}
        searchColumn="do_number"
        searchPlaceholder="Search by DO number..."
        pageSize={5}
      />
         </div>
  )}