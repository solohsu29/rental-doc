import { Button } from "@/components/ui/button"
import { executeQuery } from "@/lib/db"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Plus, PlusCircle, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import EquipmentTableClient from "@/components/EquipmentTableClient"
import { Equipment } from "@/components/equipmentColumns"
async function getEquipment(): Promise<Equipment[]> {
  try {
    // Use tagged template literal syntax (no parentheses)
    const rows = await executeQuery`
      SELECT
        e.id,
        e.gondola_number,
        e.motor_serial_number,
        e.equipment_type,
        e.status,
        e.current_location,
        e.notes,
        (
          SELECT COUNT(*) FROM rentals r WHERE r.equipment_id = e.id AND r.status = 'active'
        ) AS active_rentals,
        (
          SELECT COUNT(*) FROM documents d WHERE d.equipment_id = e.id AND d.expiry_date > CURRENT_DATE
        ) AS valid_documents,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', d.id,
              'file_name', d.file_name,
              'mime_type', d.mime_type,
              'document_type', d.document_type,
              'type', d.type,
              'issue_date', d.issue_date,
              'expiry_date', d.expiry_date
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM equipment e
      LEFT JOIN documents d ON d.equipment_id = e.id
      GROUP BY e.id
      ORDER BY e.gondola_number
    `;
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

    
      
        <EquipmentTableClient data={equipment} />
      
    </div>
  )
}
