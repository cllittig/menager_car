import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <MainNav />
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        <ModeToggle />
                        <UserNav />
                    </nav>
                </div>
            </div>
        </header>
    );
} 