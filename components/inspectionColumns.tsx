"use client"

import { CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"

export interface Inspection {
  id: string
  inspection_date: string
  gondola_number: string
  site_location: string | null
  inspector_name: string
  inspection_type: string
  is_endorsed: boolean
}

export const inspectionColumns: ColumnDef<Inspection, unknown>[] = [
  {
    accessorKey: "inspection_date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.inspection_date),
  },
  {
    accessorKey: "gondola_number",
    header: "Equipment",
  },
  {
    accessorKey: "site_location",
    header: "Site Location",
    cell: ({ row }) => row.original.site_location || "N/A",
  },
  {
    accessorKey: "inspector_name",
    header: "Inspector",
  },
  {
    accessorKey: "is_endorsed",
    header: "Endorsed",
    cell: ({ row }) => row.original.is_endorsed
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/inspections/${row.original.id}`}>
        <Button size="sm" variant="outline">View</Button>
      </Link>
    ),
  },
]
