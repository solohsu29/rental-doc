"use client"

import RentalDeliveryOrderForm from "@/components/RentalDeliveryOrderForm";

export default function NewDeliveryOrderPage() {
  return (
    <main className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create Delivery Order</h1>
      <RentalDeliveryOrderForm />
    </main>
  );
}
