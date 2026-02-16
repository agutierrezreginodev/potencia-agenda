"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarDays,
    PlusCircle,
    Users,
    FileText,
    ChevronLeft,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/presentation/components/ui/separator";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        section: "GENERAL",
    },
    {
        label: "Agenda",
        href: "/agenda",
        icon: CalendarDays,
        section: "GENERAL",
    },
    {
        label: "Nueva Reunión",
        href: "/events/new",
        icon: PlusCircle,
        section: "GENERAL",
    },
    {
        label: "Clientes",
        href: "/clients",
        icon: Users,
        section: "GESTIÓN",
    },
    {
        label: "Borradores",
        href: "/drafts",
        icon: FileText,
        section: "GESTIÓN",
    },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();

    const sections = NAV_ITEMS.reduce(
        (acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        },
        {} as Record<string, typeof NAV_ITEMS>
    );

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                    <span
                        className="text-lg font-bold tracking-tight text-brand-700 whitespace-nowrap"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Potenc-IA
                    </span>
                )}
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                {Object.entries(sections).map(([section, items]) => (
                    <div key={section} className="space-y-1">
                        {!collapsed && (
                            <p className="px-3 text-[11px] font-semibold text-ink-faint uppercase tracking-widest mb-2">
                                {section}
                            </p>
                        )}
                        {items.map((item) => {
                            const isActive =
                                item.href === "/"
                                    ? pathname === "/"
                                    : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-brand-50 text-brand-600 shadow-sm"
                                            : "text-ink-muted hover:text-ink hover:bg-muted/60"
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 shrink-0 transition-colors",
                                            isActive
                                                ? "text-brand-500"
                                                : "text-ink-faint group-hover:text-ink-muted"
                                        )}
                                    />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-sidebar-border">
                <button
                    onClick={onToggle}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-muted/60 transition-all w-full cursor-pointer",
                        collapsed && "justify-center"
                    )}
                >
                    <ChevronLeft
                        className={cn(
                            "h-5 w-5 shrink-0 transition-transform duration-300",
                            collapsed && "rotate-180"
                        )}
                    />
                    {!collapsed && <span>Colapsar</span>}
                </button>
            </div>
        </aside>
    );
}
