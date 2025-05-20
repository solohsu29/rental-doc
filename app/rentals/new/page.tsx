"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Equipment {
  id: number
  gondola_number: string
  status: string
}

interface Client {
  id: number
  name: string
}

export default function NewRentalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipmentId = searchParams.get("equipment_id")

  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>(equipmentId || "")
  const [selectedClient, setSelectedClient] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch equipment
        const equipmentResponse = await fetch("/api/equipment")
        if (!equipmentResponse.ok) {
          throw new Error("Failed to fetch equipment")
        }
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData.filter((e: Equipment) => e.status === "available"))

        // Fetch clients
        const clientsResponse = await fetch("/api/clients")
        if (!clientsResponse.ok) {
          throw new Error("Failed to fetch clients")
        }
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/rentals", {
        method: "POST",
        body: JSON.stringify({
          equipment_id: formData.get("equipment_id"),
          client_id: formData.get("client_id"),
          site_location: formData.get("site_location"),
          start_date: formData.get("start_date"),
          end_date: formData.get("end_date"),
          monthly_rate: formData.get("monthly_rate"),
          notes: formData.get("notes"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create rental")
      }

      const data = await response.json()

      toast({
        title: "Rental created",
        description: "The rental has been created successfully.",
      })

      // Redirect to create a deployment delivery order
      router.push(`/delivery-orders/new?rental_id=${data.id}&type=deployment`)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Failed to create rental. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Create New Rental</h1>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Rental Details</CardTitle>
            <CardDescription>Enter the details of the new equipment rental.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment</Label>
              <Select name="equipment_id" value={selectedEquipment} onValueChange={setSelectedEquipment} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.gondola_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {equipment.length === 0 && <p className="text-sm text-muted-foreground">No available equipment found.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select name="client_id" value={selectedClient} onValueChange={setSelectedClient} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground">No clients found. Please add a client first.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_location">Site Location</Label>
              <Input id="site_location" name="site_location" required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rate">Monthly Rate</Label>
                <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Rental"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
