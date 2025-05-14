"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Rental {
  id: number
  equipment_id: number
  site_location: string
  client_name: string
  gondola_number: string
}

export default function NewInspectionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [selectedRental, setSelectedRental] = useState<string>("")
  const [isEndorsed, setIsEndorsed] = useState(false)
  const [isChargeable, setIsChargeable] = useState(false)

  useEffect(() => {
    async function fetchRentals() {
      try {
        const response = await fetch("/api/rentals")
        if (!response.ok) {
          throw new Error("Failed to fetch rentals")
        }
        const data = await response.json()
        // Only show active rentals
        setRentals(data.filter((r: any) => r.status === "active"))
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to fetch rentals. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchRentals()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const rental = rentals.find((r) => r.id.toString() === formData.get("rental_id"))

    if (!rental) {
      toast({
        title: "Error",
        description: "Invalid rental selected.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        body: JSON.stringify({
          rental_id: formData.get("rental_id"),
          equipment_id: rental.equipment_id,
          inspection_date: formData.get("inspection_date"),
          inspection_type: formData.get("inspection_type"),
          inspector_name: formData.get("inspector_name"),
          client_safety_officer: formData.get("client_safety_officer"),
          is_endorsed: isEndorsed,
          is_chargeable: isChargeable,
          charge_amount: isChargeable ? formData.get("charge_amount") : null,
          notes: formData.get("notes"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to create inspection")
      }

      toast({
        title: "Inspection recorded",
        description: "The inspection has been recorded successfully.",
      })

      router.push("/inspections")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to record inspection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Record Inspection</h1>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Record the details of an equipment inspection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rental_id">Rental</Label>
              <Select name="rental_id" value={selectedRental} onValueChange={setSelectedRental} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select rental" />
                </SelectTrigger>
                <SelectContent>
                  {rentals.map((rental) => (
                    <SelectItem key={rental.id} value={rental.id.toString()}>
                      {rental.gondola_number} - {rental.client_name} - {rental.site_location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rentals.length === 0 && <p className="text-sm text-muted-foreground">No active rentals found.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspection_date">Inspection Date</Label>
                <Input id="inspection_date" name="inspection_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspection_type">Inspection Type</Label>
                <Select name="inspection_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspector_name">Inspector Name</Label>
                <Input id="inspector_name" name="inspector_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_safety_officer">Client Safety Officer</Label>
                <Input id="client_safety_officer" name="client_safety_officer" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_endorsed"
                checked={isEndorsed}
                onCheckedChange={(checked) => setIsEndorsed(checked === true)}
              />
              <Label htmlFor="is_endorsed" className="font-normal">
                Endorsed by client
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_chargeable"
                checked={isChargeable}
                onCheckedChange={(checked) => setIsChargeable(checked === true)}
              />
              <Label htmlFor="is_chargeable" className="font-normal">
                Chargeable inspection
              </Label>
            </div>

            {isChargeable && (
              <div className="space-y-2">
                <Label htmlFor="charge_amount">Charge Amount</Label>
                <Input id="charge_amount" name="charge_amount" type="number" step="0.01" required={isChargeable} />
              </div>
            )}

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
              {isLoading ? "Recording..." : "Record Inspection"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
