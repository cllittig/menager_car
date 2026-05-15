"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car, ChevronsUpDown } from "lucide-react";

export function TeamSwitcher() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-[200px] justify-between"
                >
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-5 w-5">
                            <AvatarFallback>
                                <Car className="h-3 w-3" />
                            </AvatarFallback>
                        </Avatar>
                        <span>ManagerCar</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuItem>
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-5 w-5">
                            <AvatarFallback>
                                <Car className="h-3 w-3" />
                            </AvatarFallback>
                        </Avatar>
                        <span>ManagerCar</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 