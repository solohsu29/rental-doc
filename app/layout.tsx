import type React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"


import "@/app/globals.css"
import { SidebarNav } from "@/components/SidebarNav"
import Header from "@/components/Header"
import { cn } from "@/lib/utils"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <SidebarNav />
          <SidebarInset>
            <header className="flex items-center gap-4 bg-background px-3 py-3">
              <SidebarTrigger />
              <div className="flex items-center justify-between w-full">
              <Header />
              </div>
            </header>
            <div className="flex-1 flex flex-col">
           
            <div className={cn("flex-1 overflow-hidden px-4")}>
              {children}
            </div>
          </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
