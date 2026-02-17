"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent } from "@/presentation/components/layout/sidebar";
import { Header } from "@/presentation/components/layout/header";
import { createClient } from "@/infrastructure/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/presentation/components/ui/sheet";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const [user, setUser] = useState<{
        email?: string;
        full_name?: string;
        avatar_url?: string;
    } | null>(null);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const supabase = createClient();

        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser({
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0],
                    avatar_url: authUser.user_metadata?.avatar_url,
                });
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0],
                    avatar_url: session.user.user_metadata?.avatar_url,
                });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                className="hidden lg:flex"
            />

            {/* Mobile Sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-[260px] border-r border-sidebar-border bg-sidebar-background">
                    <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                    <SidebarContent
                        collapsed={false}
                        onToggle={() => setMobileOpen(false)}
                        hideToggle
                    />
                </SheetContent>
            </Sheet>

            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300",
                    collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
                )}
            >
                <Header user={user} onMenuToggle={() => setMobileOpen(true)} />
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full max-w-[100vw] overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
