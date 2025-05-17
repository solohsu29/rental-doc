"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, PlusCircle } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

export interface Equipment {
  id: string
  gondola_number: string
  motor_serial_number: string
  active_rentals: number
  valid_documents: number
}

export const equipmentColumns: ColumnDef<Equipment, unknown>[] = [
  {
    accessorKey: "gondola_number",
    header: "Gondola #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("gondola_number")}</div>,
  },
  {
    accessorKey: "motor_serial_number",
    header: "Motor Serial",
  },
  {
    accessorKey: "active_rentals",
    header: () => <div className="text-center">Active Rentals</div>,
    cell: ({ row }) => {
      const count = row.getValue("active_rentals") as number
      return (
        <div className="text-center">
          <Badge variant={count > 0 ? "default" : "outline"} className="text-xs">
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "valid_documents",
    header: () => <div className="text-center">Valid Documents</div>,
    cell: ({ row }) => {
      const count = row.getValue("valid_documents") as number
      return (
        <div className="text-center">
          <Badge variant={count > 0 ? "secondary" : "outline"} className="text-xs">
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const equipment = row.original
      return (
        <div className="flex justify-end gap-2">
          <Link href={`/equipment/${equipment.id}`}>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Link href={`/rentals/new?equipment_id=${equipment.id}`}>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Rental</span>
            </Button>
          </Link>
        </div>
      )
    },
  },
]
