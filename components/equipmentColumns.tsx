"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, PlusCircle, Trash } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

export interface Equipment {
  id: string;
  gondola_number: string;
  motor_serial_number: string;
  status: "available" | "deployed" | "maintenance";
  equipment_type: string;
  location: string;
  valid_documents: number;
}

export const equipmentColumns: ColumnDef<Equipment, unknown>[] = [
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
    header: "Gondola #",
    cell: ({ row }) => <div className="font-medium">{row.getValue("gondola_number")}</div>,
  },
  {
    accessorKey: "motor_serial_number",
    header: "Motor Serial",
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="text-center">
        <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                   status === "available"
                      ? "bg-green-100 text-green-800"
                      :status === "deployed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status}
                </span>
        </div>
      );
    },
  },
  {
    accessorKey: "equipment_type",
    header: () => <div className="text-center">Equipment Type</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("equipment_type")}</div>,
  },
  {
    accessorKey: "current_location",
    header: () => <div className="text-center">Location</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("current_location")}</div>,
  },
  {
    id: "valid_documents",
    header: () => <div className="text-center">Valid Documents</div>,
    cell: ({ row }) => {
      const documents = (row.original as any).documents as Array<any> | undefined;
      return (
        <div className="text-center flex flex-col gap-1 items-center">
          {documents && documents.length > 0 ? (
            documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/documents/${doc.id}?download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs block"
                title={doc.file_name}
              >
                {doc.file_name}
              </a>
            ))
          ) : (
            <Badge variant="outline" className="text-xs">None</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => (
      <div className="flex gap-2 justify-end">
        <Link href={`/equipment/${row.original.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
        </Link>
        {row?.getValue('status') === 'available' && <Link href={`/rentals/new?equipment_id=${row.original.id}`}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Rental</span>
          </Button>
        </Link> }
        
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
