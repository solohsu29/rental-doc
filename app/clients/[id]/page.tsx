import { executeQuery } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getClient(id: string) {
  try {
    const client = await executeQuery`
      SELECT * FROM clients WHERE id = ${id}
    `;
    if (client.length === 0) return null;
    return client[0];
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return notFound();

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Client Detail</h1>
        <Link href={`/clients/${id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>
      <div className="border rounded p-4 space-y-2">
        <div><b>Name:</b> {client.name}</div>
        <div><b>Contact Person:</b> {client.contact_person || "-"}</div>
        <div><b>Email:</b> {client.email || "-"}</div>
        <div><b>Phone:</b> {client.phone || "-"}</div>
        <div><b>Address:</b> {client.address || "-"}</div>
      </div>
    </div>
  );
}
