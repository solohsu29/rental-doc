"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { DeliveryOrder, deliveryOrderColumns } from "@/components/deliveryOrderColumns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DeliveryOrdersTableClientProps {
  data: DeliveryOrder[];
}

export default function DeliveryOrdersTableClient({ data }: DeliveryOrdersTableClientProps) {
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Show modal if deleteIds is not null
  const showModal = !!deleteIds && deleteIds.length > 0;
  const isBulk = deleteIds && deleteIds.length > 1;

  const handleDelete = async () => {
    if (!deleteIds) return;
    setLoading(true);
    await fetch("/api/delivery-orders/bulk-delete", {
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
      <DataTable<DeliveryOrder, unknown>
        columns={deliveryOrderColumns}
        data={data}
        searchColumn="do_number"
        searchPlaceholder="Search by DO number..."
        pageSize={5}
        meta={{
          onDelete: (ids: string[]) => setDeleteIds(ids),
        }}
      />
      <Dialog open={showModal} onOpenChange={open => !open && setDeleteIds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBulk ? `Delete ${deleteIds?.length} Delivery Orders?` : "Delete Delivery Order?"}</DialogTitle>
            <DialogDescription>
              {isBulk
                ? `Are you sure you want to delete these ${deleteIds?.length} delivery orders? This action cannot be undone.`
                : "Are you sure you want to delete this delivery order? This action cannot be undone."}
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
