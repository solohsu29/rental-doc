"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function EditDeliveryOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deliveryOrder, setDeliveryOrder] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]); // Uploaded or attached docs
  const [uploadFiles, setUploadFiles] = useState<File[]>([]); // New: for file uploads
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(""); // New: End date field
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('Other');
  // Ensure endDate is set from deliveryOrder or rental
  // Fetch rental details for start and end date
  useEffect(() => {
    async function fetchRentalDates() {
      if (deliveryOrder && deliveryOrder.rental_id) {
        const res = await fetch(`/api/rentals`);
        if (res.ok) {
          const rentals = await res.json();
          const rental = rentals.find((r: any) => String(r.id) === String(deliveryOrder.rental_id));
          if (rental) {
            if (rental.start_date) setStartDate(rental.start_date.split('T')[0]);
            if (rental.end_date) setEndDate(rental.end_date.split('T')[0]);
          }
        }
      }
    }
    if (!loading && deliveryOrder && deliveryOrder.rental_id) {
      fetchRentalDates();
    }
  }, [loading, deliveryOrder]);
 

  useEffect(() => {
    async function fetchData() {
      const [doRes, clientsRes, equipmentRes] = await Promise.all([
        fetch(`/api/delivery-orders/${id}`),
        fetch('/api/clients'),
        fetch('/api/equipment'),
      ]);
      let rentalId = null;
      if (doRes.ok) {
        const doData = await doRes.json();
        setDeliveryOrder(doData);
        setDocuments(doData.documents || []);
        rentalId = doData.rental_id;
        if (doData.end_date) setEndDate(doData.end_date);
      }
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (equipmentRes.ok) setEquipment(await equipmentRes.json());
      // Fetch rental for client_id and equipment_id
      if (rentalId) {
        const rentalRes = await fetch(`/api/rentals`);
        if (rentalRes.ok) {
          const rentals = await rentalRes.json();
          const rental = rentals.find((r: any) => String(r.id) === String(rentalId));
          if (rental) {
            setSelectedClientId(rental.client_id ? String(rental.client_id) : '');
            setSelectedEquipmentId(rental.equipment_id ? String(rental.equipment_id) : '');
            if (rental.end_date) setEndDate(rental.end_date);
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    // Always send equipment_id with the document upload
    formData.append('equipment_id', selectedEquipmentId);
    // Send user-selected document_type
    // Always send today's date as issue_date to satisfy not-null constraint
    formData.append('issue_date', new Date().toISOString().split('T')[0]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    // Add end date and files to FormData
    formData.append("end_date", endDate);
    uploadFiles.forEach((file) => formData.append("files", file));
    // Add document IDs if needed (for now, just keep as is)
    // formData.append("documents", JSON.stringify(documents.map((d: any) => d.id)));
    const response = await fetch(`/api/delivery-orders/${id}`, {
      method: 'PUT',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      setFormError(errorData.error || "Failed to update delivery order");
      setIsSaving(false);
      return;
    }
    router.push(`/delivery-orders/${id}`);
    router.refresh();
  }

  if (loading) return <div>Loading...</div>;
  if (!deliveryOrder) return <div>Delivery order not found.</div>;

  // Pre-fill values
  const selectedSiteLocation = deliveryOrder?.site_location || '';
  const selectedNotes = deliveryOrder?.notes || '';

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Delivery Order</h1>
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-300">{formError}</div>
      )}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto my-8 space-y-4">
        {/* Client Select */}
        <div>
          <Label htmlFor="client_id">Client</Label>
          <select id="client_id" name="client_id" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {/* Equipment Select */}
        <div>
          <Label htmlFor="equipment_id">Equipment</Label>
          <select id="equipment_id" name="equipment_id" value={selectedEquipmentId} onChange={e => setSelectedEquipmentId(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="">Select equipment</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>{e.gondola_number}</option>
            ))}
          </select>
        </div>
        {/* Site Location */}
        <div>
          <Label htmlFor="site_location">Site Location</Label>
          <Input id="site_location" name="site_location" defaultValue={selectedSiteLocation} />
        </div>
        {/* Delivery Date */}
        <div>
          <Label htmlFor="do_date">Delivery Date</Label>
          <Input
            id="do_date"
            name="do_date"
            type="date"
            defaultValue={deliveryOrder.do_date?.split("T")[0]}
          />
        </div>
        {/* Start Date */}
        <div>
          <Label>Rental Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled
          />
        </div>
        {/* End Date */}
        <div>
          <Label>Rental End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={selectedNotes} />
        </div>
        {/* Documents Upload & List */}
        <div>
          <Label>Upload Documents</Label>
          <Input
            type="file"
            multiple
            onChange={e => setUploadFiles(e.target.files ? Array.from(e.target.files) : [])}
          />
          {/* Show already uploaded documents */}
          {documents && documents.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {documents.map((doc: any) =>
                doc && doc.id ? (
                  <span key={doc.id} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                   {doc.file_name && (
                      <a
                        href={`/api/documents/${doc.id}/file`}
                        download={doc.file_name}
                        className="text-blue-600 underline hover:text-blue-800 ml-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      
                      >
                        {doc.file_name}
                      </a>
                    )}
                  </span>
                ) : null
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">No uploaded documents</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/delivery-orders/${id}`)}>Cancel</Button>
        </div>
        {formError && <div className="text-red-500">{formError}</div>}
      </form>
    </div>
  );
}
