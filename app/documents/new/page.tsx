
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
}

export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipmentId = searchParams.get("equipment_id")

  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>(equipmentId || "")

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch("/api/equipment")
        if (!response.ok) {
          throw new Error("Failed to fetch equipment")
        }
        const data = await response.json()
        setEquipment(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to fetch equipment. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchEquipment()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    // Collect files for each document type
    const filesData: { type: string, file: File | null }[] = documentTypes.map((type) => ({
      type,
      file: formData.get(`file_${type}`) as File | null,
    }));

    // Only submit entries with a file selected
    const uploads = filesData.filter(fd => fd.file && fd.file.size > 0);

    try {
      for (const upload of uploads) {
        const uploadForm = new FormData();
        uploadForm.append('equipment_id', formData.get('equipment_id') as string);
        uploadForm.append('document_type', upload.type);
        uploadForm.append('issue_date', formData.get('issue_date') as string);
        uploadForm.append('expiry_date', formData.get('expiry_date') as string);
        uploadForm.append('notes', formData.get('notes') as string);
        if (upload.file) {
          uploadForm.append('file', upload.file);
        }

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: uploadForm,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${upload.type} document`);
        }
      }

      toast({
        title: "Documents uploaded",
        description: "All selected documents have been added successfully.",
      })

      if (equipmentId) {
        router.push(`/equipment/${equipmentId}`)
      } else {
        router.push("/documents")
      }
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to upload one or more documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const documentTypes = ["SWP", "RA", "MOS", "MOM_CERT", "PE_CALCULATION", "COS", "LEW"]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Add New Document</h1>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit} encType="multipart/form-data">
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Enter the details of the new document to add to the system.</CardDescription>
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
            </div>

            <div className="space-y-4">
              <Label>Upload Documents</Label>
              {documentTypes.map((type) => {
  const docTypeMap: Record<string, string> = {
    "SWP": "Safe Work Procedure (SWP)",
    "RA": "Risk Assessment (RA)",
    "MOS": "Method of Statement (MOS)",
    "MOM_CERT": "Manufacturer’s Original Manual Certificate (MOM Cert)",
    "PE_CALCULATION": "Professional Engineer Calculation (PE Calculation)",
    "COS": "Certificate of Supervision (COS)",
    "LEW": "Licensed Electrical Worker Certificate (LEW)"
  };
  return (
    <div key={type} className="space-y-2">
      <Label htmlFor={`file_${type}`}>{docTypeMap[type] || type} Document</Label>
      <Input id={`file_${type}`} name={`file_${type}`} type="file" accept="application/pdf,image/*" />
    </div>
  );
})}            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input id="issue_date" name="issue_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input id="expiry_date" name="expiry_date" type="date" />
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
              {isLoading ? "Creating..." : "Create Document"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
