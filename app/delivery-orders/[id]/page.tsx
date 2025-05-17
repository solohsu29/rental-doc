"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeliveryOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deliveryOrder, setDeliveryOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeliveryOrder() {
      const res = await fetch(`/api/delivery-orders/${id}`);
      if (res.ok) {
        setDeliveryOrder(await res.json());
      }
      setLoading(false);
    }
    fetchDeliveryOrder();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!deliveryOrder) return <div>Delivery order not found.</div>;
console.log('deliveryOrder',deliveryOrder)
  return (
    <Card className="max-w-xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Delivery Order Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><b>DO Number:</b> {deliveryOrder.do_number}</div>
        <div><b>Date:</b> {deliveryOrder.do_date?.split("T")[0]}</div>
        <div><b>Equipment:</b> {deliveryOrder.gondola_number}</div>
        <div><b>Client:</b> {deliveryOrder.client_name}</div>
        <div><b>Site Location:</b> {deliveryOrder.site_location}</div>
        <div><b>Notes:</b> {deliveryOrder.notes || "-"}</div>
        <div>
          <b>Documents:</b>{" "}
          {deliveryOrder.documents && deliveryOrder.documents.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {deliveryOrder.documents.map((doc: any) =>
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
            <span className="text-muted-foreground text-xs">No Docs</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/delivery-orders/${id}/edit`)}>Edit</Button>
          <Button variant="outline" onClick={() => router.push("/delivery-orders")}>Back</Button>
        </div>
      </CardContent>
    </Card>
  );
}
