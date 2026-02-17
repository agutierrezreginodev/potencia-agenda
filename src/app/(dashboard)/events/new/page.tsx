"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { createEvent } from "@/core/application/actions/event-actions";
import { EventForm } from "@/presentation/components/events/event-form";
import type { CreateEventDto, IAiGuide } from "@/core/domain/models/event";

export default function NewEventPage() {
    const router = useRouter();

    const handleSubmit = async (
        data: CreateEventDto,
        guide: IAiGuide | null,
        aiStatus: string,
        aiModel: string | null,
        aiTokens: number | null,
        isDraft: boolean,
        timezoneOffset: number
    ) => {
        try {
            await createEvent(
                data,
                guide as unknown as Record<string, unknown>,
                aiStatus === "success" ? "success" : aiStatus === "error" ? "error" : "pending",
                aiModel,
                aiTokens,
                isDraft,
                timezoneOffset
            );
            toast.success(isDraft ? "Borrador guardado" : "Reunión creada exitosamente");
            router.push(isDraft ? "/drafts" : "/agenda");
        } catch (error) {
            toast.error("Error al guardar", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
            throw error;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al dashboard
            </Link>

            <div>
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Nueva Reunión
                </h1>
                <p className="text-muted-foreground mt-1">
                    Registra una reunión y genera una guía de IA para tu cliente
                </p>
            </div>

            <EventForm onSubmit={handleSubmit} />
        </div>
    );
}
