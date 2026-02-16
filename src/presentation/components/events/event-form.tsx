"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Loader2,
    Sparkles,
    Save,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { createEventSchema, type CreateEventDto, type IAiGuide, type IEvent } from "@/core/domain/models/event";
import { searchClientByEmail } from "@/core/application/actions/client-actions";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select";
import { AiGuidePreview } from "./ai-guide-preview";

const DURATION_OPTIONS = [
    { value: "15", label: "15 minutos" },
    { value: "30", label: "30 minutos" },
    { value: "45", label: "45 minutos" },
    { value: "60", label: "1 hora" },
    { value: "90", label: "1.5 horas" },
    { value: "120", label: "2 horas" },
];

interface EventFormProps {
    initialData?: IEvent;
    onSubmit: (
        data: CreateEventDto,
        guide: IAiGuide | null,
        aiStatus: string,
        aiModel: string | null,
        aiTokens: number | null,
        isDraft: boolean
    ) => Promise<void>;
    isEditing?: boolean;
}

export function EventForm({ initialData, onSubmit, isEditing = false }: EventFormProps) {
    const [aiGuide, setAiGuide] = useState<IAiGuide | null>(initialData?.ai_guide ?? null);
    const [aiStatus, setAiStatus] = useState<string>(initialData?.ai_status ?? "idle");
    const [aiModel, setAiModel] = useState<string | null>(initialData?.ai_model ?? null);
    const [aiTokens, setAiTokens] = useState<number | null>(initialData?.ai_tokens ?? null);

    const [saving, setSaving] = useState(false);
    const [showGuide, setShowGuide] = useState(!!initialData?.ai_guide); // Show initially if editing
    const [clientFound, setClientFound] = useState<boolean | null>(initialData ? true : null);

    const defaultValues = initialData ? {
        client_name: initialData.client?.full_name ?? "",
        client_company: initialData.client?.company ?? "",
        client_email: initialData.client?.email ?? "",
        client_phone: initialData.client?.phone ?? "",
        title: initialData.title,
        start_date: initialData.start_at.split("T")[0],
        start_time: initialData.start_at.split("T")[1].substring(0, 5),
        duration_min: initialData.duration_min,
        request: initialData.request,
        notes: initialData.notes ?? "",
    } : {
        start_date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
        duration_min: 60,
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        getValues,
    } = useForm<CreateEventDto>({
        resolver: zodResolver(createEventSchema),
        defaultValues,
    });

    const clientEmail = watch("client_email");

    // Auto-lookup client by email (only if creating new event or email changed)
    useEffect(() => {
        if (isEditing && clientEmail === initialData?.client?.email) return;

        const timeout = setTimeout(async () => {
            if (!clientEmail || !clientEmail.includes("@")) {
                setClientFound(null);
                return;
            }
            try {
                const existing = await searchClientByEmail(clientEmail);
                if (existing) {
                    setValue("client_name", existing.full_name);
                    setValue("client_company", existing.company ?? "");
                    setValue("client_phone", existing.phone ?? "");
                    setClientFound(true);
                } else {
                    setClientFound(false);
                }
            } catch {
                setClientFound(null);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [clientEmail, setValue, isEditing, initialData]);

    const handleGenerateGuide = async () => {
        const request = getValues("request");
        if (!request || request.length < 20) {
            toast.error("La solicitud debe tener al menos 20 caracteres");
            return;
        }

        setAiStatus("generating");
        try {
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientRequest: request }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Error al generar la guía");
            }

            const data = await res.json();

            if (data.outOfScope) {
                toast.warning("Solicitud fuera de alcance", {
                    description: data.message,
                });
                setAiStatus("error");
                return;
            }

            setAiGuide(data.guide);
            setAiModel(data.model);
            setAiTokens(data.tokens);
            setAiStatus("success");
            setShowGuide(true);
            toast.success("Guía IA generada exitosamente", {
                description: `Modelo: ${data.model} · ${data.tokens} tokens · ${(data.latencyMs / 1000).toFixed(1)}s`,
            });
        } catch (error) {
            setAiStatus("error");
            toast.error("Error al generar la guía", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    };

    const onFormSubmit = async (data: CreateEventDto, isDraft: boolean) => {
        setSaving(true);
        try {
            await onSubmit(data, aiGuide, aiStatus, aiModel, aiTokens, isDraft);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit((data) => onFormSubmit(data, false))}
            className="space-y-6"
        >
            {/* Client info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Datos del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client_email">Correo electrónico *</Label>
                            <div className="relative">
                                <Input
                                    id="client_email"
                                    type="email"
                                    placeholder="cliente@empresa.com"
                                    {...register("client_email")}
                                />
                                {clientFound === true && (
                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                )}
                            </div>
                            {errors.client_email && (
                                <p className="text-xs text-destructive">{errors.client_email.message}</p>
                            )}
                            {clientFound === true && (
                                <p className="text-xs text-emerald-600">Cliente existente — datos auto-completados</p>
                            )}
                            {clientFound === false && (
                                <p className="text-xs text-muted-foreground">Cliente nuevo — se creará automáticamente</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client_name">Nombre completo *</Label>
                            <Input id="client_name" {...register("client_name")} />
                            {errors.client_name && (
                                <p className="text-xs text-destructive">{errors.client_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client_company">Empresa</Label>
                            <Input id="client_company" {...register("client_company")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client_phone">Teléfono</Label>
                            <Input id="client_phone" {...register("client_phone")} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Event details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detalles de la Reunión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input id="title" placeholder="Ej: Revisión IA Generativa para marketing" {...register("title")} />
                        {errors.title && (
                            <p className="text-xs text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha *</Label>
                            <Input id="start_date" type="date" {...register("start_date")} />
                            {errors.start_date && (
                                <p className="text-xs text-destructive">{errors.start_date.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Hora *</Label>
                            <Input id="start_time" type="time" {...register("start_time")} />
                            {errors.start_time && (
                                <p className="text-xs text-destructive">{errors.start_time.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Duración</Label>
                            <Select
                                defaultValue={defaultValues.duration_min.toString()}
                                onValueChange={(val) => setValue("duration_min", parseInt(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DURATION_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="request">
                            Solicitud del cliente (para la guía IA) *
                        </Label>
                        <Textarea
                            id="request"
                            rows={5}
                            placeholder="Describe la solicitud o necesidad del cliente..."
                            {...register("request")}
                        />
                        {errors.request && (
                            <p className="text-xs text-destructive">{errors.request.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas adicionales</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            placeholder="Notas internas sobre la reunión..."
                            {...register("notes")}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* AI Guide generation */}
            <Card
                className={aiStatus === "success" ? "border-emerald-200 bg-emerald-50/30" : ""}
            >
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand-500" />
                        Guía de Implementación IA
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant={aiStatus === "success" ? "soft" : "default"}
                            onClick={handleGenerateGuide}
                            disabled={aiStatus === "generating"}
                            className="gap-2"
                        >
                            {aiStatus === "generating" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {aiStatus === "generating"
                                ? "Generando guía..."
                                : aiStatus === "success"
                                    ? "Regenerar guía"
                                    : "Generar Guía IA"}
                        </Button>
                        {aiStatus === "success" && (
                            <div className="flex items-center gap-2">
                                <Badge variant="success">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Guía generada
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {aiModel} · {aiTokens} tokens
                                </span>
                            </div>
                        )}
                        {aiStatus === "error" && (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error — intenta de nuevo
                            </Badge>
                        )}
                    </div>

                    {aiGuide && (
                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="gap-2 text-sm"
                                onClick={() => setShowGuide(!showGuide)}
                            >
                                {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {showGuide ? "Ocultar guía" : "Ver guía generada"}
                            </Button>

                            {showGuide && <AiGuidePreview guide={aiGuide} />}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleSubmit((data) => onFormSubmit(data, true))}
                    disabled={saving}
                >
                    <Save className="h-4 w-4" />
                    {isEditing ? "Guardar como Borrador" : "Guardar como Borrador"}
                </Button>
                <Button type="submit" className="gap-2" disabled={saving}>
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CalendarDays className="h-4 w-4" />
                    )}
                    {isEditing ? "Actualizar Reunión" : "Crear Reunión"}
                </Button>
            </div>
        </form>
    );
}
