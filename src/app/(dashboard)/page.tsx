"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    Calendar,
    FileText,
    Sparkles,
    ArrowRight,
    Clock,
    PlusCircle,
    CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

import { getDashboardMetrics } from "@/core/application/actions/event-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Skeleton } from "@/presentation/components/ui/skeleton";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface DashboardMetrics {
    totalClients: number;
    meetingsThisMonth: number;
    pendingDrafts: number;
    totalGuides: number;
    recentClients: Array<{
        id: string;
        full_name: string;
        company: string | null;
        email: string;
        created_at: string;
    }>;
    upcomingEvents: Array<{
        id: string;
        title: string;
        start_at: string;
        duration_min: number;
        ai_status: string;
        clients: { id: string; full_name: string; company: string | null } | null;
    }>;
    weeklyActivity: number[];
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardMetrics()
            .then((data) => setMetrics(data as unknown as DashboardMetrics))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const chartData = DAY_LABELS.map((name, index) => ({
        name,
        reuniones: metrics?.weeklyActivity[index] ?? 0,
    }));

    const statCards = [
        {
            label: "Total Clientes",
            value: metrics?.totalClients ?? 0,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-50",
        },
        {
            label: "Reuniones este mes",
            value: metrics?.meetingsThisMonth ?? 0,
            icon: Calendar,
            color: "text-brand-500",
            bg: "bg-brand-50",
        },
        {
            label: "Borradores pendientes",
            value: metrics?.pendingDrafts ?? 0,
            icon: FileText,
            color: "text-amber-500",
            bg: "bg-amber-50",
        },
        {
            label: "Guías IA generadas",
            value: metrics?.totalGuides ?? 0,
            icon: Sparkles,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
        },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Resumen de tu actividad y métricas clave
                    </p>
                </div>
                <Link href="/events/new">
                    <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Nueva Reunión
                    </Button>
                </Link>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                                </div>
                                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                {/* Weekly activity chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Actividad Semanal</CardTitle>
                        <Badge variant="brand">Este mes</Badge>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: "hsl(var(--ink-muted))" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: "hsl(var(--ink-muted))" }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--surface))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: 13,
                                    }}
                                />
                                <Bar
                                    dataKey="reuniones"
                                    fill="hsl(var(--brand-500))"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Upcoming events */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Próximos Eventos</CardTitle>
                        <Link href="/agenda">
                            <Button variant="ghost" size="sm" className="gap-1 text-brand-500">
                                Ver agenda
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {metrics?.upcomingEvents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No hay eventos próximos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {metrics?.upcomingEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                            <Clock className="h-5 w-5 text-brand-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{event.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.clients?.full_name} · {format(new Date(event.start_at), "d MMM, HH:mm", { locale: es })}
                                            </p>
                                        </div>
                                        <Badge variant={event.ai_status === "success" ? "success" : "warning"} className="shrink-0 text-[10px]">
                                            {event.ai_status === "success" ? "IA ✓" : "Pendiente"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent clients */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Últimos Clientes</CardTitle>
                    <Link href="/clients">
                        <Button variant="ghost" size="sm" className="gap-1 text-brand-500">
                            Ver todos
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {metrics?.recentClients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aún no tienes clientes registrados</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {metrics?.recentClients.map((client) => (
                                <div key={client.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-medium text-brand-700">
                                            {client.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{client.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{client.company ?? client.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(client.created_at), "d MMM yyyy", { locale: es })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick access */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Nueva Reunión", href: "/events/new", icon: PlusCircle, color: "text-brand-500" },
                    { label: "Ver Agenda", href: "/agenda", icon: CalendarDays, color: "text-blue-500" },
                    { label: "Clientes", href: "/clients", icon: Users, color: "text-emerald-500" },
                    { label: "Borradores", href: "/drafts", icon: FileText, color: "text-amber-500" },
                ].map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card className="group hover:border-brand-200 cursor-pointer transition-all">
                            <CardContent className="p-4 flex items-center gap-3">
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                                <span className="text-sm font-medium group-hover:text-brand-600 transition-colors">
                                    {item.label}
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        </div>
    );
}
