"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate, getDocumentStatus } from "@/lib/db"
import type { ColumnDef } from "@tanstack/react-table"

export interface Document {
  id: string
  gondola_number: string
  document_type: string
  issue_date: string
  expiry_date: string
  file_name: string | null
}

export const documentColumns: ColumnDef<Document, unknown>[] = [
  {
    accessorKey: "gondola_number",
    header: "Equipment",
  },
  {
    accessorKey: "document_type",
    header: "Type",
  },
  {
    accessorKey: "issue_date",
    header: "Issue Date",
    cell: ({ row }) => formatDate(row.original.issue_date),
  },
  {
    accessorKey: "expiry_date",
    header: "Expiry Date",
    cell: ({ row }) => formatDate(row.original.expiry_date),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = getDocumentStatus(row.original.expiry_date)
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "valid"
              ? "bg-green-100 text-green-800"
              : status === "expiring"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    accessorKey: "file_name",
    header: "File",
    cell: ({ row }) => row.original.file_name ? (
      <a
        href={`/uploads/${row.original.file_name}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600 hover:text-blue-800"
      >
        {row.original.file_name}
      </a>
    ) : "-",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/documents/${row.original.id}`}>
        <Button size="sm" variant="outline">View</Button>
      </Link>
    ),
  },
]
