"use client"

import RentalDeliveryOrderForm from "@/components/RentalDeliveryOrderForm";
import { Suspense } from "react";

export default function NewDeliveryOrderPage() {
  return (
    <Suspense fallback={<div>Loading ...</div>} >
      <h1 className="text-2xl font-bold mb-6">Create Delivery Order</h1>
      <RentalDeliveryOrderForm />
    </Suspense>
  );
}
