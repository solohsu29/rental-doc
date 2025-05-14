"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useParams } from "next/navigation";

export default function EditDocumentPage() {
  const { id } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDocument() {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        setDocument(await res.json());
      }
      setLoading(false);
    }
    fetchDocument();
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const hasNewFile = file && file instanceof File && file.size > 0;
    if (!formData.get("document_type") || !formData.get("issue_date")) {
      setFormError("Document type and issue date are required.");
      setIsSaving(false);
      return;
    }
    let response;
    if (hasNewFile) {
      // Send as multipart/form-data
      const uploadForm = new FormData();
      uploadForm.append("document_type", formData.get("document_type") as string);
      uploadForm.append("issue_date", formData.get("issue_date") as string);
      uploadForm.append("expiry_date", formData.get("expiry_date") as string);
      uploadForm.append("notes", formData.get("notes") as string);
      uploadForm.append("file", file);
      response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        body: uploadForm,
      });
    } else {
      // Send as JSON
      const payload = {
        document_type: formData.get("document_type"),
        issue_date: formData.get("issue_date"),
        expiry_date: formData.get("expiry_date"),
        notes: formData.get("notes"),
      };
      response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    if (!response.ok) {
      const errorData = await response.json();
      setFormError(errorData.error || "Failed to update document");
      setIsSaving(false);
      return;
    }
    router.push(`/documents/${id}`);
    router.refresh();
  }

  if (loading) return <div>Loading...</div>;
  if (!document) return <div>Document not found.</div>;

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Document</h1>
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-300">{formError}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div>
          <Label htmlFor="document_type">Document Type</Label>
          <select
            id="document_type"
            name="document_type"
            defaultValue={document.document_type}
            required
            className="block w-full border rounded px-2 py-2"
          >
            <option value="">Select type</option>
            <option value="SWP">Safe Work Procedure (SWP)</option>
<option value="RA">Risk Assessment (RA)</option>
<option value="MOS">Method of Statement (MOS)</option>
<option value="MOM Cert">Manufacturer’s Original Manual Certificate (MOM Cert)</option>
<option value="PE Calculation">Professional Engineer Calculation (PE Calculation)</option>
<option value="COS">Certificate of Supervision (COS)</option>
<option value="LEW">Licensed Electrical Worker Certificate (LEW)</option>
          </select>
        </div>
        {document.file_path && (
          <div>
            <Label>Current File:</Label>
            <a
              href={`/api/documents/${id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block ml-2 text-blue-600 underline"
            >
              View/Download Current File
            </a>
          </div>
        )}
        <div>
          <Label htmlFor="file">Replace File</Label>
          <Input id="file" name="file" type="file" accept="*" />
        </div>
        <div>
          <Label htmlFor="issue_date">Issue Date</Label>
          <Input id="issue_date" name="issue_date" type="date" defaultValue={document.issue_date ? document.issue_date.slice(0, 10) : ""} required />
        </div>
        <div>
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input id="expiry_date" name="expiry_date" type="date" defaultValue={document.expiry_date ? document.expiry_date.slice(0, 10) : ""} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={document.notes || ""} />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
