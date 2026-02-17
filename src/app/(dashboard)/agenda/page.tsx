"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Sparkles,
    Plus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { getEvents, getEvent } from "@/core/application/actions/event-actions";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EventDetailsDialog } from "@/presentation/components/events/event-details-dialog";
import type { IEvent } from "@/core/domain/models/event";

// We use IEvent directly for details, but list uses partial. 
// For simplicity, let's cast list items to any or partial IEvent for now, 
// and fetch full details when opening dialog.
interface EventData {
    id: string;
    title: string;
    start_at: string;
    duration_min: number;
    ai_status: string;
    is_draft: boolean;
    clients: { id: string; full_name: string; company: string | null } | null;
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"month" | "week">("month");

    // Details Dialog State
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const start = startOfMonth(subMonths(currentDate, 1));
            const end = endOfMonth(addMonths(currentDate, 1));

            const data = await getEvents({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            setEvents(data as unknown as EventData[]);
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Fetch full details when an event is clicked
    const handleEventClick = async (eventId: string) => {
        setSelectedEventId(eventId);
        setLoadingDetails(true);
        setDetailsOpen(true);
        try {
            const data = await getEvent(eventId);
            setSelectedEvent(data as unknown as IEvent);
        } catch {
            toast.error("Error al cargar detalles");
            setDetailsOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDetails = (open: boolean) => {
        setDetailsOpen(open);
        if (!open) {
            setSelectedEvent(null);
            setSelectedEventId(null);
        }
    };

    const goToPrev = () => {
        setCurrentDate((d) =>
            view === "month" ? subMonths(d, 1) : new Date(d.getTime() - 7 * 86400000)
        );
    };

    const goToNext = () => {
        setCurrentDate((d) =>
            view === "month" ? addMonths(d, 1) : new Date(d.getTime() + 7 * 86400000)
        );
    };

    const goToToday = () => setCurrentDate(new Date());

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Agenda
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/events/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nueva Reunión
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Navigation + view tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                        <Button variant="outline" size="icon" onClick={goToPrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Hoy
                        </Button>
                        <Button variant="outline" size="icon" onClick={goToNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <span
                        className="text-lg font-semibold capitalize text-center sm:text-left"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        {format(currentDate, view === "month" ? "MMMM yyyy" : "'Semana del' d MMMM", { locale: es })}
                    </span>
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto">
                        <TabsTrigger value="month">Mes</TabsTrigger>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <Skeleton className="h-[600px] rounded-xl" />
            ) : view === "month" ? (
                <MonthView
                    currentDate={currentDate}
                    events={events}
                    onEventClick={handleEventClick}
                />
            ) : (
                <WeekView
                    currentDate={currentDate}
                    events={events}
                    onEventClick={handleEventClick}
                />
            )}

            <EventDetailsDialog
                open={detailsOpen}
                onOpenChange={handleCloseDetails}
                event={selectedEvent}
                onDelete={fetchEvents}
            />
        </div>
    );
}

function MonthView({
    currentDate,
    events,
    onEventClick,
}: {
    currentDate: Date;
    events: EventData[];
    onEventClick: (id: string) => void;
}) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b">
                        {DAY_NAMES.map((name) => (
                            <div
                                key={name}
                                className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7">
                        {days.map((day) => {
                            const dayEvents = events.filter((e) =>
                                isSameDay(new Date(e.start_at), day)
                            );
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "min-h-[100px] border-b border-r p-2 transition-colors",
                                        !isCurrentMonth && "bg-muted/30",
                                        isToday(day) && "bg-brand-50/50"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full",
                                            isToday(day) && "bg-brand-500 text-white",
                                            !isCurrentMonth && "text-muted-foreground/50"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={() => onEventClick(event.id)}
                                                className={cn(
                                                    "text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors",
                                                    event.is_draft
                                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                        : event.ai_status === "success"
                                                            ? "bg-brand-100 text-brand-800 hover:bg-brand-200"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                )}
                                                title={`${event.title} — ${event.clients?.full_name}`}
                                            >
                                                <span className="font-medium">
                                                    {format(new Date(event.start_at), "HH:mm")}
                                                </span>{" "}
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground pl-1.5">
                                                +{dayEvents.length - 3} más
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function WeekView({
    currentDate,
    events,
    onEventClick,
}: {
    currentDate: Date;
    events: EventData[];
    onEventClick: (id: string) => void;
}) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            {days.map((day) => {
                const dayEvents = events.filter((e) =>
                    isSameDay(new Date(e.start_at), day)
                );

                return (
                    <Card
                        key={day.toISOString()}
                        className={cn(isToday(day) && "border-brand-300 bg-brand-50/30")}
                    >
                        <CardHeader className="p-3 pb-2">
                            <div className="text-center">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {format(day, "EEE", { locale: es })}
                                </p>
                                <p
                                    className={cn(
                                        "text-xl font-bold mt-1",
                                        isToday(day) && "text-brand-500"
                                    )}
                                >
                                    {format(day, "d")}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 space-y-2">
                            {dayEvents.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground text-center py-4">
                                    Sin eventos
                                </p>
                            ) : (
                                dayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => onEventClick(event.id)}
                                        className="p-2 rounded-lg border bg-surface hover:border-brand-200 transition-colors cursor-pointer"
                                    >
                                        <p className="text-[11px] font-semibold text-brand-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(event.start_at), "HH:mm")}
                                        </p>
                                        <p className="text-xs font-medium mt-0.5 truncate">{event.title}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            {event.clients?.full_name}
                                        </p>
                                        <div className="flex gap-1 mt-1.5">
                                            {event.is_draft && (
                                                <Badge variant="warning" className="text-[8px] px-1 py-0">
                                                    Borrador
                                                </Badge>
                                            )}
                                            {event.ai_status === "success" && (
                                                <Badge variant="success" className="text-[8px] px-1 py-0">
                                                    <Sparkles className="h-2 w-2 mr-0.5" />
                                                    IA
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
