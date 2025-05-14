
"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useParams } from "next/navigation";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div>Loading...</div>;
  if (!document) return <div>Document not found.</div>;

  return (
    <Card className="max-w-xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Document Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Type:</Label> {document.document_type}
        </div>
        <div>
          <Label>Equipment ID:</Label> {document.equipment_id}
        </div>
        <div>
          <Label>Issue Date:</Label> {document.issue_date?.split("T")[0]}
        </div>
        <div>
          <Label>Expiry Date:</Label> {document.expiry_date?.split("T")[0] || "-"}
        </div>
        <div>
          <Label>Notes:</Label> {document.notes || "-"}
        </div>
        {document.file_path && (
          <div>
            <a
              href={`/api/documents/${id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2"
            >
              <Button variant="secondary">View/Download File</Button>
            </a>
          </div>
        )}
        <div>
          <Button onClick={() => router.push(`/documents/${id}/edit`)}>
            Edit Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
