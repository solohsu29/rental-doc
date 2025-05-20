"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface Equipment {
  id: number;
  gondola_number: string;
  status: string;
}

interface Client {
  id: number;
  name: string;
}

interface DocumentUpload {
  id?: number;
  file_name?: string;
  type: string;
  file: File | null;
  issue_date: string;
  expiry_date: string;
}

import { useParams } from "next/navigation";

export default function EditRentalPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [rental,setRental] = useState()

  const DOCUMENT_TYPES = [
    { value: "SWP", label: "Safe Work Procedure (SWP)" },
    { value: "RA", label: "Risk Assessment (RA)" },
    { value: "MOS", label: "Method of Statement (MOS)" },
    { value: "MOM_CERT", label: "Manufacturer’s Original Manual Certificate (MOM Cert)" },
    { value: "PE_CALCULATION", label: "Professional Engineer Calculation (PE Calculation)" },
    { value: "COS", label: "Certificate of Supervision (COS)" },
    { value: "LEW", label: "Licensed Electrical Worker Certificate (LEW)" },
  ];

  useEffect(() => {
   
    async function fetchData() {
      try {
        const [rentalRes, equipmentRes, clientsRes, docsRes] = await Promise.all([
          fetch(`/api/rentals/${id}`),
          fetch("/api/equipment"),
          fetch("/api/clients"),
          fetch(`/api/documents?rental_id=${id}`)
        ]);
  
        if (!rentalRes.ok) throw new Error("Failed to fetch rental");
        const rentalData = await rentalRes.json();
        const equipmentData = equipmentRes.ok ? await equipmentRes.json() : [];
        const clientsData = clientsRes.ok ? await clientsRes.json() : [];
        const docs = docsRes.ok ? await docsRes.json() : [];

        const formattedDocs = docs.map((doc: any) => ({
          id: doc.id,
          file_name: doc.file_name,
          type: doc.document_type,
          file: null,
          issue_date: doc.issue_date ? doc.issue_date.split("T")[0] : "",
          expiry_date: doc.expiry_date ? doc.expiry_date.split("T")[0] : "",
        }));
  
        const selectedEq = rentalData?.equipment_id?.toString() || "";
        const selectedClie = rentalData?.client_id?.toString() || "";
  
        console.log("rental", rental);
        console.log("equipment", equipmentData);
        console.log("clients", clientsData);
        console.log("docs", docs);
        console.log("selected eq", selectedEq);
        console.log("selected clie", selectedClie);
  
        // Now call all setState
        setEquipment(equipmentData);
        setClients(clientsData);
        setDocuments(formattedDocs);
        setSelectedEquipment(selectedEq);
        setSelectedClient(selectedClie);
        setSiteLocation(rentalData.site_location || "");
        setStatus(rentalData.status || "");
        setStartDate(rentalData.start_date ? rentalData.start_date.split("T")[0] : "");
        setEndDate(rentalData.end_date ? rentalData.end_date.split("T")[0] : "");
        setMonthlyRate(rentalData.monthly_rate || "");
        setNotes(rentalData.notes || "");
        setRental(rentalData)
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
      }
    }
  
    if (id) fetchData();
  }, [id]); // Only depend on id to avoid infinite re-render
// NOTE: If documents still disappear, ensure /api/documents API returns correct data after update.

  
  

  console.log('selected eq',selectedEquipment)
  console.log('selected clie',selectedClient)

  const handleDocumentChange = <K extends keyof DocumentUpload>(
    index: number,
    field: K,
    value: DocumentUpload[K]
  ) => {
    const updated = [...documents];
    updated[index][field] = value;
    setDocuments(updated);
  };

  const addDocumentField = () => setDocuments([...documents, { type: "", file: null, issue_date: "", expiry_date: "" }]);
  const removeDocumentField = (index: number) => setDocuments(documents.filter((_, i) => i !== index));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    // Explicitly set selected values
    formData.set("equipment_id", selectedEquipment);
    formData.set("client_id", selectedClient);
    documents.forEach((doc, idx) => {
      if (doc.id) {
        formData.append(`documents[${idx}][id]`, doc.id.toString());
      }
      if (doc.type) {
        formData.append(`documents[${idx}][type]`, doc.type);
      }
      if (doc.issue_date) {
        formData.append(`documents[${idx}][issue_date]`, doc.issue_date || "");
      }
      if (doc.expiry_date) {
        formData.append(`documents[${idx}][expiry_date]`, doc.expiry_date || "");
      }
      if (doc.file) {
        formData.append(`documents[${idx}][file]`, doc.file);
      }
    });
    try {
      const response = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update rental");
      }
      toast({ title: "Rental updated", description: "The rental has been updated successfully." });
      // Optionally, refetch data after successful update instead of navigating away
      // await fetchData(); // Uncomment if you want to stay on page and refresh data
      router.push(`/rentals/${id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update rental.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Edit Rental</h1>
      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Edit Rental Details</CardTitle>
            <CardDescription>Update the details of the equipment rental.</CardDescription>
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
                      {doc.id && !doc.file ? (
                        <div>
                          <span>{doc.file_name}</span>
                          <a
                            href={`/api/documents/${doc.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline ml-2"
                            download
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={e => handleDocumentChange(idx, "file", e.target.files?.[0] || null)}
                        />
                      )}
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
              <Input id="site_location" name="site_location" value={siteLocation} onChange={e => setSiteLocation(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rate">Monthly Rate</Label>
                <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
