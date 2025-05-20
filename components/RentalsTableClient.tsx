"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import type { TableMeta } from "@/components/TableMeta";
import { Rental, rentalColumns } from "@/components/rentalColumns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RentalsTableClientProps {
  data: Rental[];
}

export default function RentalsTableClient({ data }: RentalsTableClientProps) {
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showModal = !!deleteIds && deleteIds.length > 0;
  const isBulk = deleteIds && deleteIds.length > 1;

  const handleDelete = async () => {
    if (!deleteIds) return;
    setLoading(true);
    await fetch("/api/rentals/bulk-delete", {
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
      <DataTable<Rental, unknown>
        columns={rentalColumns}
        data={data}
        searchColumn="gondola_number"
        searchPlaceholder="Search by gondola number..."
        pageSize={10}
        meta={{
          onDelete: (ids: string[]) => setDeleteIds(ids),
        }}
      />
      <Dialog open={showModal} onOpenChange={open => !open && setDeleteIds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBulk ? `Delete ${deleteIds?.length} Rentals?` : "Delete Rental?"}</DialogTitle>
            <DialogDescription>
              {isBulk
                ? `Are you sure you want to delete these ${deleteIds?.length} rentals? This action cannot be undone.`
                : "Are you sure you want to delete this rental? This action cannot be undone."}
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
