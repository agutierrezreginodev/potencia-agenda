"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    FileText,
    Sparkles,
    Trash2,
    CheckCircle2,
    Clock,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { getEvents, confirmDraft, deleteEvent } from "@/core/application/actions/event-actions";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/presentation/components/ui/dialog";

interface DraftEvent {
    id: string;
    title: string;
    start_at: string;
    duration_min: number;
    request: string;
    ai_status: string;
    ai_guide: unknown;
    is_draft: boolean;
    clients: { id: string; full_name: string; company: string | null; email: string } | null;
}

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<DraftEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [deletingDraft, setDeletingDraft] = useState<DraftEvent | null>(null);
    const [processing, setProcessing] = useState(false);

    const fetchDrafts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEvents({ isDraft: true });
            setDrafts(data as unknown as DraftEvent[]);
        } catch {
            toast.error("Error al cargar borradores");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const handleConfirm = async (id: string) => {
        setConfirmingId(id);
        try {
            await confirmDraft(id);
            toast.success("Borrador confirmado como reunión");
            fetchDrafts();
        } catch (error) {
            toast.error("Error al confirmar borrador", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setConfirmingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingDraft) return;
        setProcessing(true);
        try {
            await deleteEvent(deletingDraft.id);
            toast.success("Borrador eliminado");
            setDeletingDraft(null);
            fetchDrafts();
        } catch (error) {
            toast.error("Error al eliminar borrador", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Borradores
                </h1>
                <p className="text-muted-foreground mt-1">
                    Reuniones pendientes de confirmación ({drafts.length})
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
            ) : drafts.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-1">Sin borradores</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Todos los borradores han sido confirmados o eliminados
                        </p>
                        <Link href="/events/new">
                            <Button variant="soft" className="gap-2">
                                <Sparkles className="h-4 w-4" />
                                Crear nueva reunión
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {drafts.map((draft) => (
                        <Card key={draft.id} className="hover:border-brand-200 transition-colors">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-semibold">{draft.title}</h3>
                                            <Badge variant="warning" className="text-[10px]">
                                                Borrador
                                            </Badge>
                                            {draft.ai_status === "success" ? (
                                                <Badge variant="success" className="text-[10px]">
                                                    <Sparkles className="h-3 w-3 mr-0.5" />
                                                    Guía IA
                                                </Badge>
                                            ) : draft.ai_status === "error" ? (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    <AlertCircle className="h-3 w-3 mr-0.5" />
                                                    Error IA
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Sin guía
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(draft.start_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                            <span>{draft.duration_min} min</span>
                                            {draft.clients && (
                                                <span>
                                                    {draft.clients.full_name}
                                                    {draft.clients.company ? ` · ${draft.clients.company}` : ""}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {draft.request}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            onClick={() => handleConfirm(draft.id)}
                                            disabled={confirmingId === draft.id}
                                            className="gap-1.5"
                                        >
                                            {confirmingId === draft.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-3 w-3" />
                                            )}
                                            Confirmar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeletingDraft(draft)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete dialog */}
            <Dialog
                open={!!deletingDraft}
                onOpenChange={(open) => !open && setDeletingDraft(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Borrador</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar el borrador{" "}
                            <strong>&quot;{deletingDraft?.title}&quot;</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingDraft(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
