"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function NewEquipmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Document types
  const DOCUMENT_TYPES = [
    { value: "SWP", label: "Safe Work Procedure (SWP)" },
    { value: "RA", label: "Risk Assessment (RA)" },
    { value: "MOS", label: "Method of Statement (MOS)" },
    { value: "MOM_CERT", label: "Manufacturer’s Original Manual Certificate (MOM Cert)" },
    { value: "PE_CALCULATION", label: "Professional Engineer Calculation (PE Calculation)" },
    { value: "COS", label: "Certificate of Supervision (COS)" },
    { value: "LEW", label: "Licensed Electrical Worker Certificate (LEW)" },
  ];
  // Document upload state
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
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
      const response = await fetch("/api/equipment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create equipment");
      }

      const data = await response.json();

      toast({
        title: "Equipment created",
        description: "The equipment has been added successfully.",
      });

      router.push(`/equipment`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create equipment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Equipment</h1>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Details</CardTitle>
          <CardDescription>Enter the details of the new equipment to add to the system.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gondola_number">Gondola Number</Label>
                <Input id="gondola_number" name="gondola_number" required />
              </div>
            </div>
            {/* Document upload fields */}
            <div className="space-y-2">
              <Label>Documents</Label>
              {documents.map((doc, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
                  <div className="flex flex-col">
                    <Label>Type</Label>
                    <select
                      value={doc.type}
                      onChange={e => handleDocumentChange(idx, "type", e.target.value)}
                      required
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Select type</option>
                      {DOCUMENT_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <Label>File</Label>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={e => handleDocumentChange(idx, "file", e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Issue Date</Label>
                    <input
                      type="date"
                      value={doc.issue_date}
                      onChange={e => handleDocumentChange(idx, "issue_date", e.target.value)}
                      className="border rounded px-2 py-1"
                      required
                      title="Issue Date"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label>Expiry Date</Label>
                    <input
                      type="date"
                      value={doc.expiry_date}
                      onChange={e => handleDocumentChange(idx, "expiry_date", e.target.value)}
                      className="border rounded px-2 py-1"
                      title="Expiry Date"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    {documents.length > 1 && (
                      <button type="button" onClick={() => removeDocumentField(idx)} className="text-red-500">Remove</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addDocumentField} className="text-blue-600 underline">Add another document</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motor_serial_number">Motor Serial Number</Label>
                <Input id="motor_serial_number" name="motor_serial_number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment_type">Equipment Type</Label>
                <Input id="equipment_type" name="equipment_type" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="available">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="current_location">Current Location</Label>
              <Input id="current_location" name="current_location" />
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
              {isLoading ? "Creating..." : "Create Equipment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
