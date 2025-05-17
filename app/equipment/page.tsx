import { Button } from "@/components/ui/button"
import { executeQuery } from "@/lib/db"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Plus, PlusCircle, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/DataTable"
import { Equipment, equipmentColumns } from "@/components/equipmentColumns"
async function getEquipment(): Promise<Equipment[]> {
  try {
    // Use tagged template literal syntax (no parentheses)
    const rows = await executeQuery`
      SELECT
        e.id,
        e.gondola_number,
        e.motor_serial_number,
        (
          SELECT COUNT(*) FROM rentals r WHERE r.equipment_id = e.id AND r.status = 'active'
        ) AS active_rentals,
        (
          SELECT COUNT(*) FROM documents d WHERE d.equipment_id = e.id AND d.expiry_date > CURRENT_DATE
        ) AS valid_documents
      FROM equipment e
      ORDER BY e.gondola_number
    `
    return rows as Equipment[]
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return []
  }
}

export default async function EquipmentPage() {
  const equipment = await getEquipment()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
      <span>Total Equipments:{equipment?.length || 0}</span>
        <Link href="/equipment/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </Link>
      </div>

      {/* <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gondola #</TableHead>
              <TableHead>Motor Serial</TableHead>
              <TableHead className="text-center">Active Rentals</TableHead>
              <TableHead className="text-center">Valid Documents</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length > 0 ? (
              equipment.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.gondola_number}</TableCell>
                  <TableCell>{item.motor_serial_number}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.active_rentals > 0 ? "default" : "outline"} className="text-xs">
                      {item.active_rentals}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.valid_documents > 0 ? "secondary" : "outline"} className="text-xs">
                      {item.valid_documents}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/equipment/${item.id}`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      <Link href={`/rentals/new?equipment_id=${item.id}`}>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <PlusCircle className="h-4 w-4" />
                          <span className="sr-only">Rental</span>
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No equipment found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div> */}
      
        <DataTable<Equipment, unknown>
          columns={equipmentColumns}
          data={equipment}
          searchColumn="gondola_number"
          searchPlaceholder="Search by gondola number..."
          pageSize={5}
        />
      
    </div>
  )
}
