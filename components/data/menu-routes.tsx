
import { BarChart3, Box, FileText, Package, ShoppingCart, Timer, Truck, Users } from 'lucide-react'


export const menuRoutes = (pathname:string) => {
    return [
    {
      path: "/",
      name: "Dashboard",
      icon: BarChart3,
      active: pathname === "/",
    },
    {
      path: "/equipment",
      name: "Equipment",
      icon: Box,
      active: pathname === "/equipment" || pathname.startsWith("/equipment/"),
    },

    {
      path: "/rentals",
      name: "Rentals",
      icon: ShoppingCart,
      active: pathname === "/rentals" || pathname.startsWith("/rentals/"),
    },
    {
      path: "/shifts",
      name: "Shifts",
      icon: Timer,
      active: pathname === "/shifts" || pathname.startsWith("/shifts/"),
    },
    {
      path: "/inspections",
      name: "Inspections",
      icon: Package,
      active: pathname === "/inspections" || pathname.startsWith("/inspections/"),
    },
    {
      path: "/delivery-orders",
      name: "Delivery Orders",
      icon: Truck,
      active: pathname === "/delivery-orders" || pathname.startsWith("/delivery-orders/"),
    },
    {
      path: "/clients",
      name: "Clients",
      icon: Users,
      active: pathname === "/clients" || pathname.startsWith("/clients/"),
    },
  ]
}

 