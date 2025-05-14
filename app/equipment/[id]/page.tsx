"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { executeQuery } from "@/lib/db"
import { Edit, FileText, Truck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getEquipment(id: string) {
  try {
    const equipment = await executeQuery`
      SELECT * FROM equipment WHERE id = ${id}
    `

    if (equipment.length === 0) {
      return null
    }

    return equipment[0]
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return null
  }
}

async function getDocuments(equipmentId: string) {
  try {
    const documents = await executeQuery`
      SELECT * FROM documents 
      WHERE equipment_id = ${equipmentId}
      ORDER BY document_type, expiry_date DESC
    `

    return documents
  } catch (error) {
    console.error("Error fetching documents:", error)
    return []
  }
}

async function getRentals(equipmentId: string) {
  try {
    const rentals = await executeQuery`
      SELECT r.*, c.name as client_name
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      WHERE r.equipment_id = ${equipmentId}
      ORDER BY r.start_date DESC
    `

    return rentals
  } catch (error) {
    console.error("Error fetching rentals:", error)
    return []
  }
}

import { useParams } from "next/navigation";

export default async function EquipmentDetailPage() {
  const { id } = useParams();
  if (!id || typeof id !== 'string') return notFound();
  const equipment = await getEquipment(id);

  if (!equipment) {
    notFound();
  }

  const documents = await getDocuments(id);
  const rentals = await getRentals(id);

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipment Details</h1>
        <Link href={`/equipment/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Equipment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{equipment.gondola_number}</CardTitle>
          <CardDescription>Equipment details and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Motor Serial Number</h3>
              <p>{equipment.motor_serial_number}</p>
            </div>
            <div>
              <h3 className="font-medium">Equipment Type</h3>
              <p>{equipment.equipment_type}</p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    equipment.status === "available"
                      ? "bg-green-100 text-green-800"
                      : equipment.status === "deployed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {equipment.status}
                </span>
              </p>
            </div>
            <div>
              <h3 className="font-medium">Current Location</h3>
              <p>{equipment.current_location || "Not specified"}</p>
            </div>
            <div className="col-span-2">
              <h3 className="font-medium">Notes</h3>
              <p>{equipment.notes || "No notes"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="rentals">Rental History</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Documents</h2>
            <Link href={`/documents/new?equipment_id=${id}`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </Link>
          </div>

          {documents.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-5 gap-4 p-4 font-medium">
                <div>Document Type</div>
                <div>Issue Date</div>
                <div>Expiry Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {documents.map((doc: any) => {
                const docTypeMap: Record<string, string> = {
                  "SWP": "Safe Work Procedure (SWP)",
                  "RA": "Risk Assessment (RA)",
                  "MOS": "Method of Statement (MOS)",
                  "MOM Cert": "Manufacturer’s Original Manual Certificate (MOM Cert)",
                  "PE Calculation": "Professional Engineer Calculation (PE Calculation)",
                  "COS": "Certificate of Supervision (COS)",
                  "LEW": "Licensed Electrical Worker Certificate (LEW)"
                };
                const status = doc.expiry_date
                  ? new Date(doc.expiry_date) < new Date()
                    ? "expired"
                    : "valid"
                  : "valid"

                return (
                  <div key={doc.id} className="grid grid-cols-5 gap-4 border-t p-4">
                    <div>{docTypeMap[(doc as { document_type: keyof typeof docTypeMap }).document_type] || doc.document_type}</div>
                    <div>{formatDate(doc.issue_date)}</div>
                    <div>{formatDate(doc.expiry_date)}</div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          status === "valid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div>
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No documents found for this equipment.</p>
          )}
        </TabsContent>
        <TabsContent value="rentals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rental History</h2>
            <Link href={`/rentals/new?equipment_id=${id}`}>
              <Button>
                <Truck className="mr-2 h-4 w-4" />
                New Rental
              </Button>
            </Link>
          </div>

          {rentals.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-5 gap-4 p-4 font-medium">
                <div>Client</div>
                <div>Site Location</div>
                <div>Start Date</div>
                <div>End Date</div>
                <div>Status</div>
              </div>
              {rentals.map((rental: any) => (
                <div key={rental.id} className="grid grid-cols-5 gap-4 border-t p-4">
                  <div>{rental.client_name}</div>
                  <div>{rental.site_location}</div>
                  <div>{formatDate(rental.start_date)}</div>
                  <div>{formatDate(rental.end_date)}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        rental.status === "active"
                          ? "bg-green-100 text-green-800"
                          : rental.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {rental.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No rental history found for this equipment.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
