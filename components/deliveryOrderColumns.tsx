"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Trash } from "lucide-react"

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
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    cell: ({ row, table }) => (
      <div className="flex gap-2">
        
        <Link href={`/delivery-orders/${row.original.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
        </Link>
      
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.options.meta?.onDelete?.([row.original.id])}
        >
          <Trash className="h-4 w-4"/>
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    ),
  },
];
