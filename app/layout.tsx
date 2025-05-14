import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Toaster } from "@/app/components/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Equipment Rental Management System",
  description: "Manage equipment rentals, documents, and inspections",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col px-6">
          <header className="sticky top-0 z-50 border-b bg-background">
            <div className="flex h-16 items-center justify-between py-4">
              <MainNav />
              <UserNav />
            </div>
          </header>
          <main className="flex-1">
            <div className="px-6 py-6">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
