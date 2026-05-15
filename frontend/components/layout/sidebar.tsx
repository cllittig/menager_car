import { SidebarNav } from "@/components/sidebar-nav";
import { cn } from "@/lib/utils";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Menu
                    </h2>
                    <div className="space-y-1">
                        <SidebarNav />
                    </div>
                </div>
            </div>
        </div>
    );
} 