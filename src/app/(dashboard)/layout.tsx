"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/presentation/components/layout/sidebar";
import { Header } from "@/presentation/components/layout/header";
import { createClient } from "@/infrastructure/supabase/client";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<{
        email?: string;
        full_name?: string;
        avatar_url?: string;
    } | null>(null);

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
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300",
                    collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
                )}
            >
                <Header user={user} onMenuToggle={() => setCollapsed(!collapsed)} />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
