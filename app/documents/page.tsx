import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/DataTable"
import { Document, documentColumns } from "@/components/documentColumns"
import { executeQuery } from "@/lib/db"

async function getDocuments(): Promise<Document[]> {
  const documents = await executeQuery`
    SELECT d.*, e.gondola_number
    FROM documents d
    JOIN equipment e ON d.equipment_id = e.id
    ORDER BY 
      CASE 
        WHEN d.expiry_date < CURRENT_DATE THEN 1
        WHEN d.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 2
        ELSE 3
      END,
      d.expiry_date ASC NULLS LAST
  `
  return documents as Document[]
}

export default function DocumentsPage() {
  return null;
}
