"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Eye, Trash } from "lucide-react"

export interface Rental {
  id: string
  gondola_number: string
  client_name: string
  site_location: string | null
  start_date: string
  status: string
  documents?: Array<{
    id: number;
    file_name: string;
    mime_type: string;
    document_type: string;
    issue_date: string;
    expiry_date: string;
  }>;
}

export const rentalColumns: ColumnDef<Rental, unknown>[] = [
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
    cell: ({ row }) => {
      const val = row.getValue("start_date");
      return (typeof val === "string" || val instanceof Date || val === null)
        ? formatDate(val)
        : "N/A";
    },
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    cell: ({ row }) => {
      const val = row.getValue("end_date");
      return (typeof val === "string" || val instanceof Date || val === null)
        ? formatDate(val)
        : "N/A";
    },
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
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => {
      const docs = row.original.documents || [];
      if (!docs.length) return <span className="text-muted-foreground">No documents</span>;
      return (
        <div className="flex flex-col gap-1">
          {docs.map((doc: any) => (
            <a
              key={doc.id}
              href={doc.id ? `/api/documents/${doc.id}/download` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {doc.file_name || 'Document'}
            </a>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => (
      <div className="flex gap-2">
       

        <Link href={`/rentals/${row.original.id}`}>
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
]
