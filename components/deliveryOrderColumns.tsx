"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"

export interface DeliveryOrder {
  id: string
  do_number: string
  do_date: string
  do_type: string
  client_name: string
  gondola_number: string
  site_location: string
  status: string
}

export const deliveryOrderColumns: ColumnDef<DeliveryOrder, unknown>[] = [
  {
    accessorKey: "do_number",
    header: "DO Number",
  },
  {
    accessorKey: "do_date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.do_date),
  },
  {
    accessorKey: "do_type",
    header: "Type",
    cell: ({ row }) => row?.original?.do_type,
  },
  {
    accessorKey: "client_name",
    header: "Client",
  },
  {
    accessorKey: "gondola_number",
    header: "Equipment",
  },
  {
    accessorKey: "site_location",
    header: "Site",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.original.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{row?.original?.status}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/delivery-orders/${row.original.id}`}>
        <Button size="sm" variant="outline">View</Button>
      </Link>
    ),
  },
]
