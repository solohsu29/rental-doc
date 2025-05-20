import { executeQuery } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getRental(id: string) {
  try {
    const rental = await executeQuery`
      SELECT r.*, c.name as client_name, 
        e.gondola_number, e.motor_serial_number, e.status as equipment_status, e.equipment_type, e.current_location, e.notes as equipment_notes, e.id as equipment_id
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ${id}
    `
    if (rental.length === 0) return null
    return rental[0]
  } catch (error) {
    console.error("Error fetching rental:", error)
    return null
  }
}

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await getRental(id);
  if (!rental) return notFound();

  // Fetch equipment documents
  const equipmentDocuments = await executeQuery`
    SELECT * FROM documents WHERE equipment_id = ${rental.equipment_id} ORDER BY expiry_date DESC
  `;
  // Fetch rental documents
  const rentalDocuments = await executeQuery`
    SELECT * FROM documents WHERE rental_id = ${rental.id} ORDER BY expiry_date DESC
  `;



  // Helper function for date formatting
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    if (dateString instanceof Date) return dateString.toLocaleDateString();
    if (typeof dateString === "string") return dateString.split("T")[0];
    return "-";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rental Details</h1>
        <Link href={`/rentals/${id}/edit`}>
          <Button>Edit Rental</Button>
        </Link>
      </div>

      {/* Equipment Documents Section */}
      {/* <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Equipment Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mt-2">
            {equipmentDocuments && equipmentDocuments.length > 0 ? (
              <ul className="divide-y">
                {equipmentDocuments.map((doc: any) => (
                  <li key={doc.id} className="p-4">
                    <div><b>Type:</b> {doc.document_type}</div>
                    <div><b>Issue Date:</b> {formatDate(doc.issue_date)}</div>
                    <div><b>Expiry Date:</b> {formatDate(doc.expiry_date)}</div>
                    <div><b>Status:</b> {doc.status}</div>
                    <div><b>Notes:</b> {doc.notes}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-muted-foreground text-center">No equipment documents found.</div>
            )}
          </div>
        </CardContent>
      </Card> */}

      {/* Rental Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rental for {rental.gondola_number}</CardTitle>
          <CardDescription>Detailed information about this rental</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Client</h3>
              <p>{rental.client_name}</p>
            </div>
            <div>
              <h3 className="font-medium">Site Location</h3>
              <p>{rental.site_location}</p>
            </div>
            <div>
              <h3 className="font-medium">Equipment</h3>
              <ul className="list-disc ml-5">
                <li><b>Gondola Number:</b> {rental.gondola_number}</li>
                <li><b>Serial Number:</b> {rental.serial_number}</li>
                <li><b>Motor Serial Number:</b> {rental.motor_serial_number}</li>
               
                <li><b>Status:</b> {rental.equipment_status}</li>
               
                <li><b>Notes:</b> {rental.equipment_notes}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <p>{rental.status}</p>
            </div>
            <div>
              <h3 className="font-medium">Start Date</h3>
              <p>{formatDate(rental.start_date)}</p>
            </div>
            <div>
              <h3 className="font-medium">End Date</h3>
              <p>{formatDate(rental.end_date)}</p>
            </div>
            <div className="col-span-2">
              <h3 className="font-medium">Notes</h3>
              <p>{rental.notes || "No notes"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental Documents Section */}
      <Card className="space-y-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rental Documents</CardTitle>
            {/* Placeholder for Add Document button, adapt for rental if needed */}
            {/* <Link href={`/documents/new?rental_id=${id}`}> */}
            {/*   <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Add Document
                </Button> */}
            {/* </Link> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mt-6">
            {rentalDocuments && rentalDocuments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rentalDocuments.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="px-4 py-2">
                          {doc.file_name ? (
                            <a
                              download
                              href={doc.id ? `/api/documents/${doc.id}/file` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              {doc.file_name}
                            </a>
                          ) : 'Document'}
                        </td>
                        <td className="px-4 py-2">{doc.document_type}</td>
                        <td className="px-4 py-2">{formatDate(doc.issue_date)}</td>
                        <td className="px-4 py-2">{formatDate(doc.expiry_date)}</td>
                      
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-gray-500">No documents found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
