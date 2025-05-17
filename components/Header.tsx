"use client";
import React from "react";

import { ChevronLeft, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "./hooks/usePageTitle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";


const Header = () => {
  const { titleData } = usePageTitle();
  const router = useRouter();
  return (
   
      
       
          <div
            className="w-full flex items-center justify-between py-1 px-[12px] text-[#424242] font-semibold text-xl"
          
          >
            <div>
              <div className="flex items-center gap-2">
                {titleData?.isSubPath && (
                  <button onClick={() => router?.back()}>
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {titleData?.title}
              </div>
            </div>
            <div className="flex items-center gap-4">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-start gap-2 px-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">Admin</span>
                  <span className="text-xs text-muted-foreground">admin@example.com</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">admin@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
          </div>
      
    
   
  );
};

export default Header;