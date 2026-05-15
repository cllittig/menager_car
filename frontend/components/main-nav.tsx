"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex items-center space-x-4 lg:space-x-6",
                className
            )}
            {...props}
        >
            <Link
                href="/dashboard"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Dashboard
            </Link>
            <Link
                href="/veiculos"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/veiculos" ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Veículos
            </Link>
            <Link
                href="/clientes"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/clientes" ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Clientes
            </Link>
            <Link
                href="/vendas"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/vendas" ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Vendas
            </Link>
            <Link
                href="/manutencao"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/manutencao" ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Manutenção
            </Link>
        </nav>
    );
} 