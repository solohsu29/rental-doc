
"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface Equipment {
  id: number
  gondola_number: string
  motor_serial_number: string
  monthly_rate?: number
  status: string
  equipment_type: string
  current_location?: string
  notes?: string
}

import { useParams } from "next/navigation";

interface DocumentEdit {
  id?: number;
  type: string;
  file: File | null;
  issue_date: string;
  expiry_date: string;
  file_name?: string;
  deleted?:boolean
}

export default function EditEquipmentPage() {
  const { id } = useParams();
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0];
  const [documents, setDocuments] = useState<DocumentEdit[]>([]);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch(`/api/equipment/${id}`)
        if (!response.ok) throw new Error("Failed to fetch equipment")
        const data = await response.json()
        setEquipment(data)
        // If equipment has documents, prefill the document state
        if (data && Array.isArray(data.documents)) {
          setDocuments(
            data.documents.map((doc: any) => ({
              id: doc.id,
              type: doc.type || doc.document_type || "",
              file: null,
              file_name: doc.file_name,
              issue_date: doc.issue_date ? doc.issue_date.split('T')[0] : today,
              expiry_date: doc.expiry_date ? doc.expiry_date.split('T')[0] : ""
            }))
          );
        } else {
          setDocuments([{ type: "", file: null, issue_date: today, expiry_date: "" }]);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch equipment.",
          variant: "destructive",
        })
      }
    }
    fetchEquipment()
  }, [id])

  const handleDocumentChange = <K extends keyof DocumentEdit>(
    index: number,
    field: K,
    value: DocumentEdit[K]
  ) => {
    const updated = [...documents];
    updated[index][field] = value;
    setDocuments(updated);
  };

  // Add a new blank document row, keeping all existing documents
  const addDocumentField = () => setDocuments(prevDocs => [
    ...prevDocs,
    { type: "", file: null, issue_date: today, expiry_date: "" }
  ]);

  // Remove a document row by index: mark as deleted if it has an id, otherwise remove from state
  const removeDocumentField = (index: number) => setDocuments(prevDocs => {
    const doc = prevDocs[index];
    if (doc.id) {
      // Mark as deleted, don't remove
      return prevDocs.map((d, i) => (i === index ? { ...d, deleted: true } : d));
    } else {
      // Remove new unsaved document
      return prevDocs.filter((_, i) => i !== index);
    }
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const gondola_number = formData.get("gondola_number")?.toString().trim()
    const motor_serial_number = formData.get("motor_serial_number")?.toString().trim()
    const status = formData.get("status")?.toString().trim()
    const equipment_type = formData.get("equipment_type")?.toString().trim()
    if (!gondola_number || !motor_serial_number || !status || !equipment_type) {
      setFormError("Please fill in all required fields.")
      setIsLoading(false)
      return
    }
    try {
      const formData = new FormData(e.currentTarget)
      // Append document data
      documents.forEach((doc, idx) => {
        formData.append(`documents[${idx}][deleted]`, doc.deleted ? "true" : "false");
        // Only submit non-deleted documents for update/insert
        if (doc.type && !doc.deleted) {
          if (doc.id) formData.append(`documents[${idx}][id]`, doc.id.toString());
          if (doc.file) formData.append(`documents[${idx}][file]`, doc.file);
          formData.append(`documents[${idx}][type]`, doc.type);
          formData.append(`documents[${idx}][issue_date]`, doc.issue_date || "");
          formData.append(`documents[${idx}][expiry_date]`, doc.expiry_date || "");
        }
      });
      formData.append("gondola_number", gondola_number!);
      formData.append("motor_serial_number", motor_serial_number!);
      formData.append("monthly_rate", formData.get("monthly_rate")?.toString() || "");
      formData.append("status", status!);
      formData.append("equipment_type", equipment_type!);
      formData.append("current_location", formData.get("current_location")?.toString() || "");
      formData.append("notes", formData.get("notes")?.toString() || "");

      console.log('form Data',formData)
      const response = await fetch(`/api/equipment/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.error || "Failed to update equipment")
        throw new Error(errorData.error || "Failed to update equipment")
      }
      toast({
        title: "Success",
        description: "Equipment updated successfully.",
      });
      // Re-fetch updated equipment data and update state
      const updated = await fetch(`/api/equipment/${id}`).then(res => res.json());
      setEquipment(updated);
      setDocuments(
        Array.isArray(updated.documents)
          ? updated.documents.map((doc: any) => ({
              id: doc.id,
              type: doc.type || doc.document_type || "",
              file: null,
              file_name: doc.file_name,
              issue_date: doc.issue_date ? doc.issue_date.split('T')[0] : today,
              expiry_date: doc.expiry_date ? doc.expiry_date.split('T')[0] : ""
            }))
          : [{ type: "", file: null, issue_date: today, expiry_date: "" }]
      );
      // Optionally, scroll to top or highlight the updated section
      router.back()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update equipment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!equipment) {
    return <div>Loading...</div>
  }
console.log('documents',documents)
  return (
    <div className="max-w-xl mx-auto py-8">
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-300">
          {formError}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Edit Equipment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Documents</Label>
          {documents.filter(doc => !doc.deleted).map((doc, idx) => (
            <div key={doc.id ?? idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <div className="flex flex-col">
                <Label>Type</Label>
                <select
                  value={doc.type}
                  onChange={e => handleDocumentChange(idx, "type", e.target.value)}
                  required
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select type</option>
                  <option value="SWP">Safe Work Procedure (SWP)</option>
                  <option value="RA">Risk Assessment (RA)</option>
                  <option value="MOS">Method of Statement (MOS)</option>
                  <option value="MOM_CERT">Manufacturer’s Original Manual Certificate (MOM Cert)</option>
                  <option value="PE_CALCULATION">Professional Engineer Calculation (PE Calculation)</option>
                  <option value="COS">Certificate of Supervision (COS)</option>
                  <option value="LEW">Licensed Electrical Worker Certificate (LEW)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <Label>File</Label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => handleDocumentChange(idx, "file", e.target.files?.[0] || null)}
                />
                {doc.file_name && !doc.file && (
                  <span className="text-xs text-gray-500">Current: {doc.file_name}</span>
                )}
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
        <div>
          <Label htmlFor="gondola_number">Gondola Number</Label>
          <Input id="gondola_number" name="gondola_number" defaultValue={equipment.gondola_number} required />
        </div>
        <div>
          <Label htmlFor="motor_serial_number">Motor Serial Number</Label>
          <Input id="motor_serial_number" name="motor_serial_number" defaultValue={equipment.motor_serial_number} required />
        </div>
        <div>
          <Label htmlFor="monthly_rate">Monthly Rate</Label>
          <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" defaultValue={equipment.monthly_rate ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={equipment.status}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="deployed">Deployed</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <Label htmlFor="equipment_type">Equipment Type</Label>
          <Input id="equipment_type" name="equipment_type" defaultValue={equipment.equipment_type} required />
        </div>
        <div>
          <Label htmlFor="current_location">Current Location</Label>
          <Input id="current_location" name="current_location" defaultValue={equipment.current_location ?? ""} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={equipment.notes ?? ""}
            className="w-full border rounded px-3 py-2 min-h-[80px]"
          />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
