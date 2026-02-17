"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Clock,
    Calendar,
    User,
    Building2,
    Mail,
    Phone,
    FileText,
    Pencil,
    Trash2,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Separator } from "@/presentation/components/ui/separator";

import { deleteEvent } from "@/core/application/actions/event-actions";
import { type IEvent, type IAiGuide } from "@/core/domain/models/event";
import { AiGuidePreview } from "./ai-guide-preview";

interface EventDetailsDialogProps {
    event: IEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: () => void;
}

export function EventDetailsDialog({
    event,
    open,
    onOpenChange,
    onDelete,
}: EventDetailsDialogProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    if (!event) return null;

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta reunión?")) return;

        setDeleting(true);
        try {
            await deleteEvent(event.id);
            toast.success("Reunión eliminada");
            onOpenChange(false);
            onDelete?.(); // Refresh list
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl leading-normal">
                                {event.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                                {event.is_draft ? (
                                    <Badge variant="warning">Borrador</Badge>
                                ) : (
                                    <Badge variant="secondary">Confirmado</Badge>
                                )}
                                {event.ai_status === "success" && (
                                    <Badge variant="success">Guía IA</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-2 flex-1 min-h-0 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Time & Client Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Fecha y Hora
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {format(new Date(event.start_at), "EEEE d 'de' MMMM, yyyy", {
                                                locale: es,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {format(new Date(event.start_at), "HH:mm")} -{" "}
                                            {format(
                                                new Date(new Date(event.start_at).getTime() + event.duration_min * 60000),
                                                "HH:mm"
                                            )}{" "}
                                            ({event.duration_min} min)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Cliente
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 font-medium">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {event.client?.full_name}
                                    </div>
                                    {event.client?.company && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            {event.client.company}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <a href={`mailto:${event.client?.email}`} className="hover:underline">
                                            {event.client?.email}
                                        </a>
                                    </div>
                                    {event.client?.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            {event.client.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Request */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                Solicitud
                            </h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                                {event.request}
                            </p>
                        </div>

                        {/* Notes */}
                        {event.notes && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    Notas
                                </h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {event.notes}
                                </p>
                            </div>
                        )}

                        {/* AI Guide */}
                        {event.ai_guide && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-4">
                                        Guía Generada por IA
                                    </h4>
                                    <AiGuidePreview guide={event.ai_guide as unknown as IAiGuide} />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t mt-auto">
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full sm:w-auto sm:mr-auto"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Eliminar
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cerrar
                        </Button>
                        <Link href={`/events/${event.id}/edit`} className="w-full sm:w-auto">
                            <Button className="w-full">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
