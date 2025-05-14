"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Equipment {
  id: number
  gondola_number: string
  motor_serial_number: string
  equipment_type: string
  status: string
}

export default function DocumentSetupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0])

  // Define required documents
  const requiredDocuments = [
    { id: "SWP", name: "SWP", checked: true, expiryRequired: false },
    { id: "RA", name: "RA", checked: true, expiryRequired: false },
    { id: "MOS", name: "MOS", checked: true, expiryRequired: false },
    { id: "MOM_CERT", name: "MOM Cert", checked: true, expiryRequired: true, expiryMonths: 12 },
    { id: "PE_CALCULATION", name: "PE Calculation", checked: true, expiryRequired: false, oneTime: true },
    { id: "COS", name: "COS", checked: true, expiryRequired: true, expiryMonths: 3 },
    { id: "LEW", name: "LEW", checked: true, expiryRequired: true, expiryMonths: 1 },
  ]

  const [documents, setDocuments] = useState(requiredDocuments)

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch(`/api/equipment/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch equipment")
        }
        const data = await response.json()
        setEquipment(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to fetch equipment details. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchEquipment()
  }, [params.id])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Filter only checked documents
      const selectedDocuments = documents.filter((doc) => doc.checked)

      // Create all selected documents
      for (const doc of selectedDocuments) {
        // Calculate expiry date if required
        let expiryDate = null
        if (doc.expiryRequired && doc.expiryMonths) {
          const expiry = new Date(issueDate)
          expiry.setMonth(expiry.getMonth() + doc.expiryMonths)
          expiryDate = expiry.toISOString().split("T")[0]
        }

        // Create document
        const response = await fetch("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            equipment_id: params.id,
            document_type: doc.id,
            issue_date: issueDate,
            expiry_date: expiryDate,
            notes: doc.oneTime ? "One-time document unless system changes" : "",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to create ${doc.name} document`)
        }
      }

      toast({
        title: "Documents created",
        description: "All required documents have been set up successfully.",
      })

      // Redirect to equipment details page
      router.push(`/equipment/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!equipment) {
    return <div>Loading equipment details...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Set Up Required Documents</h1>
      <p className="text-muted-foreground">
        The following documents are required when equipment is first deployed to a site.
      </p>

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Equipment: {equipment.gondola_number}</CardTitle>
            <CardDescription>Motor Serial Number: {equipment.motor_serial_number}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date for All Documents</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Required Documents</Label>
              <div className="grid gap-2 border rounded-md p-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={doc.id}
                      checked={doc.checked}
                      onCheckedChange={(checked) => {
                        setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, checked: !!checked } : d)))
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={doc.id} className="font-medium">
                        {doc.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {doc.expiryRequired
                          ? `Expires after ${doc.expiryMonths} month${doc.expiryMonths > 1 ? "s" : ""}`
                          : "No expiry date"}
                        {doc.oneTime ? " (One-time document unless system changes)" : ""}
                        {doc.id === "MOM_CERT" || doc.id === "COS" ? " - Includes Gondola and Motor Serial Number" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push(`/equipment/${params.id}`)}>
              Skip for Now
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Documents..." : "Create Documents"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
