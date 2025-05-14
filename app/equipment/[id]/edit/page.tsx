
"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface Equipment {
  id: number
  gondola_number: string
  motor_serial_number: string
  monthly_rate?: number
  status: string
  equipment_type: string
  current_location?: string
  notes?: string
}

import { useParams } from "next/navigation";

export default function EditEquipmentPage() {
  const { id } = useParams();
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch(`/api/equipment/${id}`)
        if (!response.ok) throw new Error("Failed to fetch equipment")
        const data = await response.json()
        setEquipment(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch equipment.",
          variant: "destructive",
        })
      }
    }
    fetchEquipment()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const gondola_number = formData.get("gondola_number")?.toString().trim()
    const motor_serial_number = formData.get("motor_serial_number")?.toString().trim()
    const status = formData.get("status")?.toString().trim()
    const equipment_type = formData.get("equipment_type")?.toString().trim()
    if (!gondola_number || !motor_serial_number || !status || !equipment_type) {
      setFormError("Please fill in all required fields.")
      setIsLoading(false)
      return
    }
    try {
      const formData = new FormData(e.currentTarget)
      const payload = {
        gondola_number,
        motor_serial_number,
        monthly_rate: formData.get("monthly_rate"),
        status,
        equipment_type: formData.get("equipment_type")?.toString().trim(),
        current_location: formData.get("current_location")?.toString().trim(),
        notes: formData.get("notes")?.toString().trim(),
      }
      const response = await fetch(`/api/equipment/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.error || "Failed to update equipment")
        throw new Error(errorData.error || "Failed to update equipment")
      }
      toast({
        title: "Success",
        description: "Equipment updated successfully.",
      })
      router.push(`/equipment`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update equipment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!equipment) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-300">
          {formError}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Edit Equipment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="gondola_number">Gondola Number</Label>
          <Input id="gondola_number" name="gondola_number" defaultValue={equipment.gondola_number} required />
        </div>
        <div>
          <Label htmlFor="motor_serial_number">Motor Serial Number</Label>
          <Input id="motor_serial_number" name="motor_serial_number" defaultValue={equipment.motor_serial_number} required />
        </div>
        <div>
          <Label htmlFor="monthly_rate">Monthly Rate</Label>
          <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" defaultValue={equipment.monthly_rate ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={equipment.status}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="deployed">Deployed</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <Label htmlFor="equipment_type">Equipment Type</Label>
          <Input id="equipment_type" name="equipment_type" defaultValue={equipment.equipment_type} required />
        </div>
        <div>
          <Label htmlFor="current_location">Current Location</Label>
          <Input id="current_location" name="current_location" defaultValue={equipment.current_location ?? ""} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={equipment.notes ?? ""}
            className="w-full border rounded px-3 py-2 min-h-[80px]"
          />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
