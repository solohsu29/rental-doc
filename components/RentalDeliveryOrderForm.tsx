"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Client {
  id: number;
  name: string;
}

interface Equipment {
  id: number;
  gondola_number: string;
  equipment_type: string;
  status: string;
}

interface Document {
  id: number;
  document_type: string;
  issue_date: string;
  expiry_date: string | null;
  notes: string | null;
  file_name?: string;
}

const DO_TYPES = [
  { value: "deployment", label: "Deployment" },
  { value: "rental", label: "Rental" },
  { value: "shifting", label: "Shifting" },
  { value: "offhire", label: "Offhire" },
];

export default function RentalDeliveryOrderForm() {
  const router = useRouter();
  // Form state
  const [clients, setClients] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [doType, setDoType] = useState<string>("");
  const [doNumber, setDoNumber] = useState("");
  const [doDate, setDoDate] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState(""); // New end date state
  const [monthlyRate, setMonthlyRate] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Record<string, boolean>>({});
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch clients, equipment, and documents
  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then(setClients)
      .catch(() => setError("Failed to fetch clients"));
    fetch("/api/equipment")
      .then((res) => res.json())
      .then(setEquipment)
      .catch(() => setError("Failed to fetch equipment"));
  }, []);

  // Fetch documents for selected equipment
  useEffect(() => {
    if (!selectedEquipment) return;
    fetch(`/api/documents?equipment_id=${selectedEquipment}`)
      .then((res) => res.json())
      .then(setDocuments)
      .catch(() => setError("Failed to fetch documents"));
  }, [selectedEquipment]);

  // Handle document checkbox
  const handleDocumentCheck = (docId: string) => {
    setSelectedDocuments((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Create rental
      const rentalRes = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_id: selectedEquipment,
          client_id: selectedClient,
          site_location: siteLocation,
          start_date: rentalStartDate,
          end_date: rentalEndDate, // Include end date
          monthly_rate: monthlyRate,
          notes,
        }),
      });
      const rentalData = await rentalRes.json();
      if (!rentalRes.ok) throw new Error(rentalData.error || "Rental creation failed");
      const rentalId = rentalData.id;

      // 2. Create delivery order and upload documents in one request
      const formData = new FormData();
      formData.append("rental_id", rentalId);
      formData.append("do_number", doNumber);
      formData.append("do_date", doDate);
      formData.append("do_type", doType);
      formData.append("notes", notes);
      formData.append("end_date", rentalEndDate);
      // Add selected documents (if any)
      const selectedDocIds = Object.keys(selectedDocuments).filter((id) => selectedDocuments[id]);
      formData.append("documents", JSON.stringify(selectedDocIds));
      // Add uploaded files
      uploadFiles.forEach((file, idx) => {
        formData.append("files", file);
      });

      const deliveryOrderRes = await fetch("/api/delivery-orders", {
        method: "POST",
        body: formData,
      });
      const deliveryOrderData = await deliveryOrderRes.json();
      if (!deliveryOrderRes.ok) throw new Error(deliveryOrderData.error || "Delivery order creation failed");

      setSuccess("Delivery order created successfully!");
      router.push("/delivery-orders"); // Redirect to table to show all data
      // Optionally reset form here
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardHeader>
          <CardTitle>Create Delivery Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient} required>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipment</Label>
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment} required>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment
                  .filter((eq) => eq.status === "available" || eq.status === "deployed")
                  .map((eq) => (
                    <SelectItem key={eq.id} value={String(eq.id)}>
                      {eq.gondola_number} ({eq.equipment_type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rental Start Date</Label>
            <Input
              type="date"
              value={rentalStartDate}
              onChange={(e) => setRentalStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Rental End Date</Label>
            <Input
              type="date"
              value={rentalEndDate}
              onChange={(e) => setRentalEndDate(e.target.value)}
            />
          </div>
         
          <div>
            <Label>Monthly Rate</Label>
            <Input
              type="number"
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(e.target.value)}
              placeholder="Enter monthly rate"
            />
          </div>
          <div>
            <Label>DO Number</Label>
            <Input
              type="text"
              value={doNumber}
              onChange={(e) => setDoNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>DO Date</Label>
            <Input
              type="date"
              value={doDate}
              onChange={(e) => setDoDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>DO Type</Label>
            <Select value={doType} onValueChange={setDoType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select DO type" />
              </SelectTrigger>
              <SelectContent>
                {DO_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site Location</Label>
            <Input
              type="text"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
            />
          </div>
          {documents?.length > 0 && (
            <div>
              <Label>Equipment Documents</Label>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selectedDocuments[doc.id]}
                      onCheckedChange={() => handleDocumentCheck(String(doc.id))}
                      id={`doc-${doc.id}`}
                    />
                    <Label htmlFor={`doc-${doc.id}`}>
                      {doc.document_type} ({doc.issue_date})
                      {doc.file_name && (
                        <>
                          {" "}
                          <a
                            href={`/api/documents/${doc.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 underline hover:text-blue-800"
                            download={doc.file_name}
                          >
                            Download
                          </a>
                        </>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label>Upload New Documents</Label>
            <Input type="file" multiple onChange={handleFileChange} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-2">
          {error && <span className="text-red-500 text-sm">{error}</span>}
          {success && <span className="text-green-600 text-sm">{success}</span>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !selectedClient || !selectedEquipment || !doType || !doNumber || !doDate || !siteLocation || !rentalStartDate}>
              {isLoading ? "Creating..." : "Create Delivery Order"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
