"use client"

import { CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"

export interface Shift {
  id: string
  shift_date: string
  gondola_number: string
  site_location: string | null
  block?: string | null
  floor?: string | null
  bay?: string | null
  cos_issued: boolean
  photos?: any[]
}

export const shiftColumns: ColumnDef<Shift, unknown>[] = [
  {
    accessorKey: "shift_date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.shift_date),
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
    id: "position",
    header: "Position",
    cell: ({ row }) => {
      const { block, floor, bay } = row.original
      return [
        block ? `Block ${block}` : null,
        floor ? `Floor ${floor}` : null,
        bay ? `Bay ${bay}` : null,
      ].filter(Boolean).join(", ") || "-"
    },
  },
  {
    accessorKey: "cos_issued",
    header: "COS Issued",
    cell: ({ row }) => row.original.cos_issued
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />,
  },
  {
    id: "photos",
    header: "Photos",
    cell: ({ row }) => row.original.photos ? `${row.original.photos.length} photos` : "0 photos",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/shifts/${row.original.id}`}>
        <Button size="sm" variant="outline">View</Button>
      </Link>
    ),
  },
]
