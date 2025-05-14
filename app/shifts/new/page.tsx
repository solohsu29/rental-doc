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

export default function NewShiftPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [selectedRental, setSelectedRental] = useState<string>("")
  const [cosIssued, setCosIssued] = useState(false)

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
      const response = await fetch("/api/shifts", {
        method: "POST",
        body: JSON.stringify({
          rental_id: formData.get("rental_id"),
          equipment_id: rental.equipment_id,
          shift_date: formData.get("shift_date"),
          bay: formData.get("bay"),
          elevation: formData.get("elevation"),
          block: formData.get("block"),
          floor: formData.get("floor"),
          cos_issued: cosIssued,
          notes: formData.get("notes"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to record shift")
      }

      const data = await response.json()

      toast({
        title: "Shift recorded",
        description: "The equipment shift has been recorded successfully.",
      })

      // If COS is issued, redirect to create a document
      if (cosIssued) {
        router.push(`/documents/new?equipment_id=${rental.equipment_id}&document_type=COS&shift_id=${data.id}`)
      } else {
        router.push("/shifts")
      }
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to record shift. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Record Equipment Shift</h1>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>Record the details of an equipment shift.</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="shift_date">Shift Date</Label>
              <Input id="shift_date" name="shift_date" type="date" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Input id="block" name="block" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input id="floor" name="floor" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bay">Bay</Label>
                <Input id="bay" name="bay" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevation">Elevation</Label>
                <Input id="elevation" name="elevation" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cos_issued"
                checked={cosIssued}
                onCheckedChange={(checked) => setCosIssued(checked === true)}
              />
              <Label htmlFor="cos_issued" className="font-normal">
                COS Issued for this shift
              </Label>
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
              {isLoading ? "Recording..." : "Record Shift"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
