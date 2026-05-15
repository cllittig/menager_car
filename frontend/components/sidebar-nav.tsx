import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Car,
    Package,
    Settings,
    ShoppingCart,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    {
        title: "Veículos",
        href: "/vehicles",
        icon: Car,
    },
    {
        title: "Clientes",
        href: "/clients",
        icon: Users,
    },
    {
        title: "Produtos",
        href: "/products",
        icon: Package,
    },
    {
        title: "Vendas",
        href: "/sales",
        icon: ShoppingCart,
    },
    {
        title: "Relatórios",
        href: "/reports",
        icon: BarChart,
    },
    {
        title: "Configurações",
        href: "/settings",
        icon: Settings,
    },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="grid items-start gap-2">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            pathname === item.href
                                ? "bg-muted font-medium"
                                : "hover:bg-muted",
                            "justify-start"
                        )}
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
} 