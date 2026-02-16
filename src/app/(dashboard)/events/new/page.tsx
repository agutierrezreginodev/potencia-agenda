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
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    FileText,
    Lightbulb,
    Target,
    DollarSign,
    Shield,
    BarChart3,
} from "lucide-react";
import { toast } from "sonner";

import { createEventSchema, type CreateEventDto, type IAiGuide } from "@/core/domain/models/event";
import { createEvent } from "@/core/application/actions/event-actions";
import { searchClientByEmail } from "@/core/application/actions/client-actions";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Separator } from "@/presentation/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select";
import Link from "next/link";

const DURATION_OPTIONS = [
    { value: "15", label: "15 minutos" },
    { value: "30", label: "30 minutos" },
    { value: "45", label: "45 minutos" },
    { value: "60", label: "1 hora" },
    { value: "90", label: "1.5 horas" },
    { value: "120", label: "2 horas" },
];

export default function NewEventPage() {
    const router = useRouter();
    const [aiGuide, setAiGuide] = useState<IAiGuide | null>(null);
    const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
    const [aiModel, setAiModel] = useState<string | null>(null);
    const [aiTokens, setAiTokens] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [clientFound, setClientFound] = useState<boolean | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        getValues,
    } = useForm<CreateEventDto>({
        resolver: zodResolver(createEventSchema),
        defaultValues: {
            start_date: new Date().toISOString().split("T")[0],
            start_time: "09:00",
            duration_min: 60,
        },
    });

    const clientEmail = watch("client_email");

    // Auto-lookup client by email
    useEffect(() => {
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
    }, [clientEmail, setValue]);

    // Generate AI Guide
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

    const onSubmit = async (data: CreateEventDto, isDraft = false) => {
        setSaving(true);
        try {
            await createEvent(
                data,
                aiGuide as unknown as Record<string, unknown>,
                aiStatus === "success" ? "success" : aiStatus === "error" ? "error" : "pending",
                aiModel,
                aiTokens,
                isDraft
            );
            toast.success(isDraft ? "Borrador guardado" : "Reunión creada exitosamente");
            router.push(isDraft ? "/drafts" : "/agenda");
        } catch (error) {
            toast.error("Error al guardar", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSaving(false);
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

            <form
                onSubmit={handleSubmit((data: CreateEventDto) => onSubmit(data, false))}
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
                                    defaultValue="60"
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
                                placeholder="Describe la solicitud o necesidad del cliente. Ej: El cliente necesita un chatbot para atención al cliente que se integre con su sistema CRM..."
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
                        onClick={handleSubmit((data: CreateEventDto) => onSubmit(data, true))}
                        disabled={saving}
                    >
                        <Save className="h-4 w-4" />
                        Guardar como borrador
                    </Button>
                    <Button type="submit" className="gap-2" disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CalendarDays className="h-4 w-4" />
                        )}
                        Crear Reunión
                    </Button>
                </div>
            </form>
        </div>
    );
}

function AiGuidePreview({ guide }: { guide: IAiGuide }) {
    const sections = [
        {
            key: "executive_summary",
            title: "Resumen Ejecutivo",
            icon: FileText,
            content: guide.executive_summary,
        },
        {
            key: "request_analysis",
            title: "Análisis de la Solicitud",
            icon: Target,
            content: guide.request_analysis,
        },
    ];

    return (
        <div className="space-y-4 mt-4 animate-fade-up">
            {sections.map((section) => (
                <div key={section.key} className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-brand-500" />
                        {section.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                    </p>
                </div>
            ))}

            <Separator />

            {/* Recommended technologies */}
            {guide.recommended_techs?.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-brand-500" />
                        Tecnologías Recomendadas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {guide.recommended_techs.map((tech, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-surface text-sm">
                                <p className="font-medium">{tech.name}</p>
                                <p className="text-muted-foreground text-xs mt-1">{tech.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            {/* Implementation steps */}
            {guide.implementation_steps?.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-brand-500" />
                        Pasos de Implementación
                    </h4>
                    <div className="space-y-2">
                        {guide.implementation_steps.map((step, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg border bg-surface text-sm">
                                <span className="text-brand-500 font-bold shrink-0">{step.step}.</span>
                                <div>
                                    <p className="font-medium">{step.title}</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">{step.description}</p>
                                    <p className="text-xs text-brand-500 mt-1">⏱️ {step.estimated_duration}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            {/* Costs */}
            {guide.estimated_costs && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-brand-500" />
                        Costos Estimados
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                            { label: "Setup", data: guide.estimated_costs.setup },
                            { label: "Mensual", data: guide.estimated_costs.monthly },
                            { label: "Anual", data: guide.estimated_costs.annual },
                        ].map((cost) => (
                            <div key={cost.label} className="p-3 rounded-lg border bg-surface">
                                <p className="text-xs text-muted-foreground">{cost.label}</p>
                                <p className="text-sm font-semibold mt-1">
                                    ${cost.data.min.toLocaleString()} - ${cost.data.max.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Risks */}
            {guide.risks_and_challenges?.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4 text-brand-500" />
                        Riesgos y Desafíos
                    </h4>
                    <div className="space-y-2">
                        {guide.risks_and_challenges.map((risk, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-surface text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            risk.level === "alto" ? "destructive" : risk.level === "medio" ? "warning" : "success"
                                        }
                                        className="text-[10px]"
                                    >
                                        {risk.level.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium">{risk.risk}</span>
                                </div>
                                <p className="text-muted-foreground text-xs mt-1">
                                    Mitigación: {risk.mitigation}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline & next steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guide.estimated_timeline && (
                    <div className="p-3 rounded-lg border bg-brand-50 text-sm">
                        <p className="font-semibold text-brand-700">⏰ Cronograma estimado</p>
                        <p className="text-brand-600 mt-1">{guide.estimated_timeline}</p>
                    </div>
                )}
                {guide.next_steps?.length > 0 && (
                    <div className="p-3 rounded-lg border bg-surface text-sm">
                        <p className="font-semibold">🚀 Próximos pasos</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                            {guide.next_steps.map((step, i) => (
                                <li key={i} className="text-xs">{step}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
