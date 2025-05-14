import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, getDocumentStatus } from "@/lib/db"
import { sql } from "@/lib/db"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getDocuments() {
  const documents = await sql`
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

  return documents
}

export default async function DocumentsPage() {
  const documents = await getDocuments()

  // Group documents by type
  const documentsByType: Record<string, any[]> = {}
  documents.forEach((doc: any) => {
    if (!documentsByType[doc.document_type]) {
      documentsByType[doc.document_type] = []
    }
    documentsByType[doc.document_type].push(doc)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Link href="/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </Link>
      </div>

      {Object.keys(documentsByType).length > 0 ? (
        Object.entries(documentsByType).map(([type, docs]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle>{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium">
                  <div>Equipment</div>
                  <div>Issue Date</div>
                  <div>Expiry Date</div>
                  <div>Status</div>
                </div>
                {docs.map((doc: any) => {
                  const status = getDocumentStatus(doc.expiry_date)

                  return (
                    <Link href={`/documents/${doc.id}`} key={doc.id}>
                      <div className="grid grid-cols-4 gap-4 border-t p-4 hover:bg-muted/50">
                        <div>{doc.gondola_number}</div>
                        <div>{formatDate(doc.issue_date)}</div>
                        <div>{formatDate(doc.expiry_date)}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              status === "valid"
                                ? "bg-green-100 text-green-800"
                                : status === "expiring"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {status === "valid" ? "Valid" : status === "expiring" ? "Expiring Soon" : "Expired"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground">No documents found. Add your first document to get started.</p>
      )}
    </div>
  )
}
