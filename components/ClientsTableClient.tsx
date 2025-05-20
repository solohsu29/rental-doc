"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { Client, clientColumns } from "@/components/clientColumns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ClientsTableClientProps {
  data: Client[];
}

export default function ClientsTableClient({ data }: ClientsTableClientProps) {
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showModal = !!deleteIds && deleteIds.length > 0;
  const isBulk = deleteIds && deleteIds.length > 1;

  const handleDelete = async () => {
    if (!deleteIds) return;
    setLoading(true);
    await fetch("/api/clients/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: deleteIds }),
    });
    setLoading(false);
    setDeleteIds(null);
    router.refresh();
  };

  return (
    <>
      <DataTable<Client, unknown>
        columns={clientColumns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Search by client name..."
        pageSize={10}
        meta={{
          onDelete: (ids: string[]) => setDeleteIds(ids),
        }}
      />
      <Dialog open={showModal} onOpenChange={open => !open && setDeleteIds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBulk ? `Delete ${deleteIds?.length} Clients?` : "Delete Client?"}</DialogTitle>
            <DialogDescription>
              {isBulk
                ? `Are you sure you want to delete these ${deleteIds?.length} clients? This action cannot be undone.`
                : "Are you sure you want to delete this client? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIds(null)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
