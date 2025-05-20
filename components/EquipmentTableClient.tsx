"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { Equipment, equipmentColumns } from "@/components/equipmentColumns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EquipmentTableClientProps {
  data: Equipment[];
}

export default function EquipmentTableClient({ data }: EquipmentTableClientProps) {
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showModal = !!deleteIds && deleteIds.length > 0;
  const isBulk = deleteIds && deleteIds.length > 1;

  const handleDelete = async () => {
    if (!deleteIds) return;
    setLoading(true);
    await fetch("/api/equipment/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: deleteIds }),
    });
    setLoading(false);
    setDeleteIds(null);
    router.refresh();
  };

  console.log(data)
  return (
    <>
      <DataTable<Equipment, unknown>
        columns={equipmentColumns}
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
            <DialogTitle>{isBulk ? `Delete ${deleteIds?.length} Equipment Items?` : "Delete Equipment?"}</DialogTitle>
            <DialogDescription>
              {isBulk
                ? `Are you sure you want to delete these ${deleteIds?.length} equipment items? This action cannot be undone.`
                : "Are you sure you want to delete this equipment? This action cannot be undone."}
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
