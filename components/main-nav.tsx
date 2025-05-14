"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      active: pathname === "/",
    },
    {
      href: "/equipment",
      label: "Equipment",
      active: pathname === "/equipment" || pathname.startsWith("/equipment/"),
    },
    {
      href: "/documents",
      label: "Documents",
      active: pathname === "/documents" || pathname.startsWith("/documents/"),
    },
    {
      href: "/rentals",
      label: "Rentals",
      active: pathname === "/rentals" || pathname.startsWith("/rentals/"),
    },
    {
      href: "/shifts",
      label: "Shifts",
      active: pathname === "/shifts" || pathname.startsWith("/shifts/"),
    },
    {
      href: "/inspections",
      label: "Inspections",
      active: pathname === "/inspections" || pathname.startsWith("/inspections/"),
    },
    {
      href: "/delivery-orders",
      label: "Delivery Orders",
      active: pathname === "/delivery-orders" || pathname.startsWith("/delivery-orders/"),
    },
    {
      href: "/clients",
      label: "Clients",
      active: pathname === "/clients" || pathname.startsWith("/clients/"),
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
