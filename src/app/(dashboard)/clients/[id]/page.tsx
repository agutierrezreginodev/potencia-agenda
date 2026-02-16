"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MessageSquare,
    Calendar,
    Sparkles,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { getClient, getClientEvents } from "@/core/application/actions/client-actions";
import type { IClient } from "@/core/domain/models/client";
import type { IEvent } from "@/core/domain/models/event";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Separator } from "@/presentation/components/ui/separator";

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [client, setClient] = useState<IClient | null>(null);
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params.id as string;
        Promise.all([getClient(id), getClientEvents(id)])
            .then(([c, e]) => {
                setClient(c as unknown as IClient);
                setEvents(e as unknown as IEvent[]);
            })
            .catch(() => router.push("/clients"))
            .finally(() => setLoading(false));
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link
                href="/clients"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a clientes
            </Link>

            {/* Client info */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700 shrink-0">
                            {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                                    {client.full_name}
                                </h1>
                                {client.company && (
                                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Building2 className="h-4 w-4" />
                                        {client.company}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {client.email}
                                </span>
                                {client.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-4 w-4" />
                                        {client.phone}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Desde {format(new Date(client.created_at), "MMM yyyy", { locale: es })}
                                </span>
                            </div>
                            {client.notes && (
                                <>
                                    <Separator />
                                    <p className="text-sm flex items-start gap-1.5">
                                        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                                        {client.notes}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Events history */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-brand-500" />
                        Historial de Reuniones ({events.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {events.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No hay reuniones registradas con este cliente
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                        <Clock className="h-5 w-5 text-brand-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{event.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(event.start_at), "d MMMM yyyy, HH:mm", { locale: es })} · {event.duration_min} min
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {event.request}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {event.is_draft && <Badge variant="warning">Borrador</Badge>}
                                        <Badge
                                            variant={
                                                event.ai_status === "success" ? "success"
                                                    : event.ai_status === "error" ? "destructive"
                                                        : "secondary"
                                            }
                                        >
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {event.ai_status === "success" ? "Guía IA" : event.ai_status === "error" ? "Error IA" : "Pendiente"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
