"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, InfoIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Equipment {
  id: number
  gondola_number: string
  motor_serial_number: string
  monthly_rate?: number
  status: string // 'available', 'deployed', etc.
}

interface Rental {
  id: number
  site_location: string
  client_name: string
  equipment_id: number
  monthly_rate?: number
}

interface Client {
  id: number
  name: string
}

interface Document {
  id: number
  document_type: string
  file_path: string | null
  issue_date: string
  expiry_date: string | null
}

export default function NewDeliveryOrderPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedRental, setSelectedRental] = useState<string>("")
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [doType, setDoType] = useState<string>("deployment")
  const [equipmentDocuments, setEquipmentDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])

  // Document types based on DO type
  const documentTypes: Record<string, string[]> = {
    deployment: ["SWP", "RA", "MOS", "MOM_CERT", "PE_CALCULATION", "COS", "LEW"],
    rental: ["MOM_CERT", "COS", "LEW"],
    shifting: ["COS"],
    offhire: [],
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch rentals
        const rentalsResponse = await fetch("/api/rentals")
        if (!rentalsResponse.ok) {
          const errorText = await rentalsResponse.text();
        throw new Error(`Failed to fetch rentals: ${errorText}`)
        }
        const rentalsData = await rentalsResponse.json()
        setRentals(rentalsData)

        // Fetch equipment
        const equipmentResponse = await fetch("/api/equipment")
        if (!equipmentResponse.ok) {
          const errorText = await equipmentResponse.text();
        throw new Error(`Failed to fetch equipment: ${errorText}`)
        }
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData)

        // Fetch clients
        const clientsResponse = await fetch("/api/clients")
        if (!clientsResponse.ok) {
          const errorText = await clientsResponse.text();
        throw new Error(`Failed to fetch clients: ${errorText}`)
        }
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      } catch (error) {
        console.error(error)
        let description = "Failed to fetch data. Please try again."
        if (error instanceof Error && error.message) {
          description = error.message
        }
        toast({
          title: "Error",
          description,
          variant: "destructive",
        })
        // Also log the full error to the browser console
        console.error('Data fetch error:', error)
      }
    }

    fetchData()
  }, [])

  // Fetch documents when equipment is selected
  useEffect(() => {
    if (selectedEquipment && !isNaN(Number(selectedEquipment))) {
      fetchEquipmentDocuments(selectedEquipment)
    } else {
      setEquipmentDocuments([])
      setSelectedDocuments([])
    }
  }, [selectedEquipment])

  // Update selected equipment when rental changes
  useEffect(() => {
    if (selectedRental) {
      const rental = rentals.find((r) => r.id.toString() === selectedRental)
      if (rental) {
        setSelectedEquipment(rental.equipment_id.toString())
      }
    }
  }, [selectedRental, rentals])

  async function fetchEquipmentDocuments(equipmentId: string) {
    try {
      const response = await fetch(`/api/documents?equipment_id=${equipmentId}`)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch documents (status ${response.status}): ${errorText}`)
      }
      const data = await response.json()
      setEquipmentDocuments(data)

      // Auto-select documents based on DO type
      const docsToSelect = data
        .filter((doc: Document) => documentTypes[doType].includes(doc.document_type))
        .map((doc: Document) => doc.id)
      setSelectedDocuments(docsToSelect)
    } catch (error: any) {
      console.error(error)
      let description = "Failed to fetch equipment documents. Please try again."
      if (error instanceof Error && error.message) {
        description = error.message
      } else if (error && error.response) {
        const data = await error.response.json()
        if (data && data.error) description = data.error
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      })
    }
  }

  function toggleDocument(docId: number) {
    setSelectedDocuments((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const rentalId = formData.get("rental_id") as string
    const equipmentId = formData.get("equipment_id") as string

    try {
      // If equipment is selected but rental is not, create a rental first
      let finalRentalId = rentalId
      if (!rentalId && equipmentId) {
        const clientId = formData.get("client_id") as string
        const siteLocation = formData.get("site_location") as string

        if (!clientId || !siteLocation) {
          toast({
            title: "Error",
            description: "Client and site location are required when creating a new rental.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const rentalResponse = await fetch("/api/rentals", {
          method: "POST",
          body: JSON.stringify({
            equipment_id: equipmentId,
            client_id: clientId,
            site_location: siteLocation,
            start_date: formData.get("do_date") || new Date().toISOString().split("T")[0],
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!rentalResponse.ok) {
          const errorText = await rentalResponse.text();
          toast({
            title: "Error",
            description: `Failed to create rental: ${errorText}`,
            variant: "destructive",
          })
          setIsLoading(false)
          console.error('Rental creation error:', errorText)
          return;
        }

        const rentalData = await rentalResponse.json()
        if (!rentalData.id) {
          toast({
            title: "Error",
            description: "Rental was created but no ID was returned. Cannot proceed.",
            variant: "destructive",
          })
          setIsLoading(false)
          console.error('Rental creation error: No ID returned', rentalData)
          return;
        }
        finalRentalId = rentalData.id
      }

      // Create delivery order
      const response = await fetch("/api/delivery-orders", {
        method: "POST",
        body: JSON.stringify({
          rental_id: finalRentalId,
          do_number: formData.get("do_number"),
          do_date: formData.get("do_date"),
          do_type: formData.get("do_type"),
          documents: selectedDocuments,
          notes: formData.get("notes"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMsg = "Failed to create delivery order"
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMsg = errorData.error
          }
        } catch (e) {
          // fallback to default error message
        }
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Delivery Order created",
        description: "The delivery order has been created successfully.",
      })

      router.push("/delivery-orders")
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Create Delivery Order</h1>

      {doType === "deployment" && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Deployment Documents</AlertTitle>
          <AlertDescription>
            For equipment deployment, the following documents are required: SWP, RA, MOS, MOM Cert, PE Calculation, COS,
            and LEW. The Gondola number and Motor Serial Number will be tracked in the DO, COS, and MOM Cert.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rental" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rental">Select Rental</TabsTrigger>
          <TabsTrigger value="equipment">Select Equipment</TabsTrigger>
        </TabsList>

        <form onSubmit={onSubmit}>
          <TabsContent value="rental">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Order Details (Via Rental)</CardTitle>
                <CardDescription>Create a delivery order for an existing rental.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rental_id">Rental</Label>
                  <Select name="rental_id" value={selectedRental} onValueChange={setSelectedRental} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rental" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentals.map((rental) => (
                        <SelectItem key={rental.id} value={rental.id.toString()}>
                          {rental.client_name} - {rental.site_location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Summary for Rental */}
                {selectedRental && (() => {
                  const rental = rentals.find((r) => r.id.toString() === selectedRental);
                  return rental && (
                    <Card className="bg-muted/30 border-primary mt-4">
                      <CardHeader>
                        <CardTitle>Invoice Estimate</CardTitle>
                        <CardDescription>
                          This is the estimated invoice for the first month. Rental charges will continue monthly until offhire is notified by the client.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <div><span className="font-medium">Start Date:</span> {new Date().toLocaleDateString()}</div>
                          <div><span className="font-medium">Monthly Rental Rate:</span> {rental.monthly_rate ? `$${rental.monthly_rate}` : <span className="text-muted-foreground">Not specified</span>}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="do_number">DO Number</Label>
                    <Input id="do_number" name="do_number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="do_date">DO Date</Label>
                    <Input
                      id="do_date"
                      name="do_date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="do_type">DO Type</Label>
                  <Select name="do_type" value={doType} onValueChange={setDoType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select DO type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deployment">Deployment</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                      <SelectItem value="shifting">Shifting</SelectItem>
                      <SelectItem value="offhire">Offhire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Order Details (Via Equipment)</CardTitle>
                <CardDescription>Create a delivery order by selecting equipment directly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Equipment</Label>
                  <Select name="equipment_id" value={selectedEquipment} onValueChange={setSelectedEquipment} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.filter((item) => item.status === "available").length === 0 ? (
                        <div className="p-2 text-muted-foreground">No available equipment for rental.</div>
                      ) : (
                        equipment
                          .filter((item) => item.status === "available")
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.gondola_number} - {item.motor_serial_number}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Summary for Equipment */}
                {selectedEquipment && (() => {
                  // Try to find a rental for this equipment (if it exists)
                  const rental = rentals.find((r) => r.equipment_id.toString() === selectedEquipment);
                  // Try to get monthly_rate from rental, else from equipment (if you add to equipment later)
                  const equipmentItem = equipment.find((e) => e.id.toString() === selectedEquipment);
                  const monthlyRate = rental?.monthly_rate || equipmentItem?.monthly_rate;
                  return (
                    <Card className="bg-muted/30 border-primary mt-4">
                      <CardHeader>
                        <CardTitle>Invoice Estimate</CardTitle>
                        <CardDescription>
                          This is the estimated invoice for the first month. Rental charges will continue monthly until offhire is notified by the client.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <div><span className="font-medium">Start Date:</span> {new Date().toLocaleDateString()}</div>
                          <div><span className="font-medium">Monthly Rental Rate:</span> {monthlyRate ? `$${monthlyRate}` : <span className="text-muted-foreground">Not specified</span>}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client</Label>
                    <Select name="client_id" value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_location">Site Location</Label>
                    <Input id="site_location" name="site_location" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="do_number">DO Number</Label>
                    <Input id="do_number" name="do_number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="do_date">DO Date</Label>
                    <Input
                      id="do_date"
                      name="do_date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="do_type">DO Type</Label>
                  <Select name="do_type" value={doType} onValueChange={setDoType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select DO type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deployment">Deployment</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                      <SelectItem value="shifting">Shifting</SelectItem>
                      <SelectItem value="offhire">Offhire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {selectedEquipment && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Attached Documents</CardTitle>
      <CardDescription>
        The following documents will be attached to the delivery order. Uncheck any documents you don't want to include.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {equipmentDocuments.length === 0 ? (
        <div className="p-2 text-muted-foreground">No documents found for this equipment.</div>
      ) : (
        <div className="grid gap-2">
          {equipmentDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded-md">
              <Checkbox
                id={`doc-${doc.id}`}
                checked={selectedDocuments.includes(doc.id)}
                onCheckedChange={() => toggleDocument(doc.id)}
              />
              <div className="flex-1">
                <Label htmlFor={`doc-${doc.id}`} className="font-medium">
                  {doc.document_type}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Issued: {new Date(doc.issue_date).toLocaleDateString()}
                  {doc.expiry_date && ` | Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                </p>
              </div>
              {doc.file_path && (
                <Button variant="outline" size="sm" asChild>
                  <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-1" /> View
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" type="button" onClick={() => router.back()}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Delivery Order"}
      </Button>
    </CardFooter>
  </Card>
)}

          {!selectedEquipment && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" type="button" onClick={() => router.back()} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || (!selectedRental && !selectedEquipment)}>
                {isLoading ? "Creating..." : "Create Delivery Order"}
              </Button>
            </div>
          )}
        </form>
      </Tabs>
    </div>
  )
}
