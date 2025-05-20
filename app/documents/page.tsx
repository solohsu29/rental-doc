import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import DocumentsTableClient from "@/components/DocumentsTableClient"
import { Document } from "@/components/documentColumns"
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

export default async function DocumentsPage() {
  const documents = await getDocuments();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span>Total Documents: {documents?.length || 0}</span>
        <Link href="/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </Link>
      </div>
      <DocumentsTableClient data={documents} />
    </div>
  );
}
