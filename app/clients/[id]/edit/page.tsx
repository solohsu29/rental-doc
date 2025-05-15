import { executeQuery } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

async function updateClient(id: string, formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const contact_person = formData.get("contact_person") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  await executeQuery`
    UPDATE clients SET name = ${name}, contact_person = ${contact_person}, email = ${email}, phone = ${phone}, address = ${address}
    WHERE id = ${id}
  `;
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return notFound();

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
      <form action={updateClient.bind(null, id)} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input name="name" defaultValue={client.name} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block font-medium">Contact Person</label>
          <input name="contact_person" defaultValue={client.contact_person || ''} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input name="email" type="email" defaultValue={client.email || ''} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input name="phone" defaultValue={client.phone || ''} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block font-medium">Address</label>
          <input name="address" defaultValue={client.address || ''} className="border rounded px-2 py-1 w-full" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Link href={`/clients/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
