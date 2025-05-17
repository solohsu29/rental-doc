"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"

export interface Client {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  active_rentals: number
}

export const clientColumns: ColumnDef<Client, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "contact_person",
    header: "Contact Person",
    cell: ({ row }) => row.getValue("contact_person") || "N/A",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "N/A",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "N/A",
  },
  {
    accessorKey: "active_rentals",
    header: "Active Rentals",
    cell: ({ row }) => <div className="text-center">{row.getValue("active_rentals")}</div>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Link href={`/clients/${row.original.id}`}>
          <Button size="sm" variant="outline">
            View
          </Button>
        </Link>
      </div>
    ),
  },
]
