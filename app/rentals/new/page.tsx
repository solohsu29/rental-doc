"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Equipment {
  id: number
  gondola_number: string
  status: string
}

interface Client {
  id: number
  name: string
}

export default function NewRentalPage() {
  // Document types (reuse from equipment)
  const DOCUMENT_TYPES = [
    { value: "SWP", label: "Safe Work Procedure (SWP)" },
    { value: "RA", label: "Risk Assessment (RA)" },
    { value: "MOS", label: "Method of Statement (MOS)" },
    { value: "MOM_CERT", label: "Manufacturer’s Original Manual Certificate (MOM Cert)" },
    { value: "PE_CALCULATION", label: "Professional Engineer Calculation (PE Calculation)" },
    { value: "COS", label: "Certificate of Supervision (COS)" },
    { value: "LEW", label: "Licensed Electrical Worker Certificate (LEW)" },
  ];
  interface DocumentUpload {
    type: string;
    file: File | null;
    issue_date: string;
    expiry_date: string;
  }
  const today = new Date().toISOString().split('T')[0];
  const [documents, setDocuments] = useState<DocumentUpload[]>([{ type: "", file: null, issue_date: today, expiry_date: "" }]);

  const handleDocumentChange = (index: number, field: keyof DocumentUpload, value: any) => {
    const updated = [...documents];
    updated[index][field] = value;
    setDocuments(updated);
  };
  const addDocumentField = () => setDocuments([...documents, { type: "", file: null, issue_date: today, expiry_date: "" }]);
  const removeDocumentField = (index: number) => setDocuments(documents.filter((_, i) => i !== index));
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipmentId = searchParams.get("equipment_id")

  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>(equipmentId || "")
  const [selectedClient, setSelectedClient] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch equipment
        const equipmentResponse = await fetch("/api/equipment")
        if (!equipmentResponse.ok) {
          throw new Error("Failed to fetch equipment")
        }
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData.filter((e: Equipment) => e.status === "available"))

        // Fetch clients
        const clientsResponse = await fetch("/api/clients")
        if (!clientsResponse.ok) {
          throw new Error("Failed to fetch clients")
        }
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    // Append documents from state
    documents.forEach((doc, idx) => {
      if (doc.file && doc.type) {
        formData.append(`documents[${idx}][file]`, doc.file);
        formData.append(`documents[${idx}][type]`, doc.type);
        formData.append(`documents[${idx}][issue_date]`, doc.issue_date || "");
        formData.append(`documents[${idx}][expiry_date]`, doc.expiry_date || "");
      }
    });

    try {
      const response = await fetch("/api/rentals", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create rental")
      }

      const data = await response.json()

      toast({
        title: "Rental created",
        description: "The rental has been created successfully.",
      })

      // Redirect to create a deployment delivery order
      router.push(`/delivery-orders/new?rental_id=${data.id}&type=deployment`)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Failed to create rental. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Create New Rental</h1>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Rental Details</CardTitle>
            <CardDescription>Enter the details of the new equipment rental.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment</Label>
              <Select name="equipment_id" value={selectedEquipment} onValueChange={setSelectedEquipment} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.gondola_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {equipment.length === 0 && <p className="text-sm text-muted-foreground">No available equipment found.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select name="client_id" value={selectedClient} onValueChange={setSelectedClient} required>
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
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground">No clients found. Please add a client first.</p>
              )}
            </div>

            {/* Document Upload Section */}
            <div className="space-y-2">
              <Label>Rental Documents</Label>
              {documents.map((doc, idx) => (
                <div key={idx} className="border p-2 rounded mb-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Type</Label>
                      <Select
                        value={doc.type}
                        onValueChange={val => handleDocumentChange(idx, "type", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(dt => (
                            <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>File</Label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => handleDocumentChange(idx, "file", e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={doc.issue_date}
                        onChange={e => handleDocumentChange(idx, "issue_date", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={doc.expiry_date}
                        onChange={e => handleDocumentChange(idx, "expiry_date", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDocumentField(idx)}
                        disabled={documents.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addDocumentField}>
                + Add Document
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_location">Site Location</Label>
              <Input id="site_location" name="site_location" required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rate">Monthly Rate</Label>
                <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Rental"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
