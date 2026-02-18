import {
    FileText,
    Target,
    Lightbulb,
    BarChart3,
    DollarSign,
    Shield,
    Clock,
} from "lucide-react";
import { Separator } from "@/presentation/components/ui/separator";
import { Badge } from "@/presentation/components/ui/badge";
import type { IAiGuide } from "@/core/domain/models/event";

export function AiGuidePreview({ guide }: { guide: IAiGuide }) {
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
                                <span className="text-brand-500 font-bold shrink-0 mt-0.5">{step.step}.</span>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="space-y-1">
                                            {step.tool && step.tool !== "General" && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-brand-50 text-brand-700 border border-brand-200 mb-1 hover:bg-brand-100">
                                                    {step.tool}
                                                </Badge>
                                            )}
                                            <p className="font-semibold text-foreground">{step.title}</p>
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line mb-2">
                                        {step.description}
                                    </p>

                                    <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium bg-brand-50/50 w-fit px-2 py-1 rounded-md">
                                        <Clock className="h-3 w-3" />
                                        <span>{step.estimated_duration}</span>
                                    </div>
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
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {typeof guide.estimated_costs === 'string' ? (
                            guide.estimated_costs
                        ) : (
                            // Fallback for legacy object structure
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {guide.estimated_costs && typeof guide.estimated_costs === 'object' && [
                                    { label: "Setup", data: (guide.estimated_costs as any).setup },
                                    { label: "Mensual", data: (guide.estimated_costs as any).monthly },
                                    { label: "Anual", data: (guide.estimated_costs as any).annual },
                                ].map((cost) => (
                                    <div key={cost.label} className="p-3 rounded-lg border bg-surface">
                                        <p className="text-xs text-muted-foreground">{cost.label}</p>
                                        <p className="text-sm font-semibold mt-1">
                                            {/* Handle min/max object or direct value */}
                                            {cost.data?.min !== undefined
                                                ? `$${cost.data.min} - $${cost.data.max}`
                                                : "N/A"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
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

            {/* Timeline */}
            {guide.estimated_timeline && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-500" />
                        Cronograma Estimado
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {guide.estimated_timeline}
                    </p>
                </div>
            )}

            {/* Next steps */}
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
    );
}
