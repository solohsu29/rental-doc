"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"

export interface Rental {
  id: string
  gondola_number: string
  client_name: string
  site_location: string | null
  start_date: string
  status: string
}

export const rentalColumns: ColumnDef<Rental, unknown>[] = [
  {
    accessorKey: "gondola_number",
    header: "Equipment",
    cell: ({ row }) => <span className="font-medium">{row.getValue("gondola_number")}</span>,
  },
  {
    accessorKey: "client_name",
    header: "Client",
  },
  {
    accessorKey: "site_location",
    header: "Site Location",
    cell: ({ row }) => row.getValue("site_location") || "N/A",
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => formatDate(row.getValue("start_date")),
  },
  {
    accessorKey: "status",
    header: "Hire Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "destructive"}>
        {row.getValue("status") === "active" ? "On Hire" : "Off Hire"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/rentals/${row.original.id}`}>
        <span className="underline text-blue-600 hover:text-blue-800 cursor-pointer">View</span>
      </Link>
    ),
  },
]
