"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getEvent, updateEvent } from "@/core/application/actions/event-actions";
import { EventForm } from "@/presentation/components/events/event-form";
import type { CreateEventDto, IAiGuide, IEvent } from "@/core/domain/models/event";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await getEvent(id);
                setEvent(data as unknown as IEvent);
            } catch {
                toast.error("Error al cargar la reunión");
                router.push("/agenda");
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, router]);

    const handleSubmit = async (
        data: CreateEventDto,
        guide: IAiGuide | null,
        aiStatus: string,
        aiModel: string | null,
        aiTokens: number | null,
        isDraft: boolean,
        timezoneOffset: number
    ) => {
        if (!event) return;

        try {
            // Calculate timezone aware start_at string
            const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60).toString().padStart(2, "0");
            const offsetMinutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, "0");
            const sign = timezoneOffset > 0 ? "-" : "+";
            const startAt = `${data.start_date}T${data.start_time}:00${sign}${offsetHours}:${offsetMinutes}`;

            const updates: Record<string, unknown> = {
                title: data.title,
                start_at: startAt,
                duration_min: data.duration_min,
                request: data.request,
                ai_guide: guide,
                ai_status: aiStatus === "success" ? "success" : aiStatus === "error" ? "error" : "pending",
                ai_model: aiModel,
                ai_tokens: aiTokens,
                notes: data.notes || null,
                is_draft: isDraft,
            };

            await updateEvent(event.id, updates);

            toast.success(isDraft ? "Borrador actualizado" : "Reunión actualizada");
            router.push(isDraft ? "/drafts" : "/agenda");
        } catch (error) {
            toast.error("Error al actualizar", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link
                href="/agenda"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </Link>

            <div>
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Editar Reunión
                </h1>
                <p className="text-muted-foreground mt-1">
                    Modifica los detalles de la reunión o regenera la guía IA
                </p>
            </div>

            <EventForm initialData={event} onSubmit={handleSubmit} isEditing={true} />
        </div>
    );
}
