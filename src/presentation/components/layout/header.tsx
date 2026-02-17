"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Menu } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/infrastructure/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar";
import { Button } from "@/presentation/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { ModeToggle } from "@/presentation/components/layout/mode-toggle";

interface HeaderProps {
    user: {
        email?: string;
        full_name?: string;
        avatar_url?: string;
    } | null;
    onMenuToggle?: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Sesión cerrada correctamente");
        router.push("/login");
        router.refresh();
    };

    const initials = user?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "U";

    return (
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                {onMenuToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onMenuToggle}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <div>
                    <h2 className="text-sm font-medium text-ink-muted">
                        ¡Hola, <span className="text-ink font-semibold">{user?.full_name ?? "Usuario"}</span>!
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ModeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-full hover:bg-muted/60 p-1 pr-3 transition-colors cursor-pointer">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatar_url ?? undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium hidden sm:inline">{user?.full_name ?? "Usuario"}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">{user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="h-4 w-4" />
                            Mi Perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
